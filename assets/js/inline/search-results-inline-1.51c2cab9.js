document.addEventListener('DOMContentLoaded', function() {
  const productGrid = document.querySelector('.product-grid');
  const resultsInfo = document.querySelector('.search-results-info');
  const filtersContainer = document.querySelector('.search-filters');
  const searchInputHero = document.getElementById('searchQuery');

  // State
  let BASE_ALL = [];           // all products flattened with metadata
  let QUERY = '';
  const SELECTED = { brand: new Set(), subcategory: new Set(), price: new Set() };

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function formatPrice(val) {
    try { return `₵${Number(val).toFixed(2)}`; } catch (e) { return `₵${val}`; }
  }

  function inRange(v, r) {
    if (!r) return true;
    const [min, max] = r;
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
    return true;
  }

  function createCardHTML(product) {
    const image = (product.images && product.images[0]) || 'assets/images/products/product-1.webp"';
    const price = product.price != null ? formatPrice(product.price) : '';
    const oldPrice = product.oldPrice != null ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : '';
    const link = `product.html?id=${encodeURIComponent(product.id || product.slug || '')}`;
    return `
      <div class="product-card">
        <figure>
          <a href="${link}" aria-label="View ${product.name}">
            <img src="${image}" alt="${product.name}" loading="lazy">
          </a>
        </figure>
        <div class="product-details">
          <h3 class="product-title"><a href="${link}">${product.name}</a></h3>
          <div class="price-box">
            ${oldPrice}<span class="product-price">${price}</span>
          </div>
          <div class="product-meta">
            ${product.brand ? `<span class="badge brand">${product.brand}</span>` : ''}
            ${product._subcategory ? `<span class="badge sub">${product._subcategory}</span>` : ''}
          </div>
          <div class="product-action">
            <button class="btn-add-cart" type="button" aria-label="Add ${product.name} to cart">
              <i class="fas fa-shopping-cart" aria-hidden="true"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>`;
  }

  function setResultsHeader(query, count) {
    if (!resultsInfo) return;
    const safeQ = (query || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    resultsInfo.innerHTML = `<div class="container"><h3>Showing ${count} result${count === 1 ? '' : 's'} for "${safeQ}"</h3></div>`;
  }

  function renderGrid(list) {
    if (!productGrid) return;
    if (!list.length) {
      productGrid.innerHTML = `
        <div class="no-results">
          <h3>No results found</h3>
          <p>Try different keywords or adjust filters</p>
          <div class="suggestions">
            <a class="suggestion" href="category1.html?category=mobile-phones">Mobile Phones</a>
            <a class="suggestion" href="category1.html?category=computing-devices">Computing Devices</a>
            <a class="suggestion" href="category1.html?category=home-appliances">Home Appliances</a>
            <a class="suggestion" href="category1.html?category=tech-accessories">Tech Accessories</a>
          </div>
        </div>`;
      return;
    }
    productGrid.innerHTML = list.map(createCardHTML).join('');
    productGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', function() {
        const original = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Added!';
        this.style.background = 'var(--primary-red, #e60023)';
        setTimeout(() => { this.innerHTML = original; this.style.background = ''; }, 1200);
      });
    });
  }

  function computeFacets(list) {
    const brandMap = new Map();
    const subMap = new Map();
    const prices = [];
    list.forEach(p => {
      if (p.brand) brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
      if (p._subcategory) subMap.set(p._subcategory, (subMap.get(p._subcategory) || 0) + 1);
      if (typeof p.price === 'number') prices.push(p.price);
    });
    prices.sort((a,b) => a-b);
    const facets = { brands: [], subs: [], priceRanges: [] };
    brandMap.forEach((cnt, b) => facets.brands.push({ value: b, count: cnt }));
    subMap.forEach((cnt, s) => facets.subs.push({ value: s, count: cnt }));
    facets.brands.sort((a,b) => a.value.localeCompare(b.value));
    facets.subs.sort((a,b) => a.value.localeCompare(b.value));

    if (prices.length) {
      const q = x => prices[Math.floor(x*(prices.length-1))];
      const r1 = [null, Math.floor(q(0.25))];
      const r2 = [r1[1]+1, Math.floor(q(0.5))];
      const r3 = [r2[1]+1, Math.floor(q(0.75))];
      const r4 = [r3[1]+1, null];
      const ranges = [r1, r2, r3, r4];
      const labels = [
        `<= ${formatPrice(r1[1])}`,
        `${formatPrice(r2[0])} - ${formatPrice(r2[1])}`,
        `${formatPrice(r3[0])} - ${formatPrice(r3[1])}`,
        `>= ${formatPrice(r4[0])}`
      ];
      // Count items in each range
      const counts = new Array(4).fill(0);
      prices.forEach(v => {
        ranges.forEach((rg, idx) => { if (inRange(v, rg)) counts[idx]++; });
      });
      facets.priceRanges = ranges.map((rg, i) => ({ value: rg, label: labels[i], count: counts[i] }));
    }
    return facets;
  }

  function renderFilters(facets) {
    if (!filtersContainer) return;
    const section = (title, items, facetKey, formatValue = (v)=>v) => {
      if (!items || !items.length) return '';
      const buttons = items.map(it => {
        const valKey = facetKey === 'price' ? JSON.stringify(it.value) : it.value;
        const isActive = SELECTED[facetKey === 'brand' ? 'brand' : facetKey === 'subcategory' ? 'subcategory' : 'price'].has(valKey);
        return `<button class="filter-option${isActive ? ' active' : ''}" data-facet="${facetKey}" data-value='${valKey}'>${formatValue(it.value, it)} <span class="count">(${it.count})</span></button>`;
      }).join('');
      return `<div class="filter-section"><h5>${title}</h5><div class="filter-group">${buttons}</div></div>`;
    };

    const html = [
      section('Brand', facets.brands, 'brand', (v)=>v),
      section('Subcategory', facets.subs, 'subcategory', (v)=>v),
      section('Price', facets.priceRanges, 'price', (_v, it)=>it.label)
    ].join('');

    filtersContainer.innerHTML = html || '<p class="text-muted">No filters available</p>';

    // bind events
    filtersContainer.querySelectorAll('.filter-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const facet = btn.getAttribute('data-facet');
        const raw = btn.getAttribute('data-value');
        const key = facet;
        const set = SELECTED[key];
        const value = facet === 'price' ? raw : raw;
        if (set.has(value)) set.delete(value); else set.add(value);
        applyFiltersAndRender();
      });
    });
  }

  function applyFilters(list) {
    let out = list.slice();
    // brand
    if (SELECTED.brand.size) {
      out = out.filter(p => SELECTED.brand.has(p.brand));
    }
    // subcategory
    if (SELECTED.subcategory.size) {
      out = out.filter(p => SELECTED.subcategory.has(p._subcategory));
    }
    // price
    if (SELECTED.price.size) {
      const ranges = Array.from(SELECTED.price).map(s => JSON.parse(s));
      out = out.filter(p => {
        const v = typeof p.price === 'number' ? p.price : null;
        if (v == null) return false;
        return ranges.some(r => inRange(v, r));
      });
    }
    return out;
  }

  function applyFiltersAndRender() {
    const queryFiltered = filterByQuery(BASE_ALL, QUERY);
    const filtered = applyFilters(queryFiltered);
    setResultsHeader(QUERY, filtered.length);
    renderFilters(computeFacets(queryFiltered)); // suggestions update based on query scope
    // Re-apply active states based on SELECTED
    filtersContainer.querySelectorAll('.filter-option').forEach(btn => {
      const facet = btn.getAttribute('data-facet');
      const raw = btn.getAttribute('data-value');
      const set = SELECTED[facet];
      if (set && set.has(raw)) btn.classList.add('active'); else btn.classList.remove('active');
    });
    renderGrid(filtered);
  }

  function filterByQuery(list, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(p => {
      const n = (p.name || '').toLowerCase();
      const b = (p.brand || '').toLowerCase();
      const d = (p.description || '').toLowerCase();
      return n.includes(q) || b.includes(q) || d.includes(q);
    });
  }

  async function loadData() {
    productGrid && (productGrid.innerHTML = `<div class="search-loading"><div class="loader" role="status" aria-live="polite" aria-busy="true"></div></div>`);
    try {
      let data;
      try {
        const res = await fetch('products.grouped2.json');
        data = await res.json();
      } catch(e) {
        const res2 = await fetch('assets/data/products.grouped2.json');
        data = await res2.json();
      }

      const all = [];
      if (data && Array.isArray(data.categories)) {
        data.categories.forEach(cat => {
          (cat.subcategories || []).forEach(sub => {
            (sub.products || []).forEach(p => {
              const copy = Object.assign({}, p);
              if (!copy._category) copy._category = cat.name || cat.title || '';
              if (!copy._subcategory) copy._subcategory = sub.name || sub.title || '';
              all.push(copy);
            });
          });
        });
      }
      BASE_ALL = all;
    } catch (err) {
      console.error('Failed to load search results:', err);
      productGrid && (productGrid.innerHTML = `<div class="no-results"><h3>Something went wrong</h3><p>Please try again later.</p></div>`);
    }
  }

  function initSearchForm() {
    if (searchInputHero) {
      searchInputHero.addEventListener('focus', function() { this.select(); });
      const heroForm = searchInputHero.closest('form');
      if (heroForm) {
        heroForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const val = searchInputHero.value.trim();
          window.location.href = `search-results.html?q=${encodeURIComponent(val)}`;
        });
      }
    }
  }

  async function init() {
    QUERY = getQueryParam('q');
    if (searchInputHero && QUERY) searchInputHero.value = QUERY;
    await loadData();
    // Initial render
    renderFilters(computeFacets(filterByQuery(BASE_ALL, QUERY)));
    applyFiltersAndRender();
  }

  // Initialize
  initSearchForm();
  init();
});
  const productGrid = document.querySelector('.product-grid');
  const resultsInfo = document.querySelector('.search-results-info');
  const filtersContainer = document.querySelector('.search-filters');
  const searchInputHero = document.getElementById('searchQuery');

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function formatPrice(val) {
    try { return `₵${Number(val).toFixed(2)}`; } catch (e) { return `₵${val}`; }
  }

  function createCardHTML(product) {
    const image = (product.images && product.images[0]) || 'assets/images/products/product-1.webp"';
    const price = product.price != null ? formatPrice(product.price) : '';
    const oldPrice = product.oldPrice != null ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : '';
    const link = `product.html?id=${encodeURIComponent(product.id || product.slug || '')}`;
    return `
      <div class="product-card">
        <figure>
          <a href="${link}" aria-label="View ${product.name}">
            <img src="${image}" alt="${product.name}" loading="lazy">
          </a>
        </figure>
        <div class="product-details">
          <h3 class="product-title"><a href="${link}">${product.name}</a></h3>
          <div class="price-box">
            ${oldPrice}<span class="product-price">${price}</span>
          </div>
          <div class="product-action">
            <button class="btn-add-cart" type="button" aria-label="Add ${product.name} to cart">
              <i class="fas fa-shopping-cart" aria-hidden="true"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>`;
  }

  function setResultsHeader(query, count) {
    if (!resultsInfo) return;
    const safeQ = (query || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    resultsInfo.innerHTML = `<div class="container"><h3>Showing ${count} result${count === 1 ? '' : 's'} for "${safeQ}"</h3></div>`;
  }

  async function loadAndRender(query) {
    if (!productGrid) return;

    // Loading state
    productGrid.innerHTML = `<div class="search-loading"><div class="loader" role="status" aria-live="polite" aria-busy="true"></div></div>`;

    try {
      let data;
      try {
        const res = await fetch('products.grouped2.json');
        data = await res.json();
      } catch(e) {
        const res2 = await fetch('assets/data/products.grouped2.json');
        data = await res2.json();
      }
      const all = [];
      if (data && Array.isArray(data.categories)) {
        data.categories.forEach(cat => {
          (cat.subcategories || []).forEach(sub => {
            (sub.products || []).forEach(p => all.push(p));
          });
        });
      }

      const q = (query || '').trim().toLowerCase();
      let filtered = all;
      if (q) {
        filtered = all.filter(p => {
          const n = (p.name || '').toLowerCase();
          const b = (p.brand || '').toLowerCase();
          const d = (p.description || '').toLowerCase();
          return n.includes(q) || b.includes(q) || d.includes(q);
        });
      }

      setResultsHeader(query, filtered.length);

      if (!filtered.length) {
        productGrid.innerHTML = `
          <div class="no-results">
            <h3>No results found</h3>
            <p>Try different keywords or browse popular categories</p>
            <div class="suggestions">
              <a class="suggestion" href="category1.html?category=mobile-phones">Mobile Phones</a>
              <a class="suggestion" href="category1.html?category=computing-devices">Computing Devices</a>
              <a class="suggestion" href="category1.html?category=home-appliances">Home Appliances</a>
              <a class="suggestion" href="category1.html?category=tech-accessories">Tech Accessories</a>
            </div>
          </div>`;
        return;
      }

      // Render products
      productGrid.innerHTML = filtered.map(createCardHTML).join('');

      // Wire up add-to-cart animation for new buttons
      productGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function() {
          const original = this.innerHTML;
          this.innerHTML = '<i class="fas fa-check"></i> Added!';
          this.style.background = 'var(--primary-red, #e60023)';
          setTimeout(() => { this.innerHTML = original; this.style.background = ''; }, 1500);
        });
      });
    } catch (err) {
      console.error('Failed to load search results:', err);
      setResultsHeader(query, 0);
      productGrid.innerHTML = `<div class="no-results"><h3>Something went wrong</h3><p>Please try again later.</p></div>`;
    }
  }

  // Init filters toggling (cosmetic)
  const filterOptions = document.querySelectorAll('.filter-option');
  filterOptions.forEach(option => {
    option.addEventListener('click', function() { this.classList.toggle('active'); });
  });

  // Ensure search input in hero selects on focus
  if (searchInputHero) {
    searchInputHero.addEventListener('focus', function() { this.select(); });
    const heroForm = searchInputHero.closest('form');
    if (heroForm) {
      heroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const val = searchInputHero.value.trim();
        if (val) window.location.href = `search-results.html?q=${encodeURIComponent(val)}`;
      });
    }
  }

  const q = getQueryParam('q');
  if (searchInputHero && q) searchInputHero.value = q;
  loadAndRender(q);
});
