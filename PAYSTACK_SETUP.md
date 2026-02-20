# Paystack Payment Integration Setup Guide

This document provides instructions for setting up and configuring the Paystack payment integration for the IPMC Kart checkout system.

## Overview

The Paystack integration allows customers to pay for orders using:
- Credit/Debit Cards
- Mobile Money (Ghana)
- Apple Pay
- Other Paystack-supported payment methods

Customers can choose between:
1. **Cash on Delivery (COD)** - Pay when the order is delivered
2. **Paystack** - Pay immediately via Paystack's secure payment gateway

## Prerequisites

1. A Paystack account (sign up at https://paystack.com)
2. Paystack API keys (Secret Key and Public Key)
3. Node.js environment with access to environment variables

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx  # Your Paystack Secret Key
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx  # Your Paystack Public Key (optional, for frontend if needed)

# Website Configuration (required for callback URLs)
WEBSITE_URL=http://localhost:8080  # Your website URL (update for production)
```

### Getting Your Paystack API Keys

1. Log in to your Paystack Dashboard: https://dashboard.paystack.com
2. Go to **Settings** > **API Keys & Webhooks**
3. Copy your **Secret Key** (starts with `sk_test_` for test mode or `sk_live_` for live mode)
4. Copy your **Public Key** if needed (starts with `pk_test_` or `pk_live_`)

## Webhook Configuration

To enable automatic payment verification via webhooks:

1. In your Paystack Dashboard, go to **Settings** > **API Keys & Webhooks**
2. Click **Add Webhook URL**
3. Enter your webhook URL: `https://yourdomain.com/api/orders/paystack-webhook`
4. Select the following events:
   - `charge.success`
   - `paymentrequest.success`
5. Save the webhook

**Note:** For local development, you can use a service like ngrok to expose your local server:
```bash
ngrok http 8080
```
Then use the ngrok URL in your Paystack webhook configuration.

## How It Works

### Payment Flow

1. **Customer selects Paystack payment method** at checkout
2. **Order is created** with status `processing` and payment method `paystack`
3. **Paystack payment is initialized** and authorization URL is returned
4. **Customer is redirected** to Paystack payment page
5. **Customer completes payment** on Paystack
6. **Paystack redirects back** to order complete page with payment reference
7. **Payment is verified** automatically
8. **Order status is updated** to `paid` if payment is successful

### Order Status Flow

- `processing` - Order created, waiting for payment (Paystack)
- `placed` - Order created, payment pending (COD)
- `paid` - Payment verified successfully
- `failed` - Payment failed or verification failed

## Testing

### Test Cards

Paystack provides test cards for testing payments:

**Successful Payment:**
- Card Number: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000` (if required)

**Failed Payment:**
- Card Number: `5060666666666666666`
- CVV: `123`
- Expiry: Any future date

**3D Secure:**
- Card Number: `5060666666666666669`
- CVV: `123`
- Expiry: Any future date

### Test Mobile Money

For mobile money testing, use:
- Phone: `08012345678` (for Nigeria) or `0244123456` (for Ghana)
- OTP: `123456`

## Security Considerations

1. **Never expose your Secret Key** in frontend code
2. **Always verify webhook signatures** before processing payments
3. **Use HTTPS** in production for webhook endpoints
4. **Validate payment amounts** to prevent fraud
5. **Log all payment transactions** for audit purposes

## Troubleshooting

### Payment Initialization Fails

- Check that `PAYSTACK_SECRET_KEY` is set correctly
- Verify the key is not expired
- Check server logs for detailed error messages

### Payment Verification Fails

- Ensure the payment reference matches the order
- Verify the payment amount matches the order total
- Check that the order status allows payment verification

### Webhook Not Working

- Verify the webhook URL is accessible from the internet
- Check that the webhook signature verification is working
- Ensure the webhook events are properly configured in Paystack dashboard
- Check server logs for webhook processing errors

### Redirect Issues

- Verify `WEBSITE_URL` is set correctly
- Check that the callback URL is properly formatted
- Ensure the order complete page can handle payment verification

## Production Checklist

Before going live:

- [ ] Replace test API keys with live keys
- [ ] Update `WEBSITE_URL` to production URL
- [ ] Configure production webhook URL
- [ ] Test complete payment flow end-to-end
- [ ] Verify email notifications are working
- [ ] Test with real payment methods
- [ ] Set up monitoring and alerts
- [ ] Review and test error handling
- [ ] Verify SSL certificate is valid
- [ ] Test webhook signature verification

## Support

For Paystack-specific issues:
- Paystack Documentation: https://paystack.com/docs
- Paystack Support: support@paystack.com

For integration issues:
- Check server logs for detailed error messages
- Review the code comments in:
  - `utils/paystack.js`
  - `routes/orders.js`
  - `assets/js/checkout.js`

## Files Modified/Created

### Backend
- `utils/paystack.js` - Paystack utility functions
- `routes/orders.js` - Payment routes and order creation logic
- `server.js` - Webhook route configuration

### Frontend
- `checkout.html` - Payment method selection UI
- `assets/js/checkout.js` - Payment flow handling
- `order-complete1.js` - Payment method display

### Database
- `models/order.js` - Already supports payment method and gateway fields

## API Endpoints

### POST /api/orders
Creates a new order. If payment method is `paystack`, returns authorization URL.

### POST /api/orders/verify-payment
Verifies a Paystack payment after redirect.

**Request Body:**
```json
{
  "reference": "ORDER-xxx-1234567890",
  "orderId": "order_id_here"
}
```

### POST /api/orders/paystack-webhook
Handles Paystack webhook events (configured in Paystack dashboard).

## Payment Channels

The integration supports the following Paystack payment channels:
- Card payments
- Mobile Money (Ghana, Nigeria, Kenya, South Africa)
- Bank transfers
- USSD
- QR codes
- Apple Pay

These are automatically enabled in the payment initialization.

