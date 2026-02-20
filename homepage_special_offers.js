// Special Offer Section Enhancements (Phase 2 - Part A)
// - Adds "View More" links per tab
// - Kitchen Appliances: Binatone-only filter with fallback fill to at least 4
// - Sorting by price ascending for these grids
// - Lazy loading images and skeleton loaders while fetching
// - Smooth hover transitions
(function(){
  'use strict';

  const CATEGORY_MAP = {
    kitchen: { category: 'kitchen-appliances', subcategory: 'misc', label: 'Kitchen Appliances' },
    audio: { category: 'tech-accessories', subcategory: 'wireless-sound', label: 'Audio Speakers' },
    printers: { category: 'printers-scanners', subcategory: 'printers-scanners', label: 'Printers & Scanners' },
    monitors: { category: 'computing-devices', subcategory: 'monitors', label: 'Monitors' },
    computer: { category: 'computing-devices', subcategory: 'laptops', label: 'Computer' },
    mobiles: { category: 'mobile-phones', subcategory: 'apple-iphone', label: 'Mobile Phones' }
  };

  function ensureHoverStyles(){
    if (document.getElementById('special-offers-hover-style')) return;
    const css = `
      /* Smooth hover transitions for special offer grids */
      #js-kitchen-appliances-grid .product-default,
      #js-audio-speakers-grid .product-default,
      #js-printers-scanners-grid .product-default,
      #js-monitors-grid .product-default,
      #js-computer-grid .product-default,
      #js-mobile-phones-grid .product-default{
        transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        border-radius: 10px;
      }
      #js-kitchen-appliances-grid .product-default:hover,
      #js-audio-speakers-grid .product-default:hover,
      #js-printers-scanners-grid .product-default:hover,
      #js-monitors-grid .product-default:hover,
      #js-computer-grid .product-default:hover,
      #js-mobile-phones-grid .product-default:hover{
        transform: translateY(-5px);
        box-shadow: 0 10px 22px rgba(0,0,0,0.12);
      }
      .special-skeleton{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%}
      .special-skeleton .s-card{background:#f5f6f7;border-radius:12px;height:220px;position:relative;overflow:hidden}
      .special-skeleton .s-card::after{content:'';position:absolute;top:0;left:-40%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent);animation:skeleton 1.2s infinite}
      @keyframes skeleton{0%{left:-40%}100%{left:140%}}
      @media (max-width: 992px){.special-skeleton{grid-template-columns:repeat(3,1fr)}}
      @media (max-width: 768px){.special-skeleton{grid-template-columns:repeat(2,1fr)}}
    `;
    const style = document.createElement('style');
    style.id = 'special-offers-hover-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function insertViewMoreLink(gridEl, cfg){
    if (!gridEl || !cfg) return;
    const existing = gridEl.parentElement.querySelector('.view-more-link');
    if (existing) return;
    const wrap = document.createElement('div');
    wrap.className = 'view-more-link text-right mt-2';
    const url = `category1.html?category=${encodeURIComponent(cfg.category)}${cfg.subcategory?`&subcategory=${encodeURIComponent(cfg.subcategory)}`:''}`;
    wrap.innerHTML = `<a href="${url}" class="small" style="color:#B22222;font-weight:600;">View More ${cfg.label} →</a>`;
    gridEl.parentElement.appendChild(wrap);
  }

  function getPrice(p){
    if (typeof p.price === 'number') return p.price;
    if (typeof p.price === 'string'){
      const n = Number(p.price.replace(/[^0-9.]/g,''));
      if (!Number.isNaN(n)) return n;
    }
    if (typeof p.finalPrice === 'number') return p.finalPrice;
    if (typeof p.salePrice === 'number') return p.salePrice;
    if (typeof p.regularPrice === 'number') return p.regularPrice;
    return 0;
  }

  function getImage(p){
    return p.images?.[0] || p.thumbnail || p.image || 'assets/images/products/small/product-1.webp"';
  }

  function productUrl(p){
    if (p.id) return 'product.html?id=' + encodeURIComponent(p.id);
    if (p.slug) return 'product.html?id=' + encodeURIComponent(p.slug);
    return '#';
  }

  function renderCard(p){
    const img = getImage(p);
    let priceVal = getPrice(p);
    if (priceVal === undefined || priceVal === null || isNaN(priceVal)) priceVal = 0;
    
    const price = window.formatPrice ? window.formatPrice(priceVal) : ('₵' + priceVal);
    const title = (p.name || p.title || 'Product').toString();
    return `
      <div class="col-6 col-sm-6 col-md-3 col-lg-3">
        <div class="product-default inner-quickview inner-icon">
          <figure>
            <a href="${productUrl(p)}">
              <img src="${img}" alt="${title.replace(/"/g,'&quot;')}" loading="lazy">
            </a>
          </figure>
          <div class="product-details">
            <h3 class="product-title"><a href="${productUrl(p)}">${title}</a></h3>
            <div class="price-box"><span class="product-price">${price}</span></div>
          </div>
        </div>
      </div>`;
  }

  function sortByPriceAsc(list){
    return (list||[]).slice().sort((a,b)=> (Number(getPrice(a))||0) - (Number(getPrice(b))||0));
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

  async function fetchAllProducts(){
    // Prefer local JSON first (fast, no CORS), then API
    // Use cache busting to ensure fresh data
    const cacheBuster = '?v=' + Date.now();
    
    try{
      let f = await fetch('products.grouped2.json' + cacheBuster, { cache: 'reload' });
      if (!f.ok) throw new Error('local root json not ok');
      let j = await f.json();
      let list = flattenProducts(j);
      if (list && list.length) return list;
    }catch(_local){
      try{
        let f2 = await fetch('assets/data/products.grouped2.json' + cacheBuster, { cache: 'reload' });
        if (f2.ok){
          let j2 = await f2.json();
          let list2 = flattenProducts(j2);
          if (list2 && list2.length) return list2;
        }
      }catch(_local2){}
    }
    try {
      const res = await fetch('/api/products?limit=500', { credentials:'include', cache: 'reload' });
      if (res.ok){
        const data = await res.json();
        const list = flattenProducts(data);
        if (list && list.length) return list;
      }
      return [];
    } catch(_e){
      return [];
    }
  }

  function categoryMatch(p, cat, sub){
    const pid = (p.categoryId || p.category || '').toString().toLowerCase();
    const sid = (p.subcategoryId || p.subcategory || '').toString().toLowerCase();
    const catL = (cat||'').toLowerCase();
    const subL = (sub||'').toLowerCase();
    const okCat = catL ? pid.includes(catL) : true;
    const okSub = subL ? (sid.includes(subL) || (p.subcategories||[]).map(s=>s.toLowerCase()).some(s=>s.includes(subL))) : true;
    return okCat && okSub;
  }

  function showSkeleton(grid){
    if (!grid) return;
    const s = document.createElement('div');
    s.className = 'special-skeleton';
    s.innerHTML = '<div class="s-card"></div>'.repeat(4);
    grid.innerHTML = '';
    grid.appendChild(s);
  }

  function clearSkeleton(grid){
    if (!grid) return;
    grid.innerHTML = '';
  }

  async function populateKitchen(list){
    const grid = document.getElementById('js-kitchen-appliances-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.kitchen;
    let items = list.filter(p => categoryMatch(p, cfg.category, null));
    const binas = items.filter(p => (p.name||'').toString().toLowerCase().includes('binatone'));
    // At least 4: prefer Binatone
    let selected = sortByPriceAsc(binas).slice(0, 4);
    if (selected.length < 4){
      const others = sortByPriceAsc(items.filter(p => !binas.includes(p)));
      selected = selected.concat(others.slice(0, 4 - selected.length));
    }
    clearSkeleton(grid);
    grid.innerHTML = selected.map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function populateAudio(list){
    const grid = document.getElementById('js-audio-speakers-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.audio;
    const items = sortByPriceAsc(list.filter(p => categoryMatch(p, cfg.category, cfg.subcategory)));
    clearSkeleton(grid);
    grid.innerHTML = items.slice(0,4).map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function populatePrinters(list){
    const grid = document.getElementById('js-printers-scanners-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.printers;
    const items = sortByPriceAsc(list.filter(p => categoryMatch(p, cfg.category, cfg.subcategory)));
    clearSkeleton(grid);
    grid.innerHTML = items.slice(0,4).map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function populateMonitors(list){
    const grid = document.getElementById('js-monitors-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.monitors;
    const items = sortByPriceAsc(list.filter(p => categoryMatch(p, cfg.category, cfg.subcategory)));
    clearSkeleton(grid);
    grid.innerHTML = items.slice(0,4).map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function populateComputer(list){
    const grid = document.getElementById('js-computer-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.computer;
    const items = sortByPriceAsc(list.filter(p => categoryMatch(p, cfg.category, cfg.subcategory)));
    clearSkeleton(grid);
    grid.innerHTML = items.slice(0,4).map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function populateMobiles(list){
    const grid = document.getElementById('js-mobile-phones-grid');
    if (!grid) return;
    grid.setAttribute('data-sorted', 'true');
    showSkeleton(grid);
    const cfg = CATEGORY_MAP.mobiles;
    const items = sortByPriceAsc(list.filter(p => categoryMatch(p, cfg.category, null)));
    clearSkeleton(grid);
    grid.innerHTML = items.slice(0,4).map(renderCard).join('');
    insertViewMoreLink(grid, cfg);
  }

  async function initSpecialOffers(){
    ensureHoverStyles();
    const all = await fetchAllProducts();
    await Promise.all([
      populateKitchen(all),
      populateAudio(all),
      populatePrinters(all),
      populateMonitors(all),
      populateComputer(all),
      populateMobiles(all)
    ]);
  }

  document.addEventListener('DOMContentLoaded', function(){
    // run after main scripts
    setTimeout(initSpecialOffers, 0);
  });
})();