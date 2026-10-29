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
    linkUrl: '',
    linkLabel: '',
    marquee: false,
    highlightBadge: '',
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

    // 1. Instant hydration from sessionStorage if available
    try {
      const cached = sessionStorage.getItem('pm_zaika_store_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.settings && Date.now() - (parsed.ts || 0) < 300_000) {
          setSettings(parsed.settings);
          if (typeof parsed.isOpen === 'boolean') setIsOpen(parsed.isOpen);
          if (parsed.closedReason !== undefined) setClosedReason(parsed.closedReason);
          setLoading(false);
        }
      }
    } catch {
      // sessionStorage unavailable
    }

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.ok && data.settings) {
          setSettings(data.settings);
          let storeIsOpen = true;
          let storeClosedReason: string | null = null;

          if (data.availability) {
            storeIsOpen =
              typeof data.availability.isOpen === 'boolean'
                ? data.availability.isOpen
                : typeof data.availability.acceptingOrders === 'boolean'
                ? data.availability.acceptingOrders
                : Boolean(data.settings?.isStoreOpen ?? true);

            storeClosedReason = data.availability.reason ?? null;
            setIsOpen(storeIsOpen);
            setClosedReason(storeClosedReason);
          }

          // Cache in sessionStorage for instant 0ms repeat loads
          try {
            sessionStorage.setItem(
              'pm_zaika_store_settings',
              JSON.stringify({
                settings: data.settings,
                isOpen: storeIsOpen,
                closedReason: storeClosedReason,
                ts: Date.now(),
              })
            );
          } catch {}
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
