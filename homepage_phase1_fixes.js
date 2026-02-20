// Phase 1 fixes for IPMC KART homepage
// - Robust Top Selling products population with API + JSON fallback
// - Global price rounding formatter (GHS, no decimals)
// - Light helpers for rendering and cart integration

(function(){
  // Patch Intl.NumberFormat for GHS to always show 0 fraction digits globally
  try {
    const _OrigNumberFormat = Intl.NumberFormat;
    Intl.NumberFormat = function(locale, options){
      options = options || {};
      if (options && options.style === 'currency' && (options.currency === 'GHS' || options.currency === 'GHC')){
        options = Object.assign({}, options, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }
      return new _OrigNumberFormat(locale, options);
    };
    Intl.NumberFormat.prototype = _OrigNumberFormat.prototype;
  } catch(_e) {}

  'use strict';

  // Global price formatter: rounds to whole number and formats as GHS
  // Applies site-wide when used via window.formatPrice
  window.formatPrice = function(price){
    if (price == null || typeof price !== 'number') return 'GHS 0';
    try {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(price));
    } catch(e){
      // Fallback simple formatting
      return 'GHS ' + Math.round(Number(price) || 0).toString();
    }
  };

  // Graceful util to extract best price number from product object
  function getPrice(product){
    // Prefer numeric price
    if (typeof product.price === 'number') return product.price;
    // Try parse string price
    if (typeof product.price === 'string'){
      const n = Number(product.price.replace(/[^0-9.]/g,''));
      if (!Number.isNaN(n)) return n;
    }
    if (typeof product.finalPrice === 'number') return product.finalPrice;
    if (typeof product.salePrice === 'number') return product.salePrice;
    if (typeof product.regularPrice === 'number') return product.regularPrice;
    return 0;
  }

  function getImage(product){
     let img = product.images?.[0] || product.thumbnail || product.image || 'assets/images/products/small/product-1.webp';

     // Force webp conversion for better performance
     if (img && img.includes('.jpg')) {
       img = img.replace('.jpg', '.webp');
     } else if (img && img.includes('.png')) {
       img = img.replace('.png', '.webp');
     }

     return img;
  }

  function getRating(product){
    const r = product.rating || product.averageRating || 0;
    return Math.max(0, Math.min(5, Number(r) || 0));
  }

  function productUrl(product){
    // product.id may already be a composite id like "category-sub-id-slug"
    if (product.id) return 'product.html?id=' + encodeURIComponent(product.id);
    if (product.slug) return 'product.html?id=' + encodeURIComponent(product.slug);
    return '#';
  }

  function renderStars(rating){
    // Use width percentage like existing widgets
    const pct = Math.round((rating / 5) * 100);
    return '<div class="ratings-container">\n' +
      '  <div class="product-ratings">\n' +
      '    <span class="ratings" style="width:'+pct+'%"></span>\n' +
      '    <span class="tooltiptext tooltip-top"></span>\n' +
      '  </div>\n' +
      '</div>';
  }

  function renderCard(product){
    const img = getImage(product);
    const price = getPrice(product);
    const rating = getRating(product);
    const url = productUrl(product);
    const title = (product.name || product.title || 'Product').toString();

    // Responsive columns: mobile 2, tablet 4, desktop 6
    // Using Bootstrap grid: col-6 (xs), col-sm-6, col-md-3, col-lg-2
    return (
      '<div class="col-6 col-sm-6 col-md-3 col-lg-2">' +
      '  <div class="product-default inner-quickview inner-icon">' +
      '    <figure>' +
      '      <a href="'+url+'">' +
      '        <img src="'+img+'" alt="'+title.replace(/"/g,'&quot;')+'" loading="lazy">' +
      '      </a>' +
      '    </figure>' +
      '    <div class="product-details">' +
      '      <h3 class="product-title"><a href="'+url+'">'+title+'</a></h3>' +
      '      ' + renderStars(rating) +
      '      <div class="price-box"><span class="product-price">'+ window.formatPrice(price) +'</span></div>' +
      '      <div class="product-action">' +
      '        <a href="#" class="btn-icon btn-add-cart" data-action="add-to-cart" data-product-id="'+(product.id||'')+'">' +
      '          <i class="icon-shopping-cart"></i><span>Add to Cart</span>' +
      '        </a>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  function sortProductsByPriceAsc(list){
    return (list || []).slice().sort((a,b)=>{
      return (Number(getPrice(a))||0) - (Number(getPrice(b))||0);
    });
  }

  async function fetchTopSellingFromApi(limit){
    const url = '/api/products?assignedOnly=true&promoType=top-selling&limit='+encodeURIComponent(limit);
    const res = await fetch(url, { credentials: 'include' }).catch(()=>null);
    if (!res || !res.ok) throw new Error('API request failed');
    const data = await res.json();
    // Normalize list: data.products or array
    const list = Array.isArray(data) ? data : (data?.products || []);
    return list;
  }

  function flattenProducts(data){
    try{
      if (Array.isArray(data)) return data;
      if (data && (data.products || data.items)) return data.products || data.items || [];
      const out = [];
      const cats = data && Array.isArray(data.categories) ? data.categories : [];
      cats.forEach(c => {
        const subs = Array.isArray(c.subcategories) ? c.subcategories : [];
        subs.forEach(s => {
          const prods = Array.isArray(s.products) ? s.products : [];
          prods.forEach(p => out.push(p));
        });
      });
      return out;
    }catch(_e){ return []; }
  }

  async function fetchTopSellingFromJson(limit){
    // Prefer dedicated top-selling.json if present (fast local)
    // Add cache busting and reload directive
    const cacheBuster = '?v=' + Date.now();
    try {
      const t = await fetch('top-selling.json' + cacheBuster, { cache: 'reload' }).catch(()=>null);
      if (t && t.ok) {
        const tj = await t.json();
        const list = Array.isArray(tj) ? tj : (tj.topSelling || tj.items || []);
        if (list && list.length) return list.slice(0, limit);
      }
    } catch(_e) {}
    // Fallback: use products.grouped2.json and simulate top-selling selection
    const res = await fetch('products.grouped2.json' + cacheBuster, { cache: 'reload' }).catch(()=>null);
    if (!res || !res.ok) {
      // second attempt: assets/data path
      const res2 = await fetch('assets/data/products.grouped2.json' + cacheBuster, { cache: 'reload' }).catch(()=>null);
      if (!res2 || !res2.ok) return [];
      const data2 = await res2.json();
      const all2 = flattenProducts(data2);
      const tops2 = all2.filter(p => p.isTopSelling || p.promoType === 'top-selling');
      const pool2 = tops2.length ? tops2 : all2;
      return pool2.slice(0, limit);
    }
    const data = await res.json();
    const all = flattenProducts(data);
    // Prefer ones flagged isTopSelling / promoType if present
    const tops = all.filter(p => p.isTopSelling || p.promoType === 'top-selling');
    const pool = tops.length ? tops : all;
    // Robust slice
    return pool.slice(0, limit);
  }

  function attachCartHandler(container){
    if (!container) return;
    // Prevent double binding
    if (container.dataset.cartBound) return;
    container.dataset.cartBound = 'true';

    container.addEventListener('click', function(ev){
      const btn = ev.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation(); // Prevent other listeners (e.g. theme scripts) from firing
      const pid = btn.getAttribute('data-product-id');
      try {
        if (window.CartManagerInstance && typeof window.CartManagerInstance.addToCart === 'function'){
          window.CartManagerInstance.addToCart(pid, 1);
        } else if (typeof window.CartManager === 'function'){
          const cm = window.CartManagerInstance || (window.CartManagerInstance = window.CartManager());
          cm.addToCart(pid, 1);
        } else if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
          window.CartManager.addToCart(pid, 1);
        }

        // Add visual feedback since we stopped propagation
        const originalText = btn.innerHTML;
        // Check if button has text span or just icon
        if (btn.querySelector('span')) {
             const span = btn.querySelector('span');
             const originalSpanText = span.textContent;
             span.textContent = 'Added';
             setTimeout(() => { span.textContent = originalSpanText; }, 2000);
        } else {
            // Fallback for icon-only buttons
            btn.classList.add('added-success');
            setTimeout(() => { btn.classList.remove('added-success'); }, 2000);
        }

      } catch(e){
        console.warn('Add to cart failed', e);
      }
    });
  }

   async function fetchComboDealsFromJson(limit){
     const cacheBuster = '?v=' + Date.now() + '&t=' + Date.now();
     try {
       console.log('Fetching combo deals from JSON...');
       const res = await fetch('combo-offers.json' + cacheBuster).catch((err)=>{
         console.error('Fetch failed:', err);
         return null;
       });
       if (res && res.ok) {
         const data = await res.json();
         console.log('Combo deals data:', data);
         const list = Array.isArray(data) ? data : (data.combos || data.items || []);
         console.log('Combo deals list:', list);
         if (list && list.length) return list.slice(0, limit);
       }
     } catch(e) {
       console.error('Error fetching combo deals:', e);
     }
     return [];
   }

   async function fetchComboDealsFromApi(limit){
     const url = '/api/products?assignedOnly=true&promoType=combo-deals&limit='+encodeURIComponent(limit);
     const res = await fetch(url, { credentials: 'include' }).catch(()=>null);
     if (!res || !res.ok) throw new Error('API request failed');
     const data = await res.json();
     const list = Array.isArray(data) ? data : (data?.products || []);
     return list;
   }

   async function populateComboDeals(){
     const grid = document.getElementById('js-combo-deals-grid');
     console.log('populateComboDeals called, grid element:', grid);
     if (!grid) {
       console.error('Combo deals grid not found!');
       return;
     }
     const limit = 6;
     grid.setAttribute('data-sorted', 'true');
     grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div><p>Loading combo deals...</p></div>';
     
     // 1. Try Local JSON first (fastest)
     try {
       const localList = await fetchComboDealsFromJson(limit);
       console.log('Local list fetched:', localList);
       if (Array.isArray(localList) && localList.length){
         console.log('Rendering combo deals:', localList.length, 'products');
         grid.innerHTML = sortProductsByPriceAsc(localList).slice(0, limit).map(renderCard).join('');
         attachCartHandler(grid);
         return; // Success, we are done
       } else {
         console.warn('No combo deals found in local JSON');
       }
     } catch(e) {
       console.error('Error in local fetch:', e);
     }
     
     // 2. Try API (fallback)
     try {
       let apiList = await fetchComboDealsFromApi(limit);
       if (Array.isArray(apiList) && apiList.length){
         apiList = sortProductsByPriceAsc(apiList).slice(0, limit);
         grid.innerHTML = apiList.map(renderCard).join('');
         grid.setAttribute('data-sorted', 'true');
         attachCartHandler(grid);
         return;
       }
     } catch(err){
       console.error('API fetch error:', err);
     }

     // 3. Final State Check
     if (grid.innerHTML.includes('Loading')) {
        console.error('Combo deals load failed - no products available');
        grid.innerHTML = '<div class="col-12 text-center py-4">No combo deals available.</div>';
     }
     attachCartHandler(grid);
   }

   async function populateTopSelling(){
     const grid = document.getElementById('js-top-selling-grid');
     if (!grid) return;
     const limit = 6;
     grid.setAttribute('data-sorted', 'true');
     grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div><p>Loading top selling products...</p></div>';
     try {
       const localList = await fetchTopSellingFromJson(limit);
       if (Array.isArray(localList) && localList.length){
         grid.innerHTML = sortProductsByPriceAsc(localList).slice(0, limit).map(renderCard).join('');
         attachCartHandler(grid);
         return;
       }
     } catch(_e) {}
     try {
       let apiList = await fetchTopSellingFromApi(limit);
       if (Array.isArray(apiList) && apiList.length){
         apiList = sortProductsByPriceAsc(apiList).slice(0, limit);
         grid.innerHTML = apiList.map(renderCard).join('');
         grid.setAttribute('data-sorted', 'true'); // Re-mark as sorted after API update
       } else if (!grid.innerHTML.trim() || grid.innerHTML.includes('Loading')) {
         // If nothing rendered yet, try local fallback
         const lf = await fetchTopSellingFromJson(limit);
         grid.innerHTML = sortProductsByPriceAsc(lf).slice(0, limit).map(renderCard).join('');
         grid.setAttribute('data-sorted', 'true');
       }
     } catch(err){
       if (!grid.innerHTML.trim() || grid.innerHTML.includes('Loading')){
         try {
           const list = await fetchTopSellingFromJson(limit);
           grid.innerHTML = sortProductsByPriceAsc(list).slice(0, limit).map(renderCard).join('');
           grid.setAttribute('data-sorted', 'true');
         } catch(e){
           console.error('Top Selling load failed', e);
           grid.innerHTML = '<div class="col-12 text-center py-4">Failed to load top selling products.</div>';
         }
       }
     }
     attachCartHandler(grid);
   }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(populateTopSelling, 0);
  });
})();
