'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminOrder } from '@/lib/admin/types';
import {
  getAudioContext,
  loadSoundConfig,
  playAlertSound,
  saveSoundConfig,
  startAlarmLoop,
  stopAlarmLoop,
  unlockAudioPlayback,
  type SoundConfig,
  type SoundProfile,
} from './audioAlert';

const ACK_STORAGE_KEY = 'pm_zaika_acknowledged_orders_v2';

function loadAcknowledgedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ACK_STORAGE_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function persistAcknowledgedSet(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(set).slice(-250);
    localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Creates an unthrottled Web Worker ticker for repeating alarm chimes.
 *
 * Browsers aggressively throttle timers in background tabs or un-focused windows.
 * Web Workers run on an independent OS thread and are never throttled,
 * ensuring the alarm sounds relentlessly every 2.8s until acknowledged.
 */
function createWorkerAlarmTicker(intervalMs: number, onTick: () => void): (() => void) | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;

  try {
    const workerScript = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('tick');
          }, ${intervalMs});
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.onmessage = (e) => {
      if (e.data === 'tick') onTick();
    };

    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    return null;
  }
}

/**
 * Advanced kitchen order alert hook.
 *
 * Strict guarantee: When an order arrives, it will NEVER stop ringing
 * until the kitchen user explicitly clicks "Acknowledge" or updates the order.
 */
export function useNewOrderAlert(orders: readonly AdminOrder[]) {
  const [config, setConfig] = useState<SoundConfig>(() => loadSoundConfig());
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(() => loadAcknowledgedSet());
  const [activeAlertOrder, setActiveAlertOrder] = useState<AdminOrder | null>(null);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);

  // References to keep worker timer and fallback
  const ringCleanupRef = useRef<(() => void) | null>(null);
  const ringFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRingingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // Unlock and prime HTML5 Audio and Web Audio on any interaction or window focus
  useEffect(() => {
    const unlock = () => {
      unlockAudioPlayback();
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
      } catch {
        // Ignore
      }
    };

    if (typeof document !== 'undefined' && document.hasFocus()) {
      unlock();
    }

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('focus', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('focus', unlock);
      window.removeEventListener('click', unlock);
    };
  }, []);

  // Stop ringing loop
  const stopRinging = useCallback(() => {
    stopAlarmLoop();
    if (ringCleanupRef.current) {
      ringCleanupRef.current();
      ringCleanupRef.current = null;
    }
    if (ringFallbackTimerRef.current) {
      clearInterval(ringFallbackTimerRef.current);
      ringFallbackTimerRef.current = null;
    }
    isRingingRef.current = false;
    setIsRinging(false);
  }, []);

  // Start continuous ringing using unthrottled Web Worker ticker and HTML5 background player
  const startRinging = useCallback(
    (profile: SoundProfile, volume: number) => {
      if (isRingingRef.current) return; // Already ringing continuously

      isRingingRef.current = true;
      setIsRinging(true);

      // 1. Play HTML5 background loop (authorized for background tabs!)
      startAlarmLoop(volume);

      // 2. Start unthrottled repeating alarm ticker
      const cleanupWorker = createWorkerAlarmTicker(2800, () => {
        playAlertSound(profile, volume);
      });

      if (cleanupWorker) {
        ringCleanupRef.current = cleanupWorker;
      } else {
        ringFallbackTimerRef.current = setInterval(() => {
          playAlertSound(profile, volume);
        }, 2800);
      }
    },
    []
  );

  // Mark order acknowledged: stops ringing ONLY when user clicks acknowledge!
  const acknowledgeOrder = useCallback(
    (orderId?: string) => {
      setAcknowledgedIds((prev) => {
        const next = new Set(prev);
        if (orderId) {
          next.add(orderId);
        } else if (activeAlertOrder) {
          next.add(activeAlertOrder.orderId);
        }
        persistAcknowledgedSet(next);
        return next;
      });

      // Check if any other unacknowledged orders exist
      const remaining = orders.filter((o) => {
        if (orderId && o.orderId === orderId) return false;
        if (activeAlertOrder && !orderId && o.orderId === activeAlertOrder.orderId) return false;
        return (
          o.status !== 'delivered' &&
          o.status !== 'served' &&
          o.status !== 'cancelled' &&
          !acknowledgedIds.has(o.orderId)
        );
      });

      if (remaining.length === 0) {
        stopRinging();
        setActiveAlertOrder(null);
        setUnacknowledgedCount(0);
      } else {
        setActiveAlertOrder(remaining[0]);
        setUnacknowledgedCount(remaining.length);
      }
    },
    [orders, activeAlertOrder, acknowledgedIds, stopRinging]
  );

  // Acknowledge all pending orders at once
  const acknowledgeAllOrders = useCallback(() => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      for (const o of orders) {
        next.add(o.orderId);
      }
      persistAcknowledgedSet(next);
      return next;
    });
    stopRinging();
    setActiveAlertOrder(null);
    setUnacknowledgedCount(0);
  }, [orders, stopRinging]);

  // Monitor order list: actively search and trigger alarm for unacknowledged orders
  useEffect(() => {
    if (!orders || orders.length === 0) {
      if (initialLoadDone.current) {
        stopRinging();
        setActiveAlertOrder(null);
        setUnacknowledgedCount(0);
      }
      return;
    }

    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    // Filter for active orders that require acknowledgment
    const pendingUnacknowledged = orders.filter((order) => {
      // Completed or cancelled orders do not ring
      if (order.status === 'delivered' || order.status === 'served' || order.status === 'cancelled') {
        return false;
      }
      // Check if already acknowledged by user
      if (acknowledgedIds.has(order.orderId)) {
        return false;
      }
      // Filter out ancient orders older than 2 hours to avoid stale alarms on initial setup
      const createdMs = new Date(order.createdAt).getTime();
      if (!isNaN(createdMs) && now - createdMs > twoHoursMs) {
        return false;
      }
      return true;
    });

    initialLoadDone.current = true;
    setUnacknowledgedCount(pendingUnacknowledged.length);

    if (pendingUnacknowledged.length > 0) {
      const newest = pendingUnacknowledged[0];
      setActiveAlertOrder(newest);

      // START RINGING: Will NOT stop until user clicks acknowledge!
      if (config.enabled) {
        startRinging(config.profile, config.volume);
      }

      // Trigger native desktop notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notif = new Notification(`🚨 LOUD KITCHEN ALERT: #${newest.orderId}`, {
            body: `₹${Math.round(newest.totals.grandTotalPaise / 100)} • ${newest.customerName} • ${
              newest.items.length
            } items (${newest.orderType.toUpperCase()}). Tap to acknowledge!`,
            icon: '/assets/images/pm_zaika_circular_logo.png',
            tag: `order-${newest.orderId}`,
            requireInteraction: true,
          });

          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch {
          // Ignore
        }
      }
    } else {
      // No unacknowledged orders: silence alarm
      stopRinging();
      setActiveAlertOrder(null);
    }
  }, [orders, acknowledgedIds, config.enabled, config.profile, config.volume, startRinging, stopRinging]);

  // Flash Document Title while alarm is ringing
  useEffect(() => {
    if (!isRinging || !activeAlertOrder || typeof document === 'undefined') return;

    const originalTitle = document.title;
    let toggle = false;

    const titleTimer = setInterval(() => {
      toggle = !toggle;
      document.title = toggle
        ? `🚨 NEW ORDER #${activeAlertOrder.orderId} (₹${Math.round(
            activeAlertOrder.totals.grandTotalPaise / 100
          )})!`
        : `🔔 PM ZAIKA - ACKNOWLEDGE NOW! 🔔`;
    }, 900);

    return () => {
      clearInterval(titleTimer);
      document.title = originalTitle;
    };
  }, [isRinging, activeAlertOrder]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (ringCleanupRef.current) ringCleanupRef.current();
      if (ringFallbackTimerRef.current) clearInterval(ringFallbackTimerRef.current);
    };
  }, []);

  // Update configuration and persist
  const updateConfig = useCallback((updates: Partial<SoundConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      saveSoundConfig(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    const nextState = !config.enabled;
    updateConfig({ enabled: nextState });
    if (!nextState) {
      stopRinging();
    } else {
      unlockAudioPlayback();
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') void ctx.resume();
      } catch {
        // Ignore
      }
    }
  }, [config.enabled, updateConfig, stopRinging]);

  const testSound = useCallback(
    (profile?: SoundProfile, volume?: number) => {
      unlockAudioPlayback();
      playAlertSound(profile ?? config.profile, volume ?? config.volume);
    },
    [config.profile, config.volume]
  );

  return {
    config,
    updateConfig,
    soundEnabled: config.enabled,
    toggleSound,
    enable: () => {
      updateConfig({ enabled: true });
      unlockAudioPlayback();
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') void ctx.resume();
      } catch {
        // Ignore
      }
    },
    activeAlertOrder,
    unacknowledgedCount,
    isRinging,
    acknowledgeOrder,
    acknowledgeAllOrders,
    silenceAlert: acknowledgeOrder,
    testSound,
  };
}