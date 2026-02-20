// assets/js/wishlist-dynamic.js

(function($) {
    'use strict';

    const WISHLIST_KEY = 'ipmc_wishlist';
    const PRODUCTS_URL = 'products.grouped2.json';

    // Get wishlist from localStorage
    function loadWishlistFromStorage() {
        try {
            const stored = localStorage.getItem(WISHLIST_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading wishlist from storage:', e);
            return [];
        }
    }

    function saveWishlistToStorage(wishlist) {
        try {
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
        } catch (e) {
            console.error('Error saving wishlist to storage:', e);
        }
    }

    // Initialize wishlist from localStorage
    let wishlistData = loadWishlistFromStorage();

    // Load products and render wishlist
    function loadWishlist() {
        fetch(PRODUCTS_URL)
            .then(response => response.json())
            .then(data => {
                const allProducts = data.categories.flatMap(cat => 
                    cat.subcategories.flatMap(sub => sub.products)
                );

                // Filter products that are in wishlist
                const wishlistProducts = allProducts.filter(p => 
                    wishlistData.includes(p.id)
                );

                renderWishlist(wishlistProducts);
                updateWishlistCount();
            })
            .catch(error => console.error('Failed to load wishlist:', error));
    }

    // Render wishlist table
    function renderWishlist(products) {
        const tbody = $('.table-wishlist tbody');
        
        if (products.length === 0) {
            tbody.html(`
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <h4>Your wishlist is empty</h4>
                        <p>Add products you love to your wishlist</p>
                        <a href="index.html" class="btn btn-dark">Start Shopping</a>
                    </td>
                </tr>
            `);
            return;
        }

        tbody.empty();
        products.forEach(product => {
            const image = product.images?.[0] || 'assets/images/products/product-1.webp"';
            const price = product.price || '$0.00';
            const inStock = product.stock > 0;
            
            tbody.append(`
                <tr class="product-row" data-product-id="${product.id}">
                    <td>
                        <figure class="product-image-container">
                            <a href="product.html#${product.id}" class="product-image">
                                <img src="${image}" alt="${product.name}">
                            </a>
                            <a href="#" class="btn-remove icon-cancel" title="Remove Product"></a>
                        </figure>
                    </td>
                    <td>
                        <h5 class="product-title">
                            <a href="product.html#${product.id}">${product.name}</a>
                        </h5>
                    </td>
                    <td class="price-box">${price}</td>
                    <td>
                        <span class="stock-status">${inStock ? 'In stock' : 'Out of stock'}</span>
                    </td>
                    <td class="action">
                        <a href="product.html#${product.id}" class="btn btn-quickview mt-1 mt-md-0">
                            Quick View
                        </a>
                        ${inStock ? `
                            <button class="btn btn-dark btn-add-cart btn-shop" data-product-id="${product.id}">
                                ADD TO CART
                            </button>
                        ` : `
                            <button class="btn btn-dark btn-shop" disabled>
                                OUT OF STOCK
                            </button>
                        `}
                    </td>
                </tr>
            `);
        });
    }

    // Update wishlist count in header
    function updateWishlistCount() {
        $('.wishlist-count').text(wishlistData.length);
    }

    // Add to wishlist
    function addToWishlist(productId) {
        if (!wishlistData.includes(productId)) {
            wishlistData.push(productId);
            saveWishlistToStorage(wishlistData);
            updateWishlistCount();
            showNotification('Product added to wishlist');
            
            // Update wishlist icon state
            updateWishlistIcons(productId, true);
        }
    }

    // Remove from wishlist
    function removeFromWishlist(productId) {
        wishlistData = wishlistData.filter(id => id !== productId);
        saveWishlistToStorage(wishlistData);
        updateWishlistCount();
        showNotification('Product removed from wishlist');
        
        // Update wishlist icon state
        updateWishlistIcons(productId, false);
    }
    
    // Update wishlist icon states across the page
    function updateWishlistIcons(productId, isInWishlist) {
        const wishlistButtons = document.querySelectorAll(`[data-product-id="${productId}"].btn-icon-wish, .btn-icon-wish[href*="${productId}"]`);
        wishlistButtons.forEach(btn => {
            if (isInWishlist) {
                btn.classList.add('added');
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.remove('icon-heart-o', 'icon-heart-2');
                    icon.classList.add('icon-heart', 'icon-wishlist-2');
                }
            } else {
                btn.classList.remove('added');
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.remove('icon-heart', 'icon-wishlist-2');
                    icon.classList.add('icon-heart-o', 'icon-heart-2');
                }
            }
        });
    }

    // Show notification
    function showNotification(message) {
        // Use Porto's notification if available
        if (typeof Porto !== 'undefined' && Porto.miniPopup) {
            Porto.miniPopup.open({
                name: message,
                nameLink: '#',
                imageSrc: 'assets/images/logo.webp',
                content: '',
                action: '',
                delay: 2000
            });
        } else {
            alert(message);
        }
    }

    // Event handlers
    $(document).ready(function() {
        // Load wishlist on wishlist page
        if (window.location.pathname.includes('wishlist.html')) {
            loadWishlist();
        }
        
        // Update wishlist count on page load
        updateWishlistCount();
        
        // Update all wishlist icons on page load
        wishlistData.forEach(productId => {
            updateWishlistIcons(productId, true);
        });

        // Remove from wishlist
        $(document).on('click', '.btn-remove', function(e) {
            e.preventDefault();
            const productId = $(this).closest('.product-row').data('product-id');
            removeFromWishlist(productId);
            $(this).closest('.product-row').fadeOut(300, function() {
                $(this).remove();
                if ($('.product-row').length === 0) {
                    loadWishlist();
                }
            });
        });

        // Add to cart from wishlist (only on wishlist page)
        if (window.location.pathname.includes('wishlist.html')) {
            $(document).on('click', '.btn-add-cart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const productId = $(this).data('product-id');
                if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                    window.CartManager.addToCart(productId);
                    showNotification('Product added to cart');
                } else {
                    showNotification('Product added to cart');
                }
            });
        }

        // Toggle wishlist - only enable on product page
        // Exclude add-cart buttons to prevent conflicts
        if (!window.location.pathname.includes('product.html')) {
            $(document).off('click', '.btn-wishlist, .btn-icon-wish, .add-wishlist');
        } else {
        $(document).on('click', '.btn-wishlist, .btn-icon-wish, .add-wishlist', function(e) {
            // Don't handle if this is an add-cart button
            if ($(this).hasClass('add-cart') || $(this).hasClass('btn-add-cart') || $(this).closest('.add-cart, .btn-add-cart').length) {
                e.stopPropagation();
                return;
            }
            e.preventDefault();
            const $btn = $(this);
            let productId = $btn.data('product-id');
            
            // Try to get product ID from href if not in data attribute
            if (!productId) {
                const href = $btn.attr('href');
                if (href && href.includes('product.html?id=')) {
                    const match = href.match(/id=([^&]+)/);
                    if (match) productId = match[1];
                } else if (href && href.includes('#')) {
                    productId = href.split('#')[1];
                }
            }
            
            // Try to get from closest product element
            if (!productId) {
                const $product = $btn.closest('[data-product-id], .product-default, .product-row');
                productId = $product.data('product-id');
            }
            
            if (!productId) {
                console.warn('Could not determine product ID for wishlist toggle');
                return;
            }
            
            if (wishlistData.includes(productId)) {
                removeFromWishlist(productId);
            } else {
                addToWishlist(productId);
            }
        });
        }
    });

    // Make functions globally accessible
    window.IPMCWishlist = {
        add: addToWishlist,
        remove: removeFromWishlist,
        getAll: () => wishlistData,
        count: () => wishlistData.length
    };

})(jQuery);