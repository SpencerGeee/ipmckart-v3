document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the search results page
    const isSearchResultsPage = window.location.pathname.includes('search-results.html');

    // If we're on the search results page, let the inline script handle it to avoid conflicts
    if (isSearchResultsPage) {
        return;
    }

    // Simple utilities for performance
    function debounce(fn, wait){
        let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
    }
    function throttle(fn, wait){ let last=0, id; return function(...args){ const now=Date.now(); const rem=wait-(now-last); if(rem<=0){ last=now; fn.apply(this,args);} else if(!id){ id=setTimeout(()=>{ last=Date.now(); id=null; fn.apply(this,args); }, rem);} }; }

    const productGrid = document.querySelector('.product-grid');
    const searchResultsInfo = document.querySelector('.search-results-info h3');
    const searchResultsCount = document.querySelector('.search-results-info p');
    const searchQueryInput = document.getElementById('searchQuery');

    let allProducts = [];
    let currentRenderToken = 0; // used to cancel in-flight renders

    // Fetch product data
    fetch('products.grouped2.json')
        .then(response => response.json())
        .then(data => {
            // Flatten the product data
            data.categories.forEach(category => {
                category.subcategories.forEach(subcategory => {
                    allProducts.push(...subcategory.products);
                });
            });

            // Get search query from URL
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q');

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

            if (query) {
                // attach debounced input handler for live search
                if (searchQueryInput){
                    const onInput = debounce(()=>{
                        const q = searchQueryInput.value.trim();
                        performSearch(q);
                    }, 250);
                    searchQueryInput.addEventListener('input', onInput);
                }
                searchQueryInput.value = escapeAttribute(query);
                const escapedQuery = escapeHtml(query);
                searchResultsInfo.innerHTML = `Showing results for: <span class="text-primary">"${escapedQuery}"</span>`;
                performSearch(query);
            }
        });

    function performSearch(query) {
       if (!query){ displayProducts(allProducts); return; }

        const lowerCaseQuery = query.toLowerCase();
        const filteredProducts = allProducts.filter(product => {
            return (
                product.name.toLowerCase().includes(lowerCaseQuery) ||
                product.brand.toLowerCase().includes(lowerCaseQuery) ||
                product.description.toLowerCase().includes(lowerCaseQuery) ||
                product.categoryName.toLowerCase().includes(lowerCaseQuery) ||
                product.subcategoryName.toLowerCase().includes(lowerCaseQuery)
            );
        });

        displayProducts(filteredProducts);
    }

        const sortDropdown = document.querySelector('.dropdown-menu');

    let currentProducts = [];

    sortDropdown.addEventListener('click', function(e) {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            const sortBy = e.target.textContent;
            document.querySelector('.dropdown-toggle').textContent = `Sort by: ${sortBy}`;
            sortProducts(sortBy);
        }
    });

    function sortProducts(sortBy) {
        let sortedProducts = [...currentProducts];

        switch (sortBy) {
            case 'Price: Low to High':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'Newest First':
                // Assuming newer products have higher IDs, this is a simple way to sort by newest.
                // For a real-world scenario, you'd likely have a timestamp.
                sortedProducts.sort((a, b) => b.id.localeCompare(a.id));
                break;
            case 'Customer Rating':
                sortedProducts.sort((a, b) => b.rating - a.rating);
                break;
            default: // Recommended
                // No change for recommended, as it's the default order.
                break;
        }

        displayProducts(sortedProducts);
    }

    const filterOptions = document.querySelectorAll('.filter-option');

    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
            applyFilters();
        });
    });

    function applyFilters() {
        const activeFilters = {};
        document.querySelectorAll('.filter-options').forEach(filterGroup => {
            const filterTitle = filterGroup.previousElementSibling.textContent;
            activeFilters[filterTitle] = [];
            filterGroup.querySelectorAll('.filter-option.active').forEach(option => {
                activeFilters[filterTitle].push(option.textContent);
            });
        });

        let filteredProducts = [...allProducts];

        // Get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
             const lowerCaseQuery = query.toLowerCase();
             filteredProducts = filteredProducts.filter(product => {
                return (
                    product.name.toLowerCase().includes(lowerCaseQuery) ||
                    product.brand.toLowerCase().includes(lowerCaseQuery) ||
                    product.description.toLowerCase().includes(lowerCaseQuery) ||
                    product.categoryName.toLowerCase().includes(lowerCaseQuery) ||
                    product.subcategoryName.toLowerCase().includes(lowerCaseQuery)
                );
            });
        }

        // Apply brand filters
        if (activeFilters['Brand'] && activeFilters['Brand'].length > 0) {
            filteredProducts = filteredProducts.filter(product => activeFilters['Brand'].includes(product.brand));
        }

        // Apply price filters
        if (activeFilters['Price'] && activeFilters['Price'].length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                return activeFilters['Price'].some(priceRange => {
                    if (priceRange === 'Under ₵1,000') return product.price < 1000;
                    if (priceRange === '₵1,000 - ₵3,000') return product.price >= 1000 && product.price <= 3000;
                    if (priceRange === '₵3,000 - ₵5,000') return product.price >= 3000 && product.price <= 5000;
                    if (priceRange === 'Over ₵5,000') return product.price > 5000;
                    return false;
                });
            });
        }

        displayProducts(filteredProducts);
    }

    // Security functions (already defined above)
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

    function displayProducts(products) {
       // cancel any ongoing incremental render
       const myToken = ++currentRenderToken;

        currentProducts = products;
        productGrid.innerHTML = '';
        searchResultsCount.textContent = `${products.length} products found`;

        if (products.length === 0) {
            productGrid.innerHTML = '<div class="no-results"><h3>No products found</h3><p>We couldn\'t find any products matching your search.</p></div>';
            return;
        }

        // Clear grid first
        productGrid.innerHTML = '';

        // Incremental virtualization: render in batches to avoid long tasks
        const BATCH = 24;
        let i = 0;
        function renderChunk(){
            if (myToken !== currentRenderToken) return; // canceled by a new search
            const frag = document.createDocumentFragment();
            for(let c=0; c<BATCH && i<products.length; c++, i++){
                const product = products[i];
            // Escape all user input
            const escapedName = escapeHtml(product.name);
            const escapedAttrName = escapeAttribute(product.name);
            const escapedId = escapeAttribute(product.id);
            const escapedImage = escapeAttribute(product.images[0] || 'assets/images/placeholder.webp"');

            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <figure>
                    <a href="product.html?id=${escapedId}" aria-label="View ${escapedAttrName}">
                        <img src="${escapedImage}" alt="${escapedAttrName}" loading="lazy" decoding="async" width="300" height="300">
                    </a>
                </figure>
                <div class="product-details">
                    <h3 class="product-title">
                        <a href="product.html?id=${escapedId}">${escapedName}</a>
                    </h3>
                    <div class="price-box">
                        <span class="product-price">₵${product.price.toFixed(2)}</span>
                    </div>
                    <div class="product-action">
                        <button class="btn btn-add-cart" data-product-id="${escapedId}" aria-label="Add ${escapedAttrName} to cart" type="button">Add to Cart</button>
                    </div>
                </div>
            `;

            frag.appendChild(productCard);
            }
            productGrid.appendChild(frag);
            if (i < products.length){
                // schedule next chunk
                if ('requestIdleCallback' in window){ requestIdleCallback(renderChunk, { timeout: 100 }); }
                else { setTimeout(renderChunk, 0); }
            }
        }
        renderChunk();

        // Event delegation for add to cart (single listener)
        if (!productGrid._hasCartHandler){
            productGrid._hasCartHandler = true;
            productGrid.addEventListener('click', function(e) {
            const addToCartBtn = e.target.closest('.btn-add-cart');
            if (addToCartBtn) {
                const productId = addToCartBtn.dataset.productId;
                if (window.CartManager && typeof window.CartManager.addToCart === 'function') {
                    window.CartManager.addToCart(productId);
                }
            }
        });
    }
});
