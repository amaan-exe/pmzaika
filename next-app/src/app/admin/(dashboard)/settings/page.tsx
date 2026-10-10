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
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  estimatedDeliveryTime: string;
}

const ANNOUNCEMENT_TYPES: Array<{ id: SettingsFormState['announcementType']; label: string }> = [
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'success', label: 'Success' },
  { id: 'urgent', label: 'Urgent' },
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
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">Announcement</h2>
          </div>

          <label
            className="admin-form-label"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <input
              type="checkbox"
              checked={form.announcementEnabled}
              onChange={(e) => set('announcementEnabled', e.target.checked)}
            />
            Show the banner on the storefront
          </label>

          <div className="admin-field" style={{ marginTop: 14 }}>
            <label className="admin-form-label" htmlFor="announcement-type">
              Banner style
            </label>
            <select
              id="announcement-type"
              className="admin-select"
              value={form.announcementType}
              onChange={(e) =>
                set('announcementType', e.target.value as SettingsFormState['announcementType'])
              }
              disabled={!form.announcementEnabled}
            >
              {ANNOUNCEMENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-form-label" htmlFor="announcement-text">
              Message
            </label>
            <textarea
              id="announcement-text"
              className="admin-textarea"
              value={form.announcementText}
              onChange={(e) => set('announcementText', e.target.value)}
              maxLength={5000}
              disabled={!form.announcementEnabled}
              placeholder="Kitchen is running a 30-minute delay tonight…"
            />
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                color: 'var(--admin-muted)',
                textAlign: 'right',
              }}
            >
              {form.announcementText.length} / 5000
            </p>
          </div>

          {/* Live Preview Box */}
          {form.announcementEnabled && form.announcementText && (
            <div style={{ marginTop: 16 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--admin-muted)',
                  marginBottom: 6,
                  letterSpacing: '0.08em',
                }}
              >
                Live Storefront Banner Preview
              </span>
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background:
                    form.announcementType === 'urgent'
                      ? 'rgba(239, 83, 80, 0.2)'
                      : form.announcementType === 'warning'
                      ? 'rgba(245, 166, 35, 0.2)'
                      : form.announcementType === 'success'
                      ? 'rgba(34, 192, 125, 0.2)'
                      : 'rgba(74, 163, 240, 0.2)',
                  color:
                    form.announcementType === 'urgent'
                      ? '#ff8b89'
                      : form.announcementType === 'warning'
                      ? 'var(--admin-amber)'
                      : form.announcementType === 'success'
                      ? 'var(--admin-green)'
                      : 'var(--admin-blue)',
                  border: `1px solid ${
                    form.announcementType === 'urgent'
                      ? 'rgba(239, 83, 80, 0.4)'
                      : form.announcementType === 'warning'
                      ? 'rgba(245, 166, 35, 0.4)'
                      : form.announcementType === 'success'
                      ? 'rgba(34, 192, 125, 0.4)'
                      : 'rgba(74, 163, 240, 0.4)'
                  }`,
                }}
              >
                <span>
                  {form.announcementType === 'urgent'
                    ? '🚨'
                    : form.announcementType === 'warning'
                    ? '⚠️'
                    : form.announcementType === 'success'
                    ? '🎉'
                    : '📢'}
                </span>
                <span>{form.announcementText}</span>
              </div>
            </div>
          )}
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