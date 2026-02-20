document.addEventListener('DOMContentLoaded', function() {
            const trackOrderForm = document.getElementById('track-order-form');
            const trackingResults = document.getElementById('tracking-results');
            const noResults = document.getElementById('no-results');
            const trackFormContainer = document.querySelector('.track-form-container');
            
            // Status configuration with icons and descriptions
            const statusConfig = {
                placed: {
                    icon: 'fas fa-shopping-cart',
                    title: 'Order Placed',
                    description: "We've received your order and are preparing it for shipment."
                },
                processing: {
                    icon: 'fas fa-cog',
                    title: 'Processing',
                    description: 'Your order is being processed and will be shipped soon.'
                },
                shipped: {
                    icon: 'fas fa-shipping-fast',
                    title: 'Shipped',
                    description: 'Your order is on its way to you.'
                },
                'out-for-delivery': {
                    icon: 'fas fa-truck',
                    title: 'Out for Delivery',
                    description: 'Your order is out for delivery today.'
                },
                delivered: {
                    icon: 'fas fa-check-circle',
                    title: 'Delivered',
                    description: 'Your order has been successfully delivered.'
                }
            };

            // Handle form submission
            trackOrderForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const orderId = document.getElementById('order-id').value.trim();
                const email = document.getElementById('email').value.trim();
                
                if (!orderId) {
                    showError('Please enter an order ID');
                    return;
                }
                
                // Call real API; if not found or unauthorized, show not found (no demo fallback)
                fetchOrder(orderId, email).catch(function(err){
                    console.warn('Tracking failed:', err);
                    showNoResults();
                });
            });
            
            // Simulated tracking disabled for production consistency (kept for dev/testing via manual call)
            function simulateTracking(orderId, email) {
                const trackBtn = document.querySelector('.btn-track');
                trackBtn.classList.add('loading');
                
                // Hide form and show loading state
                trackFormContainer.classList.add('hidden');
                
                // Simulate API delay
                setTimeout(function() {
                    trackBtn.classList.remove('loading');
                    
                    // For demo purposes, always show success with sample data
                    // In real implementation, you would check if order exists
                    if (orderId) {
                        const sampleOrder = {
                            orderId: orderId,
                            id: orderId,
                            status: 'shipped',
                            createdAt: new Date('2023-11-17'),
                            updatedAt: new Date('2023-11-20'),
                            total: 249.99,
                            paymentMethod: 'credit_card',
                            shipping: {
                                streetAddress: '123 Luxury Avenue',
                                town: 'Premium District',
                                country: 'United States'
                            },
                            statusHistory: [
                                { status: 'placed', date: new Date('2023-11-17 12:32:52') },
                                { status: 'processing', date: new Date('2023-11-18 09:15:23') },
                                { status: 'shipped', date: new Date('2023-11-20 14:45:10') }
                            ]
                        };
                        
                        displayOrderDetails(sampleOrder);
                        animateResults();
                    } else {
                        showNoResults();
                    }
                }, 1500);
            }
            
            // Show error message
            function showError(message) {
                const existingError = document.querySelector('.error-message');
                if (existingError) existingError.remove();
                
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.style.color = '#e74c3c';
                errorEl.style.marginTop = '10px';
                errorEl.style.fontSize = '14px';
                errorEl.textContent = message;
                
                const formGroup = document.querySelector('.form-group:last-child');
                if (formGroup) {
                    formGroup.parentNode.insertBefore(errorEl, formGroup.nextSibling);
                    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Function to animate and show results
            function animateResults(isNoResults = false) {
                if (isNoResults) {
                    noResults.classList.add('visible', 'luxury-reveal');
                    trackingResults.classList.remove('visible');
                } else {
                    trackingResults.classList.add('visible', 'luxury-reveal');
                    noResults.classList.remove('visible');
                }
            }
            
            function showNoResults() {
                animateResults(true);
            }
            
            // Helper: get CSS class for badge based on status
            function getStatusClass(status = '') {
                if (!status) return 'status-processing';
                const s = status.toLowerCase();
                switch (s) {
                    case 'processing':
                    case 'placed':
                        return 'status-processing';
                    case 'shipped':
                    case 'paid':
                        return 'status-shipped';
                    case 'delivered':
                        return 'status-delivered';
                    case 'cancelled':
                    case 'failed':
                        return 'status-cancelled';
                    default:
                        return 'status-processing';
                }
            }
            
            // Helper: derive a date string for a status
            function getStatusDate(order = {}, status, index, currentStatusIndex) {
                // If backend provides a statusHistory array with { status, date } use it
                if (Array.isArray(order.statusHistory)) {
                    const entry = order.statusHistory.find(e => String(e.status).toLowerCase() === String(status).toLowerCase());
                    if (entry && entry.date) {
                        try {
                            return new Date(entry.date).toLocaleString();
                        } catch (e) { /* ignore */ }
                    }
                }

                // If the status is the order's current status use createdAt or updatedAt
                if (order.status && String(order.status).toLowerCase() === String(status).toLowerCase()) {
                    if (order.updatedAt) return new Date(order.updatedAt).toLocaleString();
                    if (order.createdAt) return new Date(order.createdAt).toLocaleString();
                }

                // Fallback: if earlier step show createdAt, later steps leave blank or expected label
                if (index < currentStatusIndex) {
                    return order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
                }

                // For future steps show an expected placeholder
                return index === currentStatusIndex ? (order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '') : 'Not yet';
            }
            
            // Animate timeline steps and details section
            function animateTimeline() {
                const timelineSteps = document.querySelectorAll('.timeline-step');
                timelineSteps.forEach((step, i) => {
                    setTimeout(() => step.classList.add('visible'), i * 180);
                });
                const details = document.querySelector('.luxury-details');
                if (details) {
                    setTimeout(() => details.classList.add('visible'), (timelineSteps.length * 180) + 150);
                }
            }
            
            async function fetchOrder(orderId, email){
                const btn = document.querySelector('.btn-track');
                btn.classList.add('loading');
                trackFormContainer.classList.add('hidden');
                try{
                    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
                    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${qs}`, { credentials: 'include' });
                    if (res.status === 404 || res.status === 401 || res.status === 403) {
                        showNoResults();
                        return;
                    }
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    const order = await res.json();
                    // If server returns an envelope, unwrap common shapes
                    const data = order && (order.order || order.data || order.result || order);
                    if (!data || Object.keys(data).length === 0) {
                        showNoResults();
                        return;
                    }
                    displayOrderDetails(data);
                    animateResults();
                } catch(err){
                    console.error('Fetch order failed', err);
                    showNoResults();
                } finally {
                    btn.classList.remove('loading');
                }
            }

            // Function to display order details
            function displayOrderDetails(order) {
                if (!order) {
                    console.error('No order data provided');
                    return;
                }

                const returnedId = String(order.orderId || order._id || order.id || '');
                const shortId = returnedId ? `#${returnedId.slice(-12).toUpperCase()}` : '#UNKNOWN';
                const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                const formattedDate = orderDate ? orderDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date';

                const headerHtml = `
                    <div class="order-status-header">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div class="order-id-display">${shortId}</div>
                                <div class="order-date">${formattedDate}</div>
                            </div>
                            <span class="status-badge ${getStatusClass(order.status)}">
                                ${order.status ? (String(order.status).charAt(0).toUpperCase() + String(order.status).slice(1)) : 'Unknown'}
                            </span>
                        </div>
                    </div>
                `;

                const timelineSteps = generateTimelineSteps(order);
                const orderDetails = generateOrderDetails(order);

                trackingResults.innerHTML = `
                    ${headerHtml}
                    <div class="luxury-timeline">
                        ${timelineSteps}
                    </div>
                    <div class="luxury-details">
                        ${orderDetails}
                    </div>
                `;

                // Kick off animations
                animateTimeline();
            }
            
            function generateTimelineSteps(order) {
                const statuses = ['placed','processing','shipped','out-for-delivery','delivered'];
                if (String(order.status).toLowerCase() === 'cancelled') statuses.push('cancelled');

                let currentStatusIndex = statuses.findIndex(s => String(s).toLowerCase() === String(order.status).toLowerCase());
                if (currentStatusIndex === -1) currentStatusIndex = Math.max(0, statuses.length - 1);

                return statuses.map((status, index) => {
                    const statusData = statusConfig[status] || { title: status.replace(/-/g,' '), description: '' };
                    const isCompleted = index < currentStatusIndex;
                    const isActive = index === currentStatusIndex;
                    const statusClass = isActive ? 'active' : (isCompleted ? 'completed' : 'upcoming');

                    const dateText = getStatusDate(order, status, index, currentStatusIndex) || (isCompleted ? (order.createdAt ? new Date(order.createdAt).toLocaleString() : '') : '');

                    return `
                        <div class="timeline-step ${statusClass}">
                            <div class="timeline-icon">
                                <i class="${statusData.icon}"></i>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title">${statusData.title}</div>
                                <div class="timeline-date">${dateText}</div>
                                <div class="timeline-description">${statusData.description}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            function generateOrderDetails(order) {
                const address = order.shipping || order.billing || {};
                const fullAddress = (address && address.streetAddress) ?
                    `${address.streetAddress}, ${address.town || ''}, ${address.country || ''}` : 'Not specified';
                const orderId = order.orderId || order._id || order.id || '';
                const totalNum = (typeof order.total === 'number') ? order.total : Number(order.total || 0);

                // Format currency with grouping
                const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(totalNum);

                return `
                    <div class="order-details">
                        <h4 class="details-heading">Order Summary</h4>

                        <div class="detail-row">
                            <span class="detail-label">Order Number:</span>
                            <span class="detail-value order-id">${orderId ? `#${String(orderId).slice(-12).toUpperCase()}` : 'UNKNOWN'}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Order Date:</span>
                            <span class="detail-value">${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Total Amount:</span>
                            <span class="detail-value">${formattedTotal}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Payment Method:</span>
                            <span class="detail-value">${order.paymentMethod === 'credit_card' ? 'Credit Card' : (order.paymentMethod || 'Unknown')}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Shipping Address:</span>
                            <span class="detail-value">${fullAddress}</span>
                        </div>
                    </div>
                `;
            }
            
            // Check for order ID and email in URL on page load and auto-submit
            const urlParams = new URLSearchParams(window.location.search);
            const orderIdFromUrl = urlParams.get('orderId') || urlParams.get('id');
            const emailFromUrl = urlParams.get('email') || urlParams.get('e');

            if (orderIdFromUrl) {
                const orderIdField = document.getElementById('order-id');
                if (orderIdField) orderIdField.value = orderIdFromUrl;
            }
            if (emailFromUrl) {
                const emailField = document.getElementById('email');
                if (emailField) emailField.value = emailFromUrl;
            }
            // Auto submit if we have order id, optionally with email
            if (orderIdFromUrl) {
                // Defer to ensure form listeners are attached
                setTimeout(() => {
                    trackOrderForm.dispatchEvent(new Event('submit'));
                }, 0);
            }
        });
        
        // Reset form function
        function resetForm() {
            document.getElementById('track-order-form').reset();
            document.querySelector('.track-form-container').classList.remove('hidden');
            document.getElementById('tracking-results').classList.remove('visible');
            document.getElementById('no-results').classList.remove('visible');
        }