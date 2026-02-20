document.addEventListener('DOMContentLoaded', function () {
    // Handle both fixed navbar and sticky navbar search
    const searchForm = document.querySelector('.header-search form');
    const searchInput = document.getElementById('q');
    const searchInputSticky = document.getElementById('q1'); // Sticky navbar search
    const searchWrapper = document.querySelector('.header-search-wrapper');
    const searchWrapperSticky = document.querySelector('.header-right .header-search .header-search-wrapper'); // Sticky navbar wrapper

    // Initialize search preview for both inputs
    if (searchInput && searchWrapper) {
        initSearchPreview(searchInput, searchWrapper, searchForm);
    }
    
    if (searchInputSticky && searchWrapperSticky) {
        const searchFormSticky = searchWrapperSticky.closest('form');
        if (searchFormSticky) {
            initSearchPreview(searchInputSticky, searchWrapperSticky, searchFormSticky);
        }
    }
});

function initSearchPreview(searchInput, searchWrapper, searchForm) {
    if (!searchInput || !searchWrapper || !searchForm) {
        return;
    }

    // Create suggestions dropdown
    const suggestionsDropdown = document.createElement('div');
    suggestionsDropdown.className = 'search-suggestions';
    searchWrapper.appendChild(suggestionsDropdown);

    // Inject some styles for the suggestions dropdown
    const style = document.createElement('style');
    style.innerHTML = `
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            border: 1px solid #e1e1e1;
            border-top: none;
            max-height: 400px;
            overflow-y: auto;
            display: none;
            z-index: 1000;
        }
        .suggestion-item {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #f5f5f5;
            text-decoration: none;
            color: #333;
        }
        .suggestion-item:hover {
            background: #f9f9f9;
        }
        .suggestion-item img {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            object-fit: contain;
        }
        .suggestion-item-info h5 {
            margin: 0;
            font-size: 1.1rem; /* Increased font size */
            font-weight: 600; /* Bolder font */
            color: #222;
        }
        .suggestion-item-info p {
            margin: 0;
            font-size: 1rem; /* Increased font size */
            color: var(--primary-red, #ff0000); /* Use theme color for price */
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);

    let allProducts = [];

    // Fetch product data
    fetch('products.grouped2.json')
        .then(response => response.json())
        .then(data => {
            data.categories.forEach(category => {
                category.subcategories.forEach(subcategory => {
                    allProducts.push(...subcategory.products);
                });
            });
        });

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();

        if (query.length < 2) {
            suggestionsDropdown.style.display = 'none';
            return;
        }

        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.brand.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 suggestions

        if (filteredProducts.length > 0) {
            suggestionsDropdown.innerHTML = '';
            filteredProducts.forEach(product => {
                const item = document.createElement('a');
                item.href = `product.html?id=${product.id}`;
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="suggestion-item-info">
                        <h5>${product.name}</h5>
                        <p>₵${product.price.toFixed(2)}</p>
                    </div>
                `;
                suggestionsDropdown.appendChild(item);
            });
            suggestionsDropdown.style.display = 'block';
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!searchWrapper.contains(e.target)) {
            suggestionsDropdown.style.display = 'none';
        }
    });

    // Handle form submission
    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
        }
    });
}
