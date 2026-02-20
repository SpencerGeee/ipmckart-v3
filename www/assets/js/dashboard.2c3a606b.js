// Updated dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // Wire up logout handlers
    document.querySelectorAll('[data-logout], .logout-link, a[href="/logout"]').forEach(link => {
        link.addEventListener('click', handleLogout);
    });

    // Show loading state
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 50vh;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="ms-3">Loading your dashboard...</span>
            </div>`;
    }

    const userNameElement = document.getElementById('user-name');
    const userNameAltElement = document.getElementById('user-name-alt');
    const userEmailElement = document.getElementById('user-email');
    const userCreatedElement = document.getElementById('user-created');
    const userProviderElement = document.getElementById('user-provider');
    const userRoleElement = document.getElementById('user-role');
    const userVerifiedElement = document.getElementById('user-verified');

    // Forms
    const accountDetailsForm = document.querySelector('#edit form');
    const billingAddressForm = document.getElementById('billing-address-form');

    // Add CSRF token to all forms
    let csrfToken = '';

    /**
     * Shows a toast notification
     */
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || (() => {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
            return container;
        })();

        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type} border-0`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 150);
        }, 5000);
    }

    /**
     * Renders a feedback message to the user.
     * @param {string} elementId - The ID of the message container element.
     * @param {string} message - The message to display.
     * @param {boolean} isError - If true, formats the message as an error.
     */
    function showFeedback(elementId, message, isError = false) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = message;
        el.className = isError ? 'alert alert-danger' : 'alert alert-success';
        
        // Auto-hide after 5 seconds
        if (message) {
            setTimeout(() => {
                el.textContent = '';
                el.className = 'd-none';
            }, 5000);
        }
    }

    /**
     * Populates a form with data from a user object.
     * @param {HTMLFormElement} form - The form element to populate.
     * @param {object} data - The data object (e.g., user.billingAddress).
     */
    function populateForm(form, data) {
        if (!form || !data) return;
        for (const key in data) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key] || '';
            }
        }
    }

    /**
     * Verifies the user's session is still valid
     */
    async function verifySession() {
        try {
            const response = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                // If not authenticated, redirect to login
                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/login.html?returnUrl=${returnUrl}`;
                return false;
            }
            return true;
        } catch (error) {
            console.error('Session verification failed:', error);
            return false;
        }
    }

    /**
     * Handles logout - FIXED VERSION
     */
    function handleLogout(e) {
        if (e) e.preventDefault();
        
        console.log('Logout initiated...');
        
        // Clear any client-side state
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to server logout endpoint which will clear cookie and redirect
        window.location.href = '/api/auth/logout';
    }

    async function handleApiError(response) {
        if (response.status === 401) {
            await handleLogout();
            return true;
        }
        
        if (response.status === 403) {
            showToast('You do not have permission to perform this action', 'danger');
            return true;
        }
        
        if (response.status >= 500) {
            showToast('A server error occurred. Please try again later.', 'danger');
            return true;
        }
        
        return false;
    }

    /**
     * Main function to fetch user data and populate the dashboard.
     */
    async function loadUserData() {
        try {
            // Show loading state
            document.body.style.cursor = 'wait';
            
            // First verify the session
            const isSessionValid = await verifySession();
            if (!isSessionValid) {
                return;
            }
            
            // Now fetch user data
            const response = await fetch('/api/me', {
                method: 'GET',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (await handleApiError(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const user = await response.json();
            
            // Store CSRF token if available
            if (response.headers.has('x-csrf-token')) {
                csrfToken = response.headers.get('x-csrf-token');
            }

            // 1. Populate Dashboard Welcome
            const displayName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
            if (userNameElement) userNameElement.textContent = displayName;
            if (userNameAltElement) userNameAltElement.innerHTML = `<b>${displayName}</b>`;
            
            // 2. Populate Dashboard Details Card
            if (userEmailElement) userEmailElement.textContent = user.email || 'N/A';
            if (userCreatedElement) userCreatedElement.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            if (userProviderElement) userProviderElement.textContent = user.provider || 'Local';
            if (userRoleElement) userRoleElement.textContent = user.role || 'Customer';
            if (userVerifiedElement) userVerifiedElement.textContent = user.emailVerified ? 'Yes' : 'No';

            // 3. Populate "Account Details" Form
            if (accountDetailsForm) {
                accountDetailsForm.querySelector('#acc-name').value = user.firstName || '';
                accountDetailsForm.querySelector('#acc-lastname').value = user.lastName || '';
                accountDetailsForm.querySelector('#acc-text').value = user.displayName || '';
                accountDetailsForm.querySelector('#acc-email').value = user.email || '';
                
                // Add CSRF token to form
                let csrfInput = accountDetailsForm.querySelector('input[name="_csrf"]');
                if (!csrfInput && csrfToken) {
                    csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_csrf';
                    csrfInput.value = csrfToken;
                    accountDetailsForm.appendChild(csrfInput);
                } else if (csrfInput && csrfToken) {
                    csrfInput.value = csrfToken;
                }
            }
            
            // 4. Populate "Billing Address" Form
            if (billingAddressForm && user.billingAddress) {
                Object.keys(user.billingAddress).forEach(key => {
                    const input = billingAddressForm.querySelector(`[name="billing_${key}"]`);
                    if (input) input.value = user.billingAddress[key] || '';
                });
                
                // Add CSRF token to form
                let csrfInput = billingAddressForm.querySelector('input[name="_csrf"]');
                if (!csrfInput && csrfToken) {
                    csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_csrf';
                    csrfInput.value = csrfToken;
                    billingAddressForm.appendChild(csrfInput);
                } else if (csrfInput && csrfToken) {
                    csrfInput.value = csrfToken;
                }
            }
            
            // Show success message if redirected after login
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('login') === 'success') {
                showToast('Successfully logged in!', 'success');
                // Clean up URL
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }

        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Failed to load your dashboard. Please try again.', 'danger');
        } finally {
            // Hide loading state
            document.body.style.cursor = 'default';
            if (mainContent && mainContent.querySelector('.spinner-border')) {
                mainContent.innerHTML = '';
            }
        }
    }

    /**
     * Handles submission for the Account Details form.
     */
    accountDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(accountDetailsForm);
        const data = {
            firstName: formData.get('acc-name'),
            lastName: formData.get('acc-lastname'),
            displayName: formData.get('acc-text'),
            email: formData.get('acc-email'),
        };

        const newPassword = formData.get('acc-new-password');
        const confirmPassword = formData.get('acc-confirm-password');
        const currentPassword = formData.get('acc-password');

        // --- Update User Details ---
        try {
            const res = await fetch('/api/me/details', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showFeedback('account-details-message', result.message);
        } catch (error) {
            showFeedback('account-details-message', error.message, true);
        }

        // --- Handle Password Change (if fields are filled) ---
        if (newPassword && currentPassword) {
            if (newPassword !== confirmPassword) {
                return showFeedback('account-details-message', 'New passwords do not match.', true);
            }
            try {
                const res = await fetch('/api/me/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ currentPassword, newPassword }),
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showFeedback('account-details-message', 'Details and password updated successfully!');
                accountDetailsForm.reset(); // Clear password fields
            } catch (error) {
                showFeedback('account-details-message', error.message, true);
            }
        }
    });

    /**
     * Handles submission for the Billing Address form.
     */
    billingAddressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(billingAddressForm);
        // Create an object from the form data
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/me/address/billing', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            showFeedback('billing-address-message', result.message);
        } catch (error) {
            showFeedback('billing-address-message', error.message, true);
        }
    });

    /**
     * Fetches and renders the user's recent orders.
     */
    async function loadUserOrders() {
        const ordersContainer = document.querySelector('#orders .orders-list');
        const ordersTableBody = document.querySelector('#orders .table tbody');

        if (!ordersContainer || !ordersTableBody) {
            console.warn('Orders container or table body not found.');
            return;
        }

        try {
            // Build URL with email parameter if user is not authenticated (for guest orders)
            let url = '/api/orders/my-orders';
            const urlParams = new URLSearchParams();
            
            // Check if user is authenticated by checking for user data
            const userInfo = await getUserInfo();
            if (!userInfo || !userInfo.email) {
                // Try to get email from localStorage (from checkout) or query params
                const guestEmail = localStorage.getItem('guest_checkout_email') || 
                                   new URLSearchParams(window.location.search).get('email');
                if (guestEmail) {
                    urlParams.append('email', guestEmail);
                }
            }
            
            if (urlParams.toString()) {
                url += '?' + urlParams.toString();
            }

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.status === 401 || response.status === 403) {
                // User not authenticated and no email provided
                ordersContainer.innerHTML = '<div class="alert alert-info">Please log in or provide your email to view orders.</div>';
                return;
            }

            if (await handleApiError(response)) return;

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const orders = await response.json();

            if (!orders || orders.length === 0) {
                ordersContainer.innerHTML = '<div class="alert alert-info">You have no orders yet. Start shopping to see your orders here!</div>';
                return;
            }

            ordersTableBody.innerHTML = ''; // Clear existing rows
            orders.forEach(order => {
                const row = document.createElement('tr');
                const statusClass = getStatusClass(order.status);
                
                const fullId = String(order._id || order.id || order.orderId || '');
                const shortId = fullId ? `#${fullId.slice(-8).toUpperCase()}` : '#UNKNOWN';
                const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';

                row.innerHTML = `
                    <td><a href="track-order.html?orderId=${fullId}" title="Track Order">${shortId}</a></td>
                    <td>${orderDate}</td>
                    <td><span class="badge ${statusClass}">${(order.status || 'placed').charAt(0).toUpperCase() + (order.status || 'placed').slice(1)}</span></td>
                    <td>₵${(Number(order.total) || 0).toFixed(2)}</td>
                    <td>
                        <a href="track-order.html?orderId=${fullId}" class="btn btn-sm btn-outline-primary">Track</a>
                    </td>
                `;

                ordersTableBody.appendChild(row);
            });

        } catch (error) {
            console.error('Error loading user orders:', error);
            ordersContainer.innerHTML = '<div class="alert alert-danger">Could not load your orders. Please try again later.</div>';
        }
    }
    
    // Helper function to get user info
    async function getUserInfo() {
        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'paid':
            case 'shipped':
                return 'bg-success';
            case 'placed':
            case 'processing':
                return 'bg-warning text-dark';
            case 'delivered':
                return 'bg-primary';
            case 'cancelled':
            case 'failed':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Initial load of all user data
    loadUserData();
    loadUserOrders();
});