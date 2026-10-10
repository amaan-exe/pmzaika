import type { Metadata } from 'next';

import OrderTracker from './OrderTracker';
import '../track.css';

export const metadata: Metadata = {
  title: 'Track Your Order | PM Zaika Restaurant',
  description: 'Live order status and UPI payment details for your PM Zaika order.',
  robots: { index: false, follow: false },
};

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const { token } = await searchParams;

  return (
    <section className="track-page">
      <div className="container track-container">
        <OrderTracker orderId={orderId} initialToken={token} />
      </div>
    </section>
  );
}