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

      function getSimulatedSold(product) {
          const stock = Number(product.independenceDayStock || 0);
          const baseSold = Number(product.independenceDaySold || 0);

         if (baseSold > 0) {
             const variance = Math.max(0, Math.floor(stock * 0.15));
             return clamp(baseSold + Math.floor(Math.random() * variance), 0, stock);
         }

         const minPercent = stock >= 5 ? 0.2 : 0.3;
         const maxPercent = stock >= 5 ? 0.6 : 0.7;
         const soldPercent = minPercent + (Math.random() * (maxPercent - minPercent));
         const simulatedSold = Math.floor(stock * soldPercent);

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
        2. INJECT INDEPENDENCE DAY CSS
        ========================================= */
     function injectIndependenceStyles() {
         if (document.getElementById('independence-dynamic-css')) return;

         const style = document.createElement('style');
         style.id = 'independence-dynamic-css';
         style.textContent = `
             /* --- SECTION LAYOUT --- */
             .independence-section {
                 background: linear-gradient(135deg, #CF0921 0%, #FCD211 50%, #016B3D 100%);
                 padding: 3rem 0 4rem;
                 position: relative;
                 overflow: hidden;
                 border-top: 2px solid #FCD211;
             }

             .independence-section .container {
                 position: relative;
                 z-index: 2;
             }

             /* --- BACKGROUND EFFECTS --- */
             .id-watermark {
                 position: absolute;
                 top: 50%;
                 left: 50%;
                 transform: translate(-50%, -50%);
                 font-size: 30vw;
                 font-weight: 900;
                 color: rgba(252, 210, 17, 0.05);
                 z-index: 0;
                 pointer-events: none;
                 line-height: 1;
                 font-family: 'Poppins', sans-serif;
             }

             .id-particles .particle {
                 position: absolute;
                 bottom: -20px;
                 background: linear-gradient(135deg, rgba(207, 9, 33, 0.3), rgba(252, 210, 17, 0.3));
                 border-radius: 50%;
                 animation: floatUp linear infinite;
                 z-index: 0;
                 pointer-events: none;
             }
             .id-particles .p1 { width: 40px; height: 40px; left: 10%; animation-duration: 8s; }
             .id-particles .p2 { width: 20px; height: 20px; left: 30%; animation-duration: 12s; animation-delay: 2s; }
             .id-particles .p3 { width: 60px; height: 60px; left: 50%; animation-duration: 10s; animation-delay: 1s; }
             .id-particles .p4 { width: 30px; height: 30px; left: 70%; animation-duration: 14s; }
             .id-particles .p5 { width: 50px; height: 50px; left: 90%; animation-duration: 9s; animation-delay: 3s; }

             @keyframes floatUp {
                 0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                 20% { opacity: 0.6; }
                 80% { opacity: 0.6; }
                 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
             }

             /* --- HEADERS --- */
             .section-heading-wrapper { text-align: left; }
             .independence-section .sub-heading {
                  display: block;
                  font-family: 'Open Sans', sans-serif;
                  color: #FCD211;
                  font-size: 0.9rem;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  font-weight: 700;
                  margin-bottom: 5px;
                  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
             }
             .section-title {
                 font-family: 'Poppins', sans-serif;
                 font-size: 2.8rem;
                 font-weight: 800;
                 color: #fff;
                 margin: 0;
                 line-height: 1.2;
                 text-shadow: 2px 2px 5px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3);
             }
             .independence-section .section-title .highlight {
                  color: #FCD211;
                  position: relative;
                  display: inline-block;
                  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
             }

             /* --- GRID LAYOUT --- */
             .independence-section .horizontal-scroll-container {
                 position: relative;
                 overflow: hidden;
                 padding: 0 40px 0 0;
             }

             .independence-section .scroll-content {
                 display: flex;
                 overflow-x: auto;
                 scroll-behavior: smooth;
                 scrollbar-width: none;
                 -ms-overflow-style: none;
                 gap: 20px;
                 padding: 10px 0;
             }

             .independence-section .scroll-content::-webkit-scrollbar {
                 display: none;
             }

             /* --- SCROLL BUTTONS --- */
             .id-scroll-btn {
                 position: absolute;
                 top: 50%;
                 transform: translateY(-50%);
                 background: white;
                 border: 2px solid #FCD211;
                 border-radius: 50%;
                 width: 45px;
                 height: 45px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 cursor: pointer;
                 z-index: 10;
                 box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                 transition: all 0.3s ease;
                 color: #000;
                 font-size: 1.2rem;
             }

             .id-scroll-btn:hover {
                 background: #FCD211;
                 border-color: #FCD211;
                 transform: translateY(-50%) scale(1.1);
                 color: #fff;
             }

             .id-scroll-prev {
                 left: 5px;
             }

             .id-scroll-next {
                 right: 5px;
             }

             .id-nav-btn {
                 position: absolute;
                 top: 50%;
                 transform: translateY(-50%);
                 background: white;
                 border: 2px solid #FCD211;
                 border-radius: 50%;
                 width: 45px;
                 height: 45px;
                 display: none;
                 align-items: center;
                 justify-content: center;
                 cursor: pointer;
                 z-index: 10;
                 box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                 transition: all 0.3s ease;
                 color: #000;
                 font-size: 1.2rem;
             }

             .id-nav-btn:hover {
                 background: #FCD211;
                 border-color: #FCD211;
                 transform: translateY(-50%) scale(1.1);
                 color: #fff;
             }

             .id-nav-prev {
                 left: 5px;
             }

             .id-nav-next {
                 right: 5px;
             }

             @media (max-width: 768px) {
                 .independence-section .horizontal-scroll-container {
                     padding: 0 35px 0 0;
                 }
                 .id-scroll-btn {
                     width: 35px;
                     height: 35px;
                     font-size: 1rem;
                 }
             }

             /* --- VIEW ALL BUTTON --- */
             .btn-independence-pill {
                 display: inline-block;
                 background: linear-gradient(135deg, #CF0921, #b1081c);
                 color: #fff;
                 padding: 12px 28px;
                 border-radius: 50px;
                 font-weight: 700;
                 text-transform: uppercase;
                 letter-spacing: 1px;
                 font-size: 0.85rem;
                 transition: all 0.3s ease;
                 border: 2px solid transparent;
                 box-shadow: 0 4px 15px rgba(207, 9, 33, 0.3);
             }

             .btn-independence-pill:hover {
                 background: linear-gradient(135deg, #016B3D, #004d2c);
                 border-color: #FCD211;
                 box-shadow: 0 8px 25px rgba(1, 107, 61, 0.3);
                 transform: translateY(-2px);
             }

             /* --- SCROLLING WRAPPER --- */
             .id-scroll-wrapper {
                 position: relative;
                 width: 100%;
                 margin-top: 30px;
             }

             .id-scroll-content {
                 display: flex;
                 overflow-x: auto;
                 overflow-y: hidden;
                 gap: 20px;
                 padding: 20px 0;
                 scrollbar-width: none;
                 -ms-overflow-style: none;
                 scroll-behavior: smooth;
                 -webkit-overflow-scrolling: touch;
             }
             .id-scroll-content::-webkit-scrollbar { display: none; }

             /* --- NAVIGATION BUTTONS --- */
             .id-nav-btn {
                 position: absolute;
                 top: 50%;
                 transform: translateY(-50%);
                 width: 45px;
                 height: 45px;
                 border-radius: 50%;
                 background: #fff;
                 border: 2px solid #FCD211;
                 color: #000;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 z-index: 20;
                 cursor: pointer;
                 box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                 transition: all 0.3s ease;
             }
             .id-nav-btn:hover {
                 background: #FCD211;
                 transform: translateY(-50%) scale(1.1);
             }
             .id-nav-prev { left: -22px; }
             .id-nav-next { right: -22px; }
             
             @media (max-width: 768px) {
                 .id-nav-btn { display: none; }
             }

             /* --- PRODUCT CARD --- */
             #independence-products .id-card {
                 background: rgba(255, 255, 255, 0.08);
                 backdrop-filter: blur(15px);
                 border-radius: 24px;
                 position: relative;
                 display: flex;
                 flex-direction: column;
                 transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                 border: 1px solid rgba(252, 210, 17, 0.3);
                 overflow: hidden;
                 box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                 flex: 0 0 auto;
                 width: 280px;
                 height: 480px;
                 color: #fff;
             }

             #independence-products .id-card:hover {
                 transform: translateY(-10px) scale(1.02);
                 box-shadow: 0 20px 40px -5px rgba(207, 9, 33, 0.3);
                 border-color: #FCD211;
                 z-index: 10;
             }

             @media (max-width: 768px) {
                 #independence-products .id-card {
                     width: 250px;
                     height: 450px;
                 }
             }

             @media (max-width: 480px) {
                 #independence-products .id-card {
                     width: 220px;
                     height: 420px;
                 }
             }

             /* --- BADGES --- */
             .id-badge {
                 position: absolute;
                 top: 15px;
                 right: 15px;
                 background: #CF0921;
                 color: #fff;
                 font-size: 0.75rem;
                 font-weight: 800;
                 padding: 5px 12px;
                 border-radius: 8px;
                 z-index: 5;
                 box-shadow: 0 4px 12px rgba(207, 9, 33, 0.3);
                 border: 1px solid rgba(255,255,255,0.3);
                 letter-spacing: 0.5px;
             }

             .id-live-badge {
                 position: absolute;
                 top: 15px;
                 left: 15px;
                 background: #016B3D;
                 color: #FCD211;
                 font-size: 0.7rem;
                 font-weight: 800;
                 padding: 5px 12px;
                 border-radius: 50px;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 z-index: 5;
                 display: flex;
                 align-items: center;
                 gap: 5px;
                 animation: id-glow 2s infinite alternate;
                 border: 1px solid #FCD211;
             }

             @keyframes id-glow {
                 from { box-shadow: 0 0 5px #FCD211; }
                 to { box-shadow: 0 0 15px #FCD211; }
             }

             .id-img-wrapper {
                 position: relative;
                 width: 100%;
                 height: 200px;
                 overflow: hidden;
                 background: linear-gradient(180deg, #FFFFFF 0%, #FFF5E6 100%);
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 border-radius: 24px 24px 0 0;
             }

             .id-img-wrapper img {
                 max-width: 100%;
                 max-height: 100%;
                 object-fit: contain;
                 transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
                 padding: 15px;
                 filter: drop-shadow(0 5px 15px rgba(0,0,0,0.05));
             }

             #independence-products .id-card:hover .id-img-wrapper img {
                 transform: scale(1.08);
             }

             .id-content {
                 padding: 15px 20px 20px;
                 display: flex;
                 flex-direction: column;
                 flex-grow: 1;
                 background: #fff;
                 border-radius: 0 0 24px 24px;
             }

             .id-content .id-btn-add {
                 margin-top: auto;
             }

             .id-title {
                 font-family: 'Poppins', sans-serif;
                 font-size: 0.95rem;
                 font-weight: 600;
                 color: #1e293b;
                 margin: 0 0 8px;
                 line-height: 1.4;
                 display: -webkit-box;
                 -webkit-line-clamp: 2;
                 -webkit-box-orient: vertical;
                 overflow: hidden;
                 height: 40px;
             }

             .id-title a {
                 color: inherit;
                 text-decoration: none;
                 transition: color 0.3s;
             }

             .id-title a:hover {
                 color: #CF0921;
             }

             .id-price-group {
                 display: flex;
                 align-items: baseline;
                 gap: 10px;
                 margin-bottom: 15px;
             }

             .id-price {
                 font-family: 'Poppins', sans-serif;
                 font-size: 1.5rem;
                 font-weight: 800;
                 color: #CF0921;
             }

             .id-old-price {
                 font-size: 0.9rem;
                 color: #94a3b8;
                 text-decoration: line-through;
                 font-weight: 500;
             }

             .id-progress-wrap {
                 margin-bottom: 15px;
             }

             .id-progress-text {
                 display: flex;
                 justify-content: space-between;
                 font-size: 0.75rem;
                 color: #1e293b;
                 font-weight: 600;
                 margin-bottom: 8px;
             }

             .id-sold-highlight {
                 color: #CF0921;
                 font-weight: 700;
             }

             .id-stock-count {
                 color: #64748b;
                 font-weight: 600;
             }

             .id-track {
                 width: 100%;
                 height: 8px;
                 background: #e2e8f0;
                 border-radius: 10px;
                 overflow: hidden;
             }

             .id-fill {
                 height: 100%;
                 background: linear-gradient(90deg, #CF0921 0%, #FCD211 50%, #016B3D 100%);
                 border-radius: 10px;
                 transition: width 1s ease-out;
             }

             .id-btn-add {
                 width: 100%;
                 background: #CF0921;
                 color: #fff;
                 font-family: 'Poppins', sans-serif;
                 font-weight: 700;
                 font-size: 0.85rem;
                 padding: 14px;
                 border: none;
                 border-radius: 12px;
                 cursor: pointer;
                 transition: all 0.3s ease;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 box-shadow: 0 4px 12px rgba(207, 9, 33, 0.3);
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 gap: 8px;
             }

             .id-btn-add:hover {
                 background: #016B3D;
                 transform: translateY(-2px);
                 box-shadow: 0 8px 20px rgba(1, 107, 61, 0.3);
             }

             /* --- RESPONSIVE --- */
             @media (max-width: 992px) {
                 .independence-section {
                     padding: 2.5rem 0 3rem;
                 }
                 .section-title {
                     font-size: 2rem;
                 }
                 #independence-products .id-card {
                     width: 250px;
                     height: 450px;
                 }
                 .id-img-wrapper {
                     height: 180px;
                 }
             }

             @media (max-width: 768px) {
                 .independence-section {
                     padding: 2.5rem 0 3rem;
                 }
                 .section-title {
                     font-size: 2rem;
                 }
                 #independence-products .id-card {
                     width: 220px;
                     height: 420px;
                 }
                 .id-img-wrapper {
                     height: 160px;
                 }
                 .id-scroll-btn,
                 .id-nav-btn {
                     width: 35px;
                     height: 35px;
                     font-size: 1rem;
                 }
                 .btn-independence-pill {
                     padding: 10px 20px;
                     font-size: 0.75rem;
                 }
             }

             @media (max-width: 480px) {
                 .section-title {
                     font-size: 1.6rem;
                 }
                 #independence-products .id-card {
                     width: 200px;
                     height: 400px;
                 }
                 .id-content {
                     padding: 12px 15px 15px;
                 }
                 .id-title {
                     font-size: 0.9rem;
                     height: 38px;
                 }
                 .id-price {
                     font-size: 1.2rem;
                 }
             }

             @media (max-width: 360px) {
                 .section-title {
                     font-size: 1.4rem;
                 }
                 #independence-products .id-card {
                     width: 180px;
                     height: 380px;
                 }
                 .id-img-wrapper {
                     height: 140px;
                 }
             }
         `;
         document.head.appendChild(style);
     }

     /* =========================================
        3. GENERATE HTML CARD
        ========================================= */
      function generateIndependenceCard(product, simulatedSold, stock) {
         const price = parseFloat(product.price) || 0;
         const salePrice = parseFloat(product.independenceDayPrice || price);

        let oldPrice;
        if (salePrice && salePrice === price) {
            oldPrice = price * (1.2 + Math.random() * 0.1); 
        } else if (salePrice && salePrice < price) {
            oldPrice = price;
        } else {
            oldPrice = price;
        }

        const discount = oldPrice > 0 && salePrice > 0 ? Math.round(((oldPrice - salePrice) / oldPrice) * 100) : 0;

        const image = (product.independenceDayImage && product.independenceDayImage !== '')
            ? product.independenceDayImage
            : (Array.isArray(product.images) && product.images[0])
                ? product.images[0]
                : 'assets/images/placeholder.webp';
        const progress = calculateProgress(simulatedSold, stock);

        return `
            <div class="id-card" data-product-id="${product.slug}">
                <div class="id-live-badge">
                    ★ <span>6TH MARCH</span>
                </div>
                <div class="id-badge">-${discount}% GHANA @ 69</div>
                <figure class="id-img-wrapper">
                    <a href="product.html?id=${product.slug}">
                        <img src="${image}" alt="${product.name}" loading="lazy">
                    </a>
                </figure>

                <div class="id-content">
                    <h3 class="id-title">
                        <a href="product.html?id=${product.slug}">${product.name}</a>
                    </h3>

                    <div class="id-price-group">
                        <span class="id-price">₵${formatPrice(salePrice)}</span>
                        ${discount > 0 ? `<span class="id-old-price">₵${formatPrice(oldPrice)}</span>` : ''}
                    </div>

                    <div class="id-progress-wrap">
                        <div class="id-progress-text">
                            <span class="id-sold-highlight">${simulatedSold} Sold</span>
                            <span class="id-stock-count">${stock} Left</span>
                        </div>
                        <div class="id-track">
                            <div class="id-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>

                    <button class="id-btn-add" data-product-id="${product.slug}">
                        <i class="icon-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
     }

     /* =========================================
        4. MAIN LOAD FUNCTION
        ========================================= */
     async function loadIndependenceProducts() {
          injectIndependenceStyles();

          const container = document.getElementById('independence-products');
          if (!container) return;

          container.setAttribute('data-sorted', 'true');
          
          try {
               let response = await fetch('/independence-day.json');
               if (!response.ok) {
                   response = await fetch('independence-day.json');
                   if (!response.ok) throw new Error('Failed to load independence-day.json');
               }

               let data = await response.json();
               let products = (data && data.independenceDay) ? data.independenceDay : [];

              const activeProducts = products.filter(p => p && p.active !== false);

               activeProducts.sort((a, b) => {
                   const priceA = parseFloat(a.independenceDayPrice || a.price) || 0;
                   const priceB = parseFloat(b.independenceDayPrice || b.price) || 0;
                   return priceA - priceB;
               });

              if (activeProducts.length === 0) {
                  container.innerHTML = '<p class="text-center" style="padding: 40px; color: #FCD211;">No Independence Day deals available. Please check back later.</p>';
                  return;
              }

              const limit = parseInt(container.dataset.limit || '10', 10);
              const displayProducts = activeProducts.slice(0, limit);

               const html = displayProducts.map(product => {
                   const stock = Number(product.independenceDayStock || product.stock || 10);
                   const actualSold = getSimulatedSold(product);
                   return generateIndependenceCard(product, actualSold, stock);
               }).join('');

              container.classList.add('horizontal-scroll-container');
              container.innerHTML = `
                <div class="scroll-content">${html}</div>
                <button class="id-scroll-btn id-scroll-prev" aria-label="Previous">
                    <i class="icon-left-open-big"></i>
                </button>
                <button class="id-scroll-btn id-scroll-next" aria-label="Next">
                    <i class="icon-right-open-big"></i>
                </button>`;

              const scrollContent = container.querySelector('.scroll-content');
              const prevBtn = container.querySelector('.id-scroll-prev');
              const nextBtn = container.querySelector('.id-scroll-next');
              const scrollAmount = 300; 
              
              prevBtn.addEventListener('click', () => {
                  scrollContent.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
              });
              
              nextBtn.addEventListener('click', () => {
                  scrollContent.scrollBy({ left: scrollAmount, behavior: 'smooth' });
              });
              
              function updateButtons() {
                  const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
                  prevBtn.style.display = scrollContent.scrollLeft > 0 ? 'flex' : 'none';
                  nextBtn.style.display = scrollContent.scrollLeft < maxScroll ? 'flex' : 'none';
              }
              
              scrollContent.addEventListener('scroll', updateButtons);
              updateButtons();

              if (!container.dataset.cartBound) {
                  container.addEventListener('click', function(e) {
                      const btn = e.target.closest('.id-btn-add');
                      if (!btn) return;
                      const productId = btn.getAttribute('data-product-id');
                      if (!productId) return;
                      if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                          window.CartManager.addToCart(productId, 1, { theme: 'independence' });
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
              console.error('Error loading Independence Day products:', error);
              container.innerHTML = '<p class="text-center" style="padding: 40px; color: #FCD211;">Error loading Independence Day deals. Please try again later.</p>';
          }
     }

     if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', loadIndependenceProducts);
     } else {
         loadIndependenceProducts();
     }
 })();
