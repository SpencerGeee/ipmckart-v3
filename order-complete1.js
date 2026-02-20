// order-complete.js
(function() {
  'use strict';
  
  const API_BASE = '/api';

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  async function verifyPaystackPayment(orderId, reference) {
    try {
      const res = await fetch(`${API_BASE}/orders/verify-payment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, orderId })
      });

      const data = await res.json();
      return data.success && data.status === 'paid';
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  async function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    // Check if returning from Paystack payment
    const reference = urlParams.get('reference') || urlParams.get('trxref');
    
    if (!orderId) {
      document.querySelector('.success-card').innerHTML = '<h1>Error</h1><p>No order ID found in URL.</p>';
      return;
    }
    
    // If we have a payment reference, verify the payment first
    if (reference && orderId) {
      const verified = await verifyPaystackPayment(orderId, reference);
      if (verified) {
        // Clear the cart after successful payment
        try {
          if (typeof CartManager !== 'undefined' && CartManager.clearCart) {
            await CartManager.clearCart();
          } else {
            await fetch(`${API_BASE}/cart`, {
              method: 'DELETE',
              credentials: 'include'
            });
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
        }
        
        // Remove reference from URL to prevent re-verification on refresh
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('reference');
        newUrl.searchParams.delete('trxref');
        window.history.replaceState({}, '', newUrl);
      }
    }
    
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.message || 'Could not load order details');
      }
      
      const order = await res.json();
      
      // Get all detail values in order
      const detailValues = document.querySelectorAll('.detail-row .detail-value');
      if (detailValues.length < 6) {
        console.error('Unexpected number of detail rows:', detailValues.length);
      }

      // Order Number (make it uppercase last 8 chars, prefixed with #)
      const displayOrderId = order.orderId || order._id || order.id;
      detailValues[0].textContent = `#${displayOrderId.toString().slice(-8).toUpperCase()}`;

      // Order Date
      detailValues[1].textContent = new Date(order.createdAt).toLocaleDateString();

      // Total Amount (use total, not subtotal)
      detailValues[2].textContent = `₵${order.total.toFixed(2)}`;

      // Payment Method
      let paymentMethodDisplay = 'Cash on Delivery';
      if (order.paymentMethod === 'paystack') {
        paymentMethodDisplay = 'Paystack (Card, Mobile Money, Apple Pay)';
      } else if (order.paymentMethod && order.paymentMethod !== 'cod') {
        paymentMethodDisplay = order.paymentMethod;
      }
      detailValues[3].textContent = paymentMethodDisplay;

      // Shipping Address (use shipping if available, else billing; build full string)
      const address = order.shipping || order.billing;
      let fullAddress = `${address.streetAddress}${address.streetAddress2 ? ` ${address.streetAddress2}` : ''}, ${address.town}`;
      if (address.state) fullAddress += `, ${address.state}`;
      if (address.zipCode) fullAddress += ` ${address.zipCode}`;
      if (address.country) fullAddress += `, ${address.country}`;
      detailValues[4].textContent = fullAddress;

      // Estimated Delivery (dynamic based on shippingMethod)
      const daysMin = order.shippingMethod === 'express' ? 1 : 2;
      const daysMax = order.shippingMethod === 'express' ? 2 : 5;
      const orderDate = new Date(order.createdAt);
      const minDel = addDays(orderDate, daysMin);
      const maxDel = addDays(orderDate, daysMax);

      let deliveryStr;
      if (minDel.getMonth() === maxDel.getMonth()) {
        deliveryStr = `${minDel.toLocaleString('default', { month: 'long' })} ${minDel.getDate()}-${maxDel.getDate()}, ${minDel.getFullYear()}`;
      } else {
        deliveryStr = `${minDel.toLocaleString('default', { month: 'long' })} ${minDel.getDate()} - ${maxDel.toLocaleString('default', { month: 'long' })} ${maxDel.getDate()}, ${minDel.getFullYear()}`;
      }
      detailValues[5].textContent = deliveryStr;

      // Update track order button
      const trackBtn = document.querySelector('.btn-primary');
      if (trackBtn) {
        const trackOrderId = order.orderId || order._id || order.id;
        trackBtn.href = `track-order.html?orderId=${trackOrderId}`;
      }

    } catch (err) {
      console.error(err);
      document.querySelector('.success-card').innerHTML = `<h1>Error</h1><p>${err.message}. Please check your order in the <a href="/dashboard.html">dashboard</a>.</p>`;
    }
  }
  
  document.addEventListener('DOMContentLoaded', loadOrderDetails);

})();