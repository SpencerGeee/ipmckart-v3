(function () {
    'use strict';

    // --- Global State ---
    let currentProductsPage = 1;
    let currentProductCategory = '';
    const productsPerPage = 10;

    let currentOrdersPage = 1;
    let currentOrderStatus = '';
    const ordersPerPage = 10;

    let currentUsersPage = 1;
    let currentUserRole = '';
    const usersPerPage = 15;
    
// --- Helper: Fetch with Authentication ---
    async function fetchWithAuth(url, options = {}) {
        if (!options.headers) {
            options.headers = {};
        }
        options.credentials = 'include';

        // Only set Content-Type to application/json if body is not FormData
        if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, options);
        return handleFetchError(response);
    }

    // --- Helper function to handle fetch errors ---
    async function handleFetchError(response) {
        if (!response.ok) {
        // If unauthenticated -> redirect to login
        if (response.status === 401) {
            console.error('Auth Error. Redirecting to login.');
            localStorage.removeItem('authToken'); // Clear bad token
            window.location.href = '/login.html?redirect=admin.html&error=session_expired';
            throw new Error('Auth Error');
        }
        // For 403 (forbidden) do NOT auto-redirect; let caller handle it (show toast or modal message)
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

        
        const contentType = response.headers.get('content-type');
        if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
            return null; // Return null for empty or non-JSON responses
        }
        return response.json();
    }

    // --- Notification Toast ---
    const toastElement = document.getElementById('toast');
    const toastText = toastElement ? toastElement.querySelector('p') : null;
    let toastTimeout;
    function showToast(message, type = 'success') {
        if (!toastElement || !toastText) return;
        clearTimeout(toastTimeout);
        
        toastText.textContent = message;
        toastElement.style.borderColor = (type === 'danger' || type === 'warning') ? 'var(--primary-red)' : '#28a745';
        toastElement.classList.add('active');
        
        toastTimeout = setTimeout(() => {
            toastElement.classList.remove('active');
        }, 3000);
    }

    // --- Loading Overlay ---
    const loadingOverlay = document.querySelector('.loading-overlay');
    function showLoading() {
        if(loadingOverlay) loadingOverlay.classList.add('active');
    }
    function hideLoading() {
        if(loadingOverlay) loadingOverlay.classList.remove('active');
    }

    // --- View Navigation ---
    function showView(targetView) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });

        const viewToShow = document.getElementById(targetView);
        if (viewToShow) {
            viewToShow.classList.add('active');
            viewToShow.style.display = 'block';

            // Load data for the view
            if (targetView === 'dashboard-view') {
                loadDashboardStats();
            } else if (targetView === 'orders-view') {
                loadOrders(1, currentOrderStatus);
            } else if (targetView === 'products-view') {
                // Populate subcategory filter based on current category
                const productCategoryFilter = document.getElementById('productCategoryFilter');
                const productSubcategoryFilter = document.getElementById('productSubcategoryFilter');

                if (productCategoryFilter && productSubcategoryFilter) {
                    const catVal = currentProductCategory || productCategoryFilter.value || '';
                    if (catVal) {
                        productSubcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
                        const subs = CATEGORY_MAP[catVal] || [];
                        subs.forEach(sid => {
                            const opt = document.createElement('option');
                            opt.value = sid;
                            opt.textContent = SUBCATEGORY_LABELS[sid] || sid;
                            productSubcategoryFilter.appendChild(opt);
                        });
                        productSubcategoryFilter.disabled = subs.length === 0;
                        // Set current subcategory value if exists and is valid for this category
                        if (currentProductSubcategory && subs.includes(currentProductSubcategory)) {
                            productSubcategoryFilter.value = currentProductSubcategory;
                        } else if (currentProductSubcategory) {
                            // If current subcategory doesn't belong to new category, reset it
                            currentProductSubcategory = '';
                            productSubcategoryFilter.value = '';
                        }
                    } else {
                        productSubcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
                        productSubcategoryFilter.disabled = true;
                        currentProductSubcategory = '';
                    }
                }

                loadProducts(1, currentProductCategory, currentProductSearch, currentProductSubcategory);
            } else if (targetView === 'users-view') {
                loadUsers(1, currentUserRole);
            } else if (targetView === 'promos-view') {
                loadPromosProducts(1);
                updateDiscountVisibility();
            } else if (targetView === 'quota-view') {
                loadQuotas();
            } else if (targetView === 'home-assets-view') {
                initHomeAssets();
                homeAssetsFetchAll();
            } else if (targetView === 'logs-view') {
                loadLogFiles();
            } else if (targetView === 'bulk-price-view') {
                // Bulk price view - just show, no data loading needed
                console.log('Bulk price view activated');
            }
        }

        document.querySelectorAll('.admin-sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetView) {
                link.classList.add('active');
            }
        });

        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
            document.getElementById('sidebarToggle').innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
    window.showView = showView; // Expose for onclick attributes

    // --- Pagination ---
    function renderPagination(containerId, currentPage, totalPages, loadFunction) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        if (totalPages <= 1) return;

        const ul = document.createElement('ul');
        ul.className = 'pagination';

        const createPageItem = (page, text, isDisabled = false, isActive = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${page}">${text}</a>`;
            return li;
        };

        ul.appendChild(createPageItem(currentPage - 1, 'Previous', currentPage === 1));

        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            ul.appendChild(createPageItem(1, '1'));
            if (startPage > 2) {
                ul.appendChild(createPageItem(null, '...', true));
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
             ul.appendChild(createPageItem(i, i, false, i === currentPage));
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                ul.appendChild(createPageItem(null, '...', true));
            }
            ul.appendChild(createPageItem(totalPages, totalPages));
        }

        ul.appendChild(createPageItem(currentPage + 1, 'Next', currentPage === totalPages));

        ul.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target;
            if (target.tagName === 'A' && !target.closest('.page-item').classList.contains('disabled')) {
                const page = parseInt(target.getAttribute('data-page'));
                if (page) {
                    // Call the appropriate load function with its filters
                    if (loadFunction.name === "loadProducts") {
                        loadFunction(page, currentProductCategory, currentProductSearch, currentProductSubcategory);
                    } else if (loadFunction.name === "loadOrders") {
                        loadFunction(page, currentOrderStatus);
                    } else if (loadFunction.name === "loadUsers") {
                        loadFunction(page, currentUserRole);
                    } else {
                        loadFunction(page); // Fallback
                    }
                }
            }
        });
        container.appendChild(ul);
    }
    
    // --- Counter Animation ---
    function animateValue(element, start, end, duration) {
        if (!element) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            if (element.id === 'totalRevenue') {
                element.textContent = '₵' + value.toLocaleString();
            } else {
                element.textContent = value.toLocaleString();
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- Dashboard ---
    function loadDashboardStats() {
        showLoading();
        fetchWithAuth('/api/admin/stats')
            .then(data => {
                hideLoading();
                animateValue(document.getElementById('totalOrders'), 0, data.totalOrders, 1500);
                animateValue(document.getElementById('totalUsers'), 0, data.totalUsers, 1500);
                animateValue(document.getElementById('totalRevenue'), 0, data.totalRevenue, 1500);
                animateValue(document.getElementById('pendingOrders'), 0, data.pendingOrders, 1500);
                loadRecentOrders();
            })
            .catch(error => {
                hideLoading();
                console.error('Error fetching dashboard stats:', error);
                showToast(`Error loading dashboard: ${error.message}`, 'danger');
            });
    }

    function loadRecentOrders() {
        fetchWithAuth('/api/admin/orders?limit=5') // Get top 5 recent
            .then(data => {
                const ordersTableBody = document.getElementById('recentOrdersBody');
                ordersTableBody.innerHTML = '';
                
                if (!data || !data.data || data.data.length === 0) {
                    ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recent orders found.</td></tr>';
                    return;
                }
                
                data.data.forEach(order => {
                    const status = order.status || 'pending';
                    const row = `
                        <tr>
                            <td>${order.date}</td>
                            <td>#${order.id.slice(-6).toUpperCase()}</td>
                            <td>${order.customer}</td>
                            <td>₵${(Number(order.total) || 0).toFixed(2)}</td>
                            <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                        </tr>
                    `;
                    ordersTableBody.innerHTML += row;
                });
            })
            .catch(error => {
                const ordersTableBody = document.getElementById('recentOrdersBody');
                if(ordersTableBody) {
                    ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading orders.</td></tr>';
                }
                console.error('Error fetching recent orders:', error);
            });
    }

    // --- Products ---
    let currentProductSearch = '';
    let currentProductSubcategory = '';
    async function loadProducts(page = 1, category = '', q = currentProductSearch, subcategory = currentProductSubcategory) {
        currentProductsPage = page;
        currentProductCategory = category;
        showLoading();
        try {
            currentProductSubcategory = subcategory || '';
            const categoryQuery = category ? `&category=${encodeURIComponent(category)}` : '';
            const subcategoryQuery = currentProductSubcategory ? `&subcategory=${encodeURIComponent(currentProductSubcategory)}` : '';
            const searchQuery = q ? `&q=${encodeURIComponent(q)}` : '';
            const data = await fetchWithAuth(`/api/products?page=${page}&limit=${productsPerPage}&admin=true${categoryQuery}${subcategoryQuery}${searchQuery}`);
            renderProductsTable(data.data);
            renderPagination('productsPagination', data.pagination.page, data.pagination.totalPages, loadProducts);
        } catch (error) {
           console.error('Error fetching products:', error);
           document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error fetching products.</td></tr>';
           showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    function renderProductsTable(products) {
        const tableBody = document.getElementById('productsTableBody');
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No products found.</td></tr>';
            return;
        }

        // Ensure bulk move toolbar exists and wired
       ensureBulkMoveToolbar();
       products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="product-select" data-id="${product._id || ''}" data-slug="${product.slug}"></td>
                <td>
                    <img src="${(() => { const u = (Array.isArray(product.images) ? product.images[0] : (product.images && product.images.split(',')[0])); return u ? `${u}?v=${encodeURIComponent(product.updatedAt || Date.now())}` : 'https://placehold.co/60x60/333/fff?text=No+Img'; })()}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px; vertical-align: middle;"
                         onerror="this.src='https://placehold.co/60x60/333/fff?text=Error';">
                    <span style="vertical-align: middle;">${product.name}</span>
                </td>
                <td>${product.category || 'N/A'}</td>
                <td>
                  <select class="form-select form-select-sm inline-subcategory" data-slug="${product.slug}" style="min-width: 180px;">
                    ${(() => {
                      const options = [];
                      const catMap = CATEGORY_MAP || {};
                      const labels = SUBCATEGORY_LABELS || {};
                      Object.keys(catMap).forEach(catId => {
                        const subs = catMap[catId] || [];
                        subs.forEach(sid => {
                          const sel = sid === (product.subcategory || '') ? 'selected' : '';
                          options.push(`<option value="${sid}" ${sel}>${labels[sid] || sid}</option>`);
                        });
                      });
                      return options.join('');
                    })()}
                  </select>
                </td>
                <td>₵${product.price ? Number(product.price).toFixed(2) : '0.00'}</td>
                <td>${product.stock}</td>
                <td>${product.rating || '0'} <i class="fas fa-star" style="color: #ffc107;"></i></td>
                <td>
                    <button class="btn btn-sm btn-info action-btn btn-edit" data-slug="${product.slug}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger action-btn btn-delete" data-slug="${product.slug}" data-name="${product.name}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Orders ---
    async function loadOrders(page = 1, status = '') {
        currentOrdersPage = page;
        currentOrderStatus = status;
        showLoading();
        try {
            const statusQuery = status ? `&status=${encodeURIComponent(status)}` : '';
            const data = await fetchWithAuth(`/api/admin/orders?page=${page}&limit=${ordersPerPage}${statusQuery}`);
            renderOrdersTable(data.data);
            renderPagination('ordersPagination', data.pagination.page, data.pagination.totalPages, loadOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error fetching orders.</td></tr>';
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    function renderOrdersTable(orders) {
        const tableBody = document.getElementById('ordersTableBody');
        tableBody.innerHTML = '';
        if (!orders || orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const status = order.status || 'pending';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.date}</td>
                <td>#${order.id.slice(-6).toUpperCase()}</td>
                <td>${order.customer}</td>
                <td>₵${(Number(order.total) || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary action-btn btn-view-order" data-id="${order.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning action-btn btn-update-status" data-id="${order.id}" data-current-status="${status}" title="Update Status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Users ---
    async function loadUsers(page = 1, role = '') {
        currentUsersPage = page;
        currentUserRole = role;
        showLoading();
        try {
            const roleQuery = role ? `&role=${encodeURIComponent(role)}` : '';
            const data = await fetchWithAuth(`/api/admin/users?page=${page}&limit=${usersPerPage}${roleQuery}`);
            renderUsersTable(data.data);
            renderPagination('usersPagination', data.pagination.page, data.pagination.totalPages, loadUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error fetching users.</td></tr>';
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    function renderUsersTable(users) {
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const isActive = user.isActive !== false;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info action-btn btn-edit-role" data-userid="${user._id}" data-current-role="${user.role}" data-name="${user.name}" title="Edit Role">
                        <i class="fas fa-user-shield"></i>
                    </button>
                    <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'} action-btn btn-toggle-active" data-userid="${user._id}" data-is-active="${isActive}" data-name="${user.name}" title="${isActive ? 'Deactivate' : 'Activate'}">
                        <i class="fas ${isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Promos ---
    let currentPromosPage = 1;
    let currentPromosSearch = '';
    let currentPromosAssignedOnly = true;
    const promosPerPage = 10;
    async function loadPromosProducts(page = 1, q = currentPromosSearch) {
        currentPromosPage = page;
        currentPromosSearch = q || '';
        showLoading();
        try {
            const type = document.getElementById('promoTypeSelect')?.value || '';
            const searchQuery = currentPromosSearch ? `&q=${encodeURIComponent(currentPromosSearch)}` : '';
            const typeQuery = type ? `&promoType=${encodeURIComponent(type)}` : '';
            const assignedOnly = (document.getElementById('promoAssignedOnlyToggle')?.checked ?? currentPromosAssignedOnly);
            currentPromosAssignedOnly = !!assignedOnly;
            const assigned = `&assignedOnly=${assignedOnly ? 'true' : 'false'}`;
            const data = await fetchWithAuth(`/api/products?page=${page}&limit=${promosPerPage}&admin=true${typeQuery}${assigned}${searchQuery}`);
            renderPromosProductsTable(data.data);
            // Apply status column visibility based on toggle
            const promosTable = document.querySelector('#promos-view table');
            if (promosTable) promosTable.classList.toggle('promo-hide-status', assignedOnly);
            // Keep the toggle UI in sync if it rendered late
            const toggle = document.getElementById('promoAssignedOnlyToggle');
            if (toggle && toggle.checked !== currentPromosAssignedOnly) toggle.checked = currentPromosAssignedOnly;
            renderPagination('promosProductsPagination', data.pagination.page, data.pagination.totalPages, loadPromosProducts);
        } catch (e) {
            console.error('Error loading promo products:', e);
            const body = document.getElementById('promosProductsTableBody');
            if (body) body.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error fetching products.</td></tr>';
        } finally {
            hideLoading();
        }
    }
    function renderPromosProductsTable(items) {
        const body = document.getElementById('promosProductsTableBody');
        if (!body) return;
        body.innerHTML = '';
        if (!items || items.length === 0) {
            body.innerHTML = '<tr><td colspan="7" class="text-center">No products found.</td></tr>';
            return;
        }
        const type = document.getElementById('promoTypeSelect')?.value || '';
        items.forEach(p => {
            const isAssigned = (type === 'flash-sales') ? !!p.isFlashSale
                           : (type === 'black-friday') ? !!p.isBlackFriday
                           : (type === 'christmas-sale') ? !!p.isChristmas
                           : (type === 'back-to-school') ? !!p.isBackToSchool
                           : (type === 'new-year') ? !!p.isNewYear
                           : (type === 'top-selling') ? !!p.isTopSelling
                           : (type === 'combo-deals') ? !!p.isComboDeals
                           : false;
            const statusBadge = isAssigned
                ? '<span class="badge bg-success">Assigned</span>'
                : '<span class="badge bg-secondary">Not assigned</span>';
            const tr = document.createElement('tr');
            const basePrice = p.price ? Number(p.price) : 0;
            const promoPriceVal = (type === 'flash-sales') ? (p.flashSalePrice ?? null)
                                : (type === 'black-friday') ? (p.blackFridayPrice ?? null)
                                : (type === 'christmas-sale') ? (p.christmasSalePrice ?? null)
                                : (type === 'back-to-school') ? (p.backToSchoolPrice ?? null)
                                : (type === 'new-year') ? (p.newYearPrice ?? null)
                                : (type === 'combo-deals') ? (p.comboDealsPrice ?? null)
                                : null;
            const currentPromoPrice = (promoPriceVal != null) ? Number(promoPriceVal) : '';
            const currentPercent = (currentPromoPrice !== '' && basePrice>0) ? Math.round((1 - (currentPromoPrice/basePrice))*100) : '';
            tr.innerHTML = `
                <td><input type="checkbox" class="promo-product-select" data-slug="${p.slug}"></td>
                <td>
                  <img src="${(() => { const u = (Array.isArray(p.images) ? p.images[0] : (p.images && p.images.split(',')[0])); return u ? `${u}?v=${encodeURIComponent(p.updatedAt || Date.now())}` : 'https://placehold.co/60x60/333/fff?text=No+Img'; })()}"
                       alt="${p.name}"
                       style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px; vertical-align: middle;"
                       onerror="this.src='https://placehold.co/60x60/333/fff?text=Error';">
                  <span style="vertical-align: middle;">${p.name}</span>
                </td>
                <td>${statusBadge}</td>
                <td>${p.category || ''}</td>
                <td>${p.subcategory || ''}</td>
                <td>₵${basePrice.toFixed(2)}</td>
                <td>
                  <input type="number" class="form-control form-control-sm promo-price" data-slug="${p.slug}" data-base="${basePrice}" min="0" step="0.01" placeholder="e.g. 99.99" value="${currentPromoPrice}">
                </td>
                <td>
                  <div class="input-group input-group-sm">
                    <input type="number" class="form-control form-control-sm promo-percent" data-slug="${p.slug}" data-base="${basePrice}" min="0" max="95" step="1" placeholder="%" value="${currentPercent}">
                    <span class="input-group-text">%</span>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <img src="${getPromoImageSrc(type, p)}"
                         alt="Promo Image"
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 10px;"
                         onerror="this.src='https://placehold.co/60x60/333/fff?text=No+Promo+Img';">
                    <input type="file" class="form-control form-control-sm promo-image-upload" data-slug="${p.slug}" accept="image/*" style="font-size: 0.75rem; padding: 0.25rem;">
                  </div>
                </td>
                <td>${p.stock ?? 0}</td>
                <td>
                  <button class="btn btn-sm btn-outline-light btn-apply-pricing" data-slug="${p.slug}">Apply</button>
                </td>
            `;
            body.appendChild(tr);
        });
        const selectAll = document.getElementById('selectAllPromoProducts');
        if (selectAll) {
            selectAll.checked = false;
            selectAll.onchange = () => {
                document.querySelectorAll('#promosProductsTableBody .promo-product-select').forEach(cb => { cb.checked = selectAll.checked; });
            };
        }
        // Ensure direct checkbox clicks don't bubble to row handler
        body.querySelectorAll('.promo-product-select').forEach(cb => {
            cb.addEventListener('click', (ev) => { ev.stopPropagation(); });
        });
        // Toggle checkbox when clicking row (but not when clicking on interactive elements)
        // Live syncing between price and percent inputs per row
        body.addEventListener('input', (e) => {
            const priceInput = e.target.closest('input.promo-price');
            const percentInput = e.target.closest('input.promo-percent');
            if (priceInput) {
                const base = Number(priceInput.dataset.base || '0');
                const val = Number(priceInput.value || '0');
                const pct = base>0 ? Math.round((1 - (val/base))*100) : 0;
                const rowPct = priceInput.closest('tr')?.querySelector('input.promo-percent');
                if (rowPct) rowPct.value = isFinite(pct) ? Math.max(0, Math.min(95, pct)) : '';
            }
            if (percentInput) {
                const base = Number(percentInput.dataset.base || '0');
                const pct = Math.max(0, Math.min(95, Number(percentInput.value || '0')));
                const price = base * (1 - pct/100);
                const rowPrice = percentInput.closest('tr')?.querySelector('input.promo-price');
                if (rowPrice) rowPrice.value = isFinite(price) ? price.toFixed(2) : '';
            }
        });

        body.onclick = async (e) => {
            const btnApply = e.target.closest('button.btn-apply-pricing');
            if (btnApply) {
                const tr = btnApply.closest('tr');
                const slug = tr.querySelector('.promo-product-select')?.dataset.slug;
                const priceVal = tr.querySelector('input.promo-price')?.value;
                const percentVal = tr.querySelector('input.promo-percent')?.value;
                const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';
                if (!slug) return;
                showLoading();
                try {
                    const res = await fetchWithAuth('/api/admin/promos/update-pricing', {
                        method: 'POST',
                        body: JSON.stringify({ promoType: type, items: [{ slug, promoPrice: priceVal? Number(priceVal): undefined, discountPercent: percentVal? Number(percentVal): undefined }] })
                    });
                    showToast(res?.message || 'Pricing updated');
                    await loadPromosProducts(currentPromosPage, currentPromosSearch);
                } catch (err) {
                    console.error('Apply pricing failed:', err);
                    showToast(`Apply pricing failed: ${err.message}`, 'danger');
                } finally {
                    hideLoading();
                }
                return; // stop further handling
            }

            const inputDirect = e.target.closest('input,button,a,select,label');
            if (inputDirect && inputDirect.classList.contains('promo-product-select')) return; // normal checkbox behavior
            if (inputDirect && !inputDirect.classList.contains('promo-product-select')) return; // don't toggle if clicked on other controls
            const tr = e.target.closest('tr');
            if (!tr) return;
            const cb = tr.querySelector('.promo-product-select');
            if (cb) {
                cb.checked = !cb.checked;
            }
            // Update selectAll state
            if (selectAll) {
                const all = Array.from(document.querySelectorAll('#promosProductsTableBody .promo-product-select'));
                const allChecked = all.length > 0 && all.every(c => c.checked);
                selectAll.checked = allChecked;
                selectAll.indeterminate = !allChecked && all.some(c => c.checked);
            }
        };

        // Add event listener for promo image uploads
        body.addEventListener('change', async (e) => {
            const fileInput = e.target.closest('input.promo-image-upload');
            if (fileInput) {
                const slug = fileInput.dataset.slug;
                const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';

                const file = fileInput.files[0];
                if (!file) return;

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select a valid image file', 'warning');
                    return;
                }

                showLoading();
                try {
                    // Upload the image
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('promoType', type);

                    const response = await fetchWithAuth(`/api/products/${slug}/promo-image`, {
                        method: 'POST',
                        body: formData
                    });

                    showToast('Promo image updated successfully');
                    await loadPromosProducts(currentPromosPage, currentPromosSearch);
                } catch (err) {
                    console.error('Promo image upload failed:', err);
                    showToast(`Image upload failed: ${err.message}`, 'danger');
                } finally {
                    hideLoading();
                }
            }
        });
    }

    function getPromoImageSrc(type, product) {
        const promoImageFields = {
            'flash-sales': product.flashSaleImage || (Array.isArray(product.images) && product.images[0]) || '',
            'black-friday': product.blackFridayImage || (Array.isArray(product.images) && product.images[0]) || '',
            'christmas-sale': product.christmasSaleImage || (Array.isArray(product.images) && product.images[0]) || '',
            'back-to-school': product.backToSchoolImage || (Array.isArray(product.images) && product.images[0]) || '',
            'new-year': product.newYearImage || (Array.isArray(product.images) && product.images[0]) || '',
            'valentines': product.valentinesImage || (Array.isArray(product.images) && product.images[0]) || '',
            'combo-deals': product.comboDealsImage || (Array.isArray(product.images) && product.images[0]) || ''
        };

        const imageSrc = promoImageFields[type] || (Array.isArray(product.images) && product.images[0]) || 'https://placehold.co/60x60/333/fff?text=No+Promo+Img';
        return imageSrc ? `${imageSrc}?v=${encodeURIComponent(product.updatedAt || Date.now())}` : 'https://placehold.co/60x60/333/fff?text=No+Promo+Img';
    }

    function updateDiscountVisibility() {
        const type = document.getElementById('promoTypeSelect')?.value;
        const wrap = document.getElementById('discountWrapper');
        // Only show discount for flash-sales; hide for others including top-selling
        if (wrap) wrap.style.display = (type === 'flash-sales') ? 'block' : 'none';
    }
    document.getElementById('promoTypeSelect')?.addEventListener('change', () => { updateDiscountVisibility(); loadPromosProducts(1); });
    document.getElementById('promoAssignedOnlyToggle')?.addEventListener('change', () => { loadPromosProducts(1); });

    // Search with debounce
    (function(){
      const input = document.getElementById('promoSearchInput');
      const clearBtn = document.getElementById('promoSearchClearBtn');
      let t;
      if (input) {
        input.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => { loadPromosProducts(1, input.value.trim()); }, 300);
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => { if (input) input.value=''; loadPromosProducts(1, ''); });
      }
    })();

    // Assign selected
    document.getElementById('assignToPromoBtn')?.addEventListener('click', async () => {
        const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';
        const discount = parseInt(document.getElementById('promoDiscountPercent')?.value || '0', 10) || 0;
        const slugs = Array.from(document.querySelectorAll('.promo-product-select:checked')).map(cb => cb.dataset.slug);
        if (!slugs.length) { showToast('Select at least one product', 'warning'); return; }
        showLoading();
        try {
            const res = await fetchWithAuth('/api/admin/promos/assign', {
                method: 'POST',
                body: JSON.stringify({ promoType: type, productSlugs: slugs, discountPercent: discount })
            });
            showToast(res?.message || 'Assigned to promo');
        } catch (e) {
            console.error('Assign promo failed:', e);
            showToast(`Assign failed: ${e.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    // Save selected pricing
    document.getElementById('savePricingBtn')?.addEventListener('click', async () => {
        const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';
        const rows = Array.from(document.querySelectorAll('#promosProductsTableBody tr'));
        const selected = rows.filter(r => r.querySelector('.promo-product-select')?.checked);
        if (!selected.length) { showToast('Select at least one product to save pricing', 'warning'); return; }
        const items = selected.map(r => {
            const slug = r.querySelector('.promo-product-select')?.dataset.slug;
            const promoPrice = r.querySelector('input.promo-price')?.value;
            const discountPercent = r.querySelector('input.promo-percent')?.value;
            return { slug, promoPrice: promoPrice? Number(promoPrice): undefined, discountPercent: discountPercent? Number(discountPercent): undefined };
        });
        showLoading();
        try {
            const res = await fetchWithAuth('/api/admin/promos/update-pricing', {
                method: 'POST',
                body: JSON.stringify({ promoType: type, items })
            });
            showToast(res?.message || 'Pricing updated');
            await loadPromosProducts(currentPromosPage, currentPromosSearch);
        } catch (e) {
            console.error('Save pricing failed:', e);
            showToast(`Save pricing failed: ${e.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    // Unassign selected
    document.getElementById('unassignFromPromoBtn')?.addEventListener('click', async () => {
        const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';
        const slugs = Array.from(document.querySelectorAll('.promo-product-select:checked')).map(cb => cb.dataset.slug);
        if (!slugs.length) { showToast('Select at least one product', 'warning'); return; }
        showLoading();
        try {
            const res = await fetchWithAuth('/api/admin/promos/unassign', {
                method: 'POST',
                body: JSON.stringify({ promoType: type, productSlugs: slugs })
            });
            showToast(res?.message || 'Removed from promo');
        } catch (e) {
            console.error('Unassign promo failed:', e);
            showToast(`Remove failed: ${e.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    // Regenerate
    document.getElementById('regeneratePromoBtn')?.addEventListener('click', async () => {
        const type = document.getElementById('promoTypeSelect')?.value || 'flash-sales';
        showLoading();
        try {
            const res = await fetchWithAuth(`/api/admin/promos/regenerate?promoType=${encodeURIComponent(type)}`, { method: 'POST' });
            showToast(res?.message || 'Regenerated');
        } catch (e) {
            console.error('Regenerate promo failed:', e);
            showToast(`Regenerate failed: ${e.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    // Selection helpers
    document.getElementById('selectVisiblePromoBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.promo-product-select').forEach(cb => { cb.checked = true; });
    });
    document.getElementById('clearSelectionPromoBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.promo-product-select').forEach(cb => { cb.checked = false; });
        const selectAll = document.getElementById('selectAllPromoProducts');
        if (selectAll) selectAll.checked = false;
    });

    // --- Reports ---
    function generateReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        if (!startDate || !endDate) {
            showToast('Please select both start and end dates', 'warning');
            return;
        }
        
        showLoading();
        fetchWithAuth('/api/admin/report', {
            method: 'POST',
            body: JSON.stringify({ startDate, endDate })
        })
        .then(data => {
            hideLoading();
            document.getElementById('reportSummary').innerHTML = `
                <h5 style="color: var(--luxury-gold);">Report Generated</h5>
                <p class="mb-2"><strong>Period:</strong> ${data.period}</p>
                <p class="mb-2"><strong>Total Orders (Paid):</strong> ${data.totalOrders.toLocaleString()}</p>
                <p class="mb-2"><strong>Total Revenue:</strong> ₵${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p class="mb-0"><strong>Average Order Value:</strong> ₵${data.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            `;
            showToast('Report generated successfully!');
        })
        .catch(error => {
            hideLoading();
            console.error('Report generation error:', error);
            showToast(`Error generating report: ${error.message}`, 'danger');
        });
    }
    // Bind generate report to button to avoid inline onclick (CSP compliant)
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);

    // --- Logs ---
    let logAutoRefreshInterval;
    async function loadLogFiles() {
        const container = document.getElementById('logContainer');
        const timestamp = document.getElementById('logTimestamp');
        
        // Only show loading if empty or manually triggered (not auto-refresh)
        if (!container.hasChildNodes() || !logAutoRefreshInterval) {
            // showLoading(); // Optional: don't block UI for logs
        }

        try {
            const data = await fetchWithAuth('/api/admin/logs');
            
            if (data && data.logs) {
                // ANSI Color Code parsing (simple version)
                const formattedLogs = data.logs.map(line => {
                    if (!line) return '';
                    // Basic color replacements
                    let html = line
                        .replace(/\[31m/g, '<span style="color:#ff5555">') // Red
                        .replace(/\[32m/g, '<span style="color:#50fa7b">') // Green
                        .replace(/\[33m/g, '<span style="color:#f1fa8c">') // Yellow
                        .replace(/\[34m/g, '<span style="color:#bd93f9">') // Blue
                        .replace(/\[36m/g, '<span style="color:#8be9fd">') // Cyan
                        .replace(/\[39m/g, '</span>')
                        .replace(/\[0m/g, '</span>');
                    
                    return `<div class="log-line" style="border-bottom: 1px solid #222; padding: 2px 0;">${html}</div>`;
                }).join('');

                container.innerHTML = formattedLogs || '<div class="text-center text-muted mt-5">No logs found.</div>';
                container.scrollTop = container.scrollHeight; // Auto-scroll to bottom
                timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            // Don't clear logs on error, just show toast
            showToast('Failed to fetch logs', 'warning');
        } finally {
            // hideLoading();
        }
    }
    window.loadLogFiles = loadLogFiles;

    document.getElementById('autoRefreshLogs')?.addEventListener('change', (e) => {
        if (e.target.checked) {
            loadLogFiles(); // Load immediately
            logAutoRefreshInterval = setInterval(loadLogFiles, 5000);
        } else {
            clearInterval(logAutoRefreshInterval);
            logAutoRefreshInterval = null;
        }
    });

    // --- Action Handlers (Delegation) ---

    // Products
    // Inline subcategory editor and row actions
   const productsTable = document.getElementById('productsTableBody');
   productsTable?.addEventListener('change', async (event) => {
       const select = event.target.closest('select.inline-subcategory');
       if (!select) return;
       const slug = select.dataset.slug;
       const newSub = select.value;
       // Derive category from subcategory using CATEGORY_MAP
       let newCat = '';
       for (const catId of Object.keys(CATEGORY_MAP)) {
           if ((CATEGORY_MAP[catId] || []).includes(newSub)) { newCat = catId; break; }
       }
       if (!newCat) {
           showToast('Could not resolve category for selected subcategory', 'danger');
           return;
       }
       try {
           showLoading();
           await fetchWithAuth(`/api/products/${slug}`, { method: 'PATCH', body: JSON.stringify({ category: newCat, subcategory: newSub }) });
           showToast('Product subcategory updated');
           // Reload current page with current filters
           await loadProducts(currentProductsPage, currentProductCategory, currentProductSearch, currentProductSubcategory);
       } catch (e) {
           console.error('Failed to update subcategory:', e);
           showToast(`Update failed: ${e.message}`, 'danger');
       } finally {
           hideLoading();
       }
   });

   document.getElementById('productsTableBody')?.addEventListener('click', async (event) => {
        const button = event.target.closest('button.action-btn');
        if (!button) return;

        const slug = button.dataset.slug;
        const name = button.dataset.name;

        if (button.classList.contains('btn-edit')) {
            await openEditProductModal(slug);
        } else if (button.classList.contains('btn-delete')) {
            await deleteProduct(slug, name);
        }
    });

    // Orders
    document.getElementById('ordersTableBody')?.addEventListener('click', async (event) => {
        const button = event.target.closest('button.action-btn');
        if (!button) return;

        const orderId = button.dataset.id;
        const currentStatus = button.dataset.currentStatus;

        if (button.classList.contains('btn-view-order')) {
            await openOrderModal(orderId);
        } else if (button.classList.contains('btn-update-status')) {
            const newStatus = prompt(`Update status for order ${orderId.slice(-6).toUpperCase()}. Current: ${currentStatus}\n\nEnter new status (placed, processing, paid, failed, shipped, delivered, cancelled):`, currentStatus);
            const validStatuses = ['placed', 'processing', 'paid', 'failed', 'shipped', 'delivered', 'cancelled', 'refunded'];
            
            if (newStatus && newStatus !== currentStatus && validStatuses.includes(newStatus.toLowerCase())) {
                await updateOrderStatus(orderId, newStatus.toLowerCase());
            } else if (newStatus) {
                showToast('Invalid status entered.', 'danger');
            }
        }
    });

    // Users
    document.getElementById('usersTableBody')?.addEventListener('click', async (event) => {
        const button = event.target.closest('button.action-btn');
        if (!button) return;

        const userId = button.dataset.userid;
        const name = button.dataset.name;

        if (button.classList.contains('btn-edit-role')) {
            const currentRole = button.dataset.currentRole;
            const newRole = prompt(`Change role for ${name}. Current: ${currentRole}\nEnter new role (customer, admin):`, currentRole);
            const validRoles = ['customer', 'admin'];
            
            if (newRole && newRole !== currentRole && validRoles.includes(newRole.toLowerCase())) {
                await updateUserRole(userId, newRole.toLowerCase());
            } else if (newRole) {
                showToast('Invalid role entered.', 'danger');
            }
        } else if (button.classList.contains('btn-toggle-active')) {
            const isActive = button.dataset.isActive === 'true';
            if (confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} ${name}?`)) {
                 await toggleUserActiveStatus(userId, !isActive);
            }
        }
    });

    async function loadQuotas() {
        showLoading();
        try {
            const data = await fetchWithAuth('/api/quota');
            renderQuotaUI(data);
        } catch (error) {
            console.error('Error fetching quotas:', error);
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    function renderQuotaUI(accounts) {
        const cardsContainer = document.getElementById('quotaCardsContainer');
        const tableBody = document.getElementById('quotaTableBody');
        
        if (!cardsContainer || !tableBody) return;

        cardsContainer.innerHTML = '';
        tableBody.innerHTML = '';

        accounts.forEach(acc => {
            const card = document.createElement('div');
            card.className = 'col-md-4';
            const progressClass = acc.usagePercent > 90 ? 'bg-danger' : acc.usagePercent > 70 ? 'bg-warning' : 'bg-success';
            card.innerHTML = `
                <div class="card stat-card">
                    <h5 class="mb-3">${acc.name}</h5>
                    <div class="progress mb-3" style="height: 10px; background: rgba(255,255,255,0.1);">
                        <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${acc.usagePercent}%" aria-valuenow="${acc.usagePercent}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">${acc.usagePercent}% Used</small>
                        <small class="text-muted">${acc.remaining.toLocaleString()} left</small>
                    </div>
                    <div class="mt-3">
                        <span class="badge ${acc.isActive ? 'bg-success' : 'bg-danger'}">${acc.isActive ? 'Active' : 'Inactive'}</span>
                        <span class="badge bg-info">Priority: ${acc.priority}</span>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${acc.name}</td>
                <td><span class="badge ${acc.isActive ? 'bg-success' : 'bg-danger'}">${acc.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>${acc.quotaUsed.toLocaleString()}</td>
                <td>${acc.remaining.toLocaleString()} / ${acc.quotaLimit.toLocaleString()}</td>
                <td>${acc.priority}</td>
                <td>${acc.lastUsedAt ? new Date(acc.lastUsedAt).toLocaleString() : 'Never'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    document.getElementById('resetAllQuotasBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset ALL AI account quotas? This cannot be undone.')) {
            showLoading();
            try {
                await fetchWithAuth('/api/quota/reset', { method: 'POST' });
                showToast('All quotas reset successfully');
                await loadQuotas();
            } catch (error) {
                showToast(`Error: ${error.message}`, 'danger');
            } finally {
                hideLoading();
            }
        }
    });

    // --- Action Implementations ---

    async function openEditProductModal(slug) {
        showLoading();
        try {
            const product = await fetchWithAuth(`/api/products/${slug}?admin=true`);
            if (!product) throw new Error('Product not found');

            document.getElementById('editProductId').value = product.slug;
            document.getElementById('editProductName').value = product.name;
            document.getElementById('editProductCategory').value = product.category;
            populateSubcategories('editProductCategory', 'editProductSubcategory');
            document.getElementById('editProductSubcategory').value = product.subcategory || '';
            document.getElementById('editProductPrice').value = product.price;
            document.getElementById('editProductStock').value = product.stock;
            document.getElementById('editProductImages').value = (product.images || []).join(', ');
            document.getElementById('editProductDescription').value = product.description;

            const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
            editModal.show();
        } catch (error) {
            console.error("Error opening edit modal:", error);
            showToast(`Error loading product: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    async function deleteProduct(slug, name) {
        if (confirm(`Permanently delete "${name}"?\n\nThis will remove the product and its images. This action cannot be undone.`)) {
            showLoading();
            try {
                await fetchWithAuth(`/api/products/${slug}`, { method: 'DELETE' });
                showToast('Product deleted successfully!');
                await loadProducts(currentProductsPage, currentProductCategory, currentProductSearch, currentProductSubcategory);
            } catch (error) {
                console.error("Error deleting product:", error);
                showToast(`Error: ${error.message}`, 'danger');
            } finally {
                hideLoading();
            }
        }
    }

    async function updateOrderStatus(orderId, status) {
        showLoading();
        try {
            await fetchWithAuth(`/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            showToast(`Order status updated to ${status}`);
            await loadOrders(currentOrdersPage, currentOrderStatus);
        } catch (error) {
            console.error("Error updating order status:", error);
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    async function updateUserRole(userId, role) {
        showLoading();
        try {
            await fetchWithAuth(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role })
            });
            showToast(`User role updated to ${role}`);
            await loadUsers(currentUsersPage, currentUserRole);
        } catch (error) {
            console.error("Error updating user role:", error);
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

     async function toggleUserActiveStatus(userId, isActive) {
        showLoading();
        try {
            await fetchWithAuth(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive })
            });
            showToast(`User ${isActive ? 'activated' : 'deactivated'}`);
            await loadUsers(currentUsersPage, currentUserRole);
        } catch (error) {
            console.error("Error updating user status:", error);
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    }

    // --- Form Handlers ---
    document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        // Generate slug and read category early for uploads
        const rawName = document.getElementById('productName').value;
        const categoryVal = document.getElementById('productCategory').value;
        const subcategoryVal = document.getElementById('productSubcategory').value;
        const slugVal = String(rawName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Prepare images list: start with URLs (if any)
        const imageUrlStr = document.getElementById('productImages').value;
        const imagePaths = (imageUrlStr ? imageUrlStr.split(',').map(s => s.trim()).filter(Boolean) : []);

        // Upload files if selected
        try {
            const file1 = document.getElementById('productFile1').files?.[0];
            const file2 = document.getElementById('productFile2').files?.[0];
            if (file1) {
                const p1 = await uploadProductImage(file1, categoryVal, subcategoryVal, slugVal, 1);
                if (p1) imagePaths[0] = p1; // place as primary image
            }
            if (file2) {
                const p2 = await uploadProductImage(file2, categoryVal, subcategoryVal, slugVal, 2);
                if (p2) imagePaths[1] = p2; // place as secondary image
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            showToast(`Image upload failed: ${err.message}`, 'danger');
            hideLoading();
            return;
        }

        const product = {
            name: rawName,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value, 10),
            category: categoryVal,
            subcategory: subcategoryVal,
            images: imagePaths.join(', '),
            description: document.getElementById('productDescription').value,
            slug: slugVal
        };

        try {
            const newProduct = await fetchWithAuth('/api/products', {
                method: 'POST',
                body: JSON.stringify(product)
            });
            showToast(`Product "${newProduct.name}" created!`, 'success');
            document.getElementById('addProductForm').reset();
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
            if (addModal) addModal.hide();
            await loadProducts(1, ''); // Go to first page, no filter
        } catch (error) {
            console.error('Error adding product:', error);
            showToast(`Error adding product: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const slug = document.getElementById('editProductId').value;
        if (!slug) return;
        
        // Start with any URLs already provided
        const existingUrlStr = document.getElementById('editProductImages').value;
        const imagePaths = (existingUrlStr ? existingUrlStr.split(',').map(s => s.trim()).filter(Boolean) : []);

        // Upload new files if provided and place by index to override
        try {
            const categoryVal = document.getElementById('editProductCategory').value;
            const subcategoryVal = document.getElementById('editProductSubcategory').value;
            const file1 = document.getElementById('editProductFile1').files?.[0];
            const file2 = document.getElementById('editProductFile2').files?.[0];
            if (file1) {
                const p1 = await uploadProductImage(file1, categoryVal, subcategoryVal, slug, 1);
                if (p1) imagePaths[0] = p1; // replace primary image
            }
            if (file2) {
                const p2 = await uploadProductImage(file2, categoryVal, subcategoryVal, slug, 2);
                if (p2) imagePaths[1] = p2; // replace secondary image
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            showToast(`Image upload failed: ${err.message}`, 'danger');
            return;
        }

        const productData = {
            name: document.getElementById('editProductName').value,
            category: document.getElementById('editProductCategory').value,
            subcategory: document.getElementById('editProductSubcategory').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            stock: parseInt(document.getElementById('editProductStock').value, 10),
            images: imagePaths.join(', '),
            description: document.getElementById('editProductDescription').value,
        };
        
        showLoading();
        try {
            await fetchWithAuth(`/api/products/${slug}`, {
                method: 'PATCH',
                body: JSON.stringify(productData)
            });
            showToast('Product updated successfully!');
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            if (editModal) editModal.hide();
            await loadProducts(currentProductsPage, currentProductCategory, currentProductSearch, currentProductSubcategory);
        } catch (error) {
            console.error("Error updating product:", error);
            showToast(`Update failed: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    // --- Helper: upload product image via API ---
    async function uploadProductImage(file, category, subcategory, slug, index) {
        if (!file) return null;
        if (!category) throw new Error('Select a category before uploading images.');
        if (!subcategory) throw new Error('Select a subcategory before uploading images.');
        if (!slug) throw new Error('Provide a valid name to generate slug before uploading images.');
        const form = new FormData();
        form.append('file', file);
        form.append('category', category);
        form.append('subcategory', subcategory);
        form.append('slug', slug);
        form.append('index', String(index || 1));

        // Using fetch directly (not fetchWithAuth) to avoid JSON headers; keep credentials for session
        const resp = await fetch('/api/products/upload-image', { method: 'POST', body: form, credentials: 'include' });
        if (!resp.ok) {
            let msg = 'Upload failed';
            try { const j = await resp.json(); msg = j?.message || msg; } catch {}
            throw new Error(msg);
        }
        const data = await resp.json();
        return data?.path || null;
    }

    // --- Dynamic hints for where images will be stored ---
    function updateAddHints() {
        const nameEl = document.getElementById('productName');
        const catEl = document.getElementById('productCategory');
        const subEl = document.getElementById('productSubcategory');
        const slug = String(nameEl?.value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const category = catEl?.value || '<category>';
        const subcategory = subEl?.value || '<subcategory>';
        const h1 = document.getElementById('addImg1Hint');
        const h2 = document.getElementById('addImg2Hint');
        if (h1) h1.textContent = `Stored as assets/images/products/${category}/${subcategory}/${slug || '<slug>'}-1.webp"`;
        if (h2) h2.textContent = `Stored as assets/images/products/${category}/${subcategory}/${slug || '<slug>'}-2.webp"`;
    }
    function updateEditHints() {
        const slug = document.getElementById('editProductId')?.value || '<slug>';
        const category = document.getElementById('editProductCategory')?.value || '<category>';
        const subcategory = document.getElementById('editProductSubcategory')?.value || '<subcategory>';
        const h1 = document.getElementById('editImg1Hint');
        const h2 = document.getElementById('editImg2Hint');
        if (h1) h1.textContent = `Stored as assets/images/products/${category}/${subcategory}/${slug}-1.webp"`;
        if (h2) h2.textContent = `Stored as assets/images/products/${category}/${subcategory}/${slug}-2.webp"`;
    }
    document.getElementById('productName')?.addEventListener('input', updateAddHints);
    document.getElementById('productCategory')?.addEventListener('change', updateAddHints);
    document.getElementById('productSubcategory')?.addEventListener('change', updateAddHints);
    document.getElementById('editProductCategory')?.addEventListener('change', updateEditHints);
    document.getElementById('editProductSubcategory')?.addEventListener('change', updateEditHints);

    // --- Category/Subcategory mapping and population ---
    const CATEGORY_MAP = {
        'combo-deals': ['combo-deals'],
        'printers-scanners': ['printers-scanners', 'toners', 'ink-cartridges', 'printing-consumables'],
        'computing-devices': ['workstations', 'laptops', 'tablets', 'monitors', 'all-in-one-computers', 'keys-clicks', 'starlink'],
        'home-appliances': ['washing-machines', 'refrigerators', 'irons', 'vacuum-cleaners', 'televisions', 'air-conditioners', 'fans', 'air-purifiers'],
        'kitchen-appliances': ['dishwashers', 'microwaves', 'stoves', 'rice-cooker', 'blenders', 'air-fryers', 'toasters', 'kettles'],
        'tech-accessories': ['storage-devices', 'headsets-earphones', 'playhub', 'wireless-sound', 'cctv-cameras', 'network-switches', 'wifi-extenders', 'tablet-laptop-sleeves', 'power-solutions', 'smart-watches'],
        'mobile-phones': ['apple-iphone', 'samsung-smartphones', 'tecno-phones', 'itel-phones', 'infinix-smartphones', 'oppo-smartphones', 'realme-smartphones'],
        'ups': ['ups'],
        'shredders': ['shredders']
    };
    const SUBCATEGORY_LABELS = {
        'combo-deals': 'Combo Deals',
        'printers-scanners': 'Printers & Scanners',
        'toners': 'Toners',
        'ink-cartridges': 'Ink Cartridges',
        'printing-consumables': 'Printing Consumables',
        'workstations': 'Workstations',
        'laptops': 'Laptops',
        'tablets': 'Tablets',
        'monitors': 'Monitors',
        'all-in-one-computers': 'All-in-One Computers',
        'keys-clicks': 'Keys & Clicks',
        'starlink': 'Starlink',
        'washing-machines': 'Washing Machines',
        'refrigerators': 'Refrigerators',
        'irons': 'Irons',
        'vacuum-cleaners': 'Vacuum Cleaners',
        'televisions': 'Televisions',
        'air-conditioners': 'Air Conditioners',
        'fans': 'Fans',
        'air-purifiers': 'Air Purifiers',
        'dishwashers': 'Dishwashers',
        'microwaves': 'Microwaves',
        'stoves': 'Stoves',
        'rice-cooker': 'Rice Cooker',
        'blenders': 'Blenders',
        'air-fryers': 'Air Fryers',
        'toasters': 'Toasters',
        'kettles': 'Kettles',
        'storage-devices': 'Storage Devices',
        'headsets-earphones': 'Headsets & Earphones',
        'playhub': 'PlayHub',
        'wireless-sound': 'Wireless Sound',
        'cctv-cameras': 'CCTV Cameras',
        'network-switches': 'Network Switches',
        'wifi-extenders': 'WiFi Extenders',
        'tablet-laptop-sleeves': 'Tablet & Laptop Sleeves',
        'power-solutions': 'Power Solutions',
        'smart-watches': 'Smart Watches',
        'apple-iphone': 'Apple iPhone',
        'samsung-smartphones': 'Samsung Smartphones',
        'tecno-phones': 'TECNO Phones',
        'itel-phones': 'itel Phones',
        'infinix-smartphones': 'Infinix Smartphones',
        'oppo-smartphones': 'OPPO Smartphones',
        'realme-smartphones': 'realme Smartphones',
        'ups': 'UPS',
        'shredders': 'Shredders'
    };

    function populateSubcategories(categorySelectId, subcategorySelectId) {
        const cat = document.getElementById(categorySelectId)?.value;
        const subEl = document.getElementById(subcategorySelectId);
        if (!subEl) return;
        const subs = CATEGORY_MAP[cat] || [];
        subEl.innerHTML = '<option value="">Select Subcategory</option>';
        subs.forEach(sid => {
            const opt = document.createElement('option');
            opt.value = sid;
            opt.textContent = SUBCATEGORY_LABELS[sid] || sid;
            subEl.appendChild(opt);
        });
        if (subs.length === 1) {
            subEl.value = subs[0];
        }
    }

    document.getElementById('promoProdCategory')?.addEventListener('change', () => {
        populateSubcategories('promoProdCategory', 'promoProdSubcategory');
    });

    document.getElementById('addPromoProductForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const rawName = document.getElementById('promoProdName').value;
        const promoType = document.getElementById('promoProdPromoType').value;
        const categoryVal = document.getElementById('promoProdCategory').value;
        const subcategoryVal = document.getElementById('promoProdSubcategory').value;
        const basePrice = parseFloat(document.getElementById('promoProdBasePrice').value);
        const promoPrice = document.getElementById('promoProdPromoPrice').value ? parseFloat(document.getElementById('promoProdPromoPrice').value) : null;
        const stock = parseInt(document.getElementById('promoProdStock').value, 10);
        const brand = document.getElementById('promoProdBrand').value;
        const description = document.getElementById('promoProdDescription').value;
        const searchable = document.getElementById('promoProdSearchable').checked;

        const slugVal = String(rawName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

        let imagePath = '';
        try {
            const file = document.getElementById('promoProdFile').files?.[0];
            if (file) {
                imagePath = await uploadProductImage(file, categoryVal, subcategoryVal, slugVal, 1);
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            showToast(`Image upload failed: ${err.message}`, 'danger');
            hideLoading();
            return;
        }

        const product = {
            name: rawName,
            price: basePrice,
            stock: stock,
            category: categoryVal,
            subcategory: subcategoryVal,
            brand: brand,
            description: description,
            slug: slugVal,
            images: imagePath ? [imagePath] : [],
            promoType: promoType,
            promoPrice: promoPrice,
            active: searchable
        };

        try {
            const res = await fetchWithAuth('/api/admin/promos/create-product', {
                method: 'POST',
                body: JSON.stringify(product)
            });
            showToast(`Product "${rawName}" created and assigned to ${promoType}!`, 'success');
            document.getElementById('addPromoProductForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPromoProductModal'));
            if (modal) modal.hide();
            await loadPromosProducts(1);
        } catch (error) {
            console.error('Error creating promo product:', error);
            showToast(`Error: ${error.message}`, 'danger');
        } finally {
            hideLoading();
        }
    });

    document.getElementById('productCategory')?.addEventListener('change', () => {
        populateSubcategories('productCategory', 'productSubcategory');
        updateAddHints();
    });
    document.getElementById('editProductCategory')?.addEventListener('change', () => {
        populateSubcategories('editProductCategory', 'editProductSubcategory');
        updateEditHints();
    });
    // Initial populate on DOM ready

   // --- Bulk move toolbar helpers ---
   function ensureBulkMoveToolbar() {
     let bulkCat = document.getElementById('bulkCategorySelect');
     let bulkSub = document.getElementById('bulkSubcategorySelect');
     let bulkBtn = document.getElementById('bulkMoveBtn');
     const cardBody = document.querySelector('#products-view .card .card-body');
     if (!bulkCat || !bulkSub || !bulkBtn) {
       if (!cardBody) return;
       const div = document.createElement('div');
       div.className = 'd-flex align-items-center mb-3 gap-2';
        div.innerHTML = `
          <select class="form-select me-2" id="bulkCategorySelect" style="width: 200px;">
            <option value="">Target Category</option>
            <option value="combo-deals">Combo Deals</option>
            <option value="printers-scanners">Printers & Scanners</option>
            <option value="computing-devices">Computing Devices</option>
            <option value="home-appliances">Home Appliances</option>
            <option value="kitchen-appliances">Kitchen Appliances</option>
            <option value="tech-accessories">Tech Accessories</option>
            <option value="mobile-phones">Mobile Phones</option>
            <option value="ups">UPS</option>
            <option value="shredders">Shredders</option>
          </select>
          <select class="form-select me-2" id="bulkSubcategorySelect" style="width: 220px;" disabled>
            <option value="">Target Subcategory</option>
          </select>
          <button id="bulkMoveBtn" class="btn btn-outline-light">Move Selected</button>
        `;
       const tableWrap = cardBody.querySelector('.table-responsive') || cardBody.firstElementChild;
       cardBody.insertBefore(div, tableWrap);
       bulkCat = div.querySelector('#bulkCategorySelect');
       bulkSub = div.querySelector('#bulkSubcategorySelect');
       bulkBtn = div.querySelector('#bulkMoveBtn');
     }

      if (bulkCat && bulkSub) {
        bulkCat.addEventListener('change', () => {
          const catVal = bulkCat.value;
          bulkSub.innerHTML = '<option value="">Target Subcategory</option>';
          const subs = CATEGORY_MAP[catVal] || [];
          subs.forEach(sid => {
            const opt = document.createElement('option');
            opt.value = sid;
            opt.textContent = SUBCATEGORY_LABELS[sid] || sid;
            bulkSub.appendChild(opt);
          });
          bulkSub.disabled = subs.length === 0;
          if (subs.length === 1) {
            bulkSub.value = subs[0];
          }
        });
      }

     if (bulkBtn) {
       bulkBtn.addEventListener('click', async () => {
         const catVal = bulkCat?.value || '';
         const subVal = bulkSub?.value || '';
         if (!catVal || !subVal) { showToast('Select target category and subcategory', 'warning'); return; }
         const selected = Array.from(document.querySelectorAll('#productsTableBody input.product-select:checked'));
         if (selected.length === 0) { showToast('Select products using the checkboxes', 'warning'); return; }
         if (!confirm(`Move ${selected.length} product(s) to ${SUBCATEGORY_LABELS[subVal] || subVal}?`)) return;
         showLoading();
         try {
           await Promise.all(selected.map(cb => {
             const slug = cb.dataset.slug;
             return fetchWithAuth(`/api/products/${slug}`, { method: 'PATCH', body: JSON.stringify({ category: catVal, subcategory: subVal }) });
           }));
           showToast('Products moved successfully');
           await loadProducts(currentProductsPage, currentProductCategory, currentProductSearch, currentProductSubcategory);
         } catch (e) {
           console.error('Bulk move failed:', e);
           showToast(`Bulk move failed: ${e.message}`, 'danger');
         } finally {
           hideLoading();
         }
       });
     }
   }

    // --- Order detail modal: fetch + render ---
    async function openOrderModal(orderId) {
    if (!orderId) return;
    showLoading();
    try {
        // Fetch order detail; use the public order route which already supports auth/guest checks
        const order = await fetchWithAuth(`/api/orders/${orderId}`);
        if (!order) throw new Error('Order not found');

        // Meta
        const meta = `#${String(order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId)} • ${new Date(order.createdAt).toLocaleString()} • Status: ${order.status}`;
        document.getElementById('od-order-meta').textContent = `ID: #${String(order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId || order.orderId)} • ${new Date(order.createdAt).toLocaleString()} • Status: ${order.status}`;

        // Billing
        const billing = order.billing || {};
        const billingHtml = `
        <div><strong>${escapeHtml(billing.name || '')}</strong></div>
        <div>${escapeHtml(billing.companyName || '')}</div>
        <div>${escapeHtml([billing.streetAddress, billing.streetAddress2].filter(Boolean).join(', '))}</div>
        <div>${escapeHtml([billing.town, billing.state, billing.zipCode].filter(Boolean).join(', '))}</div>
        <div>${escapeHtml(billing.country || '')}</div>
        <div>Phone: ${escapeHtml(billing.phone || '')}</div>
        <div>Email: ${escapeHtml(billing.email || '')}</div>
        <div class="mt-2 text-muted small">Notes: ${escapeHtml(billing.notes || '')}</div>
        `;
        document.getElementById('od-billing').innerHTML = billingHtml;

        // Shipping (may equal billing)
        const shipping = order.shipping || {};
        const shippingHtml = `
        <div><strong>${escapeHtml(shipping.name || '')}</strong></div>
        <div>${escapeHtml(shipping.companyName || '')}</div>
        <div>${escapeHtml([shipping.streetAddress, shipping.streetAddress2].filter(Boolean).join(', '))}</div>
        <div>${escapeHtml([shipping.town, shipping.state, shipping.zipCode].filter(Boolean).join(', '))}</div>
        <div>${escapeHtml(shipping.country || '')}</div>
        <div>Phone: ${escapeHtml(shipping.phone || '')}</div>
        <div>Email: ${escapeHtml(shipping.email || '')}</div>
        <div class="mt-2 text-muted small">Notes: ${escapeHtml(shipping.notes || '')}</div>
        `;
        document.getElementById('od-shipping').innerHTML = shippingHtml;

        // Items
        const itemsBody = document.getElementById('od-items-body');
        itemsBody.innerHTML = '';
        (order.items || []).forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
            <div class="d-flex align-items-center">
                <img src="${escapeAttr((it.image) || 'https://placehold.co/60x60/333/fff?text=No+Img')}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;margin-right:12px;" onerror="this.src='https://placehold.co/60x60/333/fff?text=Error'">
                <div>
                <div><strong>${escapeHtml(it.name || '')}</strong></div>
                ${it.productId ? `<div class="text-muted small">ID: ${escapeHtml(String(it.productId))}</div>` : ''}
                </div>
            </div>
            </td>
            <td>₵${Number(it.price || 0).toFixed(2)}</td>
            <td>${Number(it.qty || 0)}</td>
            <td>₵${Number(it.lineTotal || (it.price * it.qty) || 0).toFixed(2)}</td>
            <td class="small text-muted">${escapeHtml(JSON.stringify(it.custom || ''))}</td>
        `;
        itemsBody.appendChild(tr);
        });

        // Summary
        const summary = `
        <div><strong>Subtotal:</strong> ₵${Number(order.subtotal || 0).toFixed(2)}</div>
        <div><strong>Shipping (${escapeHtml(order.shippingMethod || 'standard')}):</strong> ₵${Number(order.shippingCost || 0).toFixed(2)}</div>
        <div><strong>Total:</strong> ₵${Number(order.total || 0).toFixed(2)}</div>
        <div><strong>Currency:</strong> ${escapeHtml(order.currency || 'GHS')}</div>
        <div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || 'cod')}</div>
        <div class="mt-2 small text-muted">Created: ${new Date(order.createdAt).toLocaleString()}</div>
        `;
        document.getElementById('od-summary').innerHTML = summary;

        // Show modal
        const modalEl = document.getElementById('orderDetailModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // wire refresh button inside modal
        document.getElementById('od-refresh-btn').onclick = () => openOrderModal(orderId);

    } catch (err) {
        console.error('Error loading order:', err);
        showToast(`Error loading order: ${err.message}`, 'danger');
    } finally {
        hideLoading();
    }
    }

    // Helper: simple HTML escape for text nodes
    function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
    }


    // --- Home Assets (CSP safe, no inline scripts) ---
    let HA_INITIALIZED = false;
    let HA_STATE = { categories: [], partners: [], combos: [] };
    function initHomeAssets() {
      if (HA_INITIALIZED) return;
      HA_INITIALIZED = true;
      const view = document.getElementById('home-assets-view');
      if (!view) return;

      const statusEl = document.getElementById('homeAssetsStatus');
      const setStatus = (msg, isError=false) => { if(!statusEl) return; statusEl.textContent = msg; statusEl.style.color = isError ? '#ff8080' : '#9fd08b'; };
      const bust = () => `?v=${Date.now()}`;

      async function uploadTo(bucket, file){
        const form = new FormData(); form.append('file', file);
        const res = await fetch('/api/home-assets/upload?bucket='+encodeURIComponent(bucket), { method:'POST', body: form, credentials:'include' });
        if (!res.ok) throw new Error('Upload failed'); const j = await res.json(); return j.path;
      }
      async function saveAll(type){
        const payload = (type==='categories') ? { categories: HA_STATE.categories }
                      : (type==='partners') ? { partners: HA_STATE.partners }
                      : { combos: HA_STATE.combos };
        await fetch('/api/home-assets/'+type, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      }
      function renderList(containerId, items, type){
        const el = document.getElementById(containerId); if (!el) return;
        if (!Array.isArray(items) || items.length === 0) { el.innerHTML = '<div class="text-muted">No items yet.</div>'; return; }
        el.innerHTML = items.map((it, idx) => {
          const img = (type==='combos'? (it.images?.[0]||'') : it.img) || '';
          const title = it.title || it.alt || it.id || '';
          return `
            <div class="d-flex align-items-center justify-content-between border rounded p-2 mb-2" data-index="${idx}">
              <div class="d-flex align-items-center gap-2">
                <img src="${img ? img + bust() : 'https://placehold.co/80x50/333/fff?text=No+Img'}" style="width:80px;height:50px;object-fit:cover;border-radius:6px" onerror="this.src='https://placehold.co/80x50/333/fff?text=Error'">
                <div class="small">
                  <div><strong>${title || '(no title)'}</strong></div>
                  ${it.href ? `<div class="text-muted">${it.href}</div>` : ''}
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <label class="btn btn-sm btn-outline-light mb-0">
                  Update<input type="file" accept="image/*" data-action="update" data-type="${type}" data-index="${idx}" style="display:none">
                </label>
                <button class="btn btn-sm btn-danger" data-action="remove" data-type="${type}" data-index="${idx}">Remove</button>
              </div>
            </div>`;
        }).join('');
      }
      function renderAssets(){
        renderList('homeCatList', HA_STATE.categories, 'categories');
        renderList('homeComboList', HA_STATE.combos, 'combos');
        renderList('homePartnerList', HA_STATE.partners, 'partners');
      }
      async function fetchAll(){
        try{
          const [cats, parts, combs] = await Promise.all([
            fetch('/api/home-assets/categories', { credentials:'include' }).then(r=>r.json()),
            fetch('/api/home-assets/partners', { credentials:'include' }).then(r=>r.json()),
            fetch('/api/home-assets/combos', { credentials:'include' }).then(r=>r.json())
          ]);
          HA_STATE.categories = Array.isArray(cats.categories) ? cats.categories : [];
          HA_STATE.partners = Array.isArray(parts.partners) ? parts.partners : [];
          HA_STATE.combos = Array.isArray(combs.combos) ? combs.combos : [];
          renderAssets();
          setStatus('Loaded current homepage assets');
        }catch(e){ setStatus('Failed to load current assets', true); }
      }
      // expose for navigation hook
      window.homeAssetsFetchAll = fetchAll;

      // Delegated update/remove
      view.addEventListener('change', async (e) => {
        const input = e.target.closest('input[type="file"][data-action="update"]');
        if (!input) return;
        const type = input.dataset.type; const idx = parseInt(input.dataset.index,10);
        const file = input.files?.[0]; if (!file) return;
        try{
          const path = await uploadTo(type, file);
          if (type==='categories') { HA_STATE.categories[idx].img = path; }
          else if (type==='partners') { HA_STATE.partners[idx].img = path; }
          else if (type==='combos') {
            const arr = Array.isArray(HA_STATE.combos[idx].images)? HA_STATE.combos[idx].images : [];
            arr[0] = path; HA_STATE.combos[idx].images = arr;
          }
          await saveAll(type);
          renderAssets();
          setStatus('Asset updated');
        }catch(err){ setStatus('Update failed: '+err.message, true); }
      });
      view.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action="remove"]');
        if (!btn) return;
        const type = btn.dataset.type; const idx = parseInt(btn.dataset.index,10);
        if (!confirm('Remove this item?')) return;
        try{
          if (type==='categories') HA_STATE.categories.splice(idx,1);
          else if (type==='partners') HA_STATE.partners.splice(idx,1);
          else if (type==='combos') HA_STATE.combos.splice(idx,1);
          await saveAll(type);
          renderAssets();
          setStatus('Removed successfully');
        }catch(err){ setStatus('Remove failed: '+err.message, true); }
      });

      // Add new entries
      document.getElementById('homeCatSaveBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('homeCatTitle').value.trim();
        const href = document.getElementById('homeCatHref').value.trim();
        const file = document.getElementById('homeCatFile').files?.[0];
        if (!title || !href || !file) { setStatus('Provide title, link, and select an image', true); return; }
        try {
          const img = await uploadTo('categories', file);
          HA_STATE.categories.push({ id: title.toLowerCase().replace(/\s+/g,'-'), title, href, img });
          await saveAll('categories');
          renderAssets();
          setStatus('Category tile saved');
        } catch (e) { setStatus('Failed to save categories', true); }
      });
      document.getElementById('homeComboSaveBtn')?.addEventListener('click', async () => {
        const id = document.getElementById('homeComboId').value.trim();
        const title = document.getElementById('homeComboTitle').value.trim();
        const comboPrice = parseFloat(document.getElementById('homeComboPrice').value)||0;
        const originalPrice = parseFloat(document.getElementById('homeComboOriginal').value)||0;
        const savings = parseFloat(document.getElementById('homeComboSavings').value)||0;
        const file = document.getElementById('homeComboFile').files?.[0];
        if (!id || !title || !file) { setStatus('Provide id, title, and image', true); return; }
        try{
          const img = await uploadTo('combos', file);
          HA_STATE.combos.push({ id, title, images:[img], comboPrice, originalPrice, savings });
          await saveAll('combos');
          renderAssets();
          setStatus('Combo saved');
        }catch(e){ setStatus('Failed to save combos', true); }
      });
      document.getElementById('homePartnerSaveBtn')?.addEventListener('click', async () => {
        const alt = document.getElementById('homePartnerAlt').value.trim();
        const href = document.getElementById('homePartnerHref').value.trim();
        const file = document.getElementById('homePartnerFile').files?.[0];
        if (!file) { setStatus('Select a logo image', true); return; }
        try{
          const img = await uploadTo('partners', file);
          HA_STATE.partners.push({ img, alt, href: href || undefined });
          await saveAll('partners');
          renderAssets();
          setStatus('Partners updated');
        }catch(e){ setStatus('Failed to save partners', true); }
      });

      document.getElementById('homeAssetsRefresh')?.addEventListener('click', fetchAll);
    }

    function homeAssetsFetchAll(){
      if (document.getElementById('home-assets-view')?.classList.contains('active')) {
        // minor delay to ensure view is visible
        setTimeout(() => { document.getElementById('homeAssetsRefresh')?.click(); }, 10);
      }
    }

     document.addEventListener('DOMContentLoaded', () => {
   // Attach regenerate button
   const regenBtn = document.getElementById('regenerateProductsBtn');
   // Ensure products view initializes filters
   showView('products-view');

   const regenStatus = document.getElementById('regenerateProductsStatus');
   if (regenBtn) {
    regenBtn.addEventListener('click', async () => {
      regenBtn.disabled = true;
      regenStatus.textContent = 'Regenerating...';
      try {
        const resp = await fetch('/api/admin/regenerate-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!resp.ok) throw new Error('Request failed');
        const data = await resp.json();
        regenStatus.textContent = data?.message || 'Done';
        // Warm cache for frontend JSON and show toast
        try {
          const bust = Date.now();
          await Promise.all([
            fetch(`/assets/data/products.grouped2.json?t=${bust}`, { cache: 'reload' }),
            fetch(`/products.grouped2.json?t=${bust}`, { cache: 'reload' })
          ]);
        } catch {}
        if (typeof showToast === 'function') {
          showToast('Products JSON regenerated successfully');
        }
      } catch (e) {
        regenStatus.textContent = 'Failed';
        alert('Failed to regenerate products. Please check server logs.');
      } finally {
        regenBtn.disabled = false;
        setTimeout(() => { regenStatus.textContent = ''; }, 4000);
      }
    });
  }
    // quick actions delegation
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action === 'show-orders') {
        showView('orders-view');
        } else if (action === 'show-users') {
        showView('users-view');
        } else if (action === 'show-products') {
        showView('products-view');
        } else if (action === 'generate-report') {
        generateReport();
        }
        // add other quick actions here
    });
    });


    // --- Filter Event Listeners ---
    function setupFilters() {
        const productCategoryFilter = document.getElementById('productCategoryFilter');
        const productSubcategoryFilter = document.getElementById('productSubcategoryFilter');
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        // const userRoleFilter = document.getElementById('userRoleFilter'); // Add this ID to your user filter select

        if (productCategoryFilter) {
            productCategoryFilter.addEventListener('change', (e) => {
                const cat = e.target.value;
                currentProductCategory = cat;
                currentProductSubcategory = '';
                
                if (productSubcategoryFilter) {
                    productSubcategoryFilter.innerHTML = '<option value="">All Subcategories</option>';
                    
                    if (cat && CATEGORY_MAP[cat]) {
                        productSubcategoryFilter.disabled = false;
                        const subs = CATEGORY_MAP[cat] || [];
                        subs.forEach(sid => {
                            const opt = document.createElement('option');
                            opt.value = sid;
                            opt.textContent = SUBCATEGORY_LABELS[sid] || sid;
                            productSubcategoryFilter.appendChild(opt);
                        });
                    } else {
                        productSubcategoryFilter.disabled = true;
                    }
                }
                
                loadProducts(1, currentProductCategory, currentProductSearch, currentProductSubcategory);
            });
        }

        if (productSubcategoryFilter) {
            productSubcategoryFilter.addEventListener('change', (e) => {
                const sub = e.target.value;
                currentProductSubcategory = sub;
                loadProducts(1, currentProductCategory, currentProductSearch, currentProductSubcategory);
            });
        }

        const productSearchInput = document.getElementById('productSearchInput');
        if (productSearchInput) {
            let t;
            productSearchInput.addEventListener('input', (e) => {
                clearTimeout(t);
                const val = e.target.value.trim();
                t = setTimeout(() => {
                    currentProductSearch = val;
                    loadProducts(1, currentProductCategory, currentProductSearch, currentProductSubcategory);
                }, 300);
            });
        }

        const productSearchClearBtn = document.getElementById('productSearchClearBtn');
        if (productSearchClearBtn) {
            productSearchClearBtn.addEventListener('click', () => {
                currentProductSearch = '';
                if (productSearchInput) productSearchInput.value = '';
                loadProducts(1, currentProductCategory, '', currentProductSubcategory);
            });
        }

        // Initial load of products
        loadProducts();

        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', (e) => {
                loadOrders(1, e.target.value);
            });
        }

        // if (userRoleFilter) { ... }
    }

    // --- Logout ---
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken'); // Clear token
            showToast('Logging out...');
            window.location.href = '/login.html?logged_out=true';
            // You might also want to call a backend /api/auth/logout route if you have one
        }
    });

    // --- Initial Load and Auth Check ---
    function checkAdminAuth() {
        showLoading();
        fetchWithAuth('/api/auth/me')
            .then(user => {
                if (!user || user.role !== 'admin') {
                    throw new Error('Not Admin');
                }
                console.log('Admin auth check passed:', user);
                showView('dashboard-view');
                loadDashboardStats(); // This will hide loading when done
            })
            .catch(err => {
                hideLoading(); // Hide loading on auth fail
                console.error('Admin auth check failed:', err.message);
                localStorage.removeItem('authToken');
                window.location.href = '/login.html?redirect=admin.html&error=auth_failed';
            });
    }

    // --- DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', function() {
        // Setup sidebar link navigation
        document.querySelector('.sidebar-nav')?.addEventListener('click', function(e) {
            const navLink = e.target.closest('.nav-link[data-target]');
            if (!navLink) return;
            e.preventDefault();
            
            const targetId = navLink.dataset.target;
            if (targetId === 'logoutBtn') {
                // Handled by separate listener
                return;
            }
            showView(targetId);
        });

        // Setup mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
                sidebarToggle.innerHTML = sidebar.classList.contains('mobile-open') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            });
        }
        
        setupFilters();
        checkAdminAuth();

        // Wire select all
        const selectAll = document.getElementById('selectAllProducts');
        const tableBody = document.getElementById('productsTableBody');
        if (selectAll && tableBody) {
            selectAll.addEventListener('change', () => {
                tableBody.querySelectorAll('input.product-select').forEach(cb => { cb.checked = selectAll.checked; });
            });
        }

        // Initialize bulk toolbar wiring
        ensureBulkMoveToolbar();
        
        // Initialize Bootstrap tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl)
        });

        // Bulk Price Upload - Direct event listeners
        let bulkPriceUpdates = [];

        // Try setup on load
        setTimeout(() => {
            setupBulkPriceForm();
        }, 1000);

        // Also setup when switching to bulk price view
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link[data-target="bulk-price-view"]');
            if (link) {
                setTimeout(() => {
                    setupBulkPriceForm();
                    console.log('Bulk price view activated - form setup attempted');
                }, 500);
            }
        }, true);

        function setupBulkPriceForm() {
            const form = document.getElementById('bulkPriceForm');
            const applyBtn = document.getElementById('applyBulkPriceBtn');

            if (!form) {
                console.log('Bulk price form not yet available');
                return;
            }

            console.log('Setting up bulk price form handlers...');

            // Apply button handler (if not using inline onclick)
            if (applyBtn && !applyBtn._handlerSetup) {
                applyBtn._handlerSetup = true;
                applyBtn.addEventListener('click', async (e) => {
                    console.log('Apply button clicked');
                    e.preventDefault();

                    if (bulkPriceUpdates.length === 0) {
                        showToast('No updates to apply', 'warning');
                        return;
                    }

                    if (!confirm(`Update ${bulkPriceUpdates.length} product prices?`)) {
                        return;
                    }

                    showLoading();
                    try {
                        const response = await fetch('/api/admin/bulk-price-update/apply', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ updates: bulkPriceUpdates })
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Failed to apply updates');
                        }

                        const result = await response.json();
                        showToast(result.message, 'success');

                        const formEl = document.getElementById('bulkPriceForm');
                        if (formEl) formEl.reset();
                        const preview = document.getElementById('bulkPricePreview');
                        if (preview) preview.style.display = 'none';
                        bulkPriceUpdates = [];
                    } catch (error) {
                        console.error('Error applying updates:', error);
                        showToast(error.message, 'danger');
                    } finally {
                        hideLoading();
                    }
                });
            }

            console.log('Bulk price form handlers setup complete');
        }

        function displayBulkPricePreview(data) {
            const { summary, updates, notFound, invalidPrices, fuzzyMatches } = data;

            // Update stats
            document.getElementById('matchedCount').textContent = summary.matchedProducts;
            document.getElementById('fuzzyMatchCount').textContent = summary.fuzzyMatches || 0;
            document.getElementById('notFoundCount').textContent = summary.notFound;
            document.getElementById('invalidPriceCount').textContent = summary.invalidPrices;
            document.getElementById('totalRowsCount').textContent = summary.totalRows;

            // Calculate match rate
            const matchRate = summary.totalRows > 0
                ? Math.round((summary.matchedProducts / summary.totalRows) * 100)
                : 0;
            document.getElementById('matchRate').textContent = matchRate + '%';

            // Store updates for apply
            bulkPriceUpdates = updates;

            // Update main table
            const tableBody = document.getElementById('bulkPriceTableBody');
            tableBody.innerHTML = '';

            updates.forEach(update => {
                const row = document.createElement('tr');
                const diffColor = update.difference > 0 ? 'text-danger' : (update.difference < 0 ? 'text-success' : 'text-muted');
                const diffSign = update.difference > 0 ? '+' : '';
                const isFuzzy = update.matchMethod && update.matchMethod.startsWith('fuzzy');
                const rowClass = isFuzzy ? 'table-warning' : '';

                row.className = rowClass;
                row.innerHTML = `
                    <td><small>${update.slug}</small></td>
                    <td>${update.name} ${isFuzzy ? '<i class="fas fa-search text-info ms-1" title="Fuzzy match"></i>' : ''}</td>
                    <td>GHS ${update.currentPrice.toFixed(2)}</td>
                    <td><strong>GHS ${update.newPrice.toFixed(2)}</strong></td>
                    <td class="${diffColor}">${diffSign}GHS ${update.difference.toFixed(2)}</td>
                    <td class="${diffColor}">${diffSign}${update.percentChange}%</td>
                    <td><small class="badge ${isFuzzy ? 'bg-info' : 'bg-success'}">${update.matchMethod || 'exact'}</small></td>
                `;
                tableBody.appendChild(row);
            });

            // Update fuzzy matches table
            const fuzzyMatchesCard = document.getElementById('fuzzyMatchesCard');
            const fuzzyMatchesTableBody = document.getElementById('fuzzyMatchesTableBody');
            fuzzyMatchesTableBody.innerHTML = '';

            if (fuzzyMatches && fuzzyMatches.length > 0) {
                fuzzyMatchesCard.style.display = 'block';
                fuzzyMatches.forEach(item => {
                    const row = document.createElement('tr');
                    row.className = 'table-warning';
                    row.innerHTML = `
                        <td>${item.excelName}</td>
                        <td>${item.matchedName}</td>
                        <td><small>${item.slug}</small></td>
                        <td><span class="badge bg-info">${item.score}</span></td>
                    `;
                    fuzzyMatchesTableBody.appendChild(row);
                });
            } else {
                fuzzyMatchesCard.style.display = 'none';
            }

            // Update not found table
            const notFoundCard = document.getElementById('notFoundCard');
            const notFoundTableBody = document.getElementById('notFoundTableBody');
            notFoundTableBody.innerHTML = '';

            if (notFound.length > 0) {
                notFoundCard.style.display = 'block';
                notFound.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${item.identifier}</td>`;
                    notFoundTableBody.appendChild(row);
                });
            } else {
                notFoundCard.style.display = 'none';
            }

            // Update invalid prices table
            const invalidPricesCard = document.getElementById('invalidPricesCard');
            const invalidPricesTableBody = document.getElementById('invalidPricesTableBody');
            invalidPricesTableBody.innerHTML = '';

            if (invalidPrices.length > 0) {
                invalidPricesCard.style.display = 'block';
                invalidPrices.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${item.identifier}</td><td>${item.providedPrice}</td>`;
                    invalidPricesTableBody.appendChild(row);
                });
            } else {
                invalidPricesCard.style.display = 'none';
            }

            // Show preview section
            document.getElementById('bulkPricePreview').style.display = 'block';
        }

        // Expose necessary functions to window for inline onclick
        window.showToast = showToast;
        window.showLoading = showLoading;
        window.hideLoading = hideLoading;
        window.displayBulkPricePreview = displayBulkPricePreview;
        
        // --- Logs ---
        let currentLogFilename = '';

        async function loadLogFiles() {
            const listContainer = document.getElementById('logFilesList');
            if (!listContainer) return;

            listContainer.innerHTML = '<div class="p-3 text-center text-muted">Loading files...</div>';
            
            try {
                const files = await fetchWithAuth('/api/admin/logs');
                if (!files || files.length === 0) {
                    listContainer.innerHTML = '<div class="p-3 text-center text-muted">No log files found.</div>';
                    return;
                }

                listContainer.innerHTML = files.map(file => `
                    <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center log-file-item" data-filename="${file.name}">
                        <div class="text-truncate" style="max-width: 80%;">
                            <i class="fas fa-file-alt me-2" style="color: var(--luxury-gold);"></i>
                            ${file.name}
                        </div>
                        <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
                    </button>
                `).join('');

                // Add click listeners to log file items
                document.querySelectorAll('.log-file-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const filename = item.dataset.filename;
                        viewLogContent(filename);
                    });
                });
            } catch (error) {
                console.error('Error loading log files:', error);
                listContainer.innerHTML = '<div class="p-3 text-center text-danger">Error loading log files.</div>';
                showToast('Failed to load log files list', 'danger');
            }
        }

        async function viewLogContent(filename) {
            currentLogFilename = filename;
            const contentContainer = document.getElementById('logContent');
            const nameLabel = document.getElementById('currentLogName');
            const refreshBtn = document.getElementById('refreshCurrentLogBtn');

            if (!contentContainer || !nameLabel) return;

            nameLabel.textContent = `Viewing: ${filename}`;
            contentContainer.textContent = 'Loading content...';
            if (refreshBtn) refreshBtn.style.display = 'block';

            // Highlight the active item in the list
            document.querySelectorAll('.log-file-item').forEach(item => {
                item.classList.toggle('active', item.dataset.filename === filename);
            });

            try {
                const data = await fetchWithAuth(`/api/admin/logs/${filename}`);
                contentContainer.textContent = data.content || 'File is empty.';
                // Scroll to bottom
                setTimeout(() => {
                    contentContainer.scrollTop = contentContainer.scrollHeight;
                }, 100);
            } catch (error) {
                console.error(`Error loading log content for ${filename}:`, error);
                contentContainer.textContent = `Error loading content: ${error.message}`;
                showToast(`Failed to load log: ${filename}`, 'danger');
            }
        }

        // Bind log listeners
        document.getElementById('refreshLogFilesBtn')?.addEventListener('click', loadLogFiles);
        document.getElementById('refreshCurrentLogBtn')?.addEventListener('click', () => {
            if (currentLogFilename) viewLogContent(currentLogFilename);
        });

        window.loadLogFiles = loadLogFiles;
    });

})();

