// Global Product Sorting Script
// Sorts all product listings by price: lowest to highest
(function() {
    'use strict';

    // Skip execution on search results page to prevent conflicts
    if (window.location.pathname.includes('search-results.html')) {
        return;
    }

    // Helper to extract price from product element
    function getProductPrice(productEl) {
        const priceEl = productEl.querySelector('.product-price');
        if (!priceEl) return 0;

        const priceText = priceEl.textContent.trim();
        // Remove currency symbols and commas
        const cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(/,/g, '');
        const price = parseFloat(cleanPrice);
        return isNaN(price) ? 0 : price;
    }

    // Sort products in a grid by price ascending
    function sortProductGrid(gridEl) {
        if (!gridEl) return;

        // Skip grids that are already pre-sorted (e.g., by homepage_phase1_fixes.js)
        if (gridEl.getAttribute('data-sorted') === 'true') {
            return;
        }

        const products = Array.from(gridEl.children).filter(child =>
            child.classList.contains('product-default') ||
            child.classList.contains('col-6') ||
            child.classList.contains('col-sm-6') ||
            child.classList.contains('col-md-3') ||
            child.classList.contains('col-lg-3') ||
            child.classList.contains('product-card')
        );

        if (products.length < 2) return; // Nothing to sort

        // Sort by price
        products.sort((a, b) => getProductPrice(a) - getProductPrice(b));

        // Re-append in sorted order
        products.forEach(product => {
            gridEl.appendChild(product);
        });
    }

    // Sort all product grids on the page
    function sortAllProductGrids() {
        // Common grid selectors
        const gridSelectors = [
            '#js-top-selling-grid',
            '#js-kitchen-appliances-grid',
            '#js-audio-speakers-grid',
            '#js-printers-scanners-grid',
            '#js-monitors-grid',
            '#js-computer-grid',
            '#js-mobile-phones-grid',
            '#christmas-products',
            '#js-partners', // if applicable
            '.products-grid',
            '.product-grid',
            '[id*="grid"]' // any element with grid in id
        ];

        gridSelectors.forEach(selector => {
            const grids = document.querySelectorAll(selector);
            grids.forEach(sortProductGrid);
        });

        // Also sort any owl carousels or other dynamic content
        // Use a small delay for dynamic content
        setTimeout(() => {
            const dynamicGrids = document.querySelectorAll('.owl-carousel .product-default, .product-list');
            dynamicGrids.forEach(grid => {
                if (grid.children.length > 1) {
                    const products = Array.from(grid.children);
                    products.sort((a, b) => getProductPrice(a) - getProductPrice(b));
                    products.forEach(product => grid.appendChild(product));
                }
            });
        }, 1000);
    }

    // Run on DOM ready and after dynamic content loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sortAllProductGrids);
    } else {
        sortAllProductGrids();
    }

    // Run once after a delay for AJAX-loaded content (reduced from multiple timeouts)
    setTimeout(sortAllProductGrids, 1500);

    // Observe for dynamically added grids
    if ('MutationObserver' in window) {
        const observer = new MutationObserver((mutations) => {
            let shouldSort = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (
                            node.classList?.contains('product-default') ||
                            node.classList?.contains('product-card') ||
                            node.id?.includes('grid')
                        )) {
                            shouldSort = true;
                        }
                    });
                }
            });
            if (shouldSort) {
                setTimeout(sortAllProductGrids, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

})();