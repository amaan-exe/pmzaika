'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RestaurantSettings } from '@/lib/domain/types';

interface StoreSettingsContextType {
  settings: Partial<RestaurantSettings>;
  isOpen: boolean;
  closedReason: string | null;
  loading: boolean;
}

const DEFAULT_SETTINGS: Partial<RestaurantSettings> = {
  restaurantName: 'PM Zaika Restaurant',
  isStoreOpen: true,
  deliveryChargePaise: 2900,
  freeDeliveryAbovePaise: 49900,
  openingTime: '11:00 AM',
  closingTime: '11:30 PM',
  heroEyebrow: 'Welcome to PM Zaika Restaurant',
  heroTitle: 'Giving your Hunger a new Option',
  heroSubtitle:
    'Freshly prepared royal delicacies crafted with authentic heritage spices and hand-picked ingredients, designed to indulge your palate every single time.',
  estimatedDeliveryTime: '30-45 mins',
  announcement: {
    enabled: false,
    text: '',
    type: 'info',
  },
};

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isOpen: true,
  closedReason: null,
  loading: false,
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Partial<RestaurantSettings>>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(true);
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.ok && data.settings) {
          setSettings(data.settings);
          if (data.availability) {
            const isStoreOpen =
              typeof data.availability.isOpen === 'boolean'
                ? data.availability.isOpen
                : typeof data.availability.acceptingOrders === 'boolean'
                ? data.availability.acceptingOrders
                : Boolean(data.settings?.isStoreOpen ?? true);

            setIsOpen(isStoreOpen);
            setClosedReason(data.availability.reason);
          }
        }
      } catch (err) {
        // Silently use defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        isOpen,
        closedReason,
        loading,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
