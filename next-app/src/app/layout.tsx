import type { Metadata } from 'next';
import { Outfit, Poppins } from 'next/font/google';
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

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

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
    <html lang="en" className={`${poppins.variable} ${outfit.variable}`}>
      <body className={poppins.className}>
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <Navbar />
              <main>{children}</main>
              <BottomContactForm />
              <Footer />
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
