/**
 * Client-safe shapes returned by the admin API.
 *
 * These mirror the server projections in `@/lib/orders/service` and
 * `@/lib/domain/types`, minus anything the dashboard has no use for.
 */

export type OrderStatus =
  | 'payment_verification_pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'served'
  | 'cancelled';

export type PaymentStatus =
  | 'awaiting'
  | 'verification_pending'
  | 'verified'
  | 'rejected'
  | 'refunded';

export interface StatusMeta {
  label: string;
  description: string;
  tone: 'pending' | 'active' | 'success' | 'danger';
  step: number;
}

export interface StatusAction {
  status: OrderStatus;
  label: string;
  paymentStatus?: PaymentStatus;
}

export interface AdminOrderItem {
  title: string;
  qty: number;
  pricePaise: number;
  lineTotalPaise: number;
  vegNonVeg: 'veg' | 'non-veg';
}

export interface AdminOrder {
  orderId: string;
  status: OrderStatus;
  statusMeta: StatusMeta;
  paymentStatus: PaymentStatus;
  orderType: 'delivery' | 'dinein';
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  seatingNote: string;
  items: AdminOrderItem[];
  totals: {
    subtotalPaise: number;
    deliveryChargePaise: number;
    taxPaise: number;
    discountPaise: number;
    grandTotalPaise: number;
  };
  appliedCoupon: string | null;
  transactionReference: string | null;
  customerMarkedPaid: boolean;
  rejectionReason: string | null;
  notes?: string;
  refund: { status: string; amountPaise: number; cancellationReason?: string };
  timeline: Array<{
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    at: string;
    actor: string;
    note?: string;
  }>;
  nextActions: StatusAction[];
  actions: StatusAction[];
  isOpen: boolean;
  createdAt: string;
  /** Only for staff – lets the dashboard share the customer's tracking link. */
  trackingToken?: string;
}

export interface AdminStats {
  totalOrders: number;
  openOrders: number;
  awaitingPayment: number;
  revenuePaise: number;
  paidRevenuePaise: number;
  averageOrderValuePaise: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  totalDishes: number;
  availableDishes: number;
  lowStockCount: number;
}

export interface AdminCategory {
  id: string;
  name: string;
  count: number;
  available: number;
}

export interface AdminMenuItem {
  id: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  categoryName: string;
  image: string;
  vegNonVeg: 'veg' | 'non-veg';
  isAvailable: boolean;
  isPopular: boolean;
  badge?: string;
}

export interface AdminCoupon {
  id: string;
  couponCode: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minimumOrderPaise: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  usedByUsers: Record<string, number>;
  applicableCategory: string;
  expiryDate: string;
  active: boolean;
}

export interface AdminSettings {
  restaurantName: string;
  isStoreOpen: boolean;
  deliveryChargePaise: number;
  freeDeliveryAbovePaise: number;
  minimumOrderPaise: number;
  gstPercentage: number;
  openingTime: string;
  closingTime: string;
  supportPhone: string;
  storeUpiId: string;
  storeUpiName: string;
  restaurantAddress: string;
  autoCloseByTime: boolean;
  announcement: {
    enabled: boolean;
    text: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    linkUrl?: string;
    linkLabel?: string;
    marquee?: boolean;
    highlightBadge?: string;
  };
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  estimatedDeliveryTime?: string;
  /** Server timestamp — used to key the settings form so saves re-mount it. */
  updatedAt: string;
}

export interface AdminPayment {
  orderId: string;
  customerName: string;
  customerPhone: string;
  amountPaise: number;
  paymentStatus: PaymentStatus;
  paymentLabel: string;
  transactionReference: string | null;
  method: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  orderCount: number;
  spentPaise: number;
  lastOrderAt: string | null;
}

export interface AdminSessionInfo {
  email: string;
  provider: 'firebase' | 'local';
}

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'no_show';

export interface AdminReservation {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Capabilities {
  persistence: 'firestore' | 'local';
  firebaseAuth: boolean;
}

/** Every admin endpoint answers with this envelope. */
export interface ApiEnvelope<T> {
  ok: true;
  data: T;
}