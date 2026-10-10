import type { OrderStatus, PaymentStatus } from '@/lib/domain/types';

export interface StatusMeta {
  label: string;
  description: string;
  tone: 'pending' | 'active' | 'success' | 'danger';
  step: number;
}

/** Ordered lifecycle rendered as a progress tracker on the customer page. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, StatusMeta> = {
  payment_verification_pending: {
    label: 'Payment Awaiting',
    description: 'Scan the UPI QR and share your payment proof on WhatsApp.',
    tone: 'pending',
    step: 1,
  },
  confirmed: {
    label: 'Order Confirmed',
    description: 'Our team verified your payment and accepted the order.',
    tone: 'active',
    step: 2,
  },
  preparing: {
    label: 'Preparing in Kitchen',
    description: 'Your food is being freshly cooked to order.',
    tone: 'active',
    step: 3,
  },
  ready: {
    label: 'Ready to Serve',
    description: 'Plated and waiting in the dining area.',
    tone: 'active',
    step: 4,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    description: 'Your order is on the way.',
    tone: 'active',
    step: 4,
  },
  delivered: {
    label: 'Delivered',
    description: 'Enjoy your meal!',
    tone: 'success',
    step: 5,
  },
  served: {
    label: 'Served',
    description: 'Enjoy your meal!',
    tone: 'success',
    step: 5,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order was cancelled. Please contact us for assistance.',
    tone: 'danger',
    step: 5,
  },
};

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  payment_verification_pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'out_for_delivery', 'cancelled'],
  ready: ['served', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  served: [],
  cancelled: [],
};

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'served', 'cancelled'];

export const OPEN_STATUSES: OrderStatus[] = [
  'payment_verification_pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
];

export const ALL_STATUSES = Object.keys(ORDER_STATUS_FLOW) as OrderStatus[];

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export interface StatusAction {
  status: OrderStatus;
  label: string;
  /** Present when the transition also changes payment state. */
  paymentStatus?: PaymentStatus;
}

/** Dashboard buttons for an order in its current state. */
export const STATUS_ACTIONS: Record<OrderStatus, StatusAction[]> = {
  payment_verification_pending: [
    {
      status: 'confirmed',
      label: 'Verify Payment & Accept',
      paymentStatus: 'verified',
    },
    { status: 'cancelled', label: 'Reject & Cancel' },
  ],
  confirmed: [
    { status: 'preparing', label: 'Start Preparing' },
    { status: 'cancelled', label: 'Cancel Order' },
  ],
  preparing: [
    { status: 'ready', label: 'Ready (Dine-in)' },
    { status: 'out_for_delivery', label: 'Out for Delivery' },
    { status: 'cancelled', label: 'Cancel Order' },
  ],
  ready: [
    { status: 'served', label: 'Mark Served' },
    { status: 'delivered', label: 'Mark Delivered' },
    { status: 'cancelled', label: 'Cancel Order' },
  ],
  out_for_delivery: [
    { status: 'delivered', label: 'Mark Delivered' },
    { status: 'cancelled', label: 'Cancel Order' },
  ],
  delivered: [],
  served: [],
  cancelled: [],
};

/** Payment statuses that permit the kitchen to start working on an order. */
export function isPaymentCleared(paymentStatus: PaymentStatus): boolean {
  return paymentStatus === 'verified' || paymentStatus === 'refunded';
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * An order can only progress once its payment has been verified.
 *
 * The exception is `payment_verification_pending → confirmed`: that transition
 * *is* the admin's verification action, so the payment gate must not block it.
 * Cancellation is always permitted while the order is still open.
 */
export function isTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
  paymentStatus: PaymentStatus
): boolean {
  if (to === 'cancelled') return !isTerminal(from);
  if (!canTransition(from, to)) return false;
  if (from === 'payment_verification_pending' && to === 'confirmed') return true;
  return isPaymentCleared(paymentStatus);
}

/** Payment status implied by the order status an admin moved it to. */
export function paymentStatusFor(
  status: OrderStatus,
  current: PaymentStatus
): PaymentStatus {
  switch (status) {
    case 'confirmed':
    case 'preparing':
    case 'ready':
    case 'out_for_delivery':
    case 'delivered':
    case 'served':
      return 'verified';
    case 'cancelled':
      // A previously verified payment that is cancelled becomes a refund case.
      return isPaymentCleared(current) ? 'refunded' : 'rejected';
    default:
      return current;
  }
}

/** Human labels for the payment ledger in the admin desk. */
export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  awaiting: 'Awaiting Payment',
  verification_pending: 'Verification Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
};