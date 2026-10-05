'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MENU_DATA, MenuItem } from '@/data/menuData';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (dishId: string) => void;
  updateQuantity: (dishId: string, delta: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  isReservationOpen: boolean;
  openReservation: () => void;
  closeReservation: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  checkoutWhatsApp: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load cart from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('pm_zaika_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('pm_zaika_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [items, isMounted]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = (dishId: string) => {
    const dish = MENU_DATA.find((d) => d.id === dishId);
    if (!dish) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === dishId);
      if (existing) {
        return prev.map((item) =>
          item.id === dishId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          quantity: 1,
        },
      ];
    });

    showToast(`Added "${dish.name}" to cart! 🍽️`);
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (dishId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== dishId));
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openReservation = () => setIsReservationOpen(true);
  const closeReservation = () => setIsReservationOpen(false);

  const checkoutWhatsApp = () => {
    if (items.length === 0) {
      showToast('Your cart is empty! Add some delicious dishes first.');
      return;
    }

    const phone = '917488260572';
    let message = `🍽️ *NEW ORDER - PM ZAIKA RESTAURANT*\n`;
    message += `───────────────────\n`;

    items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n   Qty: ${item.quantity} x ₹${item.price} = ₹${item.quantity * item.price}\n`;
    });

    message += `───────────────────\n`;
    message += `💰 *Subtotal:* ₹${subtotal}\n`;
    message += `🛵 *Delivery:* To be calculated\n`;
    message += `📍 *Delivery Address:* [Please enter address]\n`;
    message += `───────────────────\n`;
    message += `Please confirm my order. Thank you!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        subtotal,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        isSearchOpen,
        openSearch,
        closeSearch,
        isReservationOpen,
        openReservation,
        closeReservation,
        toastMessage,
        showToast,
        checkoutWhatsApp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
