# PM Zaika Restaurant — Production Deployment Guide

This guide covers deploying the PM Zaika Next.js application to **Vercel** (recommended), or any modern Node.js / cloud platform.

---

## 1. Pre-Deployment Verification Status

- [x] **Production Build Tested**: `npm run build` passed with exit code 0.
- [x] **TypeScript Validation**: 0 errors across all routes and components.
- [x] **Static & Dynamic Routes**: All 42 storefront, API, and admin routes compiled cleanly.
- [x] **Firestore Integration**: Verified with the active project `pm-zaika-dc6cb` via `/api/health`.
- [x] **Firestore Read Throttling**: In-memory catalog caching (15 min) and HTTP stale-while-revalidate headers active to stay safely within daily limits.

---

## 2. Environment Variables Checklist

When deploying to Vercel (or any other host), add these environment variables in your deployment dashboard:

### Critical Firebase Backend (Admin SDK)
| Variable | Value / Description | Example |
| :--- | :--- | :--- |
| `FIREBASE_MODE` | `firestore` | `firestore` |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID | `pm-zaika-dc6cb` |
| `FIREBASE_CLIENT_EMAIL` | Service Account Client Email | `firebase-adminsdk-fbsvc@pm-zaika-dc6cb.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service Account Private Key | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |

> [!IMPORTANT]
> **Formatting `FIREBASE_PRIVATE_KEY` on Vercel**:
> Paste the private key including the quotes `"` and `\n` linebreaks, or paste the raw multi-line key. The backend `src/lib/env.ts` automatically converts `\n` strings to literal newlines.

### Client-Side Firebase SDK (Public Auth & Analytics)
| Variable | Value / Description |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBM3O-44B0G09idoWx4WBQ-IzF3zQXkMD0` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `pm-zaika-dc6cb.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `pm-zaika-dc6cb` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `pm-zaika-dc6cb.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `864606272158` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:864606272158:web:052c3161a58ab98a80198f` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-L9PWQTVKLX` |

### Restaurant & Admin Configuration
| Variable | Value / Description | Example |
| :--- | :--- | :--- |
| `ADMIN_EMAILS` | Comma-separated admin emails allowed to access `/admin` | `amaanullah2607@gmail.com` |
| `RESTAURANT_NAME` | Name of your restaurant | `PM Zaika Restaurant` |
| `RESTAURANT_WHATSAPP` | 12-digit phone number with country code | `917488260572` |
| `NEXT_PUBLIC_SITE_URL` | Your live production domain | `https://your-domain.vercel.app` |
| `UPI_VPA` | UPI Payment ID | `pmzaika@ybl` |
| `UPI_PAYEE_NAME` | Payee Name on UPI QR | `PM Zaika Restaurant` |

---

## 3. Step-by-Step Vercel Deployment

### Step A: Push Code to GitHub
Ensure all your latest changes are committed and pushed:
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

### Step B: Create Project on Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** -> **"Project"**.
2. Select your `pm-zaika` repository.
3. **CRITICAL STEP — Root Directory**:
   - Next to **Root Directory**, click **"Edit"**.
   - Select **`next-app`** (since the Next.js application lives inside the `next-app/` subfolder).
   - Click **Continue**.
4. Framework Preset will automatically detect **Next.js**.

### Step C: Add Environment Variables
- Expand the **Environment Variables** section.
- Copy and paste the variables listed in **Section 2** above.

### Step D: Deploy
- Click **"Deploy"**.
- Vercel will build the project in ~45 seconds.

---

## 4. Post-Deployment Firebase Setup

### Authorize Production Domain in Firebase
To allow customers and admins to sign in on your live production site:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **`pm-zaika-dc6cb`**.
3. Go to **Build** -> **Authentication** -> **Settings** tab.
4. Under **Authorized domains**, click **"Add domain"**.
5. Add your Vercel domain (e.g. `your-app.vercel.app`) or your custom domain (e.g. `pmzaika.com`).

---

## 5. Production Health Verification

Once deployed, run these quick checks:

1. **Backend Health Check**:
   Visit `https://<your-domain>/api/health`
   Expected response:
   ```json
   {
     "ok": true,
     "service": "pm-zaika-backend",
     "persistence": "firestore",
     "firebaseConfigured": true,
     "adminConfigured": true
   }
   ```

2. **Live Storefront**:
   Visit `https://<your-domain>/`
   - Test adding an item to the cart.
   - Check category tabs and search.

3. **Admin Dashboard**:
   Visit `https://<your-domain>/admin/login`
   - Sign in with your admin Google account (`amaanullah2607@gmail.com`).
   - Check `/admin/orders` and `/admin/settings`.
