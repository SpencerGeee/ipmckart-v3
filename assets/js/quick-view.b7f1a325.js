// Quick View functionality - Dynamic product preview
document.addEventListener('DOMContentLoaded', function() {
    const PRODUCTS_URL = 'products.grouped2.json';
    let allProducts = [];
    
    // Load all products
    fetch(PRODUCTS_URL)
        .then(response => response.json())
        .then(data => {
            allProducts = data.categories.flatMap(cat => 
                cat.subcategories.flatMap(sub => 
                    (sub.products || []).map(p => ({
                        ...p,
                        categoryId: cat.id,
                        categoryName: cat.name,
                        subcategoryId: sub.id,
                        subcategoryName: sub.name
                    }))
                )
            );
        })
        .catch(error => console.error('Failed to load products for quick view:', error));
    
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
    
    function formatPrice(price) {
        if (price === null || price === undefined || typeof price !== 'number') {
            return 'GHS 0.00';
        }
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
        }).format(price);
    }
    
    // Handle quick view button clicks
    document.addEventListener('click', function(e) {
        const quickViewBtn = e.target.closest('.btn-quickview');
        if (!quickViewBtn) return;
        
        e.preventDefault();
        e.stopPropagation(); // Stop the event from bubbling up
        
        // Get product ID from various sources
        let productId = quickViewBtn.dataset.productId;
        
        if (!productId) {
            // Try to get from href
            const href = quickViewBtn.getAttribute('href');
            if (href && href.includes('product.html?id=')) {
                const match = href.match(/id=([^&]+)/);
                if (match) productId = match[1];
            }
        }
        
        if (!productId) {
            // Try to get from closest product element
            const productElement = quickViewBtn.closest('[data-product-id], .product-default');
            if (productElement) {
                productId = productElement.dataset.productId;
            }
        }
        
        if (!productId || allProducts.length === 0) {
            console.warn('Could not determine product ID for quick view');
            // If Magnific is open, close it to stop infinite load
            if (typeof $ !== 'undefined' && $.magnificPopup && $.magnificPopup.instance.isOpen) {
                $.magnificPopup.close();
            }
            return;
        }
        
        // Find product
        const product = allProducts.find(p => String(p.id) === String(productId));
        
        if (!product) {
            console.warn('Product not found:', productId);
            // If Magnific is open, close it to stop infinite load
            if (typeof $ !== 'undefined' && $.magnificPopup && $.magnificPopup.instance.isOpen) {
                $.magnificPopup.close();
            }
            return;
        }
        
        // Show quick view popup
        showQuickView(product);
    });
    
    function showQuickView(product) {
        // Escape all user input
        const escapedName = escapeHtml(product.name);
        const escapedAttrName = escapeAttribute(product.name);
        const escapedId = escapeAttribute(product.id);
        const escapedDescription = escapeHtml(product.description || product.fullDescription || '');
        const escapedCategoryName = escapeHtml(product.categoryName || '');
        const escapedSku = escapeHtml(product.sku || 'N/A');
        const escapedRating = typeof product.rating === 'number' ? product.rating : 100;
        const formattedPrice = formatPrice(product.price);
        const formattedOldPrice = product.oldPrice ? formatPrice(product.oldPrice) : '';
        
        // Build images HTML
        const imagesHtml = (product.images || []).map(src => {
            const escapedSrc = escapeAttribute(src);
            return `<div class="product-item">
                <img class="product-single-image" src="${escapedSrc}" alt="${escapedAttrName}" />
            </div>`;
        }).join('');
        
        // Build quick view HTML
        const quickViewHTML = `
            <div class="product-single-container product-single-default product-quick-view mb-0 custom-scrollbar">
                <div class="row">
                    <div class="col-md-6 product-single-gallery mb-md-0">
                        <div class="product-slider-container">
                            ${product.oldPrice ? `<div class="label-group">
                                <div class="product-label label-sale">-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</div>
                            </div>` : ''}
                            <div class="product-single-carousel owl-carousel owl-theme show-nav-hover">
                                ${imagesHtml || '<div class="product-item"><img class="product-single-image" src="assets/images/placeholder.webp" alt="Product" /></div>'}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 product-single-details">
                        <h1 class="product-title">${escapedName}</h1>
                        <div class="ratings-container">
                            <div class="product-ratings" role="img" aria-label="Rating: ${escapedRating}%">
                                <span class="ratings" style="width:${escapedRating}%"></span>
                            </div>
                        </div>
                        <hr class="short-divider">
                        <div class="price-box">
                            ${formattedOldPrice ? `<span class="old-price">${formattedOldPrice}</span>` : ''}
                            <span class="new-price">${formattedPrice}</span>
                        </div>
                        <div class="product-desc">
                            <p>${escapedDescription}</p>
                        </div>
                        <ul class="single-info-list">
                            <li>SKU: <strong>${escapedSku}</strong></li>
                            <li>CATEGORY: <strong>${escapedCategoryName}</strong></li>
                        </ul>
                        <div class="product-action">
                            <div class="product-single-qty">
                                <input class="horizontal-quantity form-control" type="number" value="1" min="1" />
                            </div>
                            <button type="button" class="btn btn-dark add-cart" data-product-id="${escapedId}" title="Add to Cart">Add to Cart</button>
                        </div>
                        <hr class="divider mb-0 mt-0">
                        <div class="product-single-share mb-0">
                            <a href="wishlist.html" class="btn-icon-wish add-wishlist" data-product-id="${escapedId}" title="Add to Wishlist">
                                <i class="icon-wishlist-2"></i><span>Add to Wishlist</span>
                            </a>
                        </div>
                    </div>
                    <button title="Close (Esc)" type="button" class="mfp-close">×</button>
                </div>
            </div>
        `;
        
        // Create or update quick view container
        let quickViewContainer = document.getElementById('quick-view-container');
        if (!quickViewContainer) {
            quickViewContainer = document.createElement('div');
            quickViewContainer.id = 'quick-view-container';
            quickViewContainer.style.display = 'none';
            document.body.appendChild(quickViewContainer);
        }
        
        quickViewContainer.innerHTML = quickViewHTML;
        
        // Show using Magnific Popup if available
        if (typeof $ !== 'undefined' && typeof $.magnificPopup !== 'undefined') {
            $.magnificPopup.open({
                items: {
                    src: quickViewContainer,
                    type: 'inline'
                },
                mainClass: 'mfp-product',
                removalDelay: 300,
                callbacks: {
                    open: function() {
                        // Initialize carousel if jQuery and OwlCarousel are available
                        if (typeof $ !== 'undefined' && typeof $.fn.owlCarousel !== 'undefined') {
                            setTimeout(() => {
                                const carousel = $('.product-single-carousel');
                                if (carousel.length) {
                                    // Destroy existing if any
                                    if (carousel.hasClass('owl-loaded')) {
                                        carousel.trigger('destroy.owl.carousel');
                                        carousel.removeClass('owl-carousel owl-theme owl-loaded');
                                    }
                                    carousel.addClass('owl-carousel owl-theme');
                                    carousel.owlCarousel({
                                        items: 1,
                                        nav: true,
                                        dots: true,
                                        loop: false
                                    });
                                }
                            }, 100);
                        }
                    }
                }
            });
        } else {
            // Fallback: show as modal
            quickViewContainer.style.display = 'block';
            quickViewContainer.style.position = 'fixed';
            quickViewContainer.style.top = '50%';
            quickViewContainer.style.left = '50%';
            quickViewContainer.style.transform = 'translate(-50%, -50%)';
            quickViewContainer.style.zIndex = '10000';
            quickViewContainer.style.background = '#fff';
            quickViewContainer.style.padding = '20px';
            quickViewContainer.style.maxWidth = '90%';
            quickViewContainer.style.maxHeight = '90vh';
            quickViewContainer.style.overflow = 'auto';
            quickViewContainer.style.borderRadius = '8px';
            quickViewContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';
            
            // Add close button handler
            const closeBtn = quickViewContainer.querySelector('.mfp-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    quickViewContainer.style.display = 'none';
                });
            }
        }
        
        // Handle add to cart in quick view
        const addCartBtn = quickViewContainer.querySelector('.add-cart');
        if (addCartBtn) {
            addCartBtn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                    window.CartManager.addToCart(productId);
                    if (typeof $ !== 'undefined' && typeof $.magnificPopup !== 'undefined') {
                        $.magnificPopup.close();
                    } else {
                        quickViewContainer.style.display = 'none';
                    }
                }
            });
        }
        
        // Handle wishlist button in quick view
        const wishlistBtn = quickViewContainer.querySelector('.add-wishlist');
        if (wishlistBtn && window.IPMCWishlist) {
            wishlistBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.dataset.productId;
                if (window.IPMCWishlist.getAll().includes(productId)) {
                    window.IPMCWishlist.remove(productId);
                } else {
                    window.IPMCWishlist.add(productId);
                }
            });
        }
    }
});

