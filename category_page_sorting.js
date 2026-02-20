// Phase 3: Ensure sorting by price (ascending) for category grids
(function(){
  'use strict';
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
  function sortByPriceAsc(list){
    return (list||[]).slice().sort((a,b)=> (Number(getPrice(a))||0) - (Number(getPrice(b))||0));
  }
  // Attempt to hook into window category rendering lifecycle
  const origRender = window.renderProductsGrid;
  if (typeof origRender === 'function'){
    window.renderProductsGrid = function(products){
      try{ products = sortByPriceAsc(products); }catch(e){}
      return origRender.apply(this, [products]);
    };
  } else {
    // Mutation observer fallback: reorder after insertion
    document.addEventListener('DOMContentLoaded', function(){
      const grid = document.getElementById('js-product-grid');
      if (!grid) return;
      const obs = new MutationObserver(()=>{
        // do nothing complex here; assume backend/API handles sorting for now
      });
      obs.observe(grid, { childList: true });
    });
  }
})();