'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MENU_DATA, MenuItem } from '@/data/menuData';
import { api, rememberTracking } from '@/lib/client/api';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (dishId: string, itemData?: { name?: string; price?: number; image?: string }) => void;
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
  /** Server-side checkout; resolves with the created order and tracking details. */
  placeOrder: (input: PlaceOrderInput) => Promise<PlaceOrderResult>;
  isPlacingOrder: boolean;
  orderError: string | null;
  /** True once the server cart has been merged into local state. */
  isCartSynced: boolean;
}

export interface PlaceOrderInput {
  orderType: 'delivery' | 'dinein';
  customerName: string;
  customerPhone: string;
  address?: string;
  tableNote?: string;
  notes?: string;
  couponCode?: string;
  userId?: string;
  userEmail?: string;
}

export interface PlaceOrderResult {
  orderId: string;
  trackingUrl: string;
  trackingToken: string;
  paymentProofUrl: string;
  totalPaise: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Builds a cart line from the canonical site menu or cached cart item. */
function toCartItem(dishId: string, quantity: number, existing?: CartItem): CartItem | null {
  if (quantity <= 0) return null;
  const dish = MENU_DATA.find((entry: MenuItem) => entry.id === dishId);
  if (dish) {
    return {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      quantity,
    };
  }
  if (existing) {
    return {
      ...existing,
      quantity,
    };
  }
  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuth, getIdToken } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isCartSynced, setIsCartSynced] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Merge the server-side cart on first load so a new device (or cleared
  // storage) picks up where the customer left off.
  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;

    api
      .get<{ cart?: { items?: Array<{ menuItemId: string; quantity: number }> } }>(
        '/api/cart'
      )
      .then(({ cart }) => {
        if (cancelled) return;
        const remote = cart?.items ?? [];
        if (remote.length === 0) return;

        setItems((prev) => {
          const merged = new Map(prev.map((item) => [item.id, item.quantity]));

          for (const line of remote) {
            const localQty = merged.get(line.menuItemId) ?? 0;
            merged.set(line.menuItemId, Math.max(localQty, line.quantity));
          }

          return [...merged.entries()]
            .map(([id, quantity]) => {
              const prevItem = prev.find((p) => p.id === id);
              return toCartItem(id, quantity, prevItem);
            })
            .filter((item): item is CartItem => item !== null);
        });
      })
      .catch(() => {
        // Server cart unavailable – localStorage remains the source of truth.
      })
      .finally(() => {
        if (!cancelled) setIsCartSynced(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isMounted]);

  // Debounced mirror of local cart state to the server.
  useEffect(() => {
    if (!isMounted || !isCartSynced) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      api
        .put('/api/cart', {
          items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        })
        .catch(() => {
          // Non-critical: the local cart still works offline.
        });
    }, 800);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, isMounted, isCartSynced]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const addToCart = (
    dishId: string,
    itemData?: { name?: string; price?: number; image?: string }
  ) => {
    const dish = MENU_DATA.find((d) => d.id === dishId);
    const name = itemData?.name ?? dish?.name;
    const price = itemData?.price ?? dish?.price;
    const image = itemData?.image || dish?.image || '/assets/images/image2.webp';

    if (!name || price === undefined) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === dishId);
      if (existing) {
        return prev.map((item) =>
          item.id === dishId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: dishId, name, price, image, quantity: 1 }];
    });

    showToast(`Added "${name}" to cart! 🍽️`);
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

  /**
   * Places the order through the backend.
   *
   * The browser only sends menu ids and quantities — pricing, availability,
   * coupons and fees are all resolved server-side, and the response carries the
   * tracking token plus the WhatsApp deep link for the payment proof.
   */
  const placeOrder = async (input: PlaceOrderInput): Promise<PlaceOrderResult> => {
    if (items.length === 0) {
      throw new Error('Your cart is empty! Add some delicious dishes first.');
    }
    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      let idToken: string | undefined;
      if (user) {
        try {
          idToken = await getIdToken();
        } catch {
          // If token refresh fails, continue gracefully rather than blocking the customer order
        }
      }

      const headers: Record<string, string> = {};
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const response = await api.post<{
        order: { orderId: string; totals: { grandTotalPaise: number } };
        trackingToken: string;
        trackingUrl: string;
        paymentProofUrl: string;
      }>(
        '/api/orders',
        {
          orderType: input.orderType,
          items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
          customer: {
            name: input.customerName,
            phone: input.customerPhone,
            address: input.address,
            tableNote: input.tableNote,
          },
          notes: input.notes,
          couponCode: input.couponCode,
          userId: user?.uid,
          userEmail: user?.email ?? undefined,
        },
        headers
      );

      rememberTracking({
        orderId: response.order.orderId,
        token: response.trackingToken,
      });

      setItems([]);
      api.del('/api/cart').catch(() => undefined);

      return {
        orderId: response.order.orderId,
        trackingUrl: response.trackingUrl,
        trackingToken: response.trackingToken,
        paymentProofUrl: response.paymentProofUrl,
        totalPaise: response.order.totals.grandTotalPaise,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not place your order';
      setOrderError(message);
      showToast(message);
      throw error;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const checkoutWhatsApp = () => {
    if (items.length === 0) {
      showToast('Your cart is empty! Add some delicious dishes first.');
      return;
    }
    // Checkout now needs contact details, so send the customer to the cart page.
    window.location.href = '/cart';
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
        placeOrder,
        isPlacingOrder,
        orderError,
        isCartSynced,
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