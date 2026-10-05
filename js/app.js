/**
 * PM Zaika Restaurant - Master Application Script
 * Manages Cart State, Modals, Dynamic Menu, WhatsApp Ordering, and UI Interactions
 */

// ==========================================
// 1. CART STATE & LOCAL STORAGE
// ==========================================

class CartManager {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('pm_zaika_cart')) || [];
    this.initElements();
    this.updateUI();
  }

  initElements() {
    this.cartDrawer = document.getElementById('cartDrawer');
    this.cartOverlay = document.getElementById('cartOverlay');
    this.cartItemsList = document.getElementById('cartItemsList');
    this.cartBadge = document.getElementById('cartBadge');
    this.cartSubtotal = document.getElementById('cartSubtotal');
    this.cartTotal = document.getElementById('cartTotal');
    this.cartTrigger = document.getElementById('cartTrigger');
    this.cartClose = document.getElementById('cartClose');
    this.whatsappOrderBtn = document.getElementById('whatsappOrderBtn');

    if (this.cartTrigger) {
      this.cartTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    }

    if (this.cartClose) {
      this.cartClose.addEventListener('click', () => this.closeDrawer());
    }

    if (this.cartOverlay) {
      this.cartOverlay.addEventListener('click', () => this.closeDrawer());
    }

    if (this.whatsappOrderBtn) {
      this.whatsappOrderBtn.addEventListener('click', () => this.checkoutWhatsApp());
    }
  }

  save() {
    localStorage.setItem('pm_zaika_cart', JSON.stringify(this.items));
    this.updateUI();
  }

  addItem(dishId) {
    const dish = MENU_DATA.find(d => d.id === dishId);
    if (!dish) return;

    const existing = this.items.find(item => item.id === dishId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1
      });
    }

    this.save();
    showToast(`Added "${dish.name}" to cart! 🍽️`);
  }

  updateQuantity(dishId, delta) {
    const item = this.items.find(i => i.id === dishId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.items = this.items.filter(i => i.id !== dishId);
    }
    this.save();
  }

  removeItem(dishId) {
    this.items = this.items.filter(i => i.id !== dishId);
    this.save();
    showToast('Item removed from cart');
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  openDrawer() {
    if (this.cartDrawer) this.cartDrawer.classList.add('active');
    if (this.cartOverlay) this.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    if (this.cartDrawer) this.cartDrawer.classList.remove('active');
    if (this.cartOverlay) this.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  updateUI() {
    const totalCount = this.getTotalCount();
    if (this.cartBadge) {
      this.cartBadge.textContent = totalCount;
      this.cartBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    const subtotal = this.getSubtotal();
    if (this.cartSubtotal) this.cartSubtotal.textContent = `₹${subtotal}`;
    if (this.cartTotal) this.cartTotal.textContent = `₹${subtotal}`;

    if (!this.cartItemsList) return;

    if (this.items.length === 0) {
      this.cartItemsList.innerHTML = `
        <div class="empty-cart-message">
          <svg viewBox="0 0 24 24"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z"/></svg>
          <p style="font-weight:600; font-size:16px; margin-bottom:6px;">Your cart is empty</p>
          <p style="font-size:13px;">Add delicious starters, curries, or biryani to begin your feast!</p>
        </div>
      `;
      if (this.whatsappOrderBtn) this.whatsappOrderBtn.style.display = 'none';
    } else {
      if (this.whatsappOrderBtn) this.whatsappOrderBtn.style.display = 'flex';
      this.cartItemsList.innerHTML = this.items.map(item => `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.name}</h4>
            <div class="cart-item-price">₹${item.price} each</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" onclick="window.cart.updateQuantity('${item.id}', -1)">−</button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn" onclick="window.cart.updateQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="cart-remove-btn" onclick="window.cart.removeItem('${item.id}')" title="Remove Item">&times;</button>
        </div>
      `).join('');
    }
  }

  checkoutWhatsApp() {
    if (this.items.length === 0) {
      showToast('Your cart is empty!');
      return;
    }

    const itemsSummary = this.items.map(i => `• ${i.name} x ${i.quantity} = ₹${i.price * i.quantity}`).join('\n');
    const total = this.getSubtotal();
    const message = encodeURIComponent(
      `*🍛 NEW ORDER - PM ZAIKA RESTAURANT*\n\n` +
      `Hello PM Zaika Team, I would like to place an order:\n\n` +
      `${itemsSummary}\n\n` +
      `*Grand Total: ₹${total}*\n\n` +
      `Please confirm my order and estimated delivery time. Thank you!`
    );

    window.open(`https://wa.me/917488260572?text=${message}`, '_blank');
  }
}

// ==========================================
// 2. TOAST NOTIFICATIONS
// ==========================================

function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
// 3. RESERVATION MODAL & HANDLERS
// ==========================================

function initReservationModal() {
  const modal = document.getElementById('reservationModal');
  const overlay = document.getElementById('reservationModalBackdrop');
  const closeBtn = document.getElementById('reservationClose');
  const form = document.getElementById('tableReservationForm');

  const openBtns = document.querySelectorAll('.open-reservation-modal');
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal && overlay) {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeModal() {
    if (modal && overlay) {
      modal.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('resName').value;
      const phone = document.getElementById('resPhone').value;
      const date = document.getElementById('resDate').value;
      const time = document.getElementById('resTime').value;
      const guests = document.getElementById('resGuests').value;

      const waMsg = encodeURIComponent(
        `*🍽️ TABLE RESERVATION - PM ZAIKA RESTAURANT*\n\n` +
        `Guest Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Date: ${date}\n` +
        `Time Slot: ${time}\n` +
        `No. of Guests: ${guests}\n\n` +
        `Please confirm our table booking. Thank you!`
      );

      closeModal();
      showToast('Reservation details submitted successfully! ✨');
      
      // Prompt user to notify on WhatsApp for instant confirmation
      setTimeout(() => {
        if (confirm('Would you like to send this reservation directly to PM Zaika WhatsApp (+91 7488 260 572) for instant booking confirmation?')) {
          window.open(`https://wa.me/917488260572?text=${waMsg}`, '_blank');
        }
      }, 500);
    });
  }
}

// ==========================================
// 4. SEARCH MODAL & LIVE DISH FILTER
// ==========================================

function initSearchModal() {
  const searchBtn = document.getElementById('searchTrigger');
  const searchModal = document.getElementById('searchModalBackdrop');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('dishSearchInput');
  const searchResults = document.getElementById('searchResults');

  function openSearch() {
    if (searchModal) {
      searchModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
    }
  }

  function closeSearch() {
    if (searchModal) {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        searchResults.innerHTML = '<p style="text-align:center; color:#9CA3AF; padding:20px;">Type a dish name (e.g. Biryani, Paneer, Tandoori)...</p>';
        return;
      }

      const matches = MENU_DATA.filter(dish => 
        dish.name.toLowerCase().includes(q) || 
        dish.categoryName.toLowerCase().includes(q) || 
        dish.description.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        searchResults.innerHTML = `<p style="text-align:center; color:#9CA3AF; padding:20px;">No dishes found matching "${q}".</p>`;
        return;
      }

      searchResults.innerHTML = matches.map(dish => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border-bottom:1px solid #E5E7EB; gap:14px;">
          <img src="${dish.image}" alt="${dish.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
          <div style="flex-grow:1;">
            <div style="font-weight:600; font-size:14px; color:#1F2937;">${dish.name}</div>
            <div style="font-size:12px; color:#F05D23; font-weight:600;">₹${dish.price} • ${dish.categoryName}</div>
          </div>
          <button class="btn-pill-sm" onclick="window.cart.addItem('${dish.id}'); document.getElementById('searchModalBackdrop').classList.remove('active');">Add +</button>
        </div>
      `).join('');
    });
  }
}

// ==========================================
// 5. DYNAMIC MENU RENDERER & FILTER
// ==========================================

function renderMenuGrid(targetId, filter = 'all') {
  const container = document.getElementById(targetId);
  if (!container || typeof MENU_DATA === 'undefined') return;

  const filtered = filter === 'all' 
    ? MENU_DATA 
    : MENU_DATA.filter(d => d.category === filter || (filter === 'veg' && d.isVeg) || (filter === 'non-veg' && !d.isVeg));

  container.innerHTML = filtered.map(dish => `
    <div class="dish-card" data-category="${dish.category}">
      <div class="dish-card-img-wrap">
        <img src="${dish.image}" alt="${dish.name}" loading="lazy">
        ${dish.badge ? `<span class="dish-badge">${dish.badge}</span>` : ''}
        <span class="veg-indicator ${dish.isVeg ? 'veg' : 'non-veg'}" title="${dish.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}"></span>
      </div>
      <div class="dish-card-body">
        <div class="dish-meta-row">
          <span class="dish-category-label">${dish.categoryName}</span>
          <span class="dish-rating">★ ${dish.rating} (${dish.reviewsCount})</span>
        </div>
        <h3 class="dish-name">${dish.name}</h3>
        <p class="dish-desc">${dish.description}</p>
        <div class="dish-footer-row">
          <div class="dish-price-wrap">
            <span class="dish-price">₹${dish.price}</span>
            ${dish.originalPrice ? `<span class="dish-original-price">₹${dish.originalPrice}</span>` : ''}
          </div>
          <button class="add-cart-btn" onclick="window.cart.addItem('${dish.id}')">
            <span>Add to Cart</span>
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function initMenuFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      renderMenuGrid('menuShowcaseGrid', cat);
    });
  });
}

// ==========================================
// 6. GENERAL APP INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cart
  window.cart = new CartManager();

  // Initialize Modals
  initReservationModal();
  initSearchModal();

  // Render initial menu showcase if present
  renderMenuGrid('menuShowcaseGrid', 'all');
  initMenuFilters();

  // Mobile navigation toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Header scroll shadow effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Standalone Bottom Contact Form submission
  const bottomContactForm = document.getElementById('standaloneBottomContactForm');
  if (bottomContactForm) {
    bottomContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      showToast(`Thank you ${name}! Your message has been sent successfully. ✨`);
      bottomContactForm.reset();
    });
  }
});

