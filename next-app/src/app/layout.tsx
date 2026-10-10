import type { Metadata } from 'next';
import './globals.css';
import './subpages.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomContactForm from '@/components/BottomContactForm';
import FloatingCtas from '@/components/FloatingCtas';
import CartDrawer from '@/components/CartDrawer';
import SearchModal from '@/components/SearchModal';
import ToastContainer from '@/components/ToastContainer';
import AuthModal from '@/components/AuthModal';

import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import FloatingCartBar from '@/components/FloatingCartBar';

export const metadata: Metadata = {
  title: 'PM Zaika Restaurant – Taste Bhi Best Bhi | Patna',
  description:
    'PM Zaika Restaurant in Patna City serves authentic Mughlai, Chinese, Biryani, and Tandoori dishes with rich flavors and premium quality ingredients.',
  icons: {
    icon: '/assets/images/pm_zaika_circular_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
              <BottomContactForm />
              <FloatingCtas />
              <FloatingCartBar />
              <CartDrawer />
              <SearchModal />
              <ToastContainer />
              <AuthModal />
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
