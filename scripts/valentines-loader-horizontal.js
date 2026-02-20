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
          const stock = Number(product.valentinesStock || 0);
          const baseSold = Number(product.valentinesSold || 0);

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
        2. INJECT VALENTINE'S DAY CSS
        ========================================= */
     function injectValentinesStyles() {
         if (document.getElementById('valentines-dynamic-css')) return;

         const style = document.createElement('style');
         style.id = 'valentines-dynamic-css';
         style.textContent = `
             /* --- SECTION LAYOUT --- */
             .valentines-section {
                 background: linear-gradient(180deg, #FFF5F7 0%, #FFE4E9 100%);
                 padding: 4rem 0 5rem;
                 position: relative;
                 overflow: hidden;
                 border-top: 1px solid #FFC0CB;
             }

             /* --- BACKGROUND EFFECTS --- */
             .vd-watermark {
                 position: absolute;
                 top: 50%;
                 left: 50%;
                 transform: translate(-50%, -50%);
                 font-size: 30vw;
                 font-weight: 900;
                 color: rgba(236, 72, 153, 0.03); /* Faint Pink */
                 z-index: 0;
                 pointer-events: none;
                 line-height: 1;
                 font-family: 'Poppins', sans-serif;
             }

             .vd-particles .particle {
                 position: absolute;
                 bottom: -20px;
                 background: linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(251, 207, 232, 0.4));
                 border-radius: 50%;
                 animation: floatUp linear infinite;
                 z-index: 1;
             }
             .vd-particles .p1 { width: 40px; height: 40px; left: 10%; animation-duration: 8s; }
             .vd-particles .p2 { width: 20px; height: 20px; left: 30%; animation-duration: 12s; animation-delay: 2s; }
             .vd-particles .p3 { width: 60px; height: 60px; left: 50%; animation-duration: 10s; animation-delay: 1s; }
             .vd-particles .p4 { width: 30px; height: 30px; left: 70%; animation-duration: 14s; }
             .vd-particles .p5 { width: 50px; height: 50px; left: 90%; animation-duration: 9s; animation-delay: 3s; }

             @keyframes floatUp {
                 0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                 20% { opacity: 0.6; }
                 80% { opacity: 0.6; }
                 100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
             }

             /* --- HEADERS --- */
             .section-heading-wrapper { text-align: left; }
              .valentines-section .sub-heading {
                  display: block;
                  font-family: 'Open Sans', sans-serif;
                  color: #BE185D;
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
                 color: #831843;
                 margin: 0;
                 line-height: 1.2;
             }
              .valentines-section .section-title .highlight {
                  color: #EC4899; /* Hot Pink */
                  position: relative;
                  display: inline-block;
              }

             /* --- BUTTONS --- */
             .btn-valentines-pill {
                 background: #fff;
                 color: #EC4899;
                 border: 2px solid #EC4899;
                 padding: 12px 30px;
                 border-radius: 50px;
                 font-weight: 700;
                 text-transform: uppercase;
                 font-size: 0.85rem;
                 letter-spacing: 1px;
                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                 box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15);
             }
             .btn-valentines-pill:hover {
                 background: #EC4899;
                 color: #fff;
                 transform: translateY(-2px);
                 box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
                 text-decoration: none;
             }

             /* --- HORIZONTAL SCROLLING CONTAINER --- */
             .horizontal-scroll-container {
                 position: relative;
                 overflow: hidden;
                 padding: 0 40px 0 0;
             }

             .scroll-wrapper {
                 position: relative;
                 overflow: hidden;
             }

             .scroll-content {
                 display: flex;
                 overflow-x: auto;
                 scroll-behavior: smooth;
                 scrollbar-width: none; /* Firefox */
                 -ms-overflow-style: none; /* IE/Edge */
                 gap: 20px;
                 padding: 10px 0;
                 /* Hide scrollbar for Chrome/Safari */
             }
             
             .scroll-content::-webkit-scrollbar {
                 display: none;
             }

             /* --- PRODUCT CARD (AESTHETIC) --- */
             #valentines-products .vd-card {
                 background: #FFFFFF;
                 border-radius: 20px;
                 position: relative;
                 display: flex;
                 flex-direction: column;
                 transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                 border: 1px solid rgba(251, 207, 232, 0.8);
                 overflow: hidden;
                 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                 flex: 0 0 auto; /* Don't grow or shrink, maintain original size */
                 width: 280px; /* Fixed width for horizontal scrolling */
                 height: 450px;
             }

             #valentines-products .vd-card:hover {
                 transform: translateY(-12px);
                 box-shadow: 0 20px 40px -5px rgba(236, 72, 153, 0.15); /* Pink glow shadow */
                 border-color: #FBCFE8;
                 z-index: 10;
             }

             /* --- BADGE --- */
             .vd-badge {
                 position: absolute;
                 top: 15px;
                 left: 15px;
                 background: #FFF1F2;
                 color: #BE185D;
                 font-size: 0.85rem;
                 font-weight: 800;
                 padding: 7px 15px;
                 border-radius: 8px;
                 z-index: 5;
                 border: 1px solid #FBCFE8;
                 box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);
             }

             /* --- LIVE BADGE (Animated Heart) --- */
             .vd-live-badge {
                 position: absolute;
                 top: 15px;
                 right: 15px;
                 background: #EC4899;
                 color: #fff;
                 font-size: 0.65rem;
                 font-weight: 800;
                 padding: 5px 10px;
                 border-radius: 50px;
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 z-index: 5;
                 animation: heartbeat 1.5s infinite;
             }

             @keyframes heartbeat {
                 0%, 100% { transform: scale(1); }
                 10%, 30% { transform: scale(1.1); }
                 20% { transform: scale(0.9); }
             }

             /* --- IMAGE WRAPPER --- */
             .vd-img-wrapper {
                 position: relative;
                 width: 100%;
                 height: 200px;
                 overflow: hidden;
                 border-radius: 18px 18px 0 0;
                 background: linear-gradient(135deg, #FFF1F2 0%, #FCE7F3 100%);
                 display: flex;
                 align-items: center;
                 justify-content: center;
             }

             .vd-img-wrapper img {
                 max-width: 100%;
                 max-height: 100%;
                 object-fit: contain;
                 transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
                 padding: 15px;
             }

             #valentines-products .vd-card:hover .vd-img-wrapper img {
                 transform: scale(1.08);
             }

             /* --- CONTENT AREA --- */
             .vd-content {
                 padding: 20px;
                 display: flex;
                 flex-direction: column;
                 flex-grow: 1;
             }

             /* --- PRODUCT TITLE --- */
             .vd-title {
                 font-family: 'Poppins', sans-serif;
                 font-size: 1.05rem;
                 font-weight: 600;
                 color: #1F2937;
                 margin: 0 0 12px;
                 min-height: 52px;
                 line-height: 1.4;
                 overflow: hidden;
                 text-overflow: ellipsis;
                 display: -webkit-box;
                 -webkit-line-clamp: 2;
                 -webkit-box-orient: vertical;
             }

             .vd-title a {
                 color: inherit;
                 text-decoration: none;
                 transition: color 0.3s;
             }

             .vd-title a:hover {
                 color: #EC4899;
             }

             /* --- PRICE GROUP --- */
             .vd-price-group {
                 display: flex;
                 align-items: center;
                 gap: 12px;
                 margin-bottom: 15px;
             }

             .vd-price {
                 font-family: 'Poppins', sans-serif;
                 font-size: 1.5rem;
                 font-weight: 800;
                 color: #EC4899; /* Hot Pink */
             }

             .vd-old-price {
                 font-size: 1rem;
                 color: #9CA3AF;
                 text-decoration: line-through;
                 font-weight: 500;
             }

             /* --- PROGRESS BAR --- */
             .vd-progress-wrap {
                 margin-bottom: 15px;
             }

             .vd-progress-text {
                 display: flex;
                 justify-content: space-between;
                 font-size: 0.9rem;
                 margin-bottom: 8px;
             }

             .vd-sold-highlight {
                 color: #EC4899;
                 font-weight: 700;
             }

             .vd-stock-count {
                 color: #6B7280;
                 font-weight: 600;
             }

             .vd-track {
                 width: 100%;
                 height: 10px;
                 background: #FFF1F2;
                 border-radius: 50px;
                 overflow: hidden;
                 box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
             }

             .vd-fill {
                 height: 100%;
                 background: linear-gradient(90deg, #EC4899 0%, #F472B6 100%);
                 border-radius: 50px;
                 transition: width 1s ease;
                 box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);
             }

             /* --- ADD TO CART BUTTON --- */
             .vd-btn-add {
                 width: 100%;
                 background: #EC4899;
                 color: #fff;
                 font-family: 'Poppins', sans-serif;
                 font-weight: 700;
                 font-size: 0.95rem;
                 padding: 14px;
                 border: none;
                 border-radius: 12px;
                 cursor: pointer;
                 transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                 text-transform: uppercase;
                 letter-spacing: 0.5px;
                 box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
             }

             .vd-btn-add:hover {
                 background: #BE185D;
                 transform: translateY(-2px);
                 box-shadow: 0 8px 20px rgba(236, 72, 153, 0.3);
             }

             .vd-btn-add:active {
                 transform: translateY(0);
             }

             /* --- SCROLL BUTTONS --- */
             .scroll-btn {
                 position: absolute;
                 top: 50%;
                 transform: translateY(-50%);
                 background: white;
                 border: 1px solid #FBCFE8;
                 border-radius: 50%;
                 width: 40px;
                 height: 40px;
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 cursor: pointer;
                 z-index: 10;
                 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                 transition: all 0.3s ease;
             }

             .scroll-btn:hover {
                 background: #EC4899;
                 color: white;
                 border-color: #EC4899;
             }

             .scroll-prev {
                 left: 10px;
             }

             .scroll-next {
                 right: 10px;
             }

             /* --- RESPONSIVE --- */
             @media (max-width: 992px) {
                 .vd-img-wrapper { height: 180px; }
                 .section-title { font-size: 2rem; }
                 .valentines-section { padding: 2.5rem 0 3rem; }
                 #valentines-products .vd-card { width: 250px; height: 420px; }
             }

             @media (max-width: 768px) {
                 .vd-img-wrapper { height: 120px; }
                 .section-title { font-size: 1.6rem; }
                 .vd-title { font-size: 0.9rem; min-height: 42px; }
                 .vd-price { font-size: 1.2rem; }
                 .vd-old-price { font-size: 0.85rem; }
                 .vd-progress-text { font-size: 0.8rem; }
                 .vd-live-badge { top: 8px; right: 8px; padding: 3px 6px; font-size: 0.55rem; }
                 .vd-badge { top: 8px; left: 8px; font-size: 0.65rem; padding: 4px 10px; }
                 .valentines-section { padding: 2rem 0 2.5rem; }
                 .section-heading-wrapper { text-align: center; }
                 .valentines-section .sub-heading { font-size: 0.8rem; }
                 .btn-valentines-pill { padding: 10px 20px; font-size: 0.75rem; }
                 #valentines-products .vd-card { width: 220px; height: 400px; }
             }
             @media (max-width: 480px) {
                 .vd-img-wrapper { height: 100px; }
                 .section-title { font-size: 1.4rem; }
                 .vd-title { font-size: 0.85rem; min-height: 40px; }
                 .vd-price { font-size: 1.1rem; }
                 .vd-old-price { font-size: 0.8rem; }
                 .vd-progress-text { font-size: 0.75rem; }
                 .valentines-section { padding: 1.5rem 0 2rem; }
                 #valentines-products .vd-card { width: 200px; height: 380px; }
             }
             @media (max-width: 360px) {
                 .vd-img-wrapper { height: 90px; }
                 .section-title { font-size: 1.2rem; }
                 .vd-title { font-size: 0.8rem; min-height: 38px; }
                 .vd-price { font-size: 1rem; }
                 .valentines-section { padding: 1rem 0 1.5rem; }
                 #valentines-products .vd-card { width: 180px; height: 360px; }
             }
         `;
         document.head.appendChild(style);
     }

     /* =========================================
        3. GENERATE HTML CARD
        ========================================= */
      function generateValentinesCard(product, simulatedSold, stock) {
         const price = parseFloat(product.price) || 0;
         const salePrice = parseFloat(product.valentinesPrice || price);

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

        const image = (product.valentinesImage && product.valentinesImage !== '')
            ? product.valentinesImage
            : (Array.isArray(product.images) && product.images[0])
                ? product.images[0]
                : 'assets/images/placeholder.webp';
        const progress = calculateProgress(simulatedSold, stock);

        // Dynamic "Low Stock" warning for progress bar color
        const progressColor = progress > 80 ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' : '';

        return `
            <div class="vd-card" data-product-id="${product.slug}">
                <div class="vd-live-badge">
                    <span>❤️ LIVE</span>
                </div>
                <div class="vd-badge">-${discount}% Love Deal</div>

                <figure class="vd-img-wrapper">
                    <a href="product.html?id=${product.slug}">
                        <img src="${image}" alt="${product.name}" loading="lazy">
                    </a>
                </figure>

                <div class="vd-content">
                    <h3 class="vd-title">
                        <a href="product.html?id=${product.slug}">${product.name}</a>
                    </h3>

                    <div class="vd-price-group">
                        <span class="vd-price">₵${formatPrice(salePrice)}</span>
                        ${discount > 0 ? `<span class="vd-old-price">₵${formatPrice(oldPrice)}</span>` : ''}
                    </div>

                    <div class="vd-progress-wrap">
                        <div class="vd-progress-text">
                            <span class="vd-sold-highlight">${simulatedSold} Sold</span>
                            <span class="vd-stock-count">${stock} Left</span>
                        </div>
                        <div class="vd-track">
                            <div class="vd-fill" style="width: ${progress}%; ${progressColor ? 'background:'+progressColor : ''}"></div>
                        </div>
                    </div>

                    <button class="vd-btn-add" data-product-id="${product.slug}">
                        <i class="icon-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
     }

     /* =========================================
        4. MAIN LOAD FUNCTION
        ========================================= */
     async function loadValentinesProducts() {
          injectValentinesStyles();

          const container = document.getElementById('valentines-products');
          if (!container) return;

          // Prevent global sorts from breaking this section
          container.setAttribute('data-sorted', 'true');

          // Wrap content in horizontal scroll container
          container.classList.add('horizontal-scroll-container');
          
          try {
               // Fetch from valentines.json
               let response = await fetch('/valentines.json');
               if (!response.ok) {
                   console.warn('valentines.json not found or not accessible, trying valentines.json in root');
                   // Try alternative path
                   response = await fetch('valentines.json');
                   if (!response.ok) throw new Error('Failed to load valentines.json');
               }

               let data = await response.json();
               console.log('Valentine\'s data loaded:', data);
               console.log('Valentine\'s products count:', (data && data.valentines) ? data.valentines.length : 0);
               let products = (data && data.valentines) ? data.valentines : [];

              // If no valentines products, try fallback to new-year.json
              if (products.length === 0) {
                  console.log('No Valentine\'s products, trying fallback to new-year.json');
                  try {
                      response = await fetch('new-year.json');
                      if (!response.ok) throw new Error('Failed to load fallback products');
                      data = await response.json();
                      products = (data && data.newYear) ? data.newYear : [];
                  } catch (fallbackError) {
                      console.warn('Fallback to new-year.json failed:', fallbackError);
                  }
              }

              const activeProducts = products.filter(p => p && p.active !== false);

               // Sort by price (Lowest first) or Discount (Highest first)
               activeProducts.sort((a, b) => {
                   const priceA = parseFloat(a.valentinesPrice || a.price) || 0;
                   const priceB = parseFloat(b.valentinesPrice || b.price) || 0;
                   return priceA - priceB;
               });

              if (activeProducts.length === 0) {
                  container.innerHTML = '<p class="text-center" style="padding: 40px; color: #BE185D;">No Valentine\'s deals available. Please check back later or visit the admin panel to assign products to Valentine\'s Day sale.</p>';
                  return;
              }

              const limit = parseInt(container.dataset.limit || '10', 10); // Increased limit for horizontal scroll
              const displayProducts = activeProducts.slice(0, limit);

              console.log('Displaying', displayProducts.length, 'products');

               const html = displayProducts.map(product => {
                   const stock = Number(product.valentinesStock || 0);
                   const actualSold = getSimulatedSold(product);
                   console.log('Product:', product.name, 'Stock:', stock, 'Sold:', actualSold); // Debug
                   return generateValentinesCard(product, actualSold, stock);
               }).join('');

              // Set the HTML inside the scroll content
              container.innerHTML = `<div class="scroll-content">${html}</div>
                  <button class="scroll-btn scroll-prev" aria-label="Previous products">
                      <i class="icon-left-open-big"></i>
                  </button>
                  <button class="scroll-btn scroll-next" aria-label="Next products">
                      <i class="icon-right-open-big"></i>
                  </button>`;

              // Add scroll functionality
              const scrollContent = container.querySelector('.scroll-content');
              const prevBtn = container.querySelector('.scroll-prev');
              const nextBtn = container.querySelector('.scroll-next');
              
              const scrollAmount = 300; // Width of one product card + gap
              
              prevBtn.addEventListener('click', () => {
                  scrollContent.scrollBy({
                      left: -scrollAmount,
                      behavior: 'smooth'
                  });
              });
              
              nextBtn.addEventListener('click', () => {
                  scrollContent.scrollBy({
                      left: scrollAmount,
                      behavior: 'smooth'
                  });
              });
              
              // Update button visibility based on scroll position
              function updateButtons() {
                  const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
                  
                  prevBtn.style.display = scrollContent.scrollLeft > 0 ? 'flex' : 'none';
                  nextBtn.style.display = scrollContent.scrollLeft < maxScroll ? 'flex' : 'none';
              }
              
              scrollContent.addEventListener('scroll', updateButtons);
              updateButtons(); // Initial call

              // Bind Cart Events
              if (!container.dataset.cartBound) {
                  container.addEventListener('click', function(e) {
                      const btn = e.target.closest('.vd-btn-add');
                      if (!btn) return;

                      const productId = btn.getAttribute('data-product-id');
                      if (!productId) return;

                      if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                          window.CartManager.addToCart(productId, 1, { theme: 'valentines' });

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
              console.error('Error loading Valentine\'s products:', error);
              container.innerHTML = '<p class="text-center" style="padding: 40px; color: #BE185D;">Error loading Valentine\'s deals. Please try again later.</p>';
          }
     }

     // Init
     if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', loadValentinesProducts);
     } else {
         loadValentinesProducts();
     }
 })();