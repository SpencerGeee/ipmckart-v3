(function() {
     'use strict';

     /* =========================================
        1. HELPER FUNCTIONS
        ========================================= */
     function clamp(value, min, max) {
         return Math.max(min, Math.min(max, value));
     }

     function calculateProgress(sold, stock) {
         return clamp(stock > 0 ? Math.round((sold / stock) * 100) : 0, 0, 100);
     }

      // Logic to simulate realistic sold counts with guaranteed minimum
      function getSimulatedSold(product) {
          const stock = Number(product.newYearStock || 0);
          const baseSold = Number(product.newYearSold || 0);

         // If we have actual sold data, use it with some random increase
         if (baseSold > 0) {
             const variance = Math.max(0, Math.floor(stock * 0.15));
             return clamp(baseSold + Math.floor(Math.random() * variance), 0, stock);
         }

         // No actual data - simulate realistic selling activity
         // Guarantee at least 1 sale sold if stock >= 5 to show active selling
         // For smaller stock (<5), sell 20-60% to show activity
         const minPercent = stock >= 5 ? 0.2 : 0.3;
         const maxPercent = stock >= 5 ? 0.6 : 0.7;
         const soldPercent = minPercent + (Math.random() * (maxPercent - minPercent));
         const simulatedSold = Math.floor(stock * soldPercent);

         // Ensure at least 1 sold if we have stock
         const minSold = Math.max(1, Math.floor(stock * 0.15));
         return clamp(simulatedSold, minSold, stock);
     }

     function formatPrice(price) {
         if (window.formatPrice && typeof window.formatPrice === 'function') {
             return window.formatPrice(price);
         }
         return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
     }

     /* =========================================
        2. INJECT LUXURY CSS
        ========================================= */
     function injectNewYearStyles() {
         if (document.getElementById('newyear-dynamic-css')) return;

         const style = document.createElement('style');
         style.id = 'newyear-dynamic-css';
         style.textContent = `
             /* --- SECTION LAYOUT --- */
             .newyear-section {
                 background: linear-gradient(180deg, #F9FAFB 0%, #EFF6FF 100%);
                 padding: 4rem 0 5rem;
                 position: relative;
                 overflow: hidden;
                 border-top: 1px solid #e5e7eb;
             }

             /* --- BACKGROUND EFFECTS --- */
             .ny-watermark {
                 position: absolute;
                 top: 50%;
                 left: 50%;
                 transform: translate(-50%, -50%);
                 font-size: 30vw;
                 font-weight: 900;
                 color: rgba(37, 99, 235, 0.03); /* Faint Blue */
                 z-index: 0;
                 pointer-events: none;
                 line-height: 1;
                 font-family: 'Poppins', sans-serif;
             }

             .ny-particles .particle {
                 position: absolute;
                 bottom: -20px;
                 background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(147, 197, 253, 0.4));
                 border-radius: 50%;
                 animation: floatUp linear infinite;
                 z-index: 1;
             }
             .ny-particles .p1 { width: 40px; height: 40px; left: 10%; animation-duration: 8s; }
             .ny-particles .p2 { width: 20px; height: 20px; left: 30%; animation-duration: 12s; animation-delay: 2s; }
             .ny-particles .p3 { width: 60px; height: 60px; left: 50%; animation-duration: 10s; animation-delay: 1s; }
             .ny-particles .p4 { width: 30px; height: 30px; left: 70%; animation-duration: 14s; }
             .ny-particles .p5 { width: 50px; height: 50px; left: 90%; animation-duration: 9s; animation-delay: 3s; }

             @keyframes floatUp {
                 0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                 20% { opacity: 0.6; }
                 80% { opacity: 0.6; }
                 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
             }

             /* --- HEADERS --- */
             .section-heading-wrapper { text-align: left; }
              .newyear-section .sub-heading {
                  display: block;
                  font-family: 'Open Sans', sans-serif;
                  color: #2563EB;
                  font-size: 0.9rem;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  font-weight: 700;
                  margin-bottom: 5px;
              }
             .section-title {
                 font-family: 'Poppins', sans-serif;
                 font-size: 2.8rem;
                 font-weight: 800;
                 color: #1E293B;
                 margin: 0;
                 line-height: 1.2;
             }
              .newyear-section .section-title .highlight {
                  color: #2563EB; /* Royal Blue */
                  position: relative;
                  display: inline-block;
              }

             /* --- BUTTONS --- */
             .btn-modern-pill {
                 background: #fff;
                 color: #2563EB;
                 border: 2px solid #2563EB;
                 padding: 12px 30px;
                 border-radius: 50px;
                 font-weight: 700;
                 text-transform: uppercase;
                 font-size: 0.85rem;
                 letter-spacing: 1px;
                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                 box-shadow: 0 4px 15px rgba(37, 99, 235, 0.15);
             }
             .btn-modern-pill:hover {
                 background: #2563EB;
                 color: #fff;
                 transform: translateY(-2px);
                 box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
                 text-decoration: none;
             }

             /* --- PRODUCT CARD (AESTHETIC) --- */
             #newyear-products .ny-card {
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

             #newyear-products .ny-card:hover {
                 transform: translateY(-12px);
                 box-shadow: 0 20px 40px -5px rgba(37, 99, 235, 0.15); /* Blue glow shadow */
                 border-color: #BFDBFE;
                 z-index: 10;
             }

             /* --- BADGE --- */
             .ny-badge {
                 position: absolute;
                 top: 15px;
                 left: 15px;
                 background: #EFF6FF;
                 color: #2563EB;
                 font-size: 0.85rem;
                 font-weight: 800;
                 padding: 7px 15px;
                 border-radius: 8px;
                 z-index: 5;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 border: 1px solid #DBEAFE;
                 animation: badgePulse 2s ease-in-out infinite;
             }

             @keyframes badgePulse {
                 0%, 100% { transform: scale(1); }
                 50% { transform: scale(1.05); }
             }

             .ny-live-badge {
                 position: absolute;
                 top: 15px;
                 right: 15px;
                 background: linear-gradient(135deg, #2563EB, #1E40AF);
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
                 box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
             }

             .ny-live-badge::before {
                 content: '';
                 width: 8px;
                 height: 8px;
                 background: #2563EB;
                 border-radius: 50%;
                 animation: liveDotPulse 1.5s ease-in-out infinite;
             }

             @keyframes liveDotPulse {
                 0%, 100% { opacity: 1; transform: scale(1); }
                 50% { opacity: 0.5; transform: scale(1.2); }
             }

             /* --- IMAGE AREA --- */
             .ny-img-wrapper {
                 height: 220px;
                 padding: 25px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 background: #fff;
                 position: relative;
             }
             .ny-img-wrapper img {
                 max-width: 100%;
                 max-height: 100%;
                 object-fit: contain;
                 transition: transform 0.5s ease;
                 filter: brightness(0.98);
                 padding: 10px;
             }
             #newyear-products .ny-card:hover .ny-img-wrapper img {
                 transform: scale(1.08);
                 filter: brightness(1.05);
             }

             /* --- CONTENT AREA --- */
             .ny-content {
                 padding: 20px;
                 display: flex;
                 flex-direction: column;
                 flex-grow: 1;
                 background: #FFFFFF;
             }

             .ny-title {
                 font-size: 1.15rem;
                 font-weight: 600;
                 color: #1E293B;
                 margin-bottom: 12px;
                 line-height: 1.4;
                 display: -webkit-box;
                 -webkit-line-clamp: 2;
                 -webkit-box-orient: closing vertical;
                 overflow: hidden;
                 min-height: 56px;
             }
             .ny-title a { color: inherit; text-decoration: none; transition: color 0.2s; }
             .ny-title a:hover { color: #2563EB; }

             /* --- PRICE --- */
             .ny-price-group {
                 display: flex;
                 align-items: baseline;
                 gap: 12px;
                 margin-bottom: 16px;
             }
             .ny-price {
                 font-size: 1.75rem;
                 font-weight: 800;
                 color: #0F172A; /* Dark Navy */
                 letter-spacing: -0.5px;
             }
             .ny-old-price {
                 font-size: 1.15rem;
                 color: #94A3B8;
                 text-decoration: line-through;
             }

             /* --- PROGRESS BAR (BLUE THEME) --- */
             .ny-progress-wrap {
                 margin-bottom: 15px;
                 padding: 10px 12px;
                 background: #F8FAFC;
                 border-radius: 10px;
                 border: 1px solid #E2E8F0;
             }
             .ny-progress-text {
                 display: flex;
                 justify-content: space-between;
                 align-items: center;
                 font-size: 0.9rem;
                 font-weight: 700;
                 color: #1E293B;
                 margin-bottom: 8px;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
             }
             .ny-sold-highlight {
                 color: #2563EB;
                 font-size: 1rem;
                 font-weight: 800;
                 background: #EFF6FF;
                 padding: 6px 12px;
                 border-radius: 6px;
                 display: flex;
                 align-items: center;
                 gap: 8px;
                 position: relative;
             }

             .ny-sold-highlight::before {
                 content: '🔥';
                 font-size: 0.9rem;
                 animation: flamePulse 1s ease-in-out infinite;
             }

             @keyframes flamePulse {
                 0%, 100% { transform: scale(1) opacity: 1; }
                 50% { transform: scale(1.2) opacity: 0.8; }
             }

             .ny-stock-count {
                 color: #64748B;
                 font-size: 1rem;
                 font-weight: 600;
             }

             .ny-track {
                 height: 10px;
                 background: #F1F5F9;
                 border-radius: 10px;
                 overflow: hidden;
                 position: relative;
             }
             .ny-fill {
                 height: 100%;
                 background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%);
                 border-radius: 10px;
                 position: relative;
                 animation: progressFill 3s ease-in-out;
             }

             .ny-fill::after {
                 content: '';
                 position: absolute;
                 top: 2px;
                 left: 50%;
                 transform: translateX(-50%);
                 width: calc(100% - 8px);
                 height: 6px;
                 background: rgba(255, 255, 255, 0.3);
                 border-radius: 5px;
                 animation: shimmer 2s infinite linear;
                 background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
             }

             @keyframes progressFill {
                 0% { width: 0; }
                 100% { }
             }

             @keyframes shimmer {
                 0% { transform: translateX(-100%); }
                 100% { transform: translateX(100%); }
             }

             /* --- ACTION BUTTON --- */
             .ny-btn-add {
                 margin-top: auto;
                 width: 100%;
                 background: #0F172A; /* Midnight Blue */
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
             .ny-btn-add:hover {
                 background: #2563EB; /* Royal Blue */
                 box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);
                 transform: translateY(-2px);
             }
             .ny-btn-add i { font-size: 1rem; }

             /* --- RESPONSIVE --- */
             @media (max-width: 992px) {
                 .section-title { font-size: 2rem; }
                 .ny-title { font-size: 1.05rem; min-height: 52px; }
                 .ny-price { font-size: 1.55rem; }
                 .ny-old-price { font-size: 1.05rem; }
                 .newyear-section { padding: 2.5rem 0 3rem; }
             }
             @media (max-width: 768px) {
                 .ny-img-wrapper { height: 120px; padding: 15px; }
                 .ny-content { padding: 15px; }
                 .ny-title { font-size: 0.9rem; min-height: 42px; }
                 .ny-price { font-size: 1.3rem; }
                 .ny-old-price { font-size: 0.9rem; }
                 .ny-progress-text { font-size: 0.8rem; }
                 .ny-live-badge { top: 8px; right: 8px; padding: 3px 6px; font-size: 0.55rem; }
                 .ny-badge { top: 8px; left: 8px; font-size: 0.65rem; padding: 4px 10px; }
                 .newyear-section { padding: 2rem 0 2.5rem; }
                 .section-heading-wrapper { text-align: center; }
                 .newyear-section .sub-heading { font-size: 0.8rem; }
                 .btn-modern-pill { padding: 10px 20px; font-size: 0.75rem; }
             }
             @media (max-width: 480px) {
                 .ny-img-wrapper { height: 100px; padding: 12px; }
                 .ny-title { font-size: 0.85rem; min-height: 40px; }
                 .ny-price { font-size: 1.1rem; }
                 .ny-old-price { font-size: 0.8rem; }
                 .ny-progress-text { font-size: 0.75rem; }
                 .newyear-section { padding: 1.5rem 0 2rem; }
             }
             @media (max-width: 360px) {
                 .ny-img-wrapper { height: 90px; padding: 10px; }
                 .section-title { font-size: 1.2rem; }
                 .ny-title { font-size: 0.8rem; min-height: 38px; }
                 .ny-price { font-size: 1rem; }
                 .newyear-section { padding: 1rem 0 1.5rem; }
             }
         `;
         document.head.appendChild(style);
     }

     /* =========================================
        3. GENERATE HTML CARD
        ========================================= */
      function generateNewYearCard(product, simulatedSold, stock) {
         const price = parseFloat(product.price) || 0;
         const salePrice = parseFloat(product.newYearPrice || price);

        // Add fake inflated price if sale price equals original price (to show "sale" effect)
        // Increase by 25-30% to show meaningful discount
        let oldPrice;
        if (salePrice && salePrice === price) {
            oldPrice = price * (1.25 + Math.random() * 0.05); // 25-30% inflated
        } else if (salePrice && salePrice < price) {
            oldPrice = price; // Use actual original as old price
        } else {
            oldPrice = price; // No sale, no old price
        }

        const discount = oldPrice > 0 && salePrice > 0 ? Math.round(((oldPrice - salePrice) / oldPrice) * 100) : 0;

        const image = (Array.isArray(product.images) && product.images[0]) ? product.images[0] : 'assets/images/placeholder.webp';
        const progress = calculateProgress(simulatedSold, stock);

        // Dynamic "Low Stock" warning for progress bar color
        const progressColor = progress > 80 ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' : '';

        return `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
            <div class="ny-card" data-product-id="${product.slug}">
                <div class="ny-live-badge">
                    <span>LIVE</span>
                </div>
                <div class="ny-badge">-${discount}% 2026 Deal</div>

                <figure class="ny-img-wrapper">
                    <a href="product.html?id=${product.slug}">
                        <img src="${image}" alt="${product.name}" loading="lazy">
                    </a>
                </figure>

                <div class="ny-content">
                    <h3 class="ny-title">
                        <a href="product.html?id=${product.slug}">${product.name}</a>
                    </h3>

                    <div class="ny-price-group">
                        <span class="ny-price">₵${formatPrice(salePrice)}</span>
                        ${discount > 0 ? `<span class="ny-old-price">₵${formatPrice(oldPrice)}</span>` : ''}
                    </div>

                    <div class="ny-progress-wrap">
                        <div class="ny-progress-text">
                            <span class="ny-sold-highlight">${simulatedSold} Sold</span>
                            <span class="ny-stock-count">${stock} Left</span>
                        </div>
                        <div class="ny-track">
                            <div class="ny-fill" style="width: ${progress}%; ${progressColor ? 'background:'+progressColor : ''}"></div>
                        </div>
                    </div>

                    <button class="ny-btn-add" data-product-id="${product.slug}">
                        <i class="icon-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
            </div>
        `;
     }

     /* =========================================
        4. MAIN LOAD FUNCTION
        ========================================= */
     async function loadNewYearProducts() {
          injectNewYearStyles();

          const container = document.getElementById('newyear-products');
          if (!container) return;

          // Prevent global sorts from breaking this section
          container.setAttribute('data-sorted', 'true');
          
          // Use Bootstrap Grid Row
          container.classList.add('row');
          // Center content if few items
          container.classList.add('justify-content-center');

          try {
               // Fetch from new-year.json (server handles caching via ETag/Cache-Control)
               let response = await fetch('/new-year.json');
               if (!response.ok) throw new Error('Failed to load products');

               let data = await response.json();
               console.log('New Year data loaded:', data);
               console.log('New Year products count:', (data && data.newYear) ? data.newYear.length : 0);
               let products = (data && data.newYear) ? data.newYear : [];

              // If no new year products, try fallback to christmas-sale.json
              if (products.length === 0) {
                  console.log('No New Year products, trying fallback to christmas-sale.json');
                  try {
                      response = await fetch('christmas-sale.json');
                      if (!response.ok) throw new Error('Failed to load fallback products');
                      data = await response.json();
                      products = (data && data.christmasSale) ? data.christmasSale : [];
                  } catch (fallbackError) {
                      console.warn('Fallback to christmas-sale.json failed:', fallbackError);
                  }
              }

              const activeProducts = products.filter(p => p && p.active !== false);

               // Sort by price (Lowest first) or Discount (Highest first)
               activeProducts.sort((a, b) => {
                   const priceA = parseFloat(a.newYearPrice || a.price) || 0;
                   const priceB = parseFloat(b.newYearPrice || b.price) || 0;
                   return priceA - priceB;
               });

              if (activeProducts.length === 0) {
                  container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 40px; color: #64748B;">New Year deals are being updated. Check back soon!</p>';
                  return;
              }

              const limit = parseInt(container.dataset.limit || '8', 10);
              const displayProducts = activeProducts.slice(0, limit);

              console.log('Displaying', displayProducts.length, 'products');

               const html = displayProducts.map(product => {
                   const stock = Number(product.newYearStock || 0);
                   const actualSold = getSimulatedSold(product);
                   console.log('Product:', product.name, 'Stock:', stock, 'Sold:', actualSold); // Debug
                   return generateNewYearCard(product, actualSold, stock);
               }).join('');

              container.innerHTML = html;

              // Bind Cart Events
              if (!container.dataset.cartBound) {
                  container.addEventListener('click', function(e) {
                      const btn = e.target.closest('.ny-btn-add');
                      if (!btn) return;

                      const productId = btn.getAttribute('data-product-id');
                      if (!productId) return;

                      if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                          window.CartManager.addToCart(productId, 1, { theme: 'newyear' });

                          // Button feedback
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
              console.error('Error loading New Year products:', error);
              container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 40px;">Unable to load deals.</p>';
          }
     }

     // Init
     if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', loadNewYearProducts);
     } else {
         loadNewYearProducts();
     }
 })();
