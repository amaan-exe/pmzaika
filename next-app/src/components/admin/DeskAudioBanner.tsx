'use client';

import React, { useState } from 'react';

interface DeskAudioBannerProps {
  isArmed: boolean;
  soundEnabled: boolean;
  isRinging: boolean;
  onArm: () => Promise<void> | void;
  onOpenSettings: () => void;
}

/**
 * Double-Bezel Background Audio Monitor Banner.
 *
 * Designed to high-end visual standards (nested concentric bezels,
 * fluid micro-motion, button-in-button icon architecture).
 *
 * Ensures kitchen staff arm browser audio in 1-click so incoming orders
 * ring continuously even when browsing other tabs or background windows.
 */
export default function DeskAudioBanner({
  isArmed,
  soundEnabled,
  isRinging,
  onArm,
  onOpenSettings,
}: DeskAudioBannerProps) {
  const [justArmed, setJustArmed] = useState(false);

  const handleArmClick = async () => {
    try {
      await onArm();
      setJustArmed(true);
      setTimeout(() => setJustArmed(false), 5000);
    } catch {
      // Ignore
    }
  };

  if (!soundEnabled) {
    return (
      <div className="desk-audio-banner desk-audio-banner--disabled" role="status">
        <div className="desk-audio-banner-inner">
          <div className="desk-audio-banner-content">
            <span className="desk-audio-icon">🔕</span>
            <div className="desk-audio-text">
              <strong className="desk-audio-title">Kitchen Order Alarm is Muted</strong>
              <span className="desk-audio-desc">
                Sound alerts are currently disabled. Turn alarm on to receive audible chimes.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--sm admin-btn--amber"
            onClick={onOpenSettings}
          >
            <span>⚙️ Alert Settings</span>
          </button>
        </div>
      </div>
    );
  }

  if (isRinging) {
    return (
      <div className="desk-audio-banner desk-audio-banner--ringing" role="alert">
        <div className="desk-audio-banner-inner">
          <div className="desk-audio-banner-content">
            <span className="desk-audio-beacon" />
            <span className="desk-audio-icon">🚨</span>
            <div className="desk-audio-text">
              <strong className="desk-audio-title">
                Incoming Order Alarm Active — Rings Until Acknowledged!
              </strong>
              <span className="desk-audio-desc">
                A new order is waiting in the queue. Acknowledge on the alert card below to silence.
              </span>
            </div>
          </div>
          <div className="admin-sound-wave-bars">
            <span className="admin-sound-bar" />
            <span className="admin-sound-bar" />
            <span className="admin-sound-bar" />
            <span className="admin-sound-bar" />
          </div>
        </div>
      </div>
    );
  }

  if (!isArmed) {
    return (
      <div className="desk-audio-banner desk-audio-banner--standby" role="region">
        <div className="desk-audio-banner-inner">
          <div className="desk-audio-banner-content">
            <div className="desk-audio-icon-wrapper">
              <span className="desk-audio-icon">🔔</span>
              <span className="desk-audio-ping" />
            </div>
            <div className="desk-audio-text">
              <strong className="desk-audio-title">
                Arm Kitchen Audio Monitor for Background Tabs
              </strong>
              <span className="desk-audio-desc">
                Browsers require 1 click to unlock loud background audio. Click to arm so alarms
                ring aloud even while browsing Instagram or other apps.
              </span>
            </div>
          </div>

          <div className="desk-audio-actions">
            <button
              type="button"
              className="admin-btn admin-btn--primary desk-audio-arm-btn"
              onClick={handleArmClick}
              title="Click once to authorize background order alarms on this browser"
            >
              <span>Arm Kitchen Monitor</span>
              <span className="btn-icon-bubble" aria-hidden="true">🔊</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When armed and resting quietly
  return (
    <div
      className={`desk-audio-banner desk-audio-banner--armed ${
        justArmed ? 'desk-audio-banner--just-armed' : ''
      }`}
      role="status"
    >
      <div className="desk-audio-banner-inner">
        <div className="desk-audio-banner-content">
          <span className="desk-audio-status-dot" />
          <div className="desk-audio-text">
            <strong className="desk-audio-title">
              {justArmed
                ? '✅ Background Audio Monitor Armed & Live!'
                : '🟢 Background Audio Active & Ready'}
            </strong>
            <span className="desk-audio-desc">
              Orders desk is openly searching. Incoming orders will ring continuously until acknowledged,
              even if you switch to other tabs or windows.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn--sm admin-btn--ghost"
          onClick={onOpenSettings}
          title="Configure alert tones, repeating frequency, and Web Push notifications"
        >
          <span>⚙️ Tone & Push Settings</span>
        </button>
      </div>
    </div>
  );
}
