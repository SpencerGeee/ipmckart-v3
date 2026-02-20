// routes/orders.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Order = require('../models/Order');
const Product = require('../models/Product');
const requireAuthOptional = require('../middleware/authOptional');
const { sendOrderConfirmationEmail } = require('../utils/mailjet');
const { initializePayment, verifyPayment, verifyWebhookSignature } = require('../utils/paystack');

const clampQty = (n) => Math.max(1, Math.min(999, Number(n) || 1));

async function resolveProducts(clientItems) {
  const ids = Array.from(new Set(clientItems.map(i => String(i.productId)).filter(Boolean)));
  const objIds = ids.filter(x => /^[a-f\d]{24}$/i.test(x));
  const slugs = ids.filter(x => !/^[a-f\d]{24}$/i.test(x));

  const [byId, bySlug] = await Promise.all([
    objIds.length ? Product.find({ _id: { $in: objIds } }).lean() : [],
    slugs.length ? Product.find({ slug: { $in: slugs } }).lean() : []
  ]);

  const map = new Map();
  byId.forEach(p => map.set(String(p._id), p));
  bySlug.forEach(p => map.set(String(p.slug), p));
  return map;
}

router.post('/', requireAuthOptional, async (req, res) => {
  try {
    logger.debug('Request user:', req.user);
    const { items, billing, shipping, shippingMethod, shippingCost, paymentMethod } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart empty' });
    }
    if (!billing || !billing.name || !billing.email || !billing.streetAddress || !billing.town || !billing.phone) {
      return res.status(400).json({ message: 'Missing required billing fields' });
    }

    const productMap = await resolveProducts(items);
    // Allow test-only carts to proceed even if products aren't found in DB
    // (we will synthesize test products on the fly below if necessary)

    let subtotal = 0;
    const orderItems = [];

    for (const ci of items) {
      const key = String(ci.productId);
      let p = productMap.get(key);
      // Fallback: synthesize a virtual test product if identifier suggests test item
      if (!p) {
        const keyStr = String(key).toLowerCase();
        const looksLikeTest = keyStr.includes('test-') || keyStr.includes('test_product') || keyStr.includes('test') || keyStr.includes('payment');
        if (looksLikeTest) {
          p = {
            _id: key, // use the slug as a pseudo id
            slug: key,
            name: 'Test Product (Payment Integration)',
            price: 1,
            stock: 999999,
            isTestProduct: true
          };
        } else {
          return res.status(400).json({ message: 'One or more items invalid' });
        }
      }

      const qty = clampQty(ci.qty);
      if (typeof p.stock === 'number' && p.stock < qty) {
        return res.status(409).json({ message: `Insufficient stock for ${p.name}` });
      }

      const price = Number(p.price) || 0;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      orderItems.push({
        productId: p._id,
        name: p.name,
        image: p.image || '',
        price,
        qty,
        lineTotal,
        custom: ci.custom ? {
          color: ci.custom.color || '',
          size: ci.custom.size || '',
          design: ci.custom.design || ''
        } : undefined
      });
    }

    // Enforce flat 1 GHS total for test-only carts
    const isTestProduct = (prod) => {
      if (!prod) return false;
      const name = String(prod.name || '').toLowerCase();
      const idStr = String(prod._id || prod.id || prod.slug || '');
      return Boolean(prod.isTestProduct || idStr.includes('test-') || name.includes('test product') || Number(prod.price) === 1);
    };
    const isOnlyTestProductCart = items.every(ci => {
      const p = productMap.get(String(ci.productId));
      return isTestProduct(p);
    });

    let calcShippingCost = Number(shippingCost) || 0;
    if (isOnlyTestProductCart) {
      calcShippingCost = 0;
      subtotal = 1; // force subtotal display to 1 GHS
    }
    const total = isOnlyTestProductCart ? 1 : (subtotal + calcShippingCost);

    const userId = req.user && req.user._id ? req.user._id : null; // Ensure _id exists
    logger.debug('Setting userId:', userId);

    // Determine initial status based on payment method
    const initialStatus = (paymentMethod === 'paystack') ? 'processing' : 'placed';
    
    const order = await Order.create({
      user: userId,
      items: orderItems,
      billing: {
        name: billing.name,
        email: billing.email,
        companyName: billing.companyName || '',
        country: billing.country || '',
        streetAddress: billing.streetAddress || '',
        streetAddress2: billing.streetAddress2 || '',
        town: billing.town || '',
        state: billing.state || '',
        zipCode: billing.zipCode || '',
        phone: billing.phone || '',
        notes: billing.notes || ''
      },
      shipping: shipping ? {
        name: shipping.name || '',
        email: shipping.email || '',
        companyName: shipping.companyName || '',
        country: shipping.country || '',
        streetAddress: shipping.streetAddress || '',
        streetAddress2: shipping.streetAddress2 || '',
        town: shipping.town || '',
        state: shipping.state || '',
        zipCode: shipping.zipCode || '',
        phone: shipping.phone || '',
        notes: shipping.notes || ''
      } : billing,
      shippingMethod: ['express', 'standard'].includes(shippingMethod) ? shippingMethod : 'standard',
      shippingCost: calcShippingCost,
      subtotal,
      total,
      currency: 'GHS',
      status: initialStatus,
      paymentMethod: paymentMethod || 'cod',
      gateway: paymentMethod === 'paystack' ? 'paystack' : 'none'
    });

    // Send order confirmation email (don't block the response)
    const itemListHtml = order.items.map(item => `<li>${item.name} (x${item.qty}) - GHS ${item.lineTotal.toFixed(2)}</li>`).join('');
    const shippingAddressHtml = `${order.shipping.name}<br>${order.shipping.streetAddress}<br>${order.shipping.town}, ${order.shipping.state} ${order.shipping.zipCode}<br>${order.shipping.country}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 days from now

    sendOrderConfirmationEmail({
      toEmail: order.billing.email,
      bccEmail: process.env.ADMIN_EMAIL,
      userName: order.billing.name,
      orderId: order._id.toString(),
      itemList: `<ul>${itemListHtml}</ul>`,
      paymentAmount: `GHS ${order.total.toFixed(2)}`,
      shippingAddress: shippingAddressHtml,
      estimatedDeliveryDate: estimatedDelivery.toDateString(),
      trackLink: `${process.env.WEBSITE_URL}/track-order.html?id=${order._id.toString()}`
    }).catch(err => logger.error('Failed to send order confirmation email:', err));


    // If Paystack payment, initialize payment and return authorization URL
    if (paymentMethod === 'paystack') {
      try {
        const reference = `ORDER-${order._id}-${Date.now()}`;
        const callbackUrl = `${process.env.WEBSITE_URL || 'https://ipmckart.com'}/order-complete.html?orderId=${order._id}`;
        
        const paymentInit = await initializePayment({
          amount: total * 100, // Convert to pesewas/kobo
          email: billing.email,
          reference,
          metadata: {
            orderId: order._id.toString(),
            userId: userId ? userId.toString() : 'guest',
            custom_fields: [
              { display_name: 'Order ID', variable_name: 'order_id', value: order._id.toString() },
              { display_name: 'Customer Name', variable_name: 'customer_name', value: billing.name }
            ]
          },
          callback_url: callbackUrl
        });

        // Update order with payment reference
        order.gatewayRef = reference;
        await order.save();

        return res.json({
          orderId: order._id,
          status: 'payment_required',
          paymentMethod: 'paystack',
          authorization_url: paymentInit.authorization_url,
          access_code: paymentInit.access_code,
          reference: paymentInit.reference
        });
      } catch (paymentError) {
        logger.error('Payment initialization error:', paymentError);
        // Mark order as failed
        order.status = 'failed';
        await order.save();
        return res.status(500).json({ message: 'Payment initialization failed. Please try again.' });
      }
    }

    res.json({ orderId: order._id, status: 'success' });
  } catch (err) {
    logger.error('Create order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/my-orders
// Returns orders belonging to the authenticated user, or guest orders if ?email= is provided
router.get('/my-orders', requireAuthOptional, async (req, res) => {
  try {
    // If user is authenticated, use user._id
    if (req.user && req.user._id) {
      const orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
      return res.json(orders);
    }

    // Otherwise, check for email query param (guest lookup)
    const qEmail = (req.query.email || '').trim().toLowerCase();
    if (!qEmail) {
      return res.status(400).json({ message: 'Missing email for guest order lookup' });
    }

    // Match billing.email (case-insensitive)
    const orders = await Order.find({ 'billing.email': { $regex: `^${qEmail}$`, $options: 'i' } })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (err) {
    logger.error('my-orders error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/orders/verify-payment
// Verify Paystack payment after redirect
router.post('/verify-payment', requireAuthOptional, async (req, res) => {
  try {
    const { reference, orderId } = req.body;
    
    if (!reference || !orderId) {
      return res.status(400).json({ message: 'Missing reference or orderId' });
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(reference);
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment was successful
    if (verification.paid && verification.status === 'success') {
      // Verify amount matches
      const expectedAmount = order.total * 100; // Convert to pesewas
      if (Math.abs(verification.amount - expectedAmount) > 1) { // Allow 1 pesewa difference for rounding
        logger.error(`Amount mismatch: expected ${expectedAmount}, got ${verification.amount}`);
        return res.status(400).json({ message: 'Payment amount mismatch' });
      }

      // Update order status
      order.status = 'paid';
      order.gatewayRef = reference;
      await order.save();

      // Send order confirmation email
      const itemListHtml = order.items.map(item => `<li>${item.name} (x${item.qty}) - GHS ${item.lineTotal.toFixed(2)}</li>`).join('');
      const shippingAddressHtml = `${order.shipping.name}<br>${order.shipping.streetAddress}<br>${order.shipping.town}, ${order.shipping.state} ${order.shipping.zipCode}<br>${order.shipping.country}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

      sendOrderConfirmationEmail({
        toEmail: order.billing.email,
        bccEmail: process.env.ADMIN_EMAIL,
        userName: order.billing.name,
        orderId: order._id.toString(),
        itemList: `<ul>${itemListHtml}</ul>`,
        paymentAmount: `GHS ${order.total.toFixed(2)}`,
        shippingAddress: shippingAddressHtml,
        estimatedDeliveryDate: estimatedDelivery.toDateString(),
        trackLink: `${process.env.WEBSITE_URL}/track-order.html?id=${order._id.toString()}`
      }).catch(err => logger.error('Failed to send order confirmation email:', err));

      return res.json({
        success: true,
        orderId: order._id,
        status: 'paid',
        message: 'Payment verified successfully'
      });
    } else {
      // Payment failed
      order.status = 'failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: verification.gateway_response || 'Payment verification failed'
      });
    }
  } catch (err) {
    logger.error('Payment verification error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// POST /api/orders/paystack-webhook
// Handle Paystack webhook events (payment.success, charge.success, etc.)
// Note: This route should be configured to accept raw body in server.js
router.post('/paystack-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      return res.status(400).json({ message: 'Missing signature' });
    }

    // Body should be a Buffer from express.raw() - ALWAYS use raw body for signature verification
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    
    // Verify webhook signature using the RAW body (critical for security)
    if (!verifyWebhookSignature(signature, rawBody)) {
      logger.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    
    // Handle different event types
    if (event.event === 'charge.success' || event.event === 'paymentrequest.success') {
      const { reference, metadata } = event.data;
      
      if (!reference || !metadata || !metadata.orderId) {
        return res.status(400).json({ message: 'Missing reference or orderId in metadata' });
      }

      // Verify payment again to be sure
      const verification = await verifyPayment(reference);
      
      if (verification.paid && verification.status === 'success') {
        const order = await Order.findById(metadata.orderId);
        
        if (order && order.status !== 'paid') {
          order.status = 'paid';
          order.gatewayRef = reference;
          await order.save();

          // Send confirmation email
          const itemListHtml = order.items.map(item => `<li>${item.name} (x${item.qty}) - GHS ${item.lineTotal.toFixed(2)}</li>`).join('');
          const shippingAddressHtml = `${order.shipping.name}<br>${order.shipping.streetAddress}<br>${order.shipping.town}, ${order.shipping.state} ${order.shipping.zipCode}<br>${order.shipping.country}`;
          const estimatedDelivery = new Date();
          estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

          sendOrderConfirmationEmail({
            toEmail: order.billing.email,
            bccEmail: process.env.ADMIN_EMAIL,
            userName: order.billing.name,
            orderId: order._id.toString(),
            itemList: `<ul>${itemListHtml}</ul>`,
            paymentAmount: `GHS ${order.total.toFixed(2)}`,
            shippingAddress: shippingAddressHtml,
                estimatedDeliveryDate: estimatedDelivery.toDateString(),
                trackLink: `${process.env.WEBSITE_URL}/track-order.html?id=${order._id.toString()}`
              }).catch(err => logger.error('Failed to send order confirmation email:', err));
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

router.get('/:id', requireAuthOptional, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // New: Authorization check
    // New: Authorization check (admins can always view)
    const queryEmail = req.query.email?.toLowerCase();

    // If user is admin allow access
    if (req.user && req.user.role === 'admin') {
      // admin may view any order
    } else {
      const isAuthenticatedOwner = req.user && order.user && order.user.toString() === req.user._id.toString();
      const isGuestWithMatchingEmail = !order.user && queryEmail && (order.billing.email || '').toLowerCase() === queryEmail;

      if (!isAuthenticatedOwner && !isGuestWithMatchingEmail) {
        return res.status(403).json({ message: 'Unauthorized to view this order' });
      }
    }


    res.json({
      orderId: order._id,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      currency: order.currency,
      createdAt: order.createdAt,
      billing: order.billing,
      shipping: order.shipping,
      shippingMethod: order.shippingMethod || 'standard',
      paymentMethod: order.paymentMethod || 'cod',
      items: order.items
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;