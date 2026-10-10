import { z } from 'zod';

import { ALL_STATUSES, OPEN_STATUSES, TERMINAL_STATUSES } from '@/lib/orders/status';
import { PRICING } from '@/lib/env';

const trimmed = (max: number) => z.string().trim().max(max);

/** Normalises Indian mobile numbers to a bare 10-digit string. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length > 10 && digits.slice(-10).match(/^[6-9]\d{9}$/)) {
    return digits.slice(-10);
  }
  return digits;
}

const phoneSchema = z
  .string()
  .trim()
  .transform(normalisePhone)
  .pipe(
    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
  );

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const createOrderSchema = z
  .object({
    orderType: z.enum(['delivery', 'dinein']),
    items: z
      .array(
        z.object({
          menuItemId: z.string().trim().min(1, 'Missing menu item id'),
          quantity: z.coerce
            .number()
            .int()
            .min(1, 'Quantity must be at least 1')
            .max(PRICING.maxQuantityPerItem, 'Quantity is too large'),
        })
      )
      .min(1, 'Your cart is empty')
      .max(40, 'Too many distinct items in one order'),
    customer: z.object({
      name: trimmed(80).min(2, 'Please enter your name'),
      phone: phoneSchema,
      address: trimmed(300).optional(),
      tableNote: trimmed(120).optional(),
    }),
    notes: trimmed(500).optional(),
    /** Optional Firebase identity; orders may also be placed as a guest. */
    userId: trimmed(128).optional(),
    userEmail: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    couponCode: trimmed(40).optional(),
    /** Set when the customer has already marked the order paid in the UI. */
    customerMarkedPaid: z.boolean().optional(),
    transactionReference: trimmed(40).optional(),
    cartSessionId: trimmed(64).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.orderType === 'delivery' && !value.customer.address) {
      ctx.addIssue({
        code: 'custom',
        path: ['customer', 'address'],
        message: 'Delivery address is required for home delivery',
      });
    }
    if (value.orderType === 'dinein' && !value.customer.tableNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['customer', 'tableNote'],
        message: 'Please tell us your table number or seating preference',
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(ALL_STATUSES as [string, ...string[]]),
  note: trimmed(300).optional(),
  rejectionReason: trimmed(300).optional(),
});

export const paymentProofSchema = z.object({
  /** UTR / 12-digit reference from the customer's UPI app. */
  transactionReference: trimmed(40).optional(),
  note: trimmed(300).optional(),
});

export const cancelOrderSchema = z.object({
  reason: trimmed(300).optional(),
});

export const listOrdersQuerySchema = z.object({
  status: trimmed(200).optional(),
  paymentStatus: trimmed(120).optional(),
  orderType: z.enum(['delivery', 'dinein']).optional(),
  search: trimmed(80).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: trimmed(128).optional(),
  scope: z.enum(['active', 'archive', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const trackOrderSchema = z.object({
  orderId: trimmed(32).min(4),
  token: trimmed(64).min(8),
});

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const menuItemSchema = z.object({
  title: trimmed(120).min(2, 'Dish name is required'),
  description: trimmed(600).optional(),
  pricePaise: z.coerce.number().int().min(0, 'Price cannot be negative').max(100_000_00),
  category: trimmed(60).min(1, 'Category is required'),
  categoryName: trimmed(80).optional(),
  image: trimmed(400).optional(),
  vegNonVeg: z.enum(['veg', 'non-veg']).optional(),
  isAvailable: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  badge: trimmed(40).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const availabilityToggleSchema = z.object({
  isAvailable: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export const couponSchema = z.object({
  couponCode: trimmed(40).min(2, 'Coupon code is required'),
  description: trimmed(300).optional(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().min(0).max(100_000_00),
  minimumOrderPaise: z.coerce.number().int().min(0).default(0),
  usageLimit: z.coerce.number().int().min(0).default(0),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  applicableCategory: trimmed(60).default('all'),
  expiryDate: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use the yyyy-mm-dd format')
    .default(''),
  active: z.boolean().default(true),
  stackable: z.boolean().default(false),
});

export const validateCouponSchema = z.object({
  couponCode: trimmed(40).min(1),
  subtotalPaise: z.coerce.number().int().min(0),
  categories: z.array(trimmed(60)).max(40).default([]),
  userKey: trimmed(128).optional(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsSchema = z.object({
  restaurantName: trimmed(120).optional(),
  isStoreOpen: z.boolean().optional(),
  deliveryChargePaise: z.coerce.number().int().min(0).max(10_000_00).optional(),
  freeDeliveryAbovePaise: z.coerce.number().int().min(0).max(100_000_00).optional(),
  minimumOrderPaise: z.coerce.number().int().min(0).max(100_000_00).optional(),
  gstPercentage: z.coerce.number().min(0).max(100).optional(),
  openingTime: trimmed(20).optional(),
  closingTime: trimmed(20).optional(),
  supportPhone: trimmed(30).optional(),
  storeUpiId: trimmed(120).optional(),
  storeUpiName: trimmed(120).optional(),
  restaurantAddress: trimmed(300).optional(),
  autoCloseByTime: z.boolean().optional(),
  heroEyebrow: trimmed(120).optional(),
  heroTitle: trimmed(180).optional(),
  heroSubtitle: trimmed(500).optional(),
  estimatedDeliveryTime: trimmed(60).optional(),
  announcement: z
    .object({
      enabled: z.boolean(),
      text: trimmed(5000),
      type: z.enum(['info', 'warning', 'success', 'urgent']),
    })
    .partial()
    .optional(),
});

// ---------------------------------------------------------------------------
// Auth, profile, cart, push
// ---------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  idToken: trimmed(2000).optional(),
  password: z.string().min(1).optional(),
});

export const cartSyncSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: trimmed(60).min(1),
        quantity: z.coerce.number().int().min(0).max(PRICING.maxQuantityPerItem),
      })
    )
    .max(40),
});

export const profileSchema = z.object({
  displayName: trimmed(80).optional(),
  phone: trimmed(20).optional(),
  photoURL: trimmed(500).optional(),
  addresses: z
    .array(
      z.object({
        id: trimmed(64).optional(),
        label: trimmed(40).default('Home'),
        fullAddress: trimmed(300).min(1, 'Address is required'),
        landmark: trimmed(120).default(''),
        phone: trimmed(20).default(''),
        isDefault: z.boolean().default(false),
      })
    )
    .max(10)
    .optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(600),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

export const adminRoleSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  isAdmin: z.boolean(),
});

export { OPEN_STATUSES, TERMINAL_STATUSES };

/** Flattens a ZodError into `{ "field.path": "message" }` for the UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    result[key] ??= issue.message;
  }
  return result;
}