'use client';

import React, { useCallback, useMemo, useState } from 'react';

import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  updateCoupon,
} from '@/lib/client/adminApi';
import type { AdminCoupon } from '@/lib/admin/types';
import { Alert, EmptyState, Loading, PageHeader, rupees } from '@/components/admin/ui';
import { useAsyncData } from '@/components/admin/useAsyncData';

type CouponTab = 'all' | 'active' | 'inactive';

const TABS: Array<{ id: CouponTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Live' },
  { id: 'inactive', label: 'Paused' },
];

const EMPTY_FORM = {
  couponCode: '',
  description: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  // Both money fields are typed in rupees and converted to paise on submit.
  minimumOrderRupees: '',
  usageLimit: '0',
  perUserLimit: '1',
  applicableCategory: 'all',
  expiryDate: '',
  active: true,
};

type CouponForm = typeof EMPTY_FORM;

/** Money boundary: rupees in the form, paise on the wire. */
const rupeesToPaise = (text: string): number => Math.round((Number.parseFloat(text) || 0) * 100);

function toNumber(text: string): number {
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function fromCoupon(coupon: AdminCoupon): CouponForm {
  return {
    couponCode: coupon.couponCode,
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    minimumOrderRupees: String(coupon.minimumOrderPaise / 100),
    usageLimit: String(coupon.usageLimit),
    perUserLimit: String(coupon.perUserLimit),
    applicableCategory: coupon.applicableCategory || 'all',
    expiryDate: coupon.expiryDate ?? '',
    active: coupon.active,
  };
}

/** A fixed discount is paise on the wire, a percentage is already a plain number. */
function discountOut(form: CouponForm): number {
  return form.discountType === 'fixed'
    ? rupeesToPaise(form.discountValue)
    : toNumber(form.discountValue);
}

function discountLabel(coupon: AdminCoupon): string {
  return coupon.discountType === 'percent'
    ? `${coupon.discountValue}%`
    : rupees(coupon.discountValue);
}

const RULES = [
  'Active — a paused coupon cannot be applied at checkout, even by code.',
  'Expiry — after the expiry date the coupon stops working automatically. Leave empty for no expiry.',
  'Usage limit — total redemptions across all customers. 0 means unlimited.',
  'Minimum order — the cart subtotal must reach this amount for the discount to apply.',
  'Per-user limit — how many times a single customer may redeem the same coupon.',
  'Category — "all" applies everywhere; set a category id to limit it to that section of the menu.',
];

export default function AdminCouponsPage() {
  const [tab, setTab] = useState<CouponTab>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);

  const { data, error, loading, reload } = useAsyncData(() => fetchCoupons(), []);

  const coupons = data?.coupons ?? [];

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
    setNotice(null);
  }, []);

  const openEdit = useCallback((coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setForm(fromCoupon(coupon));
    setFormOpen(true);
    setNotice(null);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSaving(true);
      setNotice(null);

      const payload = {
        couponCode: form.couponCode.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: discountOut(form),
        minimumOrderPaise: rupeesToPaise(form.minimumOrderRupees),
        usageLimit: toNumber(form.usageLimit),
        perUserLimit: Math.max(1, toNumber(form.perUserLimit)),
        applicableCategory: form.applicableCategory.trim() || 'all',
        expiryDate: form.expiryDate.trim(),
        active: form.active,
      };

      try {
        if (editingId) {
          await updateCoupon(editingId, payload);
          setNotice(`${payload.couponCode} updated.`);
        } else {
          await createCoupon(payload);
          setNotice(`${payload.couponCode} created.`);
        }
        closeForm();
        reload();
      } catch (caught) {
        setNotice(null);
        throw caught;
      } finally {
        setSaving(false);
      }
    },
    [editingId, form, closeForm, reload],
  );

  const handleToggle = useCallback(
    async (coupon: AdminCoupon) => {
      setBusyId(coupon.id);
      setNotice(null);
      try {
        await updateCoupon(coupon.id, { active: !coupon.active });
        setNotice(`${coupon.couponCode} is now ${coupon.active ? 'paused' : 'live'}.`);
        reload();
      } catch (caught) {
        setNotice(null);
        throw caught;
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const handleDelete = useCallback(
    async (coupon: AdminCoupon) => {
      if (
        !window.confirm(
          `Delete coupon ${coupon.couponCode}? Customers who already used it lose the record.`,
        )
      ) {
        return;
      }
      setBusyId(coupon.id);
      setNotice(null);
      try {
        await deleteCoupon(coupon.id);
        setNotice(`${coupon.couponCode} deleted.`);
        reload();
      } catch (caught) {
        setNotice(null);
        throw caught;
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return coupons.filter((coupon) => {
      if (tab === 'active' && !coupon.active) return false;
      if (tab === 'inactive' && coupon.active) return false;
      if (!needle) return true;
      return (
        coupon.couponCode.toLowerCase().includes(needle) ||
        coupon.description.toLowerCase().includes(needle) ||
        coupon.applicableCategory.toLowerCase().includes(needle)
      );
    });
  }, [coupons, search, tab]);

  const activeCount = useMemo(() => coupons.filter((c) => c.active).length, [coupons]);

  return (
    <>
      <PageHeader
        title="Coupon desk"
        subtitle={
          loading
            ? 'Loading…'
            : `${coupons.length} coupon${coupons.length === 1 ? '' : 's'} · ${activeCount} live`
        }
        actions={
          <>
            <button
              type="button"
              className="admin-btn admin-btn--sm"
              onClick={reload}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--sm admin-btn--primary"
              onClick={openCreate}
            >
              New coupon
            </button>
          </>
        }
      />

      <div className="admin-toolbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`admin-filter-pill ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}

        <input
          className="admin-input admin-search"
          type="search"
          placeholder="Search by code, description or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {formOpen && (
        <div className="admin-card" style={{ marginBottom: 18 }}>
          <div className="admin-card-head">
            <h2 className="admin-card-title">
              {editingId ? `Edit ${form.couponCode || 'coupon'}` : 'New coupon'}
            </h2>
            <button
              type="button"
              className="admin-btn admin-btn--sm"
              onClick={closeForm}
              disabled={saving}
            >
              Close
            </button>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-code">
                  Code
                </label>
                <input
                  id="coupon-code"
                  className="admin-input"
                  value={form.couponCode}
                  onChange={(e) =>
                    setForm({ ...form, couponCode: e.target.value.toUpperCase() })
                  }
                  required
                  minLength={2}
                  maxLength={40}
                  placeholder="ZAIKA50"
                />
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-description">
                  Description
                </label>
                <input
                  id="coupon-description"
                  className="admin-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={300}
                  placeholder="50% off on your first order"
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-type">
                  Discount type
                </label>
                <select
                  id="coupon-type"
                  className="admin-select"
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })
                  }
                >
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Flat amount off</option>
                </select>
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-value">
                  {form.discountType === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
                </label>
                <input
                  id="coupon-value"
                  className="admin-input"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="decimal"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-min">
                  Minimum order (₹)
                </label>
                <input
                  id="coupon-min"
                  className="admin-input"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.minimumOrderRupees}
                  onChange={(e) => setForm({ ...form, minimumOrderRupees: e.target.value })}
                />
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-category">
                  Applicable category
                </label>
                <input
                  id="coupon-category"
                  className="admin-input"
                  value={form.applicableCategory}
                  onChange={(e) => setForm({ ...form, applicableCategory: e.target.value })}
                  maxLength={60}
                  placeholder="all"
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-usage">
                  Usage limit (0 = unlimited)
                </label>
                <input
                  id="coupon-usage"
                  className="admin-input"
                  type="number"
                  min={0}
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                />
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 12,
                    color: 'var(--admin-muted)',
                  }}
                >
                  Set 0 if the coupon can be redeemed any number of times.
                </p>
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-per-user">
                  Per-user limit
                </label>
                <input
                  id="coupon-per-user"
                  className="admin-input"
                  type="number"
                  min={1}
                  step="1"
                  value={form.perUserLimit}
                  onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="coupon-expiry">
                  Expiry date
                </label>
                <input
                  id="coupon-expiry"
                  className="admin-input"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 12,
                    color: 'var(--admin-muted)',
                  }}
                >
                  Leave empty to keep the coupon open-ended.
                </p>
              </div>

              <div className="admin-field">
                <label
                  className="admin-form-label"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="admin-toolbar" style={{ marginBottom: 0 }}>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create coupon'}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loading label="Loading coupons…" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No coupons here"
          hint={
            coupons.length === 0
              ? 'Create a coupon to run a launch offer or a repeat-order discount.'
              : 'No coupon matches this filter.'
          }
        />
      ) : (
        <div className="admin-table-wrap" style={{ marginBottom: 18 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th className="num">Min order</th>
                <th className="num">Used</th>
                <th className="num">Per user</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((coupon) => {
                const busy = busyId === coupon.id;
                return (
                  <tr key={coupon.id}>
                    <td>
                      <strong>{coupon.couponCode}</strong>
                      {coupon.description && (
                        <div style={{ fontSize: 11.5, color: 'var(--admin-muted)' }}>
                          {coupon.description}
                        </div>
                      )}
                    </td>
                    <td>{discountLabel(coupon)}</td>
                    <td className="num">
                      {coupon.minimumOrderPaise > 0
                        ? rupees(coupon.minimumOrderPaise)
                        : '—'}
                    </td>
                    <td className="num">
                      {coupon.usedCount}
                      {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' / ∞'}
                    </td>
                    <td className="num">{coupon.perUserLimit}</td>
                    <td>{coupon.applicableCategory || 'all'}</td>
                    <td>
                      {coupon.expiryDate ? (
                        new Date(`${coupon.expiryDate}T00:00:00`).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${
                          coupon.active ? 'admin-btn--green' : 'admin-btn--danger'
                        }`}
                        disabled={busy}
                        onClick={() => void handleToggle(coupon)}
                      >
                        {coupon.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          disabled={busy}
                          onClick={() => openEdit(coupon)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          disabled={busy}
                          onClick={() => void handleDelete(coupon)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* The engine behind these fields lives in the checkout, so the six rules
          are spelled out here rather than discovered by a customer. */}
      <div className="admin-card">
        <div className="admin-card-head">
          <h2 className="admin-card-title">How a coupon is judged</h2>
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '18px',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--admin-muted)',
          }}
        >
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </>
  );
}