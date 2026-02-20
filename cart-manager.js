window.CartManager = (function() {
    const STORAGE_KEY = "ipmc_cart";
    let allProducts = [];
    let loadPromise = null;

    async function loadProducts() {
        if (loadPromise) return loadPromise;

        loadPromise = (async () => {
            try {
                const cacheBuster = `?v=${Date.now()}`;
                const [mainRes, bfRes, comboRes, nyRes, flashRes, topRes] = await Promise.all([
                    fetch("/products.grouped2.json" + cacheBuster).catch(() => fetch("products.grouped2.json" + cacheBuster)),
                    fetch("/black-friday.json" + cacheBuster).catch(() => fetch("black-friday.json" + cacheBuster)).catch(() => null),
                    fetch("/combo-offers-v2.json" + cacheBuster).catch(() => fetch("combo-offers-v2.json" + cacheBuster)).catch(() => fetch("assets/data/combo-offers.json" + cacheBuster)).catch(() => null),
                    fetch("/new-year.json" + cacheBuster).catch(() => fetch("new-year.json" + cacheBuster)).catch(() => null),
                    fetch("/flash-sales.json" + cacheBuster).catch(() => null),
                    fetch("/top-selling.json" + cacheBuster).catch(() => null)
                ]);

                const results = {
                    main: mainRes && mainRes.ok ? await mainRes.json() : null,
                    bf: bfRes && bfRes.ok ? await bfRes.json() : null,
                    combo: comboRes && comboRes.ok ? await comboRes.json() : null,
                    ny: nyRes && nyRes.ok ? await nyRes.json() : null,
                    flash: flashRes && flashRes.ok ? await flashRes.json() : null,
                    top: topRes && topRes.ok ? await topRes.json() : null,
                    valentines: await fetch("/valentines.json" + cacheBuster).catch(() => fetch("valentines.json" + cacheBuster)).catch(() => null)
                };
                
                if (results.valentines && results.valentines.ok) {
                    results.valentines = await results.valentines.json();
                } else {
                    results.valentines = null;
                }

                if (!results.main) {
                    const fallbackRes = await fetch("assets/data/products.grouped2.json" + cacheBuster).catch(() => null);
                    if (fallbackRes && fallbackRes.ok) results.main = await fallbackRes.json();
                }

                if (!results.main) {
                    const fallbackRes = await fetch("assets/data/products.json" + cacheBuster).catch(() => null);
                    if (fallbackRes && fallbackRes.ok) results.main = await fallbackRes.json();
                }

                if (!results.main) throw new Error("Failed to load main products");

                let products = [];
                if (results.main.categories) {
                    products = results.main.categories.flatMap(cat => 
                        cat.subcategories.flatMap(sub => 
                            (sub.products || []).map(p => ({
                                ...p,
                                id: p.id || p.slug || p._id,
                                categoryId: cat.id,
                                categoryName: cat.name
                            }))
                        )
                    );
                }

                if (results.bf) {
                    const bfProducts = (results.bf.blackFriday || [])
                        .filter(p => p && p.active)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id,
                            price: typeof p.blackFridayPrice === 'number' ? p.blackFridayPrice : p.price,
                            images: Array.isArray(p.images) ? p.images : [],
                            categoryId: p.categoryId || p.category || p.categoryName || "black-friday",
                            categoryName: p.categoryName || "Black Friday"
                        }));
                    products = products.concat(bfProducts);
                }

                if (results.combo) {
                    const comboProducts = (results.combo.combos || [])
                        .filter(p => p && p.active)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id, 
                            price: typeof p.comboPrice === 'number' ? p.comboPrice : (typeof p.price === 'number' ? p.price : 0),
                            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
                            categoryId: "combo-deals",
                            categoryName: "Combo Deals"
                        }));
                    products = products.concat(comboProducts);
                }

                if (results.ny) {
                    const nyProducts = (results.ny.newYear || [])
                        .filter(p => p && p.active !== false)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id,
                            price: typeof p.newYearPrice === 'number' ? p.newYearPrice : p.price,
                            categoryId: p.categoryId || "new-year-sale",
                            categoryName: p.categoryName || "New Year Sale"
                        }));
                    products = products.concat(nyProducts);
                }

                if (results.flash) {
                    const flashProducts = (results.flash.flashSales || [])
                        .filter(p => p && p.active !== false)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id,
                            price: typeof p.flashPrice === 'number' ? p.flashPrice : p.price,
                            categoryId: p.categoryId || "flash-sales",
                            categoryName: p.categoryName || "Flash Sales"
                        }));
                    products = products.concat(flashProducts);
                }

                if (results.top) {
                    const topProducts = (results.top.topSelling || results.top.items || [])
                        .filter(p => p)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id,
                            categoryId: p.categoryId || "top-selling",
                            categoryName: p.categoryName || "Top Selling"
                        }));
                    products = products.concat(topProducts);
                }

                if (results.valentines) {
                    const valentinesProducts = (results.valentines.valentines || [])
                        .filter(p => p && p.active !== false)
                        .map(p => ({
                            ...p,
                            id: p.id || p.slug || p._id,
                            price: typeof p.valentinesPrice === 'number' ? p.valentinesPrice : p.price,
                            images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
                            categoryId: p.categoryId || "valentines-sale",
                            categoryName: p.categoryName || "Valentine's Sale"
                        }));
                    products = products.concat(valentinesProducts);
                }

                const productMap = new Map();
                products.forEach(p => {
                    if (p) {
                        const pid = String(p.id || p.slug || p._id || "");
                        if (pid) {
                            productMap.set(pid, p);
                        }
                    }
                });
                allProducts = Array.from(productMap.values());
                console.log(`CartManager: Loaded ${allProducts.length} products total`);
                return allProducts;
            } catch (error) {
                console.error("Failed to fetch products:", error);
                loadPromise = null; 
                return [];
            }
        })();

        return loadPromise;
    }

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return "GHS 0.00";
        return new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS"
        }).format(amount);
    };

    async function updateUI() {
        const cart = getCart();
        const fullCart = await getCartWithProducts();

        const totalQty = fullCart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = fullCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        document.querySelectorAll(".cart-count").forEach(el => {
            el.textContent = totalQty;
        });

        const dropdowns = document.querySelectorAll(".dropdown-cart-products");
        const totalEls = document.querySelectorAll(".cart-total-price");

        const dropdownHtml = fullCart.length === 0 
            ? '<p style="text-align:center; padding: 20px 0;">Your cart is empty.</p>'
            : fullCart.map(item => {
                const name = escapeHtml(item.product.name);
                const image = escapeHtml(item.product.images[0] || "placeholder.webp");
                const id = escapeHtml(item.productId);
                return `
                    <div class="product">
                        <div class="product-details">
                            <h4 class="product-title">
                                <a href="product.html?id=${id}">${name}</a>
                            </h4>
                            <span class="cart-product-info">
                                <span class="cart-product-qty">${item.quantity}</span> × ${formatCurrency(item.product.price)}
                            </span>
                        </div>
                        <figure class="product-image-container">
                            <a href="product.html?id=${id}" class="product-image">
                                <img src="${image}" alt="${name}" width="80" height="80" loading="lazy">
                            </a>
                            <a href="#" class="btn-remove" title="Remove Product" data-product-id="${id}" aria-label="Remove ${name} from cart"><span>×</span></a>
                        </figure>
                    </div>
                `;
            }).join("");

        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = dropdownHtml;
            if (!dropdown.dataset.listenerAdded) {
                dropdown.addEventListener("click", (e) => {
                    const btn = e.target.closest(".btn-remove");
                    if (btn) {
                        e.preventDefault();
                        const id = btn.dataset.productId;
                        if (id) removeFromCart(id);
                    }
                });
                dropdown.dataset.listenerAdded = "true";
            }
        });

        const formattedTotal = formatCurrency(totalPrice);
        totalEls.forEach(el => {
            el.textContent = formattedTotal;
        });
    }

    async function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        await updateUI();
    }

    function getCart() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    async function getCartWithProducts() {
        await loadProducts();
        const cart = getCart();
        return cart.map(item => {
            const baseProduct = allProducts.find(p => 
                (p.id && String(p.id) === String(item.productId)) || 
                (p.slug && String(p.slug) === String(item.productId)) ||
                (p._id && String(p._id) === String(item.productId))
            );
            
            if (!baseProduct) return null;

            const product = JSON.parse(JSON.stringify(baseProduct));
            
            let promoImage = null;
            const theme = item.theme || '';
            
            if (theme === 'valentines' || product.promoType === 'valentines') promoImage = product.valentinesImage;
            else if (theme === 'newyear' || theme === 'new-year') promoImage = product.newYearImage;
            else if (theme === 'flash' || theme === 'flash-sales') promoImage = product.flashSaleImage;
            else if (theme === 'black-friday' || theme === 'bf') promoImage = product.blackFridayImage;
            else if (theme === 'combo') promoImage = product.comboImage || (product.images && product.images[0]);

            if (!promoImage) {
                promoImage = product.valentinesImage || product.newYearImage || product.flashSaleImage || product.blackFridayImage;
            }

            if (promoImage) {
                if (!Array.isArray(product.images)) product.images = [];
                product.images = [promoImage, ...product.images.filter(img => img !== promoImage)];
                if (product.valentinesName && theme === 'valentines') product.name = product.valentinesName;
            }

            return {
                ...item,
                product
            };
        }).filter(item => item && item.product); 
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#39;");
    }

    async function removeFromCart(productId) {
        let cart = getCart();
        const pidStr = String(productId);
        cart = cart.filter(item => String(item.productId) !== pidStr);
        await saveCart(cart);
    }

    let toastTimer = null;
    function showToast(product, theme = 'default') {
        console.log("CartManager: Showing toast for", product.name, "theme:", theme);
        let toast = document.getElementById("cart-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cart-toast";
            toast.className = "cart-toast";
            document.body.appendChild(toast);
        }

        const name = escapeHtml(product.name);
        
        let displayImage = product.images && product.images[0] ? product.images[0] : "placeholder.webp";
        if (theme === 'valentines' && product.valentinesImage) displayImage = product.valentinesImage;
        else if (theme === 'newyear' && product.newYearImage) displayImage = product.newYearImage;
        else if (theme === 'flash' && product.flashSaleImage) displayImage = product.flashSaleImage;
        else if (theme === 'black-friday' && product.blackFridayImage) displayImage = product.blackFridayImage;
        
        const image = escapeHtml(displayImage);

        if (toastTimer) clearTimeout(toastTimer);
        
        toast.classList.remove("show");
        toast.className = "cart-toast" + (theme === "black-friday" || theme === "combo" ? " black-friday" : "");
        toast.innerHTML = `
            <button class="cart-toast-close" aria-label="Close notification">×</button>
            <img src="${image}" alt="${name}" class="cart-toast-img" loading="lazy">
            <div class="cart-toast-details">
                <h4>${name}</h4>
                <p>Successfully added to your cart!</p>
            </div>
        `;

        const closeBtn = toast.querySelector(".cart-toast-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                toast.classList.remove("show");
                if (toastTimer) clearTimeout(toastTimer);
            });
        }

        if (window.Utils && window.Utils.announceToScreenReader) {
            window.Utils.announceToScreenReader(`${name} successfully added to your cart!`);
        }

        // Trigger animation
        setTimeout(() => {
            toast.classList.add("show");
        }, 100);
        
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
            toastTimer = null;
        }, 4000);
    }

    async function addToCart(productId, qty = 1, options = {}) {
        if (!productId) return;
        console.log("CartManager: Adding to cart", productId, options);

        const cart = getCart();
        const pidStr = String(productId);
        const existing = cart.find(e => String(e.productId) === pidStr);
        if (existing) {
            existing.quantity += qty;
            if (options.theme) existing.theme = options.theme;
        } else {
            cart.push({ 
                productId: pidStr, 
                quantity: qty, 
                theme: options.theme || '' 
            });
        }
        await saveCart(cart);

        loadProducts().then(() => {
            const product = allProducts.find(p => 
                (p.id && String(p.id) === pidStr) || 
                (p.slug && String(p.slug) === pidStr) ||
                (p._id && String(p._id) === pidStr)
            );
            if (product) {
                showToast(product, options.theme);
            } else {
                console.warn("Product details not found for toast:", productId);
                showToast({ name: "Product " + productId, images: [] }, options.theme);
            }
        });
    }

    function injectStyles() {
        if (document.getElementById("cart-toast-styles")) return;
        const style = document.createElement("style");
        style.id = "cart-toast-styles";
        style.innerHTML = `
            .cart-toast {
                position: fixed;
                bottom: -100%;
                right: 20px;
                background-color: #fff;
                color: #333;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgb(0 0 0 / .15);
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
                transition: bottom 0.5s cubic-bezier(.25,.46,.45,.94);
                max-width: 350px;
            }
            .cart-toast.show { bottom: 20px !important; }
            .cart-toast-img {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: contain;
                background-color: #f4f4f4;
            }
            .cart-toast-details h4 {
                margin: 0 0 5px;
                font-size: 15px;
                font-weight: 600;
            }
            .cart-toast-details p {
                margin: 0;
                font-size: 13px;
                color: #666;
            }
            .cart-toast-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 16px;
                color: #999;
                cursor: pointer;
            }
            .cart-toast.black-friday {
                background-color: #000;
                color: #fff;
                box-shadow: 0 10px 30px rgb(0 0 0 / .6);
                border: 1px solid #222;
            }
            .cart-toast.black-friday .cart-toast-img { background-color: #111; }
            .cart-toast.black-friday .cart-toast-details h4 { color: #fff; }
            .cart-toast.black-friday .cart-toast-details p { color: #e5e5e5; }
            .cart-toast.black-friday .cart-toast-close { color: #bbb; }
        `;
        document.head.appendChild(style);
    }

    async function init() {
        injectStyles();
        await loadProducts();
        
        const urlParams = new URLSearchParams(window.location.search);
        const forceUpdate = urlParams.get('cartUpdate') || Date.now();
        await updateUI();

        const mobileCart = document.querySelector(".dropdown-menu.mobile-cart");
        if (mobileCart) {
            mobileCart.addEventListener("click", function(e) {
                const btn = e.target.closest(".btn-remove");
                if (btn) {
                    e.preventDefault();
                    const id = btn.dataset.productId;
                    if (id) removeFromCart(id);
                }
            });
        }
    }

    return {
        init,
        getCart,
        getCartWithProducts,
        addToCart,
        removeFromCart,
        updateQuantity: async function(productId, qty) {
            const cart = getCart();
            const pidStr = String(productId);
            const item = cart.find(e => String(e.productId) === pidStr);
            if (item) {
                item.quantity = Math.max(1, qty);
                await saveCart(cart);
            }
        },
        formatCurrency,
        getAllProducts: function() {
            return allProducts;
        }
    };
})();

window.IPMCCartManager = window.CartManager;

document.addEventListener("DOMContentLoaded", () => {
    if (window.IPMCCartManager && typeof window.IPMCCartManager.init === 'function') {
        window.IPMCCartManager.init();
    }
});
