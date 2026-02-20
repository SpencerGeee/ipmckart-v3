document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const trackOrderForm = document.getElementById('track-order-form');
    const trackingResults = document.getElementById('tracking-results');
    const noResults = document.getElementById('no-results');
    const trackContentContainer = document.querySelector('.track-content-container');
    const trackFormContainer = document.querySelector('.track-form-container');
    const API_BASE = '/api';

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
        },
        cancelled: {
            icon: 'fas fa-times-circle',
            title: 'Cancelled',
            description: 'Your order has been cancelled.'
        }
    };

    if (!trackOrderForm) return;

    async function trackOrder(orderId, email = null) {
        if (!orderId) {
            alert('Please provide an Order ID.');
            return;
        }

        try {
            let url = `${API_BASE}/orders/${orderId}`;
            if (email) {
                url += `?email=${encodeURIComponent(email)}`;
            }

            const res = await fetch(url, {
                credentials: 'include'
            });

            if (!res.ok) {
                if (res.status === 404 || res.status === 403) {
                    showNoResults();
                } else {
                    let errMessage = 'An error occurred';
                    try {
                        const errData = await res.json();
                        if (errData && errData.message) errMessage = errData.message;
                    } catch (e) { /* ignore json parse errors */ }
                    throw new Error(errMessage);
                }
                return;
            }

            const order = await res.json();
            if (!order || (!order.orderId && !order._id && !order.id)) {
                console.error('Invalid order data received:', order);
                showNoResults();
                return;
            }
            displayOrderDetails(order);
            animateResults();

        } catch (err) {
            console.error('Tracking Error:', err);
            showNoResults();
        }
    }

    // Handle manual form submission
    trackOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const orderId = document.getElementById('order-id').value.trim();
        const email = document.getElementById('email')?.value.trim();

        if (!orderId) {
            showError('Please enter an order ID');
            return;
        }

        trackOrder(orderId, email || null);
    });

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

    // Check for order ID in URL on page load (support both 'orderId' and 'id' parameters)
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('orderId') || urlParams.get('id');

    if (orderIdFromUrl) {
        const orderIdField = document.getElementById('order-id');
        if (orderIdField) orderIdField.value = orderIdFromUrl;

        const emailField = document.getElementById('email');
        if (emailField) emailField.focus();

        if (!window.location.hash) {
            // auto-submit; don't require email when user is authenticated by cookie
            trackOrder(orderIdFromUrl);
        }
    }

    // Function to animate and show results
    function animateResults(isNoResults = false) {
  if (!trackFormContainer || !trackingResults || !noResults) return;

  const trackBtn = document.querySelector('.btn-track') || trackOrderForm.querySelector('button[type="submit"]');
  if (trackBtn) {
    trackBtn.classList.add('loading');
    trackBtn.disabled = true;
  }

  // softly hide the form
  trackFormContainer.style.transition = 'opacity 320ms ease, transform 320ms ease';
  trackFormContainer.style.opacity = '0';
  trackFormContainer.style.transform = 'translateY(-8px)';
  trackFormContainer.style.pointerEvents = 'none';

  setTimeout(() => {
    trackFormContainer.style.display = 'none';

    // Ensure results containers are hidden initially
    trackingResults.style.display = 'none';
    trackingResults.classList.remove('visible');
    noResults.style.display = 'none';
    noResults.classList.remove('visible');

    if (isNoResults) {
      noResults.style.display = 'block';
      setTimeout(() => {
        noResults.classList.add('visible');
      }, 50);
    } else {
      trackingResults.style.display = 'block';
      setTimeout(() => {
        trackingResults.classList.add('visible', 'luxury-reveal');
      }, 50);
    }

    if (trackBtn) {
      trackBtn.classList.remove('loading');
      trackBtn.disabled = false;
    }

    // animate timeline steps
    animateTimeline();
  }, 380);
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

    // Helper: derive a date string for a status (tries to use order.statusHistory if available)
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
        const details = document.querySelector('.order-details-section');
        if (details) {
            setTimeout(() => details.classList.add('visible'), (timelineSteps.length * 180) + 150);
        }
    }

    // Function to display order details
 function displayOrderDetails(order) {
  if (!trackingResults) {
    console.error('trackingResults element not found');
    return;
  }
  
  if (!order) {
    console.error('No order data provided');
    return;
  }

  const returnedId = String(order.orderId || order._id || order.id || '');
  const shortId = returnedId ? `#${returnedId.slice(-12).toUpperCase()}` : '#UNKNOWN';
  const orderDate = order.createdAt ? new Date(order.createdAt) : null;
  const formattedDate = orderDate ? orderDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown date';

  const headerHtml = `
    <div class="order-status-header luxury-header">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <div class="order-id-display elegant-id">${shortId}</div>
          <div class="order-date subtle">${formattedDate}</div>
        </div>
        <span class="status-badge ${getStatusClass(order.status)} elegant-badge">
          ${order.status ? (String(order.status).charAt(0).toUpperCase() + String(order.status).slice(1)) : 'Unknown'}
        </span>
      </div>
    </div>
  `;

  const timelineSteps = generateTimelineSteps(order);
  const orderDetails = generateOrderDetails(order);

  trackingResults.innerHTML = `
    ${headerHtml}
    <div class="timeline tracking-timeline luxury-timeline">
      ${timelineSteps}
    </div>
    <div class="order-details-section luxury-details">
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
        <div class="timeline-icon luxury-icon">
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
    const formattedTotal = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 }).format(totalNum);

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
                <span class="detail-value">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || 'Unknown')}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Shipping Address:</span>
                <span class="detail-value">${fullAddress}</span>
            </div>
        </div>
    `;
}
});
