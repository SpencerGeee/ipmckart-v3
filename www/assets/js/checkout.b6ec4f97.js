// --- GLOBAL VARS ---
let cartItemsCache = [];
let selectedShippingZone = 'nationwide'; // Default
const API_BASE_URL = '/api'; // Assuming your API is at /api

// --- SHIPPING LOGIC ---
const SHIPPING_ZONES = {
  'accra-metro': {
    name: 'Accra Metro',
    cost: 30,
    description: 'Inner city delivery (24 hours)'
  },
  'greater-accra': {
    name: 'Greater Accra Outskirts',
    cost: 50,
    description: 'Tema, Kasoa, Dodowa, etc. (1-2 days)'
  },
  'nationwide': {
    name: 'Nationwide Delivery',
    cost: 70,
    description: 'Outside Greater Accra (2-5 days)'
  }
};

// New: Map zones to backend shipping methods
const SHIPPING_METHOD_MAP = {
  'accra-metro': 'express',
  'greater-accra': 'standard',
  'nationwide': 'standard'
};

/**
 * Detects the shipping zone based on form inputs.
 */
function detectShippingZone() {
    const country = (document.getElementById('country')?.value || 'GH').toUpperCase();
    const town = (document.getElementById('townName')?.value || '').toLowerCase().trim();

    if (country !== 'GH') {
        selectedShippingZone = 'nationwide';
        renderSummaryTotals(cartItemsCache);
        return;
    }

    const accraMetroAreas = [
        'accra', 'osu', 'airport', 'cantonments', 'labone', 'dzorwulu', 'roman ridge', 
        'east legon', 'spintex', 'teshie', 'nungua', 'madina', 'adenta', 'dome', 
        'achimota', 'lapaz', 'dansoman', 'kaneshie', 'abossey okai', 'bubuashie', 
        'mamprobi', 'chorkor', 'jamestown', 'ussher town', 'north kaneshie', 'south kaneshie',
        'shiashie', 'haatso', 'agbogba', 'kwabenya', 'taifa'
    ];
    const greaterAccraAreas = [
        'tema', 'kasoa', 'dodowa', 'pokuase', 'amasaman', 'nsawam', 'shai hills', 
        'prampram', 'dawhenya', 'oyibi', 'pantang', 'abokobi', 'ashongman', 
        'medie', 'ofankor', 'ablekuma', 'weija', 'gbawe'
    ];

    const isAccraMetro = accraMetroAreas.some(area => town.includes(area));
    const isGreaterAccra = greaterAccraAreas.some(area => town.includes(area));

    if (isAccraMetro) {
        selectedShippingZone = 'accra-metro';
    } else if (isGreaterAccra) {
        selectedShippingZone = 'greater-accra';
    } else {
        selectedShippingZone = 'nationwide';
    }

    renderSummaryTotals(cartItemsCache);
}

/**
 * Checks if cart contains test products
 * @return {boolean} True if cart contains test products
 */
function hasTestProducts() { // DEPRECATED partial check kept for backwards-compat (use isOnlyTestProductCart for shipping)

  return cartItemsCache.some(item => {
    const product = item.product || item;
    return product.isTestProduct || 
           product.id?.includes('test-') || 
           product.name?.toLowerCase().includes('test product') ||
           product.price === 1;
  });
}

/**
 * Gets the cost for the currently selected shipping zone.
 */
function isTestProduct(product) {
  if (!product) return false;
  const name = (product.name || '').toLowerCase();
  const id = String(product.id || product._id || '');
  return Boolean(
    product.isTestProduct ||
    id.includes('test-') ||
    name.includes('test product') ||
    Number(product.price) === 1
  );
}

function isOnlyTestProductCart() {
  if (!Array.isArray(cartItemsCache) || cartItemsCache.length === 0) return false;
  // True only if every item in the cart is a test product
  return cartItemsCache.every(item => {
    const product = item.product || item;
    return isTestProduct(product);
  });
}

function getShippingCost() {
  // Waive shipping only when the cart contains ONLY test product(s)
  if (isOnlyTestProductCart()) {
    return 0;
  }
  return SHIPPING_ZONES[selectedShippingZone]?.cost || 70;
}

// --- AUTHENTICATION ---

/**
 * Checks if the user is authenticated.
 * If not, redirects to the registration page with return URL.
 */
async function checkAuthentication() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { 
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (res.ok) {
            console.log('User is authenticated.');
            const user = await res.json();
            
            // Pre-fill email field
            const emailField = document.getElementById('email');
            if (emailField && user.email) {
                emailField.value = user.email;
                emailField.readOnly = true;
            }
            
            // Pre-fill name fields if available
            if (user.firstName) {
                const firstNameField = document.getElementById('firstName');
                if (firstNameField) firstNameField.value = user.firstName;
            }
            if (user.lastName) {
                const lastNameField = document.getElementById('lastName');
                if (lastNameField) lastNameField.value = user.lastName;
            }
            
            return true;
        }

        if (res.status === 401) {
            console.log('User not authenticated. Redirecting to register...');
            // Store current URL as redirect target
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `register.html?redirect=${redirectUrl}`;
            return false;
        }
        
        throw new Error('Auth check failed with status: ' + res.status);

    } catch (error) {
        console.error('Authentication check failed:', error);
        const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `register.html?redirect=${redirectUrl}`;
        return false;
    }
}

// --- RENDERING ---

/**
 * Renders the list of items in the order summary.
 */
function renderOrderItems(items) {
    const container = document.getElementById('order-items-container');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p>No items in cart.</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        // Handle both product object and productId reference
        const product = item.product || item;
        const productName = product.name || 'Unknown Product';
        const productImage = (product.images && product.images[0]) || 'assets/images/products/placeholder.webp"';
        const productPrice = product.price || 0;
        const quantity = item.quantity || item.qty || 1;
        
        return `
            <div class="order-item">
                <img src="${productImage}" alt="${productName}" class="order-item-img" onerror="this.src='assets/images/products/placeholder.webp"'">
                <div class="order-item-details">
                    <h4>${productName}</h4>
                    <p>Quantity: ${quantity}</p>
                    <p>Price: ₵${productPrice.toFixed(2)}</p>
                    <p>Subtotal: ₵${(productPrice * quantity).toFixed(2)}</p>
                </div>
            </div>
        `;
    }).join('');
    renderSummaryTotals(items);
}

/**
 * Renders the summary totals including subtotal, shipping, and total.
 */
function renderSummaryTotals(items) {
    const container = document.getElementById('summary-totals-container');
    if (!container) return;

    const subtotalRaw = items.reduce((sum, item) => {
        const product = item.product || item;
        const price = product.price || 0;
        const qty = item.quantity || item.qty || 1;
        return sum + (price * qty);
    }, 0);

    const testCart = isOnlyTestProductCart();
    const shippingCostRaw = getShippingCost();

    const displaySubtotal = testCart ? 1 : subtotalRaw;
    const displayShipping = testCart ? 0 : shippingCostRaw;
    const total = testCart ? 1 : (subtotalRaw + shippingCostRaw);
    
    const shippingLabel = testCart ? "Shipping (FREE for test):" : `Shipping (${SHIPPING_ZONES[selectedShippingZone].name}):`;

    container.innerHTML = `
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>₵${displaySubtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>${shippingLabel}</span>
            <span>₵${displayShipping.toFixed(2)}</span>
        </div>
        ${testCart ? '<div class="test-notice" style="color: #28a745; font-size: 0.9em; margin: 10px 0; font-style: italic;">🧪 Test product detected - No delivery fees applied for payment testing</div>' : ''}
        <div class="summary-row total">
            <span>Total:</span>
            <span>₵${total.toFixed(2)}</span>
        </div>
    `;
}

// --- ORDER PLACEMENT ---

/**
 * Shows payment success or error message.
 */
function showPaymentMessage(message, type = 'error') {
    const container = document.getElementById('payment-message-container') || document.getElementById('checkout-form');
    if (!container) return;

    const msgElement = document.createElement('p');
    msgElement.className = type === 'success' ? 'payment-success' : 'payment-error';
    msgElement.textContent = message;
    container.appendChild(msgElement);

    setTimeout(() => msgElement.remove(), 5000);
}

/**
 * Sets loading state on place order button.
 */
function setButtonLoading(isLoading) {
    const button = document.querySelector('.btn-place-order');
    if (!button) return;

    button.classList.toggle('loading', isLoading);
}

/**
 * Places the order by sending data to the backend.
 */
async function placeOrder() {
    setButtonLoading(true);

    try {
        // New: Pre-check stock before submitting
        for (const item of cartItemsCache) {
            const product = item.product || item;
            const res = await fetch(`${API_BASE_URL}/products/${product._id || product.id || product.productId}`);
            if (!res.ok) throw new Error('Failed to fetch product details');
            const prodData = await res.json();
            const qty = item.quantity || item.qty || 1;
            if (prodData.stock < qty) {
                throw new Error(`Insufficient stock for ${prodData.name}`);
            }
        }

        const form = document.getElementById('checkout-form');
        const isDifferentShipping = document.getElementById('shipDifferent')?.checked;

        const billing = {
            name: `${document.getElementById('firstName')?.value || ''} ${document.getElementById('lastName')?.value || ''}`.trim(),
            email: document.getElementById('email')?.value || '',
            companyName: document.getElementById('companyName')?.value || '',
            country: document.getElementById('country')?.value || '',
            streetAddress: document.getElementById('streetAddress')?.value || '',
            streetAddress2: document.getElementById('streetAddress2')?.value || '',
            town: document.getElementById('townName')?.value || '',
            state: document.getElementById('state')?.value || '',
            zipCode: document.getElementById('zipCode')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            notes: document.getElementById('notes')?.value || ''
        };

        let shipping = null;
        if (isDifferentShipping) {
            shipping = {
                name: `${document.getElementById('shippingFirstName')?.value || ''} ${document.getElementById('shippingLastName')?.value || ''}`.trim(),
                email: document.getElementById('shippingEmail')?.value || '',
                companyName: document.getElementById('shippingCompanyName')?.value || '',
                country: document.getElementById('shippingCountry')?.value || '',
                streetAddress: document.getElementById('shippingStreetAddress')?.value || '',
                streetAddress2: document.getElementById('shippingStreetAddress2')?.value || '',
                town: document.getElementById('shippingTownName')?.value || '',
                state: document.getElementById('shippingState')?.value || '',
                zipCode: document.getElementById('shippingZipCode')?.value || '',
                phone: document.getElementById('shippingPhone')?.value || '',
                notes: document.getElementById('shippingNotes')?.value || ''
            };
        }

        const items = cartItemsCache.map(item => {
            const product = item.product || item;
            const quantity = item.quantity || item.qty || 1;
            return {
                productId: product._id || product.id,
                name: product.name || 'Unknown Product',
                image: (product.images && product.images[0]) || '',
                price: product.price || 0,
                qty: quantity,
                lineTotal: (product.price || 0) * quantity
            };
        });

        const shippingCost = getShippingCost();
        const shippingMethod = SHIPPING_METHOD_MAP[selectedShippingZone] || 'standard';
        
        // Get selected payment method
        const paymentMethodRadio = document.querySelector('input[name="payment"]:checked');
        const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'cod';

        const payload = {
            items,
            billing,
            shipping, // Only sent if different
            shippingMethod,
            shippingCost,
            paymentMethod
        };

        console.log('Sending order payload:', payload);

        const res = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to place order');
        }

        const data = await res.json();
        
        // Handle Paystack payment
        if (paymentMethod === 'paystack' && data.status === 'payment_required' && data.authorization_url) {
            // Clear the cart before redirecting (order is created)
            if (typeof CartManager !== 'undefined' && CartManager.clearCart) {
                await CartManager.clearCart();
            } else {
                await fetch(`${API_BASE_URL}/cart`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            }
            
            // Save email to localStorage for guest order lookup
            const email = document.getElementById('email')?.value;
            if (email) {
                localStorage.setItem('guest_checkout_email', email);
            }
            
            // Redirect to Paystack payment page
            showPaymentMessage('Redirecting to payment gateway...', 'success');
            window.location.href = data.authorization_url;
            return; // Exit early, redirect will happen
        }
        
        // Handle Cash on Delivery (or other non-Paystack methods)
        showPaymentMessage('Order placed successfully! Redirecting...', 'success');
        
        // Save email to localStorage for guest order lookup
        const email = document.getElementById('email')?.value;
        if (email) {
            localStorage.setItem('guest_checkout_email', email);
        }
        
        // Clear the cart
        if (typeof CartManager !== 'undefined' && CartManager.clearCart) {
        CartManager.clearCart();
        } else {
        // Fallback API clear
        await fetch(`${API_BASE_URL}/cart`, {
            method: 'DELETE',
            credentials: 'include'
        });
        }
        
        // Redirect to order complete page
        setTimeout(() => {
            window.location.href = `order-complete.html?orderId=${data.orderId || data._id}`;
        }, 1000);

    } catch (error) {
        console.error('Order placement error:', error);
        // Improved: Show specific messages based on error
        let msg = error.message || 'Failed to place order. Please try again.';
        if (error.message.includes('stock')) {
            msg = error.message;  // e.g., "Insufficient stock for X"
        } else if (error.message.includes('invalid')) {
            msg = 'One or more items are invalid. Please refresh the cart.';
        }
        showPaymentMessage(msg, 'error');
        setButtonLoading(false);
    }
}

/**
 * Toggle shipping address collapse
 */
// Helper function for collapsible shipping form — accept event param
  function toggleCollapse(sectionId, event) {
      const content = document.getElementById(sectionId);
      const checkbox = document.getElementById('shipDifferent');
      // guard in case event is not passed
      const icon = event && event.currentTarget ? event.currentTarget.querySelector('.toggle-icon') : document.querySelector('.toggle-icon');

      if (!content) return;

      if (content.style.maxHeight && content.style.maxHeight !== '0px') {
          content.style.maxHeight = null;
          if (checkbox) checkbox.checked = false;
          if (icon) {
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
          }
      } else {
          content.style.maxHeight = content.scrollHeight + "px";
          if (checkbox) checkbox.checked = true;
          if (icon) {
              icon.classList.remove('fa-chevron-down');
              icon.classList.add('fa-chevron-up');
          }
      }
  }

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Checkout page initializing...');
    
    // 1. Check Authentication first
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting...');
        return;
    }
    
    // 2. Get DOM elements
    const orderItemsContainer = document.getElementById('order-items-container');
    const summaryTotalsContainer = document.getElementById('summary-totals-container');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!orderItemsContainer || !summaryTotalsContainer || !checkoutForm) {
        console.error('Missing critical checkout elements.');
        return;
    }

    // 3. Fetch cart items
    try {
        if (typeof CartManager !== 'undefined' && CartManager.getCartWithProducts) {
            cartItemsCache = await CartManager.getCartWithProducts();
        } else {
            // Fallback: try to get cart from API
            const cartRes = await fetch(`${API_BASE_URL}/cart`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            
            if (cartRes.ok) {
                const cartData = await cartRes.json();
                cartItemsCache = cartData.items || [];
            } else {
                throw new Error('Failed to fetch cart');
            }
        }
    } catch (error) {
        console.error("Failed to get cart items:", error);
        orderItemsContainer.innerHTML = "<p class='payment-error'>Could not load cart items. Please refresh the page.</p>";
        return;
    }

    // 4. Check if cart is empty
    if (!cartItemsCache || cartItemsCache.length === 0) {
        document.querySelector('.main-grid').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h2>Your cart is empty.</h2>
                <p>You can't proceed to checkout without any items.</p>
                <a href="category1.html?category=computing-devices" class="btn btn-primary" style="background: #08c; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Continue Shopping</a>
            </div>`;
        return;
    }

    // 5. Render page
    renderOrderItems(cartItemsCache);
    detectShippingZone();

    // 6. Setup toggle for shipping address - FIXED
    const toggleSection = document.querySelector('.toggle-section');
    if (toggleSection) {
        // Remove any existing listeners
        const newToggle = toggleSection.cloneNode(true);
        toggleSection.parentNode.replaceChild(newToggle, toggleSection);
        
        // Add click listener
        newToggle.addEventListener('click', function(event) {
            event.preventDefault();
            const shippingContent = document.getElementById('shipping');
            if (shippingContent) {
                if (shippingContent.style.maxHeight === '0px') {
                    shippingContent.style.maxHeight = shippingContent.scrollHeight + 'px';
                } else {
                    shippingContent.style.maxHeight = '0px';
                }
            }
        });
    }

    // Ensure shipping section starts collapsed
    const shippingContent = document.getElementById('shipping');
    if (shippingContent) {
        shippingContent.style.maxHeight = '0px';
        shippingContent.style.overflow = 'hidden';
        shippingContent.style.transition = 'max-height 0.3s ease';
    }

    // 7. Add Event Listeners for address changes
    const townInput = document.getElementById('townName');
    const countrySelect = document.getElementById('country');
    
    if (townInput) {
        townInput.addEventListener('input', detectShippingZone);
    }
    if (countrySelect) {
        countrySelect.addEventListener('change', detectShippingZone);
    }

    // 8. Handle payment method selection
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
            // Check the radio button
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });

    // 9. Handle form submission
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await placeOrder();
    });
    
    console.log('Checkout page initialized successfully');
});