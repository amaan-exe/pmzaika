'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Plays a short chime when a new order arrives.
 *
 * Kitchens are loud and staff are not always looking at the screen, so an audio
 * cue is the fastest way to signal a new order. The sound is generated with the
 * Web Audio API — no asset file needed — and only plays after the user has
 * interacted with the page at least once (browser autoplay policy).
 */
export function useNewOrderAlert(orderIds: readonly string[]): {
  enabled: boolean;
  enable: () => void;
} {
  const [enabled, setEnabled] = useState(false);
  const knownIds = useRef<Set<string>>(new Set(orderIds));
  const audioContext = useRef<AudioContext | null>(null);

  // Ask for permission on first interaction, then arm the alert.
  useEffect(() => {
    if (enabled) return;

    const arm = () => {
      setEnabled(true);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };

    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);

    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const fresh = orderIds.filter((id) => !knownIds.current.has(id));
    if (fresh.length === 0) return;

    // Record every id we have now seen so we only chime for genuine newcomers.
    for (const id of orderIds) knownIds.current.add(id);

    try {
      audioContext.current ??= new AudioContext();
      const ctx = audioContext.current;

      // Two-tone chime: a higher note followed by a lower one.
      const now = ctx.currentTime;
      [880, 660].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.0001, now + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.16);

        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(now + index * 0.18);
        oscillator.stop(now + index * 0.18 + 0.18);
      });
    } catch {
      // Audio unavailable (no device, blocked context) — the visual queue still works.
    }
  }, [enabled, orderIds]);

  return { enabled, enable: () => setEnabled(true) };
}