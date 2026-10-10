/**
 * Domain entities, ported from the reference backend's Mongoose schemas and
 * Firestore documents. Razorpay-specific fields are deliberately omitted; UPI
 * payment proof is verified manually by an admin instead.
 *
 * Money is stored in paise (integers) to avoid floating point drift.
 */

// ---------------------------------------------------------------------------
// Restaurant settings — Firestore `settings/restaurant`
// ---------------------------------------------------------------------------

export interface Announcement {
  enabled: boolean;
  text: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
}

export interface RestaurantSettings extends Record<string, unknown> {
  id: 'restaurant';
  restaurantName: string;
  isStoreOpen: boolean;
  /** Delivery fee in paise. */
  deliveryChargePaise: number;
  /** Order subtotal (paise) at or above which delivery is free. */
  freeDeliveryAbovePaise: number;
  /** Minimum order subtotal in paise before checkout is allowed. */
  minimumOrderPaise: number;
  /** GST percentage. `0` means prices are inclusive of tax. */
  gstPercentage: number;
  openingTime: string;
  closingTime: string;
  supportPhone: string;
  storeUpiId: string;
  storeUpiName: string;
  restaurantAddress: string;
  announcement: Announcement;
  /** Auto-close the store outside opening hours. */
  autoCloseByTime: boolean;
  updatedAt: string;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Menu — Firestore `menu`
// ---------------------------------------------------------------------------

export interface MenuItem extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  /** Selling price in paise. */
  pricePaise: number;
  category: string;
  categoryName: string;
  image: string;
  vegNonVeg: 'veg' | 'non-veg';
  isAvailable: boolean;
  isPopular: boolean;
  badge?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Coupons — Firestore `coupons`
// ---------------------------------------------------------------------------

export interface Coupon extends Record<string, unknown> {
  id: string;
  couponCode: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  /** Minimum order subtotal in paise required to redeem. */
  minimumOrderPaise: number;
  /** `0` means unlimited. */
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  /** uid → redemption count. */
  usedByUsers: Record<string, number>;
  /** Category slug, or `all`. */
  applicableCategory: string;
  /** `yyyy-mm-dd`, or empty for no expiry. */
  expiryDate: string;
  active: boolean;
  stackable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Users — Firestore `users/{uid}`
// ---------------------------------------------------------------------------

export interface SavedAddress extends Record<string, unknown> {
  id: string;
  label: string;
  fullAddress: string;
  landmark: string;
  phone: string;
  isDefault: boolean;
}

export interface UserProfile extends Record<string, unknown> {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL: string;
  addresses: SavedAddress[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Orders — Firestore `orders` and `orders_archive`
// ---------------------------------------------------------------------------

export type OrderType = 'delivery' | 'dinein';

export type PaymentStatus =
  | 'awaiting'
  | 'verification_pending'
  | 'verified'
  | 'rejected'
  | 'refunded';

export type OrderStatus =
  | 'payment_verification_pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'served'
  | 'cancelled';

export interface OrderItem extends Record<string, unknown> {
  menuItemId: string;
  title: string;
  qty: number;
  pricePaise: number;
  lineTotalPaise: number;
  image: string;
  category: string;
  vegNonVeg: 'veg' | 'non-veg';
}

export interface OrderTotals extends Record<string, unknown> {
  subtotalPaise: number;
  deliveryChargePaise: number;
  taxPaise: number;
  discountPaise: number;
  grandTotalPaise: number;
}

export interface RefundState extends Record<string, unknown> {
  requested: boolean;
  status: 'NONE' | 'REQUESTED' | 'PROCESSING' | 'REFUNDED' | 'REJECTED';
  requestedAt?: string;
  processedAt?: string;
  refundedAt?: string;
  refundedBy?: string;
  amountPaise: number;
  cancellationReason?: string;
}

export interface OrderEvent extends Record<string, unknown> {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  at: string;
  /** `customer`, `system`, or `admin:<uid>`. */
  actor: string;
  note?: string;
}

export interface Order extends Record<string, unknown> {
  id: string;
  /** Human readable identifier shown to the customer, e.g. `PMZ-261007-4821`. */
  orderId: string;

  // Customer
  userId: string;
  userEmail: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  /** Free-form dine-in note such as `Table 4 / window side`. */
  seatingNote: string;
  orderType: OrderType;

  // Items & money
  items: OrderItem[];
  totals: OrderTotals;
  appliedCoupon: string | null;
  couponId: string | null;
  /** GST breakdown, populated when `settings.gstPercentage > 0`. */
  taxMode: 'inclusive' | 'exclusive';

  // Payment (UPI + manual verification)
  paymentMethod: 'UPI';
  paymentStatus: PaymentStatus;
  /** UTR / transaction reference supplied by the customer. */
  transactionReference: string | null;
  customerMarkedPaid: boolean;
  paymentProofNote: string | null;
  paymentVerifiedBy: string | null;
  paymentVerifiedAt: string | null;
  rejectionReason: string | null;
  upi: {
    vpa: string;
    payeeName: string;
    intent: string;
    amountPaise: number;
  };

  // Lifecycle
  status: OrderStatus;
  refund: RefundState;
  timeline: OrderEvent[];
  notificationSent: boolean;
  notificationEmittedAt: string | null;

  // Bookkeeping
  trackingToken: string;
  cartSessionId: string;
  notes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// Push notification subscriptions — Firestore `admin_notification_subscriptions`
// ---------------------------------------------------------------------------

export interface PushSubscription extends Record<string, unknown> {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  adminUserId: string;
  adminEmail: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// ---------------------------------------------------------------------------
// Webhook log — Firestore `webhook_logs`
// ---------------------------------------------------------------------------

export interface WebhookLog extends Record<string, unknown> {
  id: string;
  source: string;
  event: string;
  reference: string;
  status: 'success' | 'failed' | 'skipped';
  detail: string;
  createdAt: string;
}