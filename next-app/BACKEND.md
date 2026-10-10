# PM Zaika — Backend

Order, menu, coupon and store-operations backend for the PM Zaika cart tab,
built on **Next.js 16 Route Handlers + Cloud Firestore**.

Ported from the reference implementation (`../refrence`) with **Razorpay removed**.
Online payment is handled by **UPI QR + manual verification**, which is what the
cart tab already promised customers.

---

## Contents

- [Architecture](#architecture)
- [Configuration](#configuration)
- [Persistence](#persistence)
- [Order lifecycle](#order-lifecycle)
- [API reference](#api-reference)
- [Security model](#security-model)
- [Menu data](#menu-data)
- [Firestore setup](#firestore-setup)

---

## Architecture

```
Browser
  │  sends menu ids + quantities only (never prices)
  ▼
Route Handlers (src/app/api/**)      ← validation, auth, rate limiting
  │
  ▼
Domain services (src/lib)
  ├── settings   store hours, fees, GST, UPI VPA, announcements
  ├── menu       live menu CRUD + availability
  ├── coupons    6-rule discount engine
  ├── orders     state machine, pricing, archival, CSV
  ├── users      profiles, addresses, order history
  └── notifications  Telegram · Web Push · generic webhook
  │
  ▼
DataStore (src/lib/db)  ──▶  Firestore (firebase-admin)   [production]
                            └▶ .data/pm-zaika.json         [local dev]
```

**The browser never dictates money.** Prices, availability, discounts, delivery
fees and GST are all resolved server-side from the `menu` and `settings`
collections. This is the single most important property of the design — a
modified client cannot change what it is charged.

### Layout

| Path | Purpose |
| --- | --- |
| `src/lib/db` | Generic document-store abstraction + Firestore & local drivers |
| `src/lib/domain/types.ts` | All persisted entities (orders, menu, coupons, settings, users) |
| `src/lib/orders` | Pricing, state machine, service layer, CSV export |
| `src/lib/menu` | Menu service + seeding from the restaurant's own menu sheet |
| `src/lib/coupons` | Coupon rules and atomic redemption tracking |
| `src/lib/settings` | Store settings, cache, closed-store shield |
| `src/lib/users` | Profiles, addresses, order history, admin roles |
| `src/lib/notifications` | Telegram, Web Push, WhatsApp templates, dispatcher |
| `src/lib/auth` | Admin (Firebase token or local password) and customer auth |
| `src/lib/http` | JSON helpers, error normalisation, rate limiting |
| `src/data/menuItemsSource.ts` | 314 menu items extracted from the restaurant's files |

---

## Configuration

Copy `.env.example` to `.env.local`. **Every value is optional** — with no
credentials the backend runs fully against the local JSON store.

See `.env.example` for the annotated list. The most important groups:

- **Persistence** — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **Admin access** — `ADMIN_EMAILS` (comma separated)
- **Firebase Auth (admin sign-in)** — `NEXT_PUBLIC_FIREBASE_*`
- **UPI** — `UPI_VPA`, `UPI_PAYEE_NAME` (also editable at runtime in settings)
- **Notifications** — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, VAPID keys, `ORDER_WEBHOOK_URL`

Check what is active at any time:

```bash
curl http://localhost:3000/api/health
```

---

## Persistence

`getDb()` picks a driver at runtime:

| Mode | When | Storage |
| --- | --- | --- |
| `firestore` | service-account env vars present (or `FIREBASE_MODE=firestore`) | Cloud Firestore via `firebase-admin` |
| `local` | otherwise | `.data/pm-zaika.json`, written atomically |

Both implement the same `Database` interface (`src/lib/db/types.ts`), so no
service code branches on the active mode. Local mode exists so the entire
backend — orders, coupons, menu admin, settings — can be exercised before
Firebase is provisioned. `firebase-admin` is imported lazily, so it is not loaded
at all in local mode.

### Collections

| Collection | Written by | Notes |
| --- | --- | --- |
| `orders` | server | live kitchen queue |
| `orders_archive` | server | terminal orders (delivered / served / cancelled) |
| `carts` | server | server-side cart drafts, keyed by an httpOnly session cookie |
| `menu` | server (admin) | seeded from `menuItemsSource.ts` on first read |
| `coupons` | server (admin) | redemption counters mutated transactionally |
| `settings` | server (admin) | single `restaurant` document |
| `users` | server | profiles + saved addresses |
| `admin_roles` | server | dashboard access grants |
| `admin_notification_subscriptions` | server | Web Push endpoints |
| `webhook_logs` | server | per-channel notification delivery log |

---

## Order lifecycle

```
                    ┌──────────────► cancelled
                    │
payment_verification_pending ──► confirmed ──► preparing ──► ready ──► served
        (QR shown)                              │                   (dine-in)
                                                   └──► out_for_delivery ──► delivered
```

| Status | Label | Notes |
| --- | --- | --- |
| `payment_verification_pending` | Payment Awaiting | default on creation; QR displayed |
| `confirmed` | Order Confirmed | **this transition verifies the payment** |
| `preparing` | Preparing in Kitchen | |
| `ready` | Ready to Serve | dine-in |
| `out_for_delivery` | Out for Delivery | delivery |
| `delivered` | Delivered | terminal → archived |
| `served` | Served | dine-in terminal → archived |
| `cancelled` | Cancelled | terminal → archived |

### Rules the server enforces

1. **Closed-store shield** — orders are rejected with `403` when
   `settings.isStoreOpen` is false, or outside opening hours when
   `autoCloseByTime` is on.
2. **Payment gate** — an order cannot reach `preparing` or beyond until payment
   is verified. The one exception is `payment_verification_pending → confirmed`,
   because *that* transition is the verification.
3. **Minimum order** — configurable via `settings.minimumOrderPaise`.
4. **Availability** — dishes toggled unavailable are rejected at checkout.
5. **Coupons are re-validated at creation** — a client-supplied discount is
   ignored entirely; the engine recomputes it.
6. **Idempotent kitchen alerts** — a transaction claims `notificationSent`, so a
   double-submitted order can never produce two alerts.
7. **Archival** — terminal orders move to `orders_archive`; history stays
   queryable and `/track` keeps working.

### Payment flow (UPI, no gateway)

1. `POST /api/orders` → order created in `payment_verification_pending`.
   The response includes the UPI intent, a QR endpoint and a `wa.me` deep link.
2. The cart tab opens WhatsApp with a pre-filled payment-proof request and shows
   the QR on `/track/[orderId]`.
3. Optionally the customer posts their UTR to
   `POST /api/orders/:id/payment-proof` (order stays pending).
4. An admin calls `PATCH /api/orders/:id/status` with `{"status":"confirmed"}`,
   which marks the payment `verified` and starts the kitchen.
5. Refunds on a cancelled, already-paid order are tracked on `order.refund`
   and settle to `paymentStatus: "refunded"`.

---

## API reference

All responses are `{ ok: true, ... }` or `{ ok: false, error, fields? }`.
Admin endpoints require the `pm_admin_session` cookie.

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | readiness + active configuration |
| `GET` | `/api/settings` | pricing rules, hours, UPI, announcement |
| `GET` | `/api/menu` | live menu (seeds on first read) + categories |
| `GET` `PUT` `DELETE` | `/api/cart` | server-side cart sync |
| `POST` | `/api/coupons/validate` | coupon preview for the cart |
| `POST` | `/api/orders` | place an order |
| `GET` | `/api/orders/:orderId?token=` | order status (needs the tracking token) |
| `GET` | `/api/orders/:orderId/qr?token=` | UPI QR as SVG |
| `POST` | `/api/orders/:orderId/payment-proof?token=` | submit UTR / proof note |
| `POST` | `/api/orders/:orderId/cancel?token=` | cancel own order |
| `GET` | `/api/orders/:orderId/whatsapp?token=` | pre-built WhatsApp links |
| `GET` | `/api/my/orders` | order history (Firebase ID token) |
| `GET` `PUT` | `/api/profile` | profile + saved addresses |

### Admin

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` `GET` `DELETE` | `/api/admin/session` | sign in / whoami / sign out |
| `GET` | `/api/admin/orders` | filtered, paginated order queue |
| `GET` | `/api/admin/orders/export` | CSV of the order book |
| `GET` | `/api/admin/stats` | revenue, volume, menu health |
| `GET` `POST` | `/api/admin/menu` | list (incl. unavailable) / create |
| `PATCH` `PUT` `DELETE` | `/api/admin/menu/:itemId` | edit / toggle availability / delete |
| `POST` | `/api/admin/menu/seed` | re-seed from the restaurant's menu sheet |
| `GET` `POST` | `/api/admin/coupons` | list / create |
| `PATCH` `DELETE` | `/api/admin/coupons/:couponId` | edit / delete |
| `GET` `PUT` | `/api/admin/settings` | store operations + announcement |
| `GET` | `/api/admin/users` | customer directory with spend |
| `PATCH` | `/api/admin/users/:uid` | grant / revoke dashboard access |
| `GET` | `/api/admin/payments` | UPI payment ledger |
| `GET` | `/api/admin/payments/webhook-logs` | notification delivery log |
| `GET` `POST` `DELETE` | `/api/admin/notifications` | Web Push subscriptions |
| `POST` | `/api/admin/notifications/test` | send a test alert |
| `PATCH` | `/api/orders/:orderId/status` | status transition |
| `PATCH` | `/api/orders/:orderId/refund` | refund state |
| `POST` | `/api/orders/:orderId/restore` | un-archive an order |

---

## The kitchen desk (`/admin`)

A full operations dashboard, styled to match the public site but darkened for
low-light counter use.

| Route | Purpose |
| --- | --- |
| `/admin/login` | sign in |
| `/admin` | overview — payments to chase, revenue, menu availability |
| `/admin/orders` | live order queue with one-tap status transitions |
| `/admin/menu` | dish CRUD + in/out availability toggles |
| `/admin/coupons` | coupon desk with the six rule parameters |
| `/admin/payments` | UPI ledger (verified, pending, refunded) |
| `/admin/users` | customer directory + kitchen access grants |
| `/admin/settings` | hours, fees, GST, UPI, open/closed, announcements |

### Signing in

`POST /api/admin/session` sets the `pm_admin_session` httpOnly cookie that every
admin endpoint then relies on.

**Without Firebase** (local persistence, the default) a shared kitchen password
is accepted:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" -d '{"password":"zaika-admin"}'
```

Override the default with `LOCAL_ADMIN_PASSWORD`.

**With Firebase configured** the login page signs in through Firebase Auth and
posts the resulting ID token instead:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/admin/session \
  -H "Content-Type: application/json" -d '{"idToken":"<firebase id token>"}'
```

The token is verified on **every** request with `verifyIdToken`, and the
e-mail must be listed in `ADMIN_EMAILS` (or hold an `admin_roles` document).

### Three layers of protection

1. `src/proxy.ts` — redirects obviously-signed-out requests before they render
2. `src/app/admin/(dashboard)/layout.tsx` — server-side `getAdminSession()` gate
3. `requireAdmin()` inside every admin API handler — the real check

Each admin page also carries a nav badge showing how many orders still need a
payment decision, and the queue refreshes every 20 seconds.

---

## Security model

| Concern | Mitigation |
| --- | --- |
| Price tampering | prices resolved server-side from `menu`; client totals ignored |
| Discount tampering | coupon re-validated at creation; redemption counted transactionally |
| Order enumeration | reads require a secret `trackingToken`, returned exactly once |
| Token leakage | stripped from every public projection |
| Admin access | Firebase ID token verified per request, allow-listed by `ADMIN_EMAILS` or an `admin_roles` document |
| Guest checkout | supported; orders keyed by `guest:<phone>` |
| XSS | React escapes all interpolated text; WhatsApp/Telegram templates escape HTML |
| Replay / flooding | per-IP rate limits on order creation, coupon validation, cart sync, admin sign-in |
| Oversized payloads | 64 KB request-body ceiling; internal error details never returned |
| Direct client writes | Firestore rules deny all browser writes; only the Admin SDK writes |

### Firestore rules

`firestore.rules` is **stricter than the reference**: `menu`, `settings`,
`coupons`, `orders` and `carts` are read-only to the browser and writable only
by the Admin SDK (which bypasses rules). Admin e-mails must be listed in both
`ADMIN_EMAILS` and the rules file.

---

## Menu data

`src/data/menuItemsSource.ts` holds **314 dishes across 24 categories**,
extracted verbatim from the restaurant's own files:

- `../menu-items/New Zaika Menu (1).xlsx` — 269 dishes
- `../menu-items/Buffet Menu (1).docx` — 45 buffet dishes

Price column is **"Res. Price" (column B, whole rupees)**. The half-portion
("R. Half Price") and marketplace MRP ("Zomato & Swiggy") columns were dropped.
The full row-by-row extraction trace is in
[`../menu-items/EXTRACTION-NOTES.md`](../../menu-items/EXTRACTION-NOTES.md).

> ⚠️ **The buffet docx contains no prices.** Buffet item prices are placeholders
> copied from the matching a-la-carte dish. Set real buffet pricing from the admin
> menu desk before publishing.

On first read of `/api/menu` the collection is seeded. Image resolution runs in
three steps (`src/lib/menu/seed.ts`):

1. a **real photograph** of that dish, if one exists — `src/data/dishPhotos.ts`
   is generated by `node scripts/map-dish-photos.cjs`, which fuzzy-matches the
   photographs in `public/assets/images/dishes` against menu names and
   normalising spelling variance (`Kawab` → `Kabab`, `Mashroom` → `Mashroom`,
   `Matar` → `Matter`)
2. an image already used elsewhere on the site
3. a per-category fallback, so nothing ever renders broken

19 of the 29 dish photographs currently map to a menu item. The rest show dishes
that are not on the current menu sheet (Afgani Kabab, Palak Paneer, Chicken
Muradabadi Biryani…) — they appear in the Gallery instead. Admins can override
any image from `/admin/menu`.

---

## Firestore setup

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

- `firestore.rules` — see above
- `firestore.indexes.json` — composite indexes for the order queue filters
  (`status`/`paymentStatus`/`userId`/`orderType` × `createdAt`)

A composite index is required for each status filter you enable in the admin
queue; the console prints the exact index command on the first blocked query.

---

## Local development

```bash
npm run dev
```

No Firebase setup required. The backend runs against `.data/pm-zaika.json`:

- seed the menu: `GET /api/menu`
- create an admin session: `POST /api/admin/session {"password":"zaika-admin"}`
  (override with `LOCAL_ADMIN_PASSWORD`)
- place an order: `POST /api/orders`

Delete `.data/` to reset everything.