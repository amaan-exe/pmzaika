'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

export interface DishCardProps {
  dish: {
    id: string;
    name?: string;
    title?: string;
    category?: string;
    categoryName?: string;
    price?: number;
    pricePaise?: number;
    originalPrice?: number;
    isVeg?: boolean;
    vegNonVeg?: 'veg' | 'non-veg';
    rating?: number;
    reviewsCount?: number;
    badge?: string;
    description?: string;
    image?: string;
    isAvailable?: boolean;
  };
}

export default function DishCard({ dish }: DishCardProps) {
  const { items, addToCart, updateQuantity } = useCart();

  const displayName = dish.name || dish.title || 'Special Dish';
  const displayPrice =
    dish.price !== undefined
      ? dish.price
      : Math.round((dish.pricePaise || 0) / 100);
  const displayImg = dish.image || '/assets/images/food_royal_biryani.jpg';
  const isVegetarian =
    dish.isVeg !== undefined ? dish.isVeg : dish.vegNonVeg === 'veg';
  const rating = dish.rating ?? 4.8;
  const reviewsCount = dish.reviewsCount ?? 120;

  // Check if item is already in customer's cart
  const cartItem = items.find((item) => item.id === dish.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(dish.id, {
      name: displayName,
      price: displayPrice,
      image: displayImg,
    });
  };

  return (
    <div className="dish-card-luxury group">
      {/* Image Container with Zoom & Floating Badges */}
      <div className="dish-img-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImg}
          alt={displayName}
          className="dish-main-photo"
          loading="lazy"
          decoding="async"
          width={320}
          height={220}
        />

        {/* Floating Category / Chef Badge */}
        {dish.badge && <span className="dish-badge-pill">{dish.badge}</span>}

        {/* Veg / Non-Veg Indicator */}
        <div
          className={`diet-badge ${isVegetarian ? 'veg' : 'non-veg'}`}
          title={isVegetarian ? 'Pure Vegetarian' : 'Non-Vegetarian'}
        >
          <span className="diet-dot"></span>
        </div>
      </div>

      {/* Card Content */}
      <div className="dish-card-content">
        <div className="dish-header-row">
          <span className="dish-cat-name">{dish.categoryName || 'Signature'}</span>
          <div className="dish-rating-badge">
            <span className="star-icon">★</span>
            <span className="rating-num">{rating}</span>
            <span className="reviews-num">({reviewsCount})</span>
          </div>
        </div>

        <h3 className="dish-item-name">{displayName}</h3>
        {dish.description && <p className="dish-item-desc">{dish.description}</p>}

        <div className="dish-bottom-bar">
          <div className="dish-pricing">
            <span className="current-price">₹{displayPrice}</span>
            {dish.originalPrice && dish.originalPrice > displayPrice && (
              <span className="old-price">₹{dish.originalPrice}</span>
            )}
          </div>

          {qtyInCart > 0 ? (
            <div className="dish-card-stepper" aria-label="Adjust quantity">
              <button
                type="button"
                className="dish-stepper-btn"
                onClick={() => updateQuantity(dish.id, -1)}
                aria-label={`Decrease ${displayName}`}
              >
                −
              </button>
              <span className="dish-stepper-qty">{qtyInCart}</span>
              <button
                type="button"
                className="dish-stepper-btn"
                onClick={() => updateQuantity(dish.id, 1)}
                aria-label={`Increase ${displayName}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-add-dish"
              onClick={handleAdd}
              aria-label={`Add ${displayName} to cart`}
            >
              <span>Add</span>
              <div className="add-icon-circle">+</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
