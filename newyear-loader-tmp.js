    /* =========================================
        4. MAIN LOAD FUNCTION
        ========================================= */
      async function loadNewYearProducts() {
          injectNewYearStyles();

          const container = document.getElementById('newyear-products');
          if (!container) return;

          // Prevent global sorts from breaking this section
          container.setAttribute('data-sorted', 'true');

          try {
              // Fetch from newyear.json first
              let response = await fetch('newyear.json');
              if (!response.ok) throw new Error('Failed to load products');

              let data = await response.json();
              let products = (data && data.newYearSale) ? data.newYearSale : [];

              // If no new year products, try fallback to christmas-sale.json
              if (products.length === 0) {
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
                  const priceA = parseFloat(a.newYearSalePrice || a.christmasSalePrice || a.price) || 0;
                  const priceB = parseFloat(b.newYearSalePrice || b.christmasSalePrice || b.price) || 0;
                  return priceA - priceB;
              });

              if (activeProducts.length === 0) {
                  container.innerHTML = '<p class="text-center" style="grid-column: 1/-1; padding: 40px; color: #64748B;">New Year deals are being updated. Check back soon!</p>';
                  return;
              }

              const limit = parseInt(container.dataset.limit || '8', 10);
              const displayProducts = activeProducts.slice(0, limit);

              const html = displayProducts.map(product => {
                  const stock = Number(product.newYearSaleStock || product.christmasSaleStock || 0);
                  const actualSold = Number(product.newYearSaleSold || product.christmasSaleSold || 0);
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
