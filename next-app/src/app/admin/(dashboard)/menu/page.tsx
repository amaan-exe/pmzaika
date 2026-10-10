'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  createMenuItem,
  deleteMenuItem,
  fetchMenu,
  reseedMenu,
  toggleMenuItem,
  updateMenuItem,
} from '@/lib/client/adminApi';
import type { AdminCategory, AdminMenuItem } from '@/lib/admin/types';
import { Alert, EmptyState, Loading, PageHeader, rupees } from '@/components/admin/ui';
import { useAsyncData, usePolling } from '@/components/admin/useAsyncData';

const REFRESH_MS = 45_000;

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  categoryName: '',
  // The API speaks paise; the form keeps whatever the admin typed in rupees.
  priceRupees: '',
  image: '',
  vegNonVeg: 'veg' as 'veg' | 'non-veg',
  isAvailable: true,
};

type DishForm = typeof EMPTY_FORM;

/** Money boundary: rupees in the form, paise on the wire. */
const rupeesToPaise = (rupeesText: string): number =>
  Math.round((Number.parseFloat(rupeesText) || 0) * 100);

function fromItem(item: AdminMenuItem): DishForm {
  return {
    title: item.title,
    description: item.description ?? '',
    category: item.category,
    categoryName: item.categoryName ?? '',
    priceRupees: String(item.pricePaise / 100),
    image: item.image ?? '',
    vegNonVeg: item.vegNonVeg,
    isAvailable: item.isAvailable,
  };
}

export default function AdminMenuPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DishForm>(EMPTY_FORM);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImageFile = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadImageFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadImageFile(file);
    }
  };

  const { data, error, loading, reload } = useAsyncData(
    () => fetchMenu(category === 'all' ? undefined : category),
    [category],
  );

  // The kitchen toggles dishes in and out during service, so keep it fresh.
  usePolling(reload, REFRESH_MS);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadError(null);
    setUploadingImage(false);
    setFormOpen(true);
    setNotice(null);
  }, []);

  const openEdit = useCallback((item: AdminMenuItem) => {
    setEditingId(item.id);
    setForm(fromItem(item));
    setUploadError(null);
    setUploadingImage(false);
    setFormOpen(true);
    setNotice(null);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadError(null);
    setUploadingImage(false);
    setDragActive(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSaving(true);
      setNotice(null);

      // Money is typed in rupees and converted once, right before the request.
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim(),
        categoryName: form.categoryName.trim() || undefined,
        pricePaise: rupeesToPaise(form.priceRupees),
        image: form.image.trim() || undefined,
        vegNonVeg: form.vegNonVeg,
        isAvailable: form.isAvailable,
      };

      try {
        if (editingId) {
          await updateMenuItem(editingId, payload);
          setNotice(`${payload.title} updated.`);
        } else {
          await createMenuItem(payload);
          setNotice(`${payload.title} added to the menu.`);
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
    async (item: AdminMenuItem) => {
      setBusyId(item.id);
      setNotice(null);
      try {
        await toggleMenuItem(item.id);
        setNotice(`${item.title} is now ${item.isAvailable ? 'paused' : 'live'}.`);
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
    async (item: AdminMenuItem) => {
      if (!window.confirm(`Delete “${item.title}” from the menu? This cannot be undone.`)) {
        return;
      }
      setBusyId(item.id);
      setNotice(null);
      try {
        await deleteMenuItem(item.id);
        setNotice(`${item.title} deleted.`);
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

  const handleReseed = useCallback(async () => {
    const ok = window.confirm(
      'Re-seed from the menu sheet? Every dish is replaced with the published sheet, so admin edits and availability toggles will be lost.',
    );
    if (!ok) return;

    setSeeding(true);
    setNotice(null);
    try {
      const result = await reseedMenu();
      setNotice(`Re-seeded ${result.seeded} dishes from the menu sheet.`);
      reload();
    } catch (caught) {
      setNotice(null);
      throw caught;
    } finally {
      setSeeding(false);
    }
  }, [reload]);

  // The category filter already narrows server-side, so search only has to
  // cover text the pills cannot express.
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle),
    );
  }, [items, search]);

  const counts = useMemo(
    () => ({
      total: items.length,
      available: items.filter((item) => item.isAvailable).length,
    }),
    [items],
  );

  return (
    <>
      <PageHeader
        title="Menu desk"
        subtitle={
          loading
            ? 'Loading…'
            : `${counts.total} dish${counts.total === 1 ? '' : 'es'} · ${counts.available} available`
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
              className="admin-btn admin-btn--sm"
              onClick={() => void handleReseed()}
              disabled={seeding}
            >
              {seeding ? 'Re-seeding…' : 'Re-seed from menu sheet'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--sm admin-btn--primary"
              onClick={openCreate}
            >
              Add dish
            </button>
          </>
        }
      />

      <div className="admin-toolbar">
        <button
          type="button"
          className={`admin-filter-pill ${category === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          All
        </button>
        {categories.map((item: AdminCategory) => (
          <button
            key={item.id}
            type="button"
            className={`admin-filter-pill ${category === item.id ? 'active' : ''}`}
            onClick={() => setCategory(item.id)}
          >
            {item.name} ({item.count})
          </button>
        ))}

        <input
          className="admin-input admin-search"
          type="search"
          placeholder="Search dishes by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      {formOpen && (
        <div className="admin-card" style={{ marginBottom: 18 }}>
          <div className="admin-card-head">
            <h2 className="admin-card-title">{editingId ? 'Edit dish' : 'Add a dish'}</h2>
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
                <label className="admin-form-label" htmlFor="dish-title">
                  Dish name
                </label>
                <input
                  id="dish-title"
                  className="admin-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={120}
                />
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="dish-price">
                  Price (₹)
                </label>
                <input
                  id="dish-price"
                  className="admin-input"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="decimal"
                  placeholder="180"
                  value={form.priceRupees}
                  onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-form-label" htmlFor="dish-description">
                Description
              </label>
              <textarea
                id="dish-description"
                className="admin-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={600}
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="dish-category">
                  Category id
                </label>
                <input
                  id="dish-category"
                  className="admin-input"
                  list="menu-category-ids"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  maxLength={60}
                />
                <datalist id="menu-category-ids">
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="admin-field">
                <label className="admin-form-label" htmlFor="dish-category-name">
                  Category label
                </label>
                <input
                  id="dish-category-name"
                  className="admin-input"
                  placeholder="Shown to customers"
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  maxLength={80}
                />
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-form-label" htmlFor="dish-veg">
                  Dietary preference
                </label>
                <select
                  id="dish-veg"
                  className="admin-select"
                  value={form.vegNonVeg}
                  onChange={(e) =>
                    setForm({ ...form, vegNonVeg: e.target.value as 'veg' | 'non-veg' })
                  }
                >
                  <option value="veg">🟢 Veg (Vegetarian)</option>
                  <option value="non-veg">🔴 Non-veg</option>
                </select>
              </div>

              <div
                className="admin-field"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: 24,
                }}
              >
                <label
                  className="admin-form-label"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: '#f5a623',
                      cursor: 'pointer',
                    }}
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  />
                  <span>
                    <strong style={{ display: 'block', fontSize: 13 }}>Available to order</strong>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)', fontWeight: 400 }}>
                      Visible in customer menu
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="admin-field admin-image-upload-section">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label className="admin-form-label" style={{ margin: 0 }}>
                  Dish Photo
                </label>
                {uploadingImage && (
                  <span className="admin-upload-badge-loading">Uploading photo…</span>
                )}
              </div>

              <div
                className={`admin-image-dropzone ${dragActive ? 'is-dragover' : ''} ${
                  form.image ? 'has-image' : ''
                }`}
              >
                {form.image ? (
                  <div className="admin-image-preview-card">
                    <div className="admin-image-preview-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image}
                        alt={form.title || 'Dish preview'}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector(
                            '.admin-preview-error-fallback',
                          );
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                      <div className="admin-preview-error-fallback" style={{ display: 'none' }}>
                        <span>Image not found</span>
                      </div>
                    </div>

                    <div className="admin-image-preview-details">
                      <div className="admin-image-preview-path" title={form.image}>
                        <span className="admin-image-path-tag">URL / Path</span>
                        <code>{form.image}</code>
                      </div>

                      <div className="admin-image-preview-actions">
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {uploadingImage ? 'Uploading…' : 'Upload new photo'}
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                          disabled={uploadingImage}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="admin-image-empty-dropzone"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="admin-image-empty-icon">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="admin-image-empty-text">
                      <strong>Click or drag & drop dish image to upload</strong>
                      <span>PNG, JPG, WEBP, or AVIF (up to 10MB)</span>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--primary"
                      disabled={uploadingImage}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      {uploadingImage ? 'Uploading…' : 'Choose Photo'}
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
              </div>

              {uploadError && (
                <div className="admin-upload-error-msg">
                  <span>⚠️ {uploadError}</span>
                </div>
              )}

              <div className="admin-image-url-fallback">
                <label htmlFor="dish-image" className="admin-image-url-toggle">
                  Or enter image URL / path manually:
                </label>
                <input
                  id="dish-image"
                  className="admin-input"
                  placeholder="/assets/images/dishes/paneer.webp or https://..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  maxLength={400}
                />
              </div>
            </div>

            <div className="admin-toolbar" style={{ marginBottom: 0 }}>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add dish'}
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
        <Loading label="Loading the menu…" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No dishes here"
          hint={
            category !== 'all' || search.trim()
              ? 'No dish matches this filter. Clear the search or pick another category.'
              : 'Add your first dish, or re-seed from the published menu sheet.'
          }
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Type</th>
                <th className="num">Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const busy = busyId === item.id;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="admin-thumb" src={item.image} alt="" loading="lazy" />
                        ) : (
                          <div className="admin-thumb" aria-hidden />
                        )}
                        <div>
                          <strong>{item.title}</strong>
                          {item.description && (
                            <div
                              style={{
                                fontSize: 11.5,
                                color: 'var(--admin-muted)',
                                maxWidth: 320,
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{item.categoryName || item.category}</td>
                    <td>
                      <span
                        className={`admin-pill admin-pill--${
                          item.vegNonVeg === 'veg' ? 'success' : 'danger'
                        }`}
                      >
                        {item.vegNonVeg === 'veg' ? 'Veg' : 'Non-veg'}
                      </span>
                    </td>
                    <td className="num">{rupees(item.pricePaise)}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-btn admin-btn--sm ${
                          item.isAvailable ? 'admin-btn--green' : 'admin-btn--danger'
                        }`}
                        disabled={busy}
                        onClick={() => void handleToggle(item)}
                      >
                        {item.isAvailable ? 'Available' : 'Paused'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          disabled={busy}
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          disabled={busy}
                          onClick={() => void handleDelete(item)}
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
    </>
  );
}