'use client';

import React, { useCallback, useState } from 'react';

import { fetchSettings, saveSettings } from '@/lib/client/adminApi';
import type { AdminSettings } from '@/lib/admin/types';
import { Alert, Loading, PageHeader } from '@/components/admin/ui';
import { useAsyncData } from '@/components/admin/useAsyncData';

/** Mirrors the server settings object, but money is typed in rupees. */
interface SettingsFormState {
  isStoreOpen: boolean;
  autoCloseByTime: boolean;
  openingTime: string;
  closingTime: string;
  deliveryChargeRupees: string;
  freeDeliveryAboveRupees: string;
  minimumOrderRupees: string;
  gstPercentage: string;
  storeUpiId: string;
  storeUpiName: string;
  supportPhone: string;
  announcementEnabled: boolean;
  announcementType: 'info' | 'warning' | 'success' | 'urgent';
  announcementText: string;
  announcementLinkUrl: string;
  announcementLinkLabel: string;
  announcementMarquee: boolean;
  announcementHighlightBadge: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  estimatedDeliveryTime: string;
}

const ANNOUNCEMENT_TYPES: Array<{ id: SettingsFormState['announcementType']; label: string; icon: string }> = [
  { id: 'info', label: 'Info (Blue)', icon: '📢' },
  { id: 'warning', label: 'Warning (Amber)', icon: '⚠️' },
  { id: 'success', label: 'Offer / Deal (Green)', icon: '🎉' },
  { id: 'urgent', label: 'Urgent Alert (Red)', icon: '🚨' },
];

interface AnnouncementPreset {
  id: string;
  icon: string;
  name: string;
  badge: string;
  text: string;
  type: SettingsFormState['announcementType'];
  linkUrl: string;
  linkLabel: string;
  marquee: boolean;
}

const ANNOUNCEMENT_PRESETS: AnnouncementPreset[] = [
  {
    id: 'biryani-offer',
    icon: '🍛',
    name: 'Weekend Biryani Deal',
    badge: 'FLASH OFFER',
    text: 'Flat 20% OFF on all Handi & Dum Biryanis today! Use code ZAIKA20 at checkout.',
    type: 'success',
    linkUrl: '/#menu-showcase',
    linkLabel: 'Order Biryani',
    marquee: false,
  },
  {
    id: 'free-delivery',
    icon: '🛵',
    name: 'Free Express Delivery',
    badge: 'FREE DELIVERY',
    text: 'Enjoy Zero Delivery Fee on all direct orders above ₹399 anywhere in Patna!',
    type: 'info',
    linkUrl: '/#menu-showcase',
    linkLabel: 'Explore Menu',
    marquee: false,
  },
  {
    id: 'late-night-ticker',
    icon: '⚡',
    name: 'Midnight Ticker',
    badge: 'LATE NIGHT DEAL',
    text: '⚡ Midnight Biryani Craving? Complimentary Gulab Jamun on all family meals placed before 11:30 PM!',
    type: 'success',
    linkUrl: '/#menu-showcase',
    linkLabel: 'Claim Offer',
    marquee: true,
  },
  {
    id: 'kitchen-rush',
    icon: '🚨',
    name: 'High Kitchen Volume',
    badge: 'KITCHEN RUSH',
    text: 'Kitchen is currently experiencing peak dinner order volume. Please allow 15–20 min cooking buffer.',
    type: 'urgent',
    linkUrl: '',
    linkLabel: '',
    marquee: false,
  },
  {
    id: 'monsoon-alert',
    icon: '🌧️',
    name: 'Monsoon Advisory',
    badge: 'WEATHER ADVISORY',
    text: 'Heavy rainfall in Patna: Rider safety prioritized, delivery times may be slightly extended.',
    type: 'warning',
    linkUrl: '/contact',
    linkLabel: 'Live Support',
    marquee: false,
  },
  {
    id: 'table-reservation',
    icon: '👑',
    name: 'Royal Dine-In',
    badge: 'TABLE BOOKING',
    text: 'Host your family dinner at PM Zaika! Weekend Mughlai table reservations are now open.',
    type: 'info',
    linkUrl: '/reservation',
    linkLabel: 'Book Table',
    marquee: false,
  },
];

/** Money boundary: the form shows rupees, the API stores paise. */
const rupeesToPaise = (text: string): number => Math.round((Number.parseFloat(text) || 0) * 100);

function toFormState(settings: AdminSettings): SettingsFormState {
  return {
    isStoreOpen: settings.isStoreOpen,
    autoCloseByTime: settings.autoCloseByTime,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    deliveryChargeRupees: String(settings.deliveryChargePaise / 100),
    freeDeliveryAboveRupees: String(settings.freeDeliveryAbovePaise / 100),
    minimumOrderRupees: String(settings.minimumOrderPaise / 100),
    gstPercentage: String(settings.gstPercentage),
    storeUpiId: settings.storeUpiId,
    storeUpiName: settings.storeUpiName,
    supportPhone: settings.supportPhone,
    announcementEnabled: settings.announcement.enabled,
    announcementType: settings.announcement.type,
    announcementText: settings.announcement.text,
    announcementLinkUrl: settings.announcement.linkUrl || '',
    announcementLinkLabel: settings.announcement.linkLabel || '',
    announcementMarquee: Boolean(settings.announcement.marquee),
    announcementHighlightBadge: settings.announcement.highlightBadge || '',
    heroEyebrow: settings.heroEyebrow || 'Welcome to PM Zaika Restaurant',
    heroTitle: settings.heroTitle || 'Giving your Hunger a new Option',
    heroSubtitle:
      settings.heroSubtitle ||
      'Freshly prepared royal delicacies crafted with authentic heritage spices and hand-picked ingredients, designed to indulge your palate every single time.',
    estimatedDeliveryTime: settings.estimatedDeliveryTime || '30-45 mins',
  };
}

/**
 * The editable form, seeded from the server on first render.
 *
 * The parent keys this component by `settings.updatedAt`, so a successful save
 * re-mounts it with fresh server values instead of trusting the local copy.
 */
function SettingsForm({
  settings,
  onSaved,
}: {
  settings: AdminSettings;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SettingsFormState>(() => toFormState(settings));
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setNotice(null);

      try {
        // One call so the storefront never sees half-applied operations data.
        await saveSettings({
          isStoreOpen: form.isStoreOpen,
          autoCloseByTime: form.autoCloseByTime,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          deliveryChargePaise: rupeesToPaise(form.deliveryChargeRupees),
          freeDeliveryAbovePaise: rupeesToPaise(form.freeDeliveryAboveRupees),
          minimumOrderPaise: rupeesToPaise(form.minimumOrderRupees),
          gstPercentage: Number.parseFloat(form.gstPercentage) || 0,
          storeUpiId: form.storeUpiId.trim(),
          storeUpiName: form.storeUpiName.trim(),
          supportPhone: form.supportPhone.trim(),
          announcement: {
            enabled: form.announcementEnabled,
            type: form.announcementType,
            text: form.announcementText.trim(),
            linkUrl: form.announcementLinkUrl.trim(),
            linkLabel: form.announcementLinkLabel.trim(),
            marquee: form.announcementMarquee,
            highlightBadge: form.announcementHighlightBadge.trim(),
          },
          heroEyebrow: form.heroEyebrow.trim(),
          heroTitle: form.heroTitle.trim(),
          heroSubtitle: form.heroSubtitle.trim(),
          estimatedDeliveryTime: form.estimatedDeliveryTime.trim(),
        });
        setNotice('Settings saved. The storefront picks these up on its next load.');
        onSaved();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save settings.');
      } finally {
        setSaving(false);
      }
    },
    [form, onSaved],
  );

  const applyPreset = (preset: AnnouncementPreset) => {
    setForm((current) => ({
      ...current,
      announcementEnabled: true,
      announcementType: preset.type,
      announcementText: preset.text,
      announcementHighlightBadge: preset.badge,
      announcementLinkUrl: preset.linkUrl,
      announcementLinkLabel: preset.linkLabel,
      announcementMarquee: preset.marquee,
    }));
  };

  const set = <K extends keyof SettingsFormState>(key: K, value: SettingsFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <form onSubmit={(e) => void handleSave(e)}>
      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* Store status */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Store status</h2>
          </div>

          <label
            className="admin-form-label"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <input
              type="checkbox"
              checked={form.isStoreOpen}
              onChange={(e) => set('isStoreOpen', e.target.checked)}
            />
            Accepting orders
          </label>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--admin-muted)' }}>
            Turning this off blocks checkout immediately. Customers can still browse the menu.
          </p>

          <label
            className="admin-form-label"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <input
              type="checkbox"
              checked={form.autoCloseByTime}
              onChange={(e) => set('autoCloseByTime', e.target.checked)}
            />
            Close automatically at closing time
          </label>
        </div>

        {/* Hours */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Hours</h2>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="opening-time">
                Opens
              </label>
              <input
                id="opening-time"
                className="admin-input"
                type="time"
                value={form.openingTime}
                onChange={(e) => set('openingTime', e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="closing-time">
                Closes
              </label>
              <input
                id="closing-time"
                className="admin-input"
                type="time"
                value={form.closingTime}
                onChange={(e) => set('closingTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Pricing</h2>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="delivery-charge">
                Delivery charge (₹)
              </label>
              <input
                id="delivery-charge"
                className="admin-input"
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={form.deliveryChargeRupees}
                onChange={(e) => set('deliveryChargeRupees', e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="free-delivery-above">
                Free delivery above (₹)
              </label>
              <input
                id="free-delivery-above"
                className="admin-input"
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={form.freeDeliveryAboveRupees}
                onChange={(e) => set('freeDeliveryAboveRupees', e.target.value)}
              />
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="minimum-order">
                Minimum order (₹)
              </label>
              <input
                id="minimum-order"
                className="admin-input"
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={form.minimumOrderRupees}
                onChange={(e) => set('minimumOrderRupees', e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="gst">
                GST (%)
              </label>
              <input
                id="gst"
                className="admin-input"
                type="number"
                min={0}
                max={100}
                step="0.01"
                inputMode="decimal"
                value={form.gstPercentage}
                onChange={(e) => set('gstPercentage', e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="estimated-delivery">
              Estimated delivery time label
            </label>
            <input
              id="estimated-delivery"
              className="admin-input"
              value={form.estimatedDeliveryTime}
              onChange={(e) => set('estimatedDeliveryTime', e.target.value)}
              placeholder="e.g. 30-45 mins"
              maxLength={60}
            />
          </div>
        </div>

        {/* Homepage & Brand Customization */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Homepage & Brand Content</h2>
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="hero-eyebrow">
              Hero Welcome Pill / Eyebrow
            </label>
            <input
              id="hero-eyebrow"
              className="admin-input"
              value={form.heroEyebrow}
              onChange={(e) => set('heroEyebrow', e.target.value)}
              placeholder="Welcome to PM Zaika Restaurant"
              maxLength={120}
            />
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="hero-title">
              Hero Main Headline
            </label>
            <input
              id="hero-title"
              className="admin-input"
              value={form.heroTitle}
              onChange={(e) => set('heroTitle', e.target.value)}
              placeholder="Giving your Hunger a new Option"
              maxLength={180}
            />
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="hero-subtitle">
              Hero Tagline / Subtitle
            </label>
            <textarea
              id="hero-subtitle"
              className="admin-textarea"
              style={{ minHeight: 75 }}
              value={form.heroSubtitle}
              onChange={(e) => set('heroSubtitle', e.target.value)}
              maxLength={450}
              placeholder="Freshly prepared royal delicacies crafted with authentic heritage spices..."
            />
          </div>
        </div>

        {/* Payments */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Payments</h2>
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="upi-id">
              Store UPI ID
            </label>
            <input
              id="upi-id"
              className="admin-input"
              value={form.storeUpiId}
              onChange={(e) => set('storeUpiId', e.target.value)}
              maxLength={120}
              placeholder="zaika@upi"
            />
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="upi-name">
                UPI payee name
              </label>
              <input
                id="upi-name"
                className="admin-input"
                value={form.storeUpiName}
                onChange={(e) => set('storeUpiName', e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="support-phone">
                Support phone
              </label>
              <input
                id="support-phone"
                className="admin-input"
                value={form.supportPhone}
                onChange={(e) => set('supportPhone', e.target.value)}
                maxLength={30}
              />
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div className="announcement-card-header">
            <div>
              <h2 className="admin-card-title" style={{ fontSize: 18, marginBottom: 2 }}>
                Store Announcement Banner
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--admin-muted)' }}>
                Configure real-time top-of-page notifications, promotions, and kitchen advisories across the storefront.
              </p>
            </div>
            {form.announcementEnabled ? (
              <span className="announcement-status-pill announcement-status-pill--active">
                ● Live on Storefront
              </span>
            ) : (
              <span className="announcement-status-pill announcement-status-pill--inactive">
                ○ Inactive / Off
              </span>
            )}
          </div>

          {/* Master Enable Toggle */}
          <div className="announcement-toggle-row">
            <div className="announcement-toggle-info">
              <span className="announcement-toggle-title">Show announcement on website</span>
              <span className="announcement-toggle-desc">
                When active, displays a polished top announcement bar above the navigation on all storefront pages.
              </span>
            </div>
            <label className="admin-switch-label">
              <input
                type="checkbox"
                checked={form.announcementEnabled}
                onChange={(e) => set('announcementEnabled', e.target.checked)}
              />
              <span className="admin-switch-slider"></span>
            </label>
          </div>

          {/* Quick Presets Grid */}
          <div className="announcement-presets-section">
            <div className="announcement-presets-head">
              <span className="announcement-presets-title">
                ⚡ 1-Click Fast Presets (Click to autofill)
              </span>
              <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>
                Instantly pre-fill high-converting banners
              </span>
            </div>
            <div className="announcement-presets-grid">
              {ANNOUNCEMENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="announcement-preset-btn"
                  onClick={() => applyPreset(preset)}
                  title={preset.text}
                >
                  <span className="announcement-preset-top">
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </span>
                  <span className="announcement-preset-desc">
                    [{preset.badge}] {preset.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Style Segmented Cards */}
          <div className="admin-field">
            <label className="admin-form-label">
              Banner Style & Tone
            </label>
            <div className="announcement-themes-grid">
              {ANNOUNCEMENT_TYPES.map((type) => {
                const isSelected = form.announcementType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`announcement-theme-card announcement-theme-card--${type.id} ${
                      isSelected ? 'active' : ''
                    }`}
                    onClick={() => set('announcementType', type.id)}
                    disabled={!form.announcementEnabled}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 14,
            }}
          >
            {/* Highlight Tag / Badge */}
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="announcement-badge">
                Highlight Badge / Tag (Optional)
              </label>
              <input
                id="announcement-badge"
                className="admin-input"
                value={form.announcementHighlightBadge}
                onChange={(e) => set('announcementHighlightBadge', e.target.value)}
                placeholder="e.g. FLASH OFFER, FREE DELIVERY, NOTICE"
                maxLength={40}
                disabled={!form.announcementEnabled}
              />
              <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 4, display: 'block' }}>
                Shows as a stylish pill badge next to the icon.
              </span>
            </div>

            {/* Continuous Marquee Ticker Toggle */}
            <div className="admin-field">
              <label className="admin-form-label">
                Display Mode
              </label>
              <div className="announcement-toggle-row" style={{ marginTop: 0, padding: '9px 12px' }}>
                <div className="announcement-toggle-info">
                  <span className="announcement-toggle-title" style={{ fontSize: 13 }}>
                    Continuous Scrolling Marquee
                  </span>
                  <span className="announcement-toggle-desc" style={{ fontSize: 11 }}>
                    Seamless horizontal loop. Great for long notices or mobile screens.
                  </span>
                </div>
                <label className="admin-switch-label">
                  <input
                    type="checkbox"
                    checked={form.announcementMarquee}
                    onChange={(e) => set('announcementMarquee', e.target.checked)}
                    disabled={!form.announcementEnabled}
                  />
                  <span className="admin-switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Announcement Text */}
          <div className="admin-field" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="admin-form-label" htmlFor="announcement-text">
                Announcement Message
              </label>
              <span
                style={{
                  fontSize: 11.5,
                  color: form.announcementText.length > 4500 ? 'var(--admin-red)' : 'var(--admin-muted)',
                }}
              >
                {form.announcementText.length} / 5000
              </span>
            </div>
            <textarea
              id="announcement-text"
              className="admin-textarea"
              value={form.announcementText}
              onChange={(e) => set('announcementText', e.target.value)}
              maxLength={5000}
              disabled={!form.announcementEnabled}
              style={{ minHeight: 70 }}
              placeholder="e.g. Flat 20% OFF on all Handi Biryanis today! Use code ZAIKA20 at checkout."
            />
          </div>

          {/* Action Button & Link (CTA) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 14,
            }}
          >
            <div className="admin-field">
              <label className="admin-form-label" htmlFor="announcement-link-url">
                Call-to-Action Link URL (Optional)
              </label>
              <input
                id="announcement-link-url"
                className="admin-input"
                value={form.announcementLinkUrl}
                onChange={(e) => set('announcementLinkUrl', e.target.value)}
                placeholder="e.g. /#menu-showcase, /reservation, or https://..."
                maxLength={300}
                disabled={!form.announcementEnabled}
              />
              <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 4, display: 'block' }}>
                Where clicking the action button directs the customer.
              </span>
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="announcement-link-label">
                Button Text (Optional)
              </label>
              <input
                id="announcement-link-label"
                className="admin-input"
                value={form.announcementLinkLabel}
                onChange={(e) => set('announcementLinkLabel', e.target.value)}
                placeholder="e.g. Order Now, Book Table, Claim Code"
                maxLength={50}
                disabled={!form.announcementEnabled}
              />
              <span style={{ fontSize: 11.5, color: 'var(--admin-muted)', marginTop: 4, display: 'block' }}>
                Defaults to &ldquo;View Details&rdquo; if link is provided without label.
              </span>
            </div>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="announcement-preview-stage">
            <div className="announcement-preview-bar-head">
              <span className="announcement-preview-label">
                <span>👁️</span>
                <span>Real-Time Storefront Preview</span>
                {!form.announcementEnabled && (
                  <span style={{ color: 'var(--admin-muted)', fontWeight: 400, textTransform: 'none' }}>
                    (Banner is currently inactive on storefront)
                  </span>
                )}
              </span>

              <div className="announcement-preview-mode-switch">
                <button
                  type="button"
                  className={`announcement-preview-mode-btn ${previewMode === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('desktop')}
                >
                  🖥️ Desktop View
                </button>
                <button
                  type="button"
                  className={`announcement-preview-mode-btn ${previewMode === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('mobile')}
                >
                  📱 Mobile View
                </button>
              </div>
            </div>

            <div
              className={`announcement-preview-frame ${
                previewMode === 'mobile' ? 'announcement-preview-frame--mobile' : ''
              }`}
            >
              {form.announcementText ? (
                <div
                  className={`preview-announcement-bar preview-announcement-bar--${form.announcementType}`}
                >
                  <div className="preview-bar-content">
                    <span className="preview-icon-wrap" aria-hidden="true">
                      <span>
                        {form.announcementType === 'urgent'
                          ? '🚨'
                          : form.announcementType === 'warning'
                          ? '⚠️'
                          : form.announcementType === 'success'
                          ? '🎉'
                          : '📢'}
                      </span>
                      {form.announcementType === 'urgent' && <span className="preview-pulse-dot" />}
                    </span>

                    {form.announcementHighlightBadge && (
                      <span className="preview-badge">{form.announcementHighlightBadge}</span>
                    )}

                    {form.announcementMarquee ? (
                      <div className="preview-marquee-wrapper">
                        <div className="preview-marquee-track">
                          <span className="preview-text">{form.announcementText}</span>
                          <span className="preview-text" aria-hidden="true">
                            {form.announcementText}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="preview-text">{form.announcementText}</span>
                    )}

                    {form.announcementLinkUrl && (
                      <span className="preview-cta-btn">
                        <span>{form.announcementLinkLabel || 'View Details'}</span>
                        <span style={{ fontSize: 11, fontWeight: 800 }}>↗</span>
                      </span>
                    )}
                  </div>

                  <span className="preview-close-btn" aria-hidden="true" title="Simulated dismiss">
                    ✕
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--admin-muted)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 8,
                    border: '1px dashed var(--admin-border)',
                  }}
                >
                  Type a message or select a 1-click preset above to see the live preview.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-toolbar" style={{ marginTop: 20 }}>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}

export default function AdminSettingsPage() {
  const { data, error, loading, reload } = useAsyncData(() => fetchSettings(), []);

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Store settings" subtitle="Loading…" />
        {error && <Alert kind="error">{error}</Alert>}
        <Loading label="Loading store settings…" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Store settings"
        subtitle="Live operations data — the storefront reads this from /api/settings."
        actions={
          <button type="button" className="admin-btn admin-btn--sm" onClick={reload}>
            Reload
          </button>
        }
      />

      {/*
        Keyed by `updatedAt` so a successful save re-mounts the form with the
        server's normalised values. Without the key the form would keep showing
        whatever the admin last typed, which can drift from what was stored.
      */}
      <SettingsForm
        key={data.settings.updatedAt}
        settings={data.settings}
        onSaved={reload}
      />
    </>
  );
}