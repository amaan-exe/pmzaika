'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { MENU_DATA } from '@/data/menuData';

export default function SearchModal() {
  const { isSearchOpen, closeSearch, addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDishes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return MENU_DATA.filter(
      (dish) =>
        dish.name.toLowerCase().includes(term) ||
        dish.categoryName.toLowerCase().includes(term) ||
        dish.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  if (!isSearchOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={closeSearch}>
      <div
        className="modal-window"
        style={{ maxWidth: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Search Delicious Dishes</h3>
          <button
            className="cart-close"
            onClick={closeSearch}
            aria-label="Close Search"
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="text"
              className="form-input-bottom"
              placeholder="Search by dish name, biryani, chicken, paneer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{ paddingLeft: '44px' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#9CA3AF',
              }}
            >
              🔍
            </span>
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {searchTerm.trim() === '' ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                Type to start searching through PM Zaika dishes... 🍲
              </div>
            ) : filteredDishes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                No dishes found matching "{searchTerm}". Try another delicious craving!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#F9FAFB',
                      borderRadius: '12px',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={dish.image}
                        alt={dish.name}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-heading)' }}>
                          {dish.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--accent-orange)', fontWeight: 700 }}>
                          ₹{dish.price}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => {
                        addToCart(dish.id);
                        closeSearch();
                      }}
                    >
                      Add +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
