/** Lifecycle events emitted to the notification channels. */
export type OrderEventName =
  | 'order.created'
  | 'order.payment_verified'
  | 'order.status_changed'
  | 'order.cancelled'
  | 'order.completed';

export interface DispatchChannel {
  name: 'telegram' | 'webpush' | 'webhook';
  attempted: boolean;
  success: boolean;
  detail: string;
}

export interface DispatchResult {
  event: OrderEventName;
  /** True when the notification had already been sent for this order. */
  duplicate: boolean;
  channels: DispatchChannel[];
}