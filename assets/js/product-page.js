(function() {
    'use strict';

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return "GHS 0.00";
        return new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getQueryParam = (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    };

    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const createDescriptionRenderer = () => {
        const decodeHtml = (html) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        };

        const cleanText = (text) => {
            if (!text) return '';
            let content = decodeHtml(text);
            content = content.replace(/[\uFFFD\u007F-\u009F\u00AD]/g, '');
            content = content.replace(/\u00D7/g, 'x');
            content = content.replace(/\u2013/g, '-');
            content = content.replace(/\u2014/g, '-');
            content = content.replace(/\u2018|\u2019/g, "'");
            content = content.replace(/\u201C|\u201D/g, '"');
            return content.trim();
        };

        const parseContent = (text) => {
            const content = cleanText(text);
            if (!content) return { type: 'empty' };

            if (content.includes('<div') || content.includes('<table') || content.includes('<section')) {
                return { type: 'html', content: content };
            }

            let lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            
            if (lines.length === 1 && content.includes(':')) {
                const featureSplitRegex = /\s+(?=[A-Z][\w\s/()&.-]{2,25}:)/g;
                const splitLines = content.split(featureSplitRegex);
                if (splitLines.length > 1) {
                    lines = splitLines.map(l => l.trim());
                }
            }

            const features = [];
            const paragraphs = [];

            lines.forEach(line => {
                const cleanLine = line.replace(/^[\*\u2022\-]\s+/, '');
                if (cleanLine.includes(':') && cleanLine.length < 100 && !cleanLine.endsWith(':')) {
                    const [key, ...val] = cleanLine.split(':');
                    features.push({ key: key.trim(), value: val.join(':').trim() });
                } else {
                    paragraphs.push(cleanLine);
                }
            });

            return { type: 'mixed', features, paragraphs, raw: content };
        };

        const getFeatureIcon = (label, index) => {
            const iconMap = {
                'display': 'fas fa-desktop', 'screen': 'fas fa-desktop', 'resolution': 'fas fa-tv',
                'size': 'fas fa-ruler', 'weight': 'fas fa-weight', 'color': 'fas fa-palette',
                'storage': 'fas fa-hdd', 'memory': 'fas fa-memory', 'ram': 'fas fa-microchip',
                'processor': 'fas fa-microchip', 'cpu': 'fas fa-microchip', 'battery': 'fas fa-battery-full',
                'camera': 'fas fa-camera', 'wifi': 'fas fa-wifi', 'bluetooth': 'fas fa-bluetooth',
                'port': 'fas fa-plug', 'usb': 'fas fa-usb', 'power': 'fas fa-bolt',
                'warranty': 'fas fa-shield-alt', 'material': 'fas fa-cube', 'speed': 'fas fa-tachometer-alt',
                'sound': 'fas fa-volume-up', 'audio': 'fas fa-music', 'os': 'fas fa-cog',
                'system': 'fas fa-cogs', 'dimension': 'fas fa-expand'
            };

            const lowerLabel = (label || '').toLowerCase();
            for (const [key, icon] of Object.entries(iconMap)) {
                if (lowerLabel.includes(key)) return icon;
            }
            
            const fallbackIcons = ['fas fa-check', 'fas fa-star', 'fas fa-circle', 'fas fa-dot-circle'];
            return fallbackIcons[index % fallbackIcons.length];
        };

        const renderShort = (text) => {
            const data = parseContent(text);
            if (data.type === 'empty') return '';
            
            let html = '<div class="luxury-short-desc">';
            
            if (data.type === 'html') {
                const tmp = document.createElement('div');
                tmp.innerHTML = data.content;
                let plain = tmp.textContent || tmp.innerText || "";
                plain = plain.substring(0, 150) + (plain.length > 150 ? '...' : '');
                html += `<p class="short-desc-text">${plain}</p>`;
            } else {
                const itemsToShow = data.features.slice(0, 3);
                
                if (itemsToShow.length > 0) {
                    html += '<div class="short-features">';
                    itemsToShow.forEach((item, idx) => {
                        const icon = getFeatureIcon(item.key, idx);
                        html += `
                            <div class="feature-item">
                                <div class="feature-icon"><i class="${icon}"></i></div>
                                <div class="feature-details">
                                    <span class="feature-label">${item.key}</span>
                                    <span class="feature-value">${item.value}</span>
                                </div>
                            </div>`;
                    });
                    html += '</div>';
                } else if (data.paragraphs.length > 0) {
                    let p = data.paragraphs[0];
                    if (p.length > 180) p = p.substring(0, 180) + '...';
                    html += `<p class="short-desc-text">${p}</p>`;
                }
            }
            
            html += '</div>';
            return html;
        };

        const renderLong = (text) => {
            const data = parseContent(text);
            if (data.type === 'empty') return '<div class="no-description">No description available for this product.</div>';
            if (data.type === 'html') return `<div class="luxury-long-desc">${data.content}</div>`;
            
            let html = '<div class="luxury-long-desc">';
            
            if (data.paragraphs.length > 0) {
                html += '<div class="desc-section"><div class="desc-content">';
                html += `<p>${data.paragraphs[0]}</p>`;
                html += '</div></div>';
            }
            
            if (data.features.length > 0) {
                html += '<div class="desc-section">';
                html += '<h3 class="desc-section-title"><i class="fas fa-bolt"></i> Key Specifications</h3>';
                html += '<div class="features-grid">';
                
                data.features.forEach((item, index) => {
                    const icon = getFeatureIcon(item.key, index);
                    html += `
                        <div class="feature-card">
                            <div class="feature-card-icon"><i class="${icon}"></i></div>
                            <div class="feature-card-content">
                                <h4>${item.key}</h4>
                                <p>${item.value}</p>
                            </div>
                        </div>`;
                });
                html += '</div></div>';
            }
            
            if (data.paragraphs.length > 1) {
                html += '<div class="desc-section">';
                html += '<h3 class="desc-section-title"><i class="fas fa-info-circle"></i> More Details</h3>';
                html += '<div class="desc-content">';
                data.paragraphs.slice(1).forEach(p => {
                    html += `<p>${p}</p>`;
                });
                html += '</div></div>';
            }
            
            html += '</div>';
            return html;
        };

        return { renderShort, renderLong };
    };

    const renderRelatedProducts = (category, currentId) => {
        const carousel = document.getElementById("related-products-carousel");
        if (!carousel) return;

        const manager = window.IPMCCartManager || window.CartManager;
        if (!manager) return;

        const allProducts = manager.getAllProducts();
        const related = allProducts
            .filter(p => p.categoryId === category && String(p.id || p.slug) !== String(currentId))
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);

        if (related.length === 0) {
            const section = carousel.closest(".products-section");
            if (section) section.style.display = 'none';
            return;
        }

        carousel.classList.remove('owl-carousel', 'owl-theme');

        carousel.innerHTML = related.map(p => {
            const name = escapeHtml(p.name);
            const id = p.id || p.slug;
            const price = formatCurrency(p.price);
            const oldPrice = p.originalPrice || p.oldPrice ? formatCurrency(p.originalPrice || p.oldPrice) : null;
            // Use Valentine's image if available
            const image = p.valentinesImage || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "assets/images/placeholder.webp");
            const rating = p.rating || 0;

            return `
                <div class="product-default inner-quickview inner-icon">
                    <figure>
                        <a href="product.html?id=${id}">
                            <img src="${image}" width="239" height="239" alt="${name}">
                        </a>
                    </figure>
                    <div class="product-details">
                        <h3 class="product-title">
                            <a href="product.html?id=${id}">${name}</a>
                        </h3>
                        <div class="ratings-container">
                            <div class="product-ratings">
                                <span class="ratings" style="width:${rating * 20}%"></span>
                            </div>
                        </div>
                        <div class="price-box">
                            ${oldPrice ? `<span class="old-price">${oldPrice}</span>` : ""}
                            <span class="product-price">${price}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderProduct = (product) => {
        try {
            console.log("Product Page: Rendering product:", product.name);
            const container = document.querySelector(".product-single-container");
            const tabsContainer = document.querySelector(".product-single-tabs");
            if (!container) {
                console.error("Product Page: Container .product-single-container not found!");
                return;
            }

            const name = escapeHtml(product.name || "Unknown Product");
            const price = formatCurrency(product.price || 0);
            const oldPrice = product.originalPrice || product.oldPrice ? formatCurrency(product.originalPrice || product.oldPrice) : null;
            const sku = product.id || product.slug || "N/A";
            const category = product.categoryName || "Combo Deals";
            const categoryId = product.categoryId || "combo-deals";
            
            const descriptionRenderer = createDescriptionRenderer();
            const shortDescriptionHtml = descriptionRenderer.renderShort(product.description || "");
            const longDescriptionHtml = descriptionRenderer.renderLong(product.fullDescription || product.description || "");
            
            // Use Valentine's Day specific image if available, regardless of context
            let images = Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
            
            // If the product has a Valentine's image, prioritize it over other images
            if (product.valentinesImage) {
                images = [product.valentinesImage, ...images];
            }

            const imagesHtml = images.map(img => `
                <div class="product-item">
                    <img class="product-single-image" src="${img}" data-zoom-image="${img}" alt="${name}" />
                </div>
            `).join('');

            const thumbnailsHtml = images.map(img => `
                <div class="owl-dot">
                    <img src="${img}" alt="${name} thumbnail" />
                </div>
            `).join('');

            console.log(`Product Page: Generated HTML with ${images.length} images`);

            container.innerHTML = `
                <div class="row">
                    <div class="col-lg-5 col-md-6 product-single-gallery">
                        <div class="product-slider-container">
                            <div class="product-single-carousel owl-carousel owl-theme show-nav-hover">
                                ${imagesHtml || '<div class="product-item"><img src="assets/images/placeholder.webp" alt="No image"></div>'}
                            </div>
                        </div>
                        <div class="prod-thumbnail owl-dots">
                            ${thumbnailsHtml}
                        </div>
                    </div>

                    <div class="col-lg-7 col-md-6 product-single-details">
                        <h1 class="product-title">${name}</h1>

                        <div class="ratings-container">
                            <div class="product-ratings">
                                <span class="ratings" style="width:100%"></span>
                            </div>
                            <a href="#" class="rating-link">( 0 Reviews )</a>
                        </div>

                        <hr class="short-divider">

                        <div class="price-box">
                            ${oldPrice ? `<span class="old-price">${oldPrice}</span>` : ""}
                            <span class="new-price">${price}</span>
                        </div>

                        <div class="product-desc">
                            ${shortDescriptionHtml}
                        </div>

                        <ul class="single-info-list">
                            <li>SKU: <strong>${sku}</strong></li>
                            <li>CATEGORY: <strong><a href="category1.html?category=${categoryId}" class="product-category">${category}</a></strong></li>
                        </ul>

                        <div class="product-action">
                            <div class="product-single-qty">
                                <input id="product-quantity" class="horizontal-quantity form-control" type="number" value="1" min="1">
                            </div>

                            <button type="button" class="btn btn-dark add-cart mr-2" title="Add to Cart">Add to Cart</button>
                            <a href="cart.html" class="btn btn-gray view-cart d-none">View cart</a>
                        </div>

                        <hr class="divider mb-0 mt-0">

                        <div class="product-single-share mb-3">
                            <label class="sr-only">Share:</label>
                            <div class="social-icons mr-2">
                                <a href="#" class="social-icon social-facebook icon-facebook" target="_blank" title="Facebook"></a>
                                <a href="#" class="social-icon social-twitter icon-twitter" target="_blank" title="Twitter"></a>
                                <a href="#" class="social-icon social-linkedin fab fa-linkedin-in" target="_blank" title="Linkedin"></a>
                            </div>
                            <a href="wishlist.html" class="btn-icon-wish add-wishlist" title="Add to Wishlist"><i class="icon-heart"></i><span>Add to Wishlist</span></a>
                        </div>
                    </div>
                </div>
            `;

            if (tabsContainer) {
                tabsContainer.innerHTML = `
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item"><a class="nav-link active" id="product-tab-desc" data-toggle="tab" href="#product-desc-content" role="tab">Description</a></li>
                    </ul>
                    <div class="tab-content">
                        <div class="tab-pane fade show active" id="product-desc-content" role="tabpanel">
                            <div class="product-desc-content">${longDescriptionHtml}</div>
                        </div>
                    </div>
                `;
            }

            const addBtn = container.querySelector(".add-cart");
            if (addBtn) {
                addBtn.addEventListener("click", () => {
                    const qtyInput = document.getElementById("product-quantity");
                    const qty = parseInt(qtyInput ? qtyInput.value : "1");
                    if (window.CartManager) {
                        window.CartManager.addToCart(sku, qty, { theme: categoryId === 'combo-deals' ? 'combo' : 'default' });
                        const viewCartBtn = container.querySelector(".view-cart");
                        if (viewCartBtn) viewCartBtn.classList.remove("d-none");
                    }
                });
            }

            const initCarousel = () => {
                if (window.jQuery && jQuery.fn.owlCarousel) {
                    const $carousel = jQuery(".product-single-carousel");
                    if ($carousel.length) {
                        $carousel.owlCarousel({
                            items: 1,
                            nav: true,
                            dots: true,
                            dotsContainer: '.prod-thumbnail'
                        });
                        console.log("Product Page: Carousel initialized");
                    }
                } else {
                    setTimeout(initCarousel, 100);
                }
            };
            initCarousel();
            renderRelatedProducts(product.categoryId, product.id || product.slug);
            console.log("Product Page: Render complete");
        } catch (error) {
            console.error("Product Page: Error in renderProduct:", error);
        }
    };

    const init = async () => {
        const productId = getQueryParam("id");
        if (!productId) {
            console.error("Product Page: No product ID found in URL");
            return;
        }

        console.log("Product Page: Initializing for ID:", productId);

        try {
            const manager = window.IPMCCartManager || window.CartManager;
            if (manager) {
                console.log("Product Page: Waiting for CartManager...");
                if (typeof manager.init === 'function') {
                    await manager.init();
                }
                
                if (typeof manager.getAllProducts !== 'function') {
                    console.error("Product Page: manager.getAllProducts is not a function! Check for namespace conflicts.");
                    return;
                }

                const allProducts = manager.getAllProducts();
                console.log(`Product Page: CartManager ready. Total products: ${allProducts.length}`);

                const product = allProducts.find(p => {
                    const idStr = String(p.id || "").toLowerCase().trim();
                    const slugStr = String(p.slug || "").toLowerCase().trim();
                    const mongoIdStr = String(p._id || "").toLowerCase().trim();
                    const searchId = productId.toLowerCase().trim();
                    return idStr === searchId || slugStr === searchId || mongoIdStr === searchId;
                });
                
                if (product) {
                    console.log("Product Page: Found product:", product.name);
                    renderProduct(product);
                    const breadcrumb = document.querySelector(".breadcrumb-item.active");
                    if (breadcrumb) breadcrumb.textContent = product.name;
                    document.title = `${product.name} | IPMC Kart`;
                } else {
                    console.warn("Product Page: Product not found in CartManager:", productId);
                    const container = document.querySelector(".product-single-container");
                    if (container) {
                        container.innerHTML = `<div class="container text-center py-5">
                            <h2>Product Not Found</h2>
                            <p>Sorry, we couldn't find the product you're looking for.</p>
                            <a href="index.html" class="btn btn-primary">Back to Home</a>
                        </div>`;
                    }
                }
            } else {
                console.error("Product Page: CartManager not found on window");
            }
        } catch (err) {
            console.error("Product Page: Error initializing:", err);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();