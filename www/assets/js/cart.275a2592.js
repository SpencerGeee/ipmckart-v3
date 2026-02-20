document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.querySelector('.cart-items');
    const summaryContainer = document.querySelector('.cart-summary');

    if (!cartItemsContainer || !summaryContainer) {
        console.error('Cart containers not found on this page.');
        return;
    }

    // Security functions
    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttribute(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#39;');
    }

    async function renderCart() {
        const items = await window.CartManager.getCartWithProducts();
        
        if (items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart fade-in">
                    <i class="fas fa-shopping-cart" aria-hidden="true"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <a href="category1.html?category=computing-devices" class="shop-now-btn">Shop Now</a>
                </div>`;
            summaryContainer.style.display = 'none';
        } else {
            summaryContainer.style.display = 'block';
            
            // Clear container first
            cartItemsContainer.innerHTML = '';
            
            // Render items safely
            items.forEach(item => {
                // Escape user input
                const escapedName = escapeHtml(item.product.name);
                const escapedAttrName = escapeAttribute(item.product.name);
                const escapedId = escapeAttribute(item.productId);
                const escapedImage = escapeAttribute(item.product.images[0] || 'placeholder.webp"');
                
                const cartCard = document.createElement('div');
                cartCard.className = 'cart-card fade-in';
                cartCard.setAttribute('data-product-id', escapedId);
                
                cartCard.innerHTML = `
                    <img src="${escapedImage}" alt="${escapedAttrName}" class="product-image" loading="lazy">
                    <div class="product-details">
                        <h3 class="product-name"><a href="product.html?id=${escapedId}">${escapedName}</a></h3>
                        <div class="product-price">${window.CartManager.formatCurrency(item.product.price)}</div>
                        <div class="quantity-controls">
                            <button class="qty-btn" data-change="-1" aria-label="Decrease quantity" type="button">-</button>
                            <label for="qty-${escapedId}" class="sr-only">Quantity</label>
                            <input id="qty-${escapedId}" type="number" class="quantity" value="${item.quantity}" min="1" readonly aria-label="Quantity for ${escapedAttrName}">
                            <button class="qty-btn" data-change="1" aria-label="Increase quantity" type="button">+</button>
                        </div>
                        <button class="remove-btn" aria-label="Remove ${escapedAttrName} from cart" type="button">
                            <i class="fas fa-trash-alt" aria-hidden="true"></i> Remove
                        </button>
                    </div>
                `;
                
                cartItemsContainer.appendChild(cartCard);
            });
            
            renderSummary(items);
            // Adjust checkout behavior for Starlink Mini
            const checkoutBtn = document.getElementById('proceed-checkout');
            if (checkoutBtn) {
                const hasStarlinkMini = items.some(it => (it.product?.id || it.productId) === 'starlink-002-starlink-mini-kit');
                checkoutBtn.href = hasStarlinkMini ? 'starlink-mini.html' : 'checkout.html';
            }
        }
    }

    function renderSummary(items) {
        const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        // Waive fees for special test product only-orders
        const hasOnlyTest = items.length > 0 && items.every(it => (it.product?.id || it.productId) === 'storage-devices-016-test');
        const shipping = hasOnlyTest ? 0 : (subtotal > 0 ? 15.00 : 0); // Example shipping cost
        const tax = hasOnlyTest ? 0 : (subtotal * 0.125); // Example tax rate
        const total = subtotal + shipping + tax;

        summaryContainer.innerHTML = `
            <h3 class="summary-title">Order Summary</h3>
            <div class="summary-item">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">${window.CartManager.formatCurrency(subtotal)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Shipping</span>
                <span class="summary-value">${window.CartManager.formatCurrency(shipping)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Tax (12.5%)</span>
                <span class="summary-value">${window.CartManager.formatCurrency(tax)}</span>
            </div>
            <div class="summary-total">
                <span>Total</span>
                <span>${window.CartManager.formatCurrency(total)}</span>
            </div>
             <a href=\"#\" id=\"proceed-checkout\" class=\"checkout-btn\">
                <i class="fas fa-lock"></i> Proceed to Checkout
            </a>
            <a href="category1.html?category=computing-devices" class="continue-shopping">
                <i class="fas fa-arrow-left"></i> Continue Shopping
            </a>
        `;
    }

    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.cart-card');
        if (!card) return;

        const productId = card.dataset.productId;

        // Handle quantity change
        if (target.matches('.qty-btn')) {
            const change = parseInt(target.dataset.change, 10);
            const currentQty = parseInt(card.querySelector('.quantity').value, 10);
            window.CartManager.updateQuantity(productId, currentQty + change);
            renderCart(); // Re-render to reflect changes
        }

        // Handle remove item
        if (target.closest('.remove-btn')) {
            window.CartManager.removeFromCart(productId);
            renderCart(); // Re-render to reflect changes
        }
    });

    renderCart();
});