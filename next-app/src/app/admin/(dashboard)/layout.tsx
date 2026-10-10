import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/auth/admin';
import AdminShell from '@/components/admin/AdminShell';
import { listOrders } from '@/lib/orders/service';
import '@/app/admin.css';

/**
 * Auth gate for every admin page except `/admin/login`.
 *
 * The route group does not affect the URL, so this still serves `/admin`,
 * `/admin/orders`, and so on — while the login page sits outside it.
 */
export default async function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  // Sidebar badge: how many orders still need a payment decision.
  let pendingCount = 0;
  try {
    const { orders } = await listOrders({
      paymentStatus: ['awaiting', 'verification_pending'],
      limit: 100,
    });
    pendingCount = orders.length;
  } catch {
    // A count failure must never block the dashboard from rendering.
  }

  return (
    <AdminShell
      session={{ email: session.email, provider: session.provider }}
      pendingCount={pendingCount}
    >
      {children}
    </AdminShell>
  );
}