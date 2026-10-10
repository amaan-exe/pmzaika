import type { Metadata } from 'next';
import '@/app/admin.css';

/**
 * Root layout for `/admin/*`.
 *
 * Imports the admin stylesheet here so that both `/admin/login` and the dashboard
 * have access to admin styles without duplicating imports.
 */

export const metadata: Metadata = {
  title: 'Kitchen Desk | PM Zaika',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}