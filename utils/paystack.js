// utils/paystack.js
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

/**
 * Initialize a Paystack payment transaction
 * @param {Object} params - Payment parameters
 * @param {Number} params.amount - Amount in kobo (smallest currency unit)
 * @param {String} params.email - Customer email
 * @param {String} params.reference - Unique transaction reference
 * @param {String} params.metadata - Additional metadata (orderId, customer info, etc.)
 * @param {String} params.callback_url - Callback URL after payment
 * @returns {Promise<Object>} Paystack response with authorization_url
 */
async function initializePayment({ amount, email, reference, metadata = {}, callback_url }) {
  try {
    const response = await paystack.transaction.initialize({
      amount: Math.round(amount), // Amount in kobo (GHS * 100)
      email,
      reference,
      metadata,
      callback_url,
      currency: 'GHS',
      channels: ['card', 'mobile_money', 'bank', 'ussd', 'qr', 'apple_pay']
    });

    if (!response.status) {
      throw new Error(response.message || 'Failed to initialize payment');
    }

    return {
      success: true,
      authorization_url: response.data.authorization_url,
      access_code: response.data.access_code,
      reference: response.data.reference
    };
  } catch (error) {
    console.error('Paystack initialization error:', error);
    throw new Error(error.message || 'Payment initialization failed');
  }
}

/**
 * Verify a Paystack transaction
 * @param {String} reference - Transaction reference to verify
 * @returns {Promise<Object>} Transaction details
 */
async function verifyPayment(reference) {
  try {
    const response = await paystack.transaction.verify(reference);

    if (!response.status) {
      throw new Error(response.message || 'Payment verification failed');
    }

    const { data } = response;
    
    return {
      success: true,
      status: data.status, // 'success', 'failed', 'abandoned', etc.
      paid: data.status === 'success',
      amount: data.amount / 100, // Convert from kobo to GHS
      currency: data.currency,
      reference: data.reference,
      gateway_response: data.gateway_response,
      customer: data.customer,
      metadata: data.metadata,
      paid_at: data.paid_at,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Paystack verification error:', error);
    throw new Error(error.message || 'Payment verification failed');
  }
}

/**
 * Verify webhook signature from Paystack
 * @param {String} signature - X-Paystack-Signature header value
 * @param {Buffer|String|Object} body - Request body (Buffer from express.raw() or parsed object)
 * @returns {Boolean} True if signature is valid
 */
function verifyWebhookSignature(signature, body) {
  const crypto = require('crypto');
  
  // Handle different body types
  const bodyString = Buffer.isBuffer(body) 
    ? body.toString('utf8')
    : (typeof body === 'string' ? body : JSON.stringify(body));
  
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(bodyString)
    .digest('hex');
  
  return hash === signature;
}

module.exports = {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature
};

