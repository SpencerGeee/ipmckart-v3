(function() {
    'use strict';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function calculateProgress(sold, stock) {
        return clamp(stock > 0 ? Math.round((sold / stock) * 100) : 0, 0, 100);
    }

     function getSimulatedSold(product) {
         const stock = Number(product.stock || product.comboStock || 15);
         const base = Number(product.comboSold || 3);
         const slug = product.slug || product.id || '';
         const variance = (slug.length % 4) + 2; 
         return clamp(base + variance, 0, stock);
     }

    function formatPrice(price) {
        if (window.formatPrice && typeof window.formatPrice === 'function') {
            return window.formatPrice(price);
        }
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function injectComboStyles() {
        if (document.getElementById('combo-dynamic-css')) return;

        const style = document.createElement('style');
        style.id = 'combo-dynamic-css';
        style.textContent = `
             :root {
                --combo-primary: #9333EA;
                --combo-accent: #A855F7;
             }
             .combo-offers-section {
                 background: linear-gradient(180deg, #FDF4FF 0%, #FAE8FF 100%);
                 padding: 4rem 0 5rem;
                 position: relative;
                 overflow: hidden;
                 border-top: 1px solid #F0ABFC;
             }

             #js-combo-deals-grid {
                 display: grid;
                 grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                 gap: 25px;
                 padding: 20px 0;
             }

             #js-combo-deals-grid .combo-card {
                 background: #FFFFFF;
                 border-radius: 20px;
                 position: relative;
                 display: flex;
                 flex-direction: column;
                 transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                 border: 1px solid rgba(226, 232, 240, 0.8);
                 overflow: hidden;
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                 height: 100%;
             }

             #js-combo-deals-grid .combo-card:hover {
                 transform: translateY(-12px);
                 box-shadow: 0 20px 40px -5px rgba(147, 51, 234, 0.15);
                 border-color: #E9D5FF;
                 z-index: 10;
             }

             .combo-badge {
                 position: absolute;
                 top: 15px;
                 left: 15px;
                 background: #FAF5FF;
                 color: #9333EA;
                 font-size: 0.85rem;
                 font-weight: 800;
                 padding: 7px 15px;
                 border-radius: 8px;
                 z-index: 5;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 border: 1px solid #F3E8FF;
                 animation: badgePulse 2s ease-in-out infinite;
             }

             @keyframes badgePulse {
                 0%, 100% { transform: scale(1); }
                 50% { transform: scale(1.05); }
             }

             .combo-exclusive-badge {
                 position: absolute;
                 top: 15px;
                 right: 15px;
                 background: linear-gradient(135deg, #9333EA, #7E22CE);
                 color: white;
                 font-size: 0.7rem;
                 font-weight: 700;
                 padding: 5px 10px;
                 border-radius: 20px;
                 z-index: 5;
                 text-transform: uppercase;
                 letter-spacing: 1px;
                 display: flex;
                 align-items: center;
                 gap: 6px;
                 box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
             }

             .combo-exclusive-badge::before {
                 content: '★';
                 font-size: 0.8rem;
             }

             .combo-img-wrapper {
                 height: 220px;
                 padding: 25px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 background: #fff;
                 position: relative;
             }
             .combo-img-wrapper img {
                 max-width: 100%;
                 max-height: 100%;
                 object-fit: contain;
                 transition: transform 0.5s ease;
                 filter: brightness(0.98);
             }
             #js-combo-deals-grid .combo-card:hover .combo-img-wrapper img {
                 transform: scale(1.08);
                 filter: brightness(1.05);
             }

             .combo-content {
                 padding: 20px;
                 display: flex;
                 flex-direction: column;
                 flex-grow: 1;
                 background: #FFFFFF;
             }

             .combo-title {
                 font-size: 1.15rem;
                 font-weight: 600;
                 color: #1E293B;
                 margin-bottom: 12px;
                 line-height: 1.4;
                 display: -webkit-box;
                 -webkit-line-clamp: 2;
                 -webkit-box-orient: vertical;
                 overflow: hidden;
                 min-height: 56px;
             }
             .combo-title a { color: inherit; text-decoration: none; transition: color 0.2s; }
             .combo-title a:hover { color: #9333EA; }

             .combo-price-group {
                 display: flex;
                 align-items: baseline;
                 gap: 12px;
                 margin-bottom: 16px;
             }
             .combo-price {
                 font-size: 1.75rem;
                 font-weight: 800;
                 color: #581C87;
                 letter-spacing: -0.5px;
             }
             .combo-old-price {
                 font-size: 1.15rem;
                 color: #94A3B8;
                 text-decoration: line-through;
             }

            .combo-stock-bar {
                background: #E5E7EB;
                height: 8px;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 8px;
                position: relative;
            }
            .combo-stock-fill {
                height: 100%;
                background: linear-gradient(90deg, #A855F7 0%, #9333EA 100%);
                border-radius: 10px;
                width: 0%;
                transition: width 1s ease-out;
                position: relative;
                overflow: hidden;
            }
            
            .combo-stock-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 2s infinite linear;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .combo-stock-text {
                font-size: 0.85rem;
                color: #581C87;
                display: flex;
                justify-content: space-between;
                font-weight: 600;
            }
            .combo-stock-highlight { 
                color: #9333EA;
                font-weight: 700;
            }

             .combo-btn-add {
                 margin-top: 15px;
                 width: 100%;
                 background: #0F172A;
                 color: #fff;
                 border: none;
                 padding: 12px;
                 border-radius: 12px;
                 font-weight: 600;
                 font-size: 0.85rem;
                 cursor: pointer;
                 transition: all 0.3s ease;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 gap: 8px;
             }
             .combo-btn-add:hover {
                 background: #9333EA;
                 box-shadow: 0 5px 15px rgba(147, 51, 234, 0.4);
                 transform: translateY(-2px);
             }
             .combo-btn-add i { font-size: 1rem; }


            @media (max-width: 992px) {
                #js-combo-deals-grid { grid-template-columns: repeat(3, 1fr); }
                .combo-title { font-size: 1.05rem; min-height: 52px; }
                .combo-price { font-size: 1.55rem; }
                .combo-old-price { font-size: 1.05rem; }
            }
            @media (max-width: 768px) {
                #js-combo-deals-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .combo-img-wrapper { height: 180px; padding: 20px; }
                .combo-content { padding: 18px; }
                .combo-title { font-size: 1rem; min-height: 48px; }
                .combo-price { font-size: 1.45rem; }
                .combo-old-price { font-size: 0.95rem; }
                .combo-progress-text { font-size: 0.85rem; }
                .combo-exclusive-badge { top: 10px; right: 10px; padding: 4px 8px; font-size: 0.6rem; }
                .combo-badge { top: 10px; left: 10px; font-size: 0.7rem; padding: 5px 12px; }
            }
            @media (max-width: 480px) {
                #js-combo-deals-grid { grid-template-columns: 1fr; }
                .combo-title { font-size: 0.9rem; min-height: 44px; }
                .combo-price { font-size: 1.3rem; }
                .combo-old-price { font-size: 0.85rem; }
            }
        `;
        document.head.appendChild(style);
    }

     function generateComboCard(product, simulatedSold, stock) {
        const rawPrice = product.comboDealsPrice || product.comboPrice || product.price;
        const dealPrice = (rawPrice !== undefined && rawPrice !== null) ? parseFloat(rawPrice) : 0;
        
        let oldPrice, salePrice;
        
        if (product.originalPrice && parseFloat(product.originalPrice) > dealPrice) {
             oldPrice = parseFloat(product.originalPrice);
             salePrice = dealPrice;
        } else {
             salePrice = dealPrice;
             oldPrice = dealPrice * 1.25; 
        }

        const discount = oldPrice > 0 && salePrice > 0 ? Math.round(((oldPrice - salePrice) / oldPrice) * 100) : 20;
        const image = (Array.isArray(product.images) && product.images[0]) ? product.images[0] : 'assets/images/placeholder.webp';
        const progress = clamp(Math.round((simulatedSold/stock)*100), 10, 95);

        return `
            <div class="combo-card" data-product-id="${product.slug || product.id}">
                <div class="combo-exclusive-badge">
                    <span>BUNDLE</span>
                </div>
                <div class="combo-badge">-${discount}% Deal</div>

                <figure class="combo-img-wrapper">
                    <a href="product.html?id=${encodeURIComponent(product.slug || product.id)}">
                        <img src="${image}" alt="${product.name}" loading="lazy">
                    </a>
                </figure>

                <div class="combo-content">
                    <h3 class="combo-title">
                        <a href="product.html?id=${encodeURIComponent(product.slug || product.id)}">${product.name || 'Combo Deal'}</a>
                    </h3>

                    <div class="combo-price-group">
                        <span class="combo-price">₵${formatPrice(salePrice)}</span>
                        <span class="combo-old-price">₵${formatPrice(oldPrice)}</span>
                    </div>

                    <div class="combo-stock-bar">
                        <div class="combo-stock-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="combo-stock-text">
                        <span class="combo-stock-highlight">${simulatedSold} Sold</span>
                        <span>${stock - simulatedSold} Bundles Left</span>
                    </div>

                    <button class="combo-btn-add" data-product-id="${product.slug || product.id}">
                        <i class="icon-shopping-cart"></i> Add Bundle
                    </button>
                </div>
            </div>
        `;
    }

    async function loadComboDeals() {
         injectComboStyles();

         const container = document.getElementById('js-combo-deals-grid');
         if (!container) return;

         try {
              const cacheBuster = '?v=' + new Date().getTime();
              let response = await fetch('combo-offers-v2.json' + cacheBuster, { cache: 'no-cache' });
              
              if (!response.ok) {
                  response = await fetch('assets/data/combo-offers-v2.json' + cacheBuster, { cache: 'no-cache' });
                  if (!response.ok) throw new Error('Failed to load products');
              }

              let data = await response.json();
              let products = (data && data.combos) ? data.combos : [];

              if (products.length === 0) {
                  container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 40px; color: #64748B;">Combo deals are coming soon!</p>';
                  return;
              }

              const limit = container.dataset.limit ? parseInt(container.dataset.limit) : null;
              let displayProducts = products;
              
              if (limit && limit > 0) {
                  displayProducts = products.slice(0, limit);
              }

               const html = displayProducts.map(product => {
                   if (!product) return '';
                   product.price = Number(product.price) || 0;
                   const stock = Number(product.stock || product.comboStock || 15); 
                   const actualSold = getSimulatedSold(product);
                   return generateComboCard(product, actualSold, stock);
               }).join('');

              container.innerHTML = html;

              if (!container.dataset.cartBound) {
                  container.addEventListener('click', function(e) {
                      const btn = e.target.closest('.combo-btn-add');
                      if (!btn) return;

                      const productId = btn.getAttribute('data-product-id');
                      if (!productId) return;

                      const manager = window.IPMCCartManager || window.CartManager;
                      if (manager && typeof manager.addToCart === 'function') {
                          manager.addToCart(productId, 1, { theme: 'combo' });

                          const originalHtml = btn.innerHTML;
                          btn.disabled = true;
                          btn.innerHTML = '<i class="fas fa-check"></i> Added';
                          btn.style.background = '#10B981';

                          setTimeout(() => {
                              btn.disabled = false;
                              btn.innerHTML = originalHtml;
                              btn.style.background = '';
                          }, 1500);
                      }
                  });
                  container.dataset.cartBound = '1';
              }

         } catch (error) {
             container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 40px;">Unable to load deals.</p>';
         }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadComboDeals);
    } else {
        loadComboDeals();
    }
})();
