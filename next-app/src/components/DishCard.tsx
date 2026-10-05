'use client';

import React from 'react';
import { MenuItem } from '@/data/menuData';
import { useCart } from '@/context/CartContext';

export default function DishCard({ dish }: { dish: MenuItem }) {
  const { addToCart } = useCart();

  return (
    <div className="dish-card-luxury group">
      {/* Image Container with Zoom & Floating Badges */}
      <div className="dish-img-container">
        <img
          src={dish.image}
          alt={dish.name}
          className="dish-main-photo"
          loading="lazy"
        />

        {/* Floating Category / Chef Badge */}
        {dish.badge && (
          <span className="dish-badge-pill">
            {dish.badge}
          </span>
        )}

        {/* Veg / Non-Veg Indicator */}
        <div
          className={`diet-badge ${dish.isVeg ? 'veg' : 'non-veg'}`}
          title={dish.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
        >
          <span className="diet-dot"></span>
        </div>
      </div>

      {/* Card Content */}
      <div className="dish-card-content">
        <div className="dish-header-row">
          <span className="dish-cat-name">{dish.categoryName}</span>
          <div className="dish-rating-badge">
            <span className="star-icon">★</span>
            <span className="rating-num">{dish.rating}</span>
            <span className="reviews-num">({dish.reviewsCount})</span>
          </div>
        </div>

        <h3 className="dish-item-name">{dish.name}</h3>
        <p className="dish-item-desc">{dish.description}</p>

        <div className="dish-bottom-bar">
          <div className="dish-pricing">
            <span className="current-price">₹{dish.price}</span>
            {dish.originalPrice > dish.price && (
              <span className="old-price">₹{dish.originalPrice}</span>
            )}
          </div>

          <button
            type="button"
            className="btn-add-dish"
            onClick={() => addToCart(dish.id)}
            aria-label={`Add ${dish.name} to cart`}
          >
            <span>Add</span>
            <div className="add-icon-circle">+</div>
          </button>
        </div>
      </div>
    </div>
  );
}
