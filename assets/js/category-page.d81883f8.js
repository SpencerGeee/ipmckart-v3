(function() {
  const SUB_ALIASES = {
    'keys': 'keys-clicks',
    'refridgerators': 'refrigerators'
  };

  const params = new URLSearchParams(window.location.search);
  // Normalize category and subcategory IDs from URL, applying aliases
  const rawCategoryId = params.get('category') || location.hash.slice(1);
  const rawSubcategoryId = params.get('subcategory');
  const categoryId = rawCategoryId && SUB_ALIASES[rawCategoryId] ? SUB_ALIASES[rawCategoryId] : rawCategoryId;
  const subcategoryId = rawSubcategoryId && SUB_ALIASES[rawSubcategoryId] ? SUB_ALIASES[rawSubcategoryId] : rawSubcategoryId;

  const isAll = !categoryId;
  if (isAll) {
    console.warn('No category specified; showing all products');
  }

  const PATH_CANDIDATES = [
    'products.grouped2.json',
    '/products.grouped2.json',
    'assets/data/products.grouped2.json',
    '/assets/data/products.grouped2.json'
  ];

  async function loadData() {
    for (const path of PATH_CANDIDATES) {
      try {
        const res = await fetch(path, { cache: 'default' });
        if (!res.ok) continue;
        const json = await res.json();
        if (json && Array.isArray(json.categories)) return json;
      } catch (e) {
        console.error('Failed to load from path:', path, e);
        // try next path
      }
    }
    throw new Error('Unable to load products data from any known path');
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined || typeof price !== 'number') {
        return 'GHS 0.00';
    }
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
    }).format(price);
  };

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

  function buildSidebarCategories(categories, currentCatId, currentSubId) {
    const catList = document.querySelector('.cat-list');
    if (!catList) return;
    catList.innerHTML = '';
    
    categories.forEach(cat => {
      const isActive = cat.id === currentCatId;
      const subs = cat.subcategories || [];
      const totalCount = subs.reduce((sum, s) => sum + ((s.products && s.products.length) ? s.products.length : 0), 0);
      const li = document.createElement('li');
      
      // Escape user input
      const escapedCatId = escapeAttribute(cat.id);
      const escapedCatName = escapeHtml(cat.name);
      
      const subsHtml = subs.length ? `
        <div class="collapse ${isActive ? 'show' : ''}" id="widget-category-${escapedCatId}">
          <ul class="cat-sublist" role="menu">
            ${subs.map(s => {
              const count = (s.products && s.products.length) ? s.products.length : 0;
              const active = isActive && s.id === currentSubId;
              const escapedSubId = escapeAttribute(s.id);
              const escapedSubName = escapeHtml(s.name);
              return `<li role="none">
                <a href="?category=${escapedCatId}&subcategory=${escapedSubId}" ${active ? 'class="active"' : ''} role="menuitem">
                  ${escapedSubName} <span class="products-count">(${count})</span>
                </a>
              </li>`;
            }).join('')}
          </ul>
        </div>
      ` : '';
      
      li.innerHTML = `
        <a href="#widget-category-${escapedCatId}" ${isActive ? '' : 'class="collapsed"'} 
           data-toggle="collapse" role="button" 
           aria-expanded="${isActive}" 
           aria-controls="widget-category-${escapedCatId}">
          ${escapedCatName}<span class="products-count">(${totalCount})</span>
          ${subs.length ? '<span class="toggle" aria-hidden="true"></span>' : ''}
        </a>
        ${subsHtml}
      `;
      catList.appendChild(li);
    });
  }

  // Pagination state
  const PRODUCTS_PER_PAGE = 12;
  let currentPage = 1;
  let allProducts = [];

  function renderProducts(products) {
    const grid = document.getElementById('js-product-grid');
    if (!grid) {
      console.error('Product grid element not found!');
      return;
    }

    // Store all products for pagination
    allProducts = products;

    if (products.length === 0) {
      grid.innerHTML = '<div class="col-12"><p>No products found in this category.</p></div>';
      return;
    }

    // Get current page from URL or default to 1
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;

    // Calculate pagination
    const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    const productsToShow = products.slice(startIndex, endIndex);

    console.log(`Rendering ${productsToShow.length} products (page ${currentPage} of ${totalPages})`);

    // Clear grid first
    grid.innerHTML = '';
    
    // Render products safely
    productsToShow.forEach(p => {
        const formattedPrice = formatPrice(p.price);
        const formattedOldPrice = p.oldPrice ? formatPrice(p.oldPrice) : '';

        // Escape all user input
        const escapedName = escapeHtml(p.name);
        const escapedAttrName = escapeAttribute(p.name);
        const escapedId = escapeAttribute(p.id);
        const escapedCategoryId = escapeAttribute(p.categoryId || '');
        const escapedCategoryName = escapeHtml(p.categoryName || 'Category');
        const images = Array.isArray(p.images) ? p.images : [];
        const escapedImage1 = escapeAttribute(images[0] || 'assets/images/products/single/product-img.webp"');
        const escapedImage2 = images[1] ? escapeAttribute(images[1]) : '';
        const ratingVal = typeof p.rating === 'number' ? Math.max(0, Math.min(100, p.rating)) : 100;
        const escapedRating = ratingVal;
        
        const productDiv = document.createElement('div');
        productDiv.className = 'col-6 col-sm-4 col-md-3';
        
        const labelsHtml = p.labels && p.labels.length ? `
          <div class="label-group">
            ${p.labels.map(label => {
              const escapedLabel = escapeHtml(label);
              const escapedLabelAttr = escapeAttribute(label.toLowerCase());
              return `<div class="product-label label-${escapedLabelAttr}">${escapedLabel}</div>`;
            }).join('')}
          </div>` : '';

        productDiv.innerHTML = `
        <div class="product-default">
            <figure>
                <a href="product.html?id=${escapedId}" aria-label="View ${escapedAttrName}">
                    <img src="${escapedImage1}" alt="${escapedAttrName}" loading="lazy" decoding="async" width="300" height="300" />
                    ${escapedImage2 ? `<img src="${escapedImage2}" alt="${escapedAttrName}" loading="lazy" decoding="async" width="300" height="300" />` : ''}
                </a>
                ${labelsHtml}
            </figure>
            <div class="product-details">
                <div class="category-list">
                    <a href="?category=${escapedCategoryId}" class="product-category">${escapedCategoryName}</a>
                </div>
                <h3 class="product-title">
                    <a href="product.html?id=${escapedId}">${escapedName}</a>
                </h3>
                <div class="ratings-container">
                    <div class="product-ratings" role="img" aria-label="Rating: ${escapedRating}%">
                        <span class="ratings" style="width:${escapedRating}%"></span>
                    </div>
                </div>
                <div class="price-box">
                    ${formattedOldPrice ? `<span class="old-price">${formattedOldPrice}</span>` : ''}
                    <span class="product-price">${formattedPrice}</span>
                </div>
                <div class="product-action">
                    <button class="btn-icon btn-add-cart" data-product-id="${escapedId}" title="Add to Cart" aria-label="Add ${escapedAttrName} to cart" type="button">
                        <span>ADD TO CART</span>
                    </button>
                    
                </div>
            </div>
        </div>
        `;
        
        grid.appendChild(productDiv);
    });

    // Render pagination controls
    renderPagination(totalPages, currentPage);

    // Progressive enhancement: Load More without full reload
    setupLoadMore(totalPages);

    // Add event listeners using event delegation
    setupEventListeners(grid);
  }

  function setupEventListeners(grid) {
    // Add event listener to the entire grid for event delegation (attach once)
    if (!grid.__eventsBound) {
      grid.__eventsBound = true;
      
      // Add to cart handler
      grid.addEventListener('click', function(event) {
        const addToCartButton = event.target.closest('.btn-add-cart');
        if (addToCartButton) {
            event.preventDefault();
            if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
            event.stopPropagation();
            const productId = addToCartButton.dataset.productId;
            if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                window.CartManager.addToCart(productId);
                if (window.Utils && window.Utils.announceToScreenReader) {
                    window.Utils.announceToScreenReader('Product added to cart');
                }
            }
        }

        // Quick view handler
        const quickViewButton = event.target.closest('.btn-quickview');
        if (quickViewButton) {
            event.preventDefault();
            const productId = quickViewButton.dataset.productId;
            if (window.QuickView && typeof window.QuickView.show === 'function') {
                window.QuickView.show(productId);
            }
        }
      });
      
      // Add keyboard support for buttons
      grid.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
              const button = event.target.closest('.btn-add-cart, .btn-quickview');
              if (button) {
                  event.preventDefault();
                  button.click();
              }
          }
      });
    }
  }

  function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.querySelector('.toolbox-pagination');
    if (!paginationContainer || totalPages <= 1) {
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'block';
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const subcategoryId = urlParams.get('subcategory');

    let paginationHTML = '<ul class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
      urlParams.set('page', currentPage - 1);
      paginationHTML += `<li class="page-item"><a class="page-link" href="?${urlParams.toString()}">Previous</a></li>`;
    } else {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">Previous</span></li>`;
    }

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      urlParams.set('page', 1);
      paginationHTML += `<li class="page-item"><a class="page-link" href="?${urlParams.toString()}">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      urlParams.set('page', i);
      if (i === currentPage) {
        paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
      } else {
        paginationHTML += `<li class="page-item"><a class="page-link" href="?${urlParams.toString()}">${i}</a></li>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      urlParams.set('page', totalPages);
      paginationHTML += `<li class="page-item"><a class="page-link" href="?${urlParams.toString()}">${totalPages}</a></li>`;
    }

    // Next button
    if (currentPage < totalPages) {
      urlParams.set('page', currentPage + 1);
      paginationHTML += `<li class="page-item"><a class="page-link" href="?${urlParams.toString()}">Next</a></li>`;
    } else {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
    }

    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
  }

  function setupLoadMore(totalPages) {
    const loadMoreBtn = document.querySelector('#load-more');
    if (!loadMoreBtn) return;

    loadMoreBtn.style.display = (currentPage < totalPages) ? 'inline-block' : 'none';

    loadMoreBtn.onclick = function(e) {
      e.preventDefault();
      if (currentPage >= totalPages) return;

      currentPage += 1;
      const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const productsToAppend = allProducts.slice(startIndex, endIndex);

      const grid = document.getElementById('js-product-grid');
      if (!grid) return;

      productsToAppend.forEach(p => {
        const formattedPrice = formatPrice(p.price);
        const formattedOldPrice = p.oldPrice ? formatPrice(p.oldPrice) : '';

        const escapedName = escapeHtml(p.name);
        const escapedAttrName = escapeAttribute(p.name);
        const escapedId = escapeAttribute(p.id);
        const escapedCategoryId = escapeAttribute(p.categoryId || '');
        const escapedCategoryName = escapeHtml(p.categoryName || 'Category');
        const images = Array.isArray(p.images) ? p.images : [];
        const escapedImage1 = escapeAttribute(images[0] || 'assets/images/products/single/product-img.webp"');
        const escapedImage2 = images[1] ? escapeAttribute(images[1]) : '';
        const ratingVal = typeof p.rating === 'number' ? Math.max(0, Math.min(100, p.rating)) : 100;
        const escapedRating = ratingVal;

        const productDiv = document.createElement('div');
        productDiv.className = 'col-6 col-sm-4 col-md-3';
        productDiv.innerHTML = `
          <div class="product-default">
            <figure>
              <a href="product.html?id=${escapedId}" aria-label="View ${escapedAttrName}">
                <img src="${escapedImage1}" alt="${escapedAttrName}" loading="lazy" decoding="async" width="300" height="300" />
                ${escapedImage2 ? `<img src="${escapedImage2}" alt="${escapedAttrName}" loading="lazy" decoding="async" width="300" height="300" />` : ''}
              </a>
            </figure>
            <div class="product-details">
              <div class="category-list">
                <a href="?category=${escapedCategoryId}" class="product-category">${escapedCategoryName}</a>
              </div>
              <h3 class="product-title">
                <a href="product.html?id=${escapedId}">${escapedName}</a>
              </h3>
              <div class="ratings-container">
                <div class="product-ratings" role="img" aria-label="Rating: ${escapedRating}%">
                  <span class="ratings" style="width:${escapedRating}%"></span>
                </div>
              </div>
              <div class="price-box">
                ${formattedOldPrice ? `<span class="old-price">${formattedOldPrice}</span>` : ''}
                <span class="product-price">${formattedPrice}</span>
              </div>
              <div class="product-action">
                <button class="btn-icon btn-add-cart" data-product-id="${escapedId}" title="Add to Cart" aria-label="Add ${escapedAttrName} to cart" type="button">
                  <span>ADD TO CART</span>
                </button>
                <button type="button" class="btn-quickview btn-icon" data-product-id="${escapedId}" title="Quick View" aria-label="Quick view of ${escapedAttrName}"><i class="fas fa-external-link-alt" aria-hidden="true"></i></button>
              </div>
            </div>
          </div>`;
        grid.appendChild(productDiv);
      });

      // Update pagination controls and toggle the button visibility
      renderPagination(totalPages, currentPage);
      loadMoreBtn.style.display = (currentPage < totalPages) ? 'inline-block' : 'none';
    };
  }

  // Faceted filtering state and helpers
  const SELECTED = { brand: new Set(), subcategory: new Set(), price: new Set() };
  let BASE_PRODUCTS = [];

  function inRange(v, r){ if (!r) return true; const [min,max]=r; if (min!=null && v<min) return false; if (max!=null && v>max) return false; return true; }

  function computeFacets(list){
    const brandMap = new Map();
    const subMap = new Map();
    const prices = [];
    list.forEach(p=>{
      if (p.brand) brandMap.set(p.brand, (brandMap.get(p.brand)||0)+1);
      if (p._subcategory) subMap.set(p._subcategory, (subMap.get(p._subcategory)||0)+1);
      if (typeof p.price==='number') prices.push(p.price);
    });
    prices.sort((a,b)=>a-b);
    const facets = { brands:[], subs:[], priceRanges:[] };
    brandMap.forEach((cnt,b)=>facets.brands.push({value:b,count:cnt}));
    subMap.forEach((cnt,s)=>facets.subs.push({value:s,count:cnt}));
    facets.brands.sort((a,b)=>a.value.localeCompare(b.value));
    facets.subs.sort((a,b)=>a.value.localeCompare(b.value));
    if (prices.length){
      const q = x => prices[Math.floor(x*(prices.length-1))];
      const r1=[null, Math.floor(q(0.25))];
      const r2=[r1[1]+1, Math.floor(q(0.5))];
      const r3=[r2[1]+1, Math.floor(q(0.75))];
      const r4=[r3[1]+1, null];
      const ranges=[r1,r2,r3,r4];
      const labels=[`<= ${formatPrice(r1[1])}`, `${formatPrice(r2[0])} - ${formatPrice(r2[1])}`, `${formatPrice(r3[0])} - ${formatPrice(r3[1])}`, `>= ${formatPrice(r4[0])}`];
      const counts=new Array(4).fill(0);
      prices.forEach(v=>{ ranges.forEach((rg,i)=>{ if(inRange(v,rg)) counts[i]++; }); });
      facets.priceRanges = ranges.map((rg,i)=>({value:rg,label:labels[i],count:counts[i]}));
    }
    return facets;
  }

  function renderFilters(facets){
    const container = document.getElementById('js-category-filters');
    if (!container) return;
    const section = (title,items,key,format=(v)=>v)=>{
      if (!items || !items.length) return '';
      const buttons = items.map(it=>{
        const valKey = key==='price' ? JSON.stringify(it.value) : it.value;
        const active = SELECTED[key].has(valKey);
        return `<button class="filter-option${active?' active':''}" data-facet="${key}" data-value='${valKey}'>${format(it.value,it)} <span class="count">(${it.count})</span></button>`;
      }).join('');
      return `<div class="filter-section"><h5>${title}</h5><div class="filter-group">${buttons}</div></div>`;
    };
    container.innerHTML = [
      section('Brand', facets.brands, 'brand'),
      section('Subcategory', facets.subs, 'subcategory'),
      section('Price', facets.priceRanges, 'price', (_v,it)=>it.label)
    ].join('') || '<p class="text-muted">No filters available</p>';

    container.querySelectorAll('.filter-option').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const facet = btn.getAttribute('data-facet');
        const raw = btn.getAttribute('data-value');
        const set = SELECTED[facet];
        if (set.has(raw)) set.delete(raw); else set.add(raw);
        applyAndRender();
      });
    });
  }

  function applyFilters(list){
    let out = list.slice();
    if (SELECTED.brand.size) out = out.filter(p=> SELECTED.brand.has(p.brand));
    if (SELECTED.subcategory.size) out = out.filter(p=> SELECTED.subcategory.has(p._subcategory));
    if (SELECTED.price.size){
      const ranges = Array.from(SELECTED.price).map(s=>JSON.parse(s));
      out = out.filter(p=>{ const v = typeof p.price==='number'?p.price:null; if (v==null) return false; return ranges.some(r=>inRange(v,r)); });
    }
    return out;
  }

  function renderActiveChips(){
    const bar = document.getElementById('js-active-filters');
    const clearBtn = document.getElementById('js-clear-filters');
    if (!bar || !clearBtn) return;
    const chips = [];
    SELECTED.brand.forEach(v=> chips.push({facet:'brand', label:v, value:v}));
    SELECTED.subcategory.forEach(v=> chips.push({facet:'subcategory', label:v, value:v}));
    SELECTED.price.forEach(s=>{ const r=JSON.parse(s); const label = `${r[0]==null?'<=':formatPrice(r[0])} ${r[0]==null?formatPrice(r[1]):'to '+formatPrice(r[1]||'')}`; chips.push({facet:'price', label, value:s}); });
    if (!chips.length) { bar.innerHTML=''; clearBtn.disabled=true; return; }
    clearBtn.disabled=false;
    bar.innerHTML = chips.map(c=>`<span class="filter-chip" data-facet="${c.facet}" data-value='${c.value}'>${escapeHtml(c.label||'') || c.label}<button class="remove" aria-label="Remove filter">×</button></span>`).join('');
    bar.querySelectorAll('.filter-chip .remove').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const chip = btn.closest('.filter-chip');
        const facet = chip.getAttribute('data-facet');
        const val = chip.getAttribute('data-value');
        SELECTED[facet].delete(val);
        applyAndRender();
      });
    });
    clearBtn.onclick = ()=>{ SELECTED.brand.clear(); SELECTED.subcategory.clear(); SELECTED.price.clear(); applyAndRender(); };
  }

  function applyAndRender(){
    const filtered = applyFilters(BASE_PRODUCTS);
    renderActiveChips();
    renderFilters(computeFacets(BASE_PRODUCTS));
    renderProducts(filtered);
  }

  // Initialize when DOM is ready
  function init() {
    loadData()
      .then(data => {
        console.log('Data loaded successfully:', data);
        
        const category = isAll ? null : data.categories.find(c => c.id === categoryId);
        if (!isAll && !category) {
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.innerHTML = `<h2 class="text-center">Category not found</h2>`;
          }
          return;
        }

        let subDisplayName;
        if (!isAll && subcategoryId) {
          const subObj = category.subcategories.find(s => s.id === subcategoryId);
          subDisplayName = subObj ? subObj.name : undefined;
        }
        const displayName = isAll ? 'All Products' : (subcategoryId 
          ? (subDisplayName || '')
          : category.name);
        
        document.title = `${displayName} | IPMC Kart`;
        
        const bannerTitle = document.querySelector('.page-title');
        if (bannerTitle) bannerTitle.textContent = displayName || '';
        
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item.active');
        if (breadcrumbItems.length) {
          breadcrumbItems[breadcrumbItems.length - 1].textContent = displayName;
        }

        buildSidebarCategories(data.categories, categoryId, subcategoryId);

        let products;
       if (isAll) {
         products = (data.categories || []).flatMap(cat => (cat.subcategories || []).flatMap(sc => sc.products || []).map(p=>Object.assign({ _subcategory: sc.name || sc.id }, p)));
       } else if (subcategoryId) {
         const subsArr = (category && category.subcategories ? category.subcategories : []);
         const sub = subsArr.find(s => s.id === subcategoryId);
         const fallbacks = subsArr.flatMap(sc => (sc.products || []).map(p=>Object.assign({ _subcategory: sc.name || sc.id }, p)));
         products = sub && Array.isArray(sub.products)
           ? sub.products.map(p=>Object.assign({ _subcategory: sub.name || sub.id }, p))
           : fallbacks;
       } else {
         products = (category && category.subcategories ? category.subcategories : []).flatMap(sc => (sc.products || []).map(p=>Object.assign({ _subcategory: sc.name || sc.id }, p)));
       }
       
       BASE_PRODUCTS = products;
       console.log(`Found ${products.length} products to render`);
       renderFilters(computeFacets(BASE_PRODUCTS));
       renderActiveChips();
       applyAndRender();
     })
      .catch(err => {
        console.error('Failed to load products:', err);
        const grid = document.getElementById('js-product-grid');
        if (grid) grid.innerHTML = '<div class="col-12"><p>Failed to load products. Please try again later.</p></div>';
      });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();