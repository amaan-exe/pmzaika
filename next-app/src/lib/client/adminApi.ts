/**
 * Typed client for the admin API.
 *
 * Every call relies on the `pm_admin_session` httpOnly cookie set by
 * `POST /api/admin/session`, so nothing here has to handle tokens.
 */

import { ApiError, api } from '@/lib/client/api';
import type {
  AdminCategory,
  AdminCoupon,
  AdminMenuItem,
  AdminOrder,
  AdminPayment,
  AdminReservation,
  AdminSessionInfo,
  AdminSettings,
  AdminStats,
  AdminUser,
  Capabilities,
  OrderStatus,
  PaymentStatus,
  ReservationStatus,
} from '@/lib/admin/types';

export { ApiError };

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionResponse {
  session: AdminSessionInfo;
  capabilities: Capabilities;
}

/**
 * Signs in. `password` is used when running without Firebase Auth;
 * `idToken` is the Firebase Auth token once Firebase is configured.
 */
export async function signIn(input: {
  password?: string;
  idToken?: string;
}): Promise<SessionResponse> {
  return api.post<SessionResponse>('/api/admin/session', input);
}

export function currentSession(): Promise<SessionResponse> {
  return api.get<SessionResponse>('/api/admin/session');
}

export function signOut(): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>('/api/admin/session');
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface StatsResponse {
  stats: AdminStats;
  categories: AdminCategory[];
}

export async function fetchStats(): Promise<StatsResponse> {
  return api.get<StatsResponse>('/api/admin/stats');
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderQuery {
  status?: OrderStatus | 'all' | 'open' | 'closed';
  paymentStatus?: string;
  orderType?: 'delivery' | 'dinein';
  search?: string;
  scope?: 'active' | 'archive' | 'all';
  limit?: number;
}

export interface OrdersResponse {
  total: number;
  orders: AdminOrder[];
}

function toQueryString(query: OrderQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || value === 'all') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * The kitchen queue filters on the server, but the "open" convenience tab maps
 * to a status list the dashboard resolves here.
 */
const OPEN_STATUS_LIST: OrderStatus[] = [
  'payment_verification_pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
];

export async function fetchOrders(query: OrderQuery = {}): Promise<OrdersResponse> {
  const resolved: OrderQuery = { ...query, scope: query.scope ?? 'active' };

  if (query.status === 'open') {
    resolved.status = undefined;
    paramsSet(resolved, 'status', OPEN_STATUS_LIST.join(','));
  }

  return api.get<OrdersResponse>(`/api/admin/orders${toQueryString(resolved)}`);
}

// Small helper so `fetchOrders` can add a computed filter without mutating input.
function paramsSet<T extends object>(target: T, key: string, value: string): void {
  (target as Record<string, unknown>)[key] = value;
}

export async function updateOrderStatus(
  orderId: string,
  payload: {
    status: OrderStatus;
    note?: string;
    rejectionReason?: string;
  }
): Promise<{ order: AdminOrder }> {
  return api.patch<{ order: AdminOrder }>(
    `/api/orders/${encodeURIComponent(orderId)}/status`,
    payload
  );
}

export async function updateRefund(
  orderId: string,
  status: 'REQUESTED' | 'PROCESSING' | 'REFUNDED' | 'REJECTED',
  note?: string
): Promise<{ order: AdminOrder }> {
  return api.patch<{ order: AdminOrder }>(
    `/api/orders/${encodeURIComponent(orderId)}/refund`,
    { status, note }
  );
}

export async function restoreOrder(orderId: string): Promise<{ order: AdminOrder }> {
  return api.post<{ order: AdminOrder }>(
    `/api/orders/${encodeURIComponent(orderId)}/restore`
  );
}

/** WhatsApp deep links for an order, used by the "notify customer" action. */
export async function orderWhatsappLinks(orderId: string): Promise<{
  statusUpdate: { url: string };
  cancellation: { url: string };
}> {
  return api.get(`/api/orders/${encodeURIComponent(orderId)}/whatsapp`);
}

export async function verifyPaymentProof(
  orderId: string,
  transactionReference?: string,
  note?: string
): Promise<{ paymentStatus: PaymentStatus }> {
  return api.post(
    `/api/orders/${encodeURIComponent(orderId)}/payment-proof`,
    { transactionReference, note }
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export interface MenuResponse {
  count: number;
  categories: AdminCategory[];
  items: AdminMenuItem[];
}

export async function fetchMenu(category?: string): Promise<MenuResponse> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return api.get<MenuResponse>(`/api/admin/menu${qs}`);
}

export interface MenuItemInput {
  title: string;
  description?: string;
  pricePaise: number;
  category: string;
  categoryName?: string;
  image?: string;
  vegNonVeg?: 'veg' | 'non-veg';
  isAvailable?: boolean;
  isPopular?: boolean;
  badge?: string;
}

export async function createMenuItem(input: MenuItemInput): Promise<{ item: AdminMenuItem }> {
  return api.post<{ item: AdminMenuItem }>('/api/admin/menu', input);
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>
): Promise<{ item: AdminMenuItem }> {
  return api.patch<{ item: AdminMenuItem }>(
    `/api/admin/menu/${encodeURIComponent(id)}`,
    input
  );
}

export async function toggleMenuItem(id: string): Promise<{ item: AdminMenuItem }> {
  return api.put<{ item: AdminMenuItem }>(`/api/admin/menu/${encodeURIComponent(id)}`, {});
}

export async function deleteMenuItem(id: string): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(`/api/admin/menu/${encodeURIComponent(id)}`);
}

export async function reseedMenu(): Promise<{ seeded: number }> {
  return api.post<{ seeded: number }>('/api/admin/menu/seed');
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface CouponsResponse {
  count: number;
  coupons: AdminCoupon[];
}

export type CouponInput = Omit<
  AdminCoupon,
  'id' | 'usedCount' | 'usedByUsers'
>;

export async function fetchCoupons(search?: string): Promise<CouponsResponse> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return api.get<CouponsResponse>(`/api/admin/coupons${qs}`);
}

export async function createCoupon(
  input: CouponInput
): Promise<{ coupon: AdminCoupon }> {
  return api.post<{ coupon: AdminCoupon }>('/api/admin/coupons', input);
}

export async function updateCoupon(
  id: string,
  input: Partial<CouponInput>
): Promise<{ coupon: AdminCoupon }> {
  return api.patch<{ coupon: AdminCoupon }>(
    `/api/admin/coupons/${encodeURIComponent(id)}`,
    input
  );
}

export async function deleteCoupon(id: string): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(`/api/admin/coupons/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type SettingsPatch = Partial<Omit<AdminSettings, 'announcement'>> & {
  announcement?: Partial<AdminSettings['announcement']>;
};

export async function fetchSettings(): Promise<{ settings: AdminSettings }> {
  return api.get<{ settings: AdminSettings }>('/api/admin/settings');
}

export async function saveSettings(
  patch: SettingsPatch
): Promise<{ settings: AdminSettings }> {
  return api.put<{ settings: AdminSettings }>('/api/admin/settings', patch);
}

// ---------------------------------------------------------------------------
// Payments & users
// ---------------------------------------------------------------------------

export async function fetchPayments(): Promise<{ count: number; entries: AdminPayment[] }> {
  return api.get('/api/admin/payments');
}

export async function fetchUsers(): Promise<{
  count: number;
  users: AdminUser[];
  admins: Array<{ id: string; email: string; isAdmin: boolean }>;
}> {
  return api.get('/api/admin/users');
}

export async function setAdminRole(
  email: string,
  isAdmin: boolean
): Promise<{ ok: boolean }> {
  return api.patch<{ ok: boolean }>(
    `/api/admin/users/${encodeURIComponent(email)}`,
    { email, isAdmin }
  );
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export interface ReservationsResponse {
  total: number;
  reservations: AdminReservation[];
}

export async function fetchAdminReservations(filter: {
  status?: string;
  date?: string;
  search?: string;
  limit?: number;
}): Promise<ReservationsResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return api.get<ReservationsResponse>(`/api/admin/reservations${qs ? `?${qs}` : ''}`);
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus,
): Promise<{ reservation: AdminReservation }> {
  return api.patch<{ reservation: AdminReservation }>(
    `/api/admin/reservations/${encodeURIComponent(reservationId)}`,
    { status },
  );
}

export async function deleteReservation(reservationId: string): Promise<{ ok: boolean }> {
  return api.del<{ ok: boolean }>(
    `/api/admin/reservations/${encodeURIComponent(reservationId)}`,
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function fetchNotificationLog(): Promise<{
  count: number;
  logs: Array<{
    id: string;
    source: string;
    event: string;
    reference: string;
    status: string;
    detail: string;
    createdAt: string;
  }>;
}> {
  return api.get('/api/admin/payments/webhook-logs');
}