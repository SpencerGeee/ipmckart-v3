const Mailjet = require('node-mailjet');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto'); // For token generation
const bcrypt = require('bcryptjs');

let mailjet;
if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
  mailjet = new Mailjet({
    apiKey: process.env.MAILJET_API_KEY,
    apiSecret: process.env.MAILJET_SECRET_KEY,
  });
} else {
  console.warn('Mailjet API keys not found. Email services will be disabled.');
  mailjet = {
    post: () => ({
      request: () => Promise.resolve({ body: { Messages: [{ Status: 'Disabled' }] } })
    })
  };
}

// Use API_URL for backend links; fallback to WEBSITE_URL
const API_BASE = process.env.API_URL || process.env.WEBSITE_URL;

// Helper to clean Mailchimp-exported HTML (remove zero-width spaces, extra NBSPs, etc.)
function cleanTemplate(html) {
  return html
    .replace(/[\u200B\u200C\u200D\uFEFF\r\n\t]+/g, ' ') // Remove zero-width spaces, BOM, extra whitespace
    .replace(/&nbsp;/g, ' ') // Replace NBSP with regular space
    .replace(/&zwnj;/g, '') // Remove ZWNJ
    .replace(/&lrm;/g, '') // Remove LRM/RLM
    .replace(/&rlm;/g, '')
    .trim();
}

async function sendWelcomeEmail({ toEmail, userName }) {
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping welcome email in test environment.');
    return Promise.resolve(true);
  }
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'welcome-email.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template); // Clean template

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: `Welcome to IPMC Kart, ${userName || 'Valued Customer'}!`,
            HTMLPart: template,
            TextPart: `Dear ${userName || 'Valued Customer'},\n\nThank you for joining IPMC Kart! We're thrilled to have you as part of our community. Discover our 100% handmade treasures at ${process.env.WEBSITE_URL}/shop. Use code WELCOME10 for 10% off your first purchase.\n\nBest regards,\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Welcome email sent to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send welcome email to ${toEmail}:`, error);
    return false;
  }
}

async function sendVerificationEmail({ toEmail, userName, verificationToken }) {
  try {
    // CRITICAL: Use the backend API URL (Render), not the frontend website URL
    const API_BASE = process.env.API_URL || 'https://ipmckart.com';
    
    // Build verification link pointing to backend
    const verificationLink = `${API_BASE}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(toEmail)}`;
    const expirationTime = 1; // hours

    console.log('=== MAILJET VERIFICATION EMAIL DEBUG ===');
    console.log('Sending verification email to:', toEmail);
    console.log('Verification token:', verificationToken);
    console.log('Verification link:', verificationLink);
    console.log('API_BASE:', API_BASE);
    console.log('=== END DEBUG ===');

    const templatePath = path.join(__dirname, '..', 'templates', 'email-verification.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template);

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{verification_link}/g, verificationLink)
      .replace(/{expiration_time}/g, expirationTime)
      .replace(/{website_url}/g, process.env.WEBSITE_URL || 'https://ipmcKart.com')
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL || 'https://ipmcKart.com'}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: 'Verify Your Email for IPMC Kart',
            HTMLPart: template,
            TextPart: `Hello ${userName || 'Valued Customer'},\n\nTo complete your registration, verify your email by clicking this link:\n\n${verificationLink}\n\nThis link expires in ${expirationTime} hour(s).\n\nThank you,\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Verification email sent to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${toEmail}:`, error);
    return false;
  }
}

async function sendPasswordResetEmail({ toEmail, userName, resetToken }) {
  try {
    // Use WEBSITE_URL for the reset link (frontend URL), with a fallback for local development
    const websiteUrl = process.env.WEBSITE_URL || 'https://localhost:4040';
    const resetLink = `${websiteUrl}/forgot-password.html?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;
    const expirationTime = 1; // hours

    const templatePath = path.join(__dirname, '..', 'templates', 'password-reset.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template); // Clean template

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{reset_link}/g, resetLink)
      .replace(/{expiration_time}/g, expirationTime)
      .replace(/{website_url}/g, websiteUrl)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${websiteUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: 'Reset Your Password for IPMC Kart',
            HTMLPart: template,
            TextPart: `Hi ${userName || 'Valued Customer'},\n\nReset your password: ${resetLink}\n\nThis link expires in ${expirationTime} hours.\n\nIf you need help, contact shop@ipmcKart.com\n\nBest,\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Password reset email sent to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${toEmail}:`, error);
    return false;
  }
}

async function sendOrderConfirmationEmail({ toEmail, bccEmail, userName, orderId, itemList, paymentAmount, shippingAddress, estimatedDeliveryDate, trackLink }) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'order-confirmation.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // Clean the template to avoid rendering issues
    template = template.replace(/[\u200B-\u200D\uFEFF]/g, ' ').trim();

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{order_id}/g, orderId)
      .replace(/{item_list}/g, itemList)
      .replace(/{payment_amount}/g, paymentAmount)
      .replace(/{shipping_address}/g, shippingAddress)
      .replace(/{estimated_delivery_date}/g, estimatedDeliveryDate)
      .replace(/{track_link}/g, trackLink)
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const message = {
      From: {
        Email: process.env.EMAIL_SENDER,
        Name: process.env.EMAIL_SENDER_NAME,
      },
      To: [
        {
          Email: toEmail,
          Name: userName || 'Valued Customer',
        },
      ],
      Subject: `Order Confirmed: #${orderId} from IPMC Kart`,
      HTMLPart: template,
      TextPart: `Dear ${userName || 'Valued Customer'},\n\nYour payment for order ${orderId} has been received.\nItems: ${itemList}\nTotal: ${paymentAmount}\nShipping to: ${shippingAddress.replace(/<br>/g, '\n')}\nEstimated Delivery: ${estimatedDeliveryDate}\n\nTrack your order here: ${trackLink}\n\nThank you for your purchase!\nThe IPMC Kart Team`,
    };

    // Add BCC for admin notification if provided
    message.Bcc = [];
    if (bccEmail) {
      message.Bcc.push({ Email: bccEmail });
    }
    // Always BCC boss for order notifications
    message.Bcc.push({ Email: 'vaishnavi.pulavarthy@ipmcghana.com' });
    // Always BCC user for order notifications
    message.Bcc.push({ Email: 'cyrilspencer12345@gmail.com' });

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({ Messages: [message] });

    console.log(`Order confirmation sent for ${orderId} to ${toEmail}: ${request.body.Messages[0].Status}`);
    if (bccEmail) {
      console.log(`Admin BCC sent to ${bccEmail}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to send order confirmation to ${toEmail}:`, error.statusCode ? error.response.data : error);
    return false;
  }
}

async function sendOrderShippedEmail({ toEmail, userName, orderId, itemList, trackingNumber, carrierName, estimatedDeliveryDate, trackingLink, paymentAmount }) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'order-shipped.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template); // Clean template

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{order_id}/g, orderId)
      .replace(/{item_list}/g, itemList)
      .replace(/{tracking_number}/g, trackingNumber)
      .replace(/{carrier_name}/g, carrierName)
      .replace(/{estimated_delivery_date}/g, estimatedDeliveryDate)
      .replace(/{payment_amount}/g, paymentAmount || 'N/A')
      .replace(/{tracking_link}/g, trackingLink)
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: 'Your IPMC Kart Order Has Shipped!',
            HTMLPart: template,
            TextPart: `Hello ${userName || 'Valued Customer'},\n\nYour order ${orderId} has shipped!\nItems: ${itemList}\nTracking: ${trackingNumber} via ${carrierName}\nEstimated: ${estimatedDeliveryDate}\nTrack: ${trackingLink || 'TBD'}\nPayment Amount: ${paymentAmount}\n\nEnjoy!\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Order shipped email sent for ${orderId} to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order shipped email to ${toEmail}:`, error);
    return false;
  }
}

// New: Order Delivered Email (similar to shipped, but customized for delivery confirmation)
async function sendOrderDeliveredEmail({ toEmail, userName, orderId, itemList, deliveryDate, feedbackLink }) {
  try {
    // Assume a template exists or create one similar to shipped
    const templatePath = path.join(__dirname, '..', 'templates', 'order-delivered.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template); // Clean template

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{order_id}/g, orderId)
      .replace(/{item_list}/g, itemList)
      .replace(/{delivery_date}/g, deliveryDate || new Date().toLocaleDateString())
      .replace(/{feedback_link}/g, feedbackLink || `${process.env.WEBSITE_URL}/feedback?order=${orderId}`)
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{estimated_delivery_date}/g, deliveryDate || new Date().toLocaleDateString())
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: 'Your IPMC Kart Order Has Been Delivered!',
            HTMLPart: template,
            TextPart: `Hello ${userName || 'Valued Customer'},\n\nGreat news! Your order ${orderId} has been delivered on ${deliveryDate || new Date().toLocaleDateString()}.\nItems: ${itemList}\n\nWe hope you love your handmade treasures! Share your feedback: ${feedbackLink || process.env.WEBSITE_URL + '/feedback'}\n\nThank you for shopping with us!\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Order delivered email sent for ${orderId} to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send order delivered email to ${toEmail}:`, error);
    return false;
  }
}

async function sendAbandonedCartEmail({ toEmail, userName, itemList, cartLink }) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'abandoned-cart.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template); // Clean template

    template = template
      .replace(/{user_name}/g, userName || 'Valued Customer')
      .replace(/{item_list}/g, itemList || 'Your selected items')
      .replace(/{cart_link}/g, cartLink || `${process.env.WEBSITE_URL}/cart`)
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: process.env.EMAIL_SENDER_NAME,
            },
            To: [
              {
                Email: toEmail,
                Name: userName || 'Valued Customer',
              },
            ],
            Subject: `You Left Something Behind at IPMC Kart!`,
            HTMLPart: template,
            TextPart: `Hello ${userName || 'Valued Customer'},\n\nWe noticed you left some beautiful handmade items in your cart. Complete your purchase now and enjoy 10% off with code CART10!\n\nItems: ${itemList}\n\nReturn to cart: ${cartLink || process.env.WEBSITE_URL + '/cart'}\n\nBest,\nThe IPMC Kart Team`,
          },
        ],
      });

    console.log(`Abandoned cart email sent to ${toEmail}: ${request.body.Messages[0].Status}`);
    return true;
  } catch (error) {
    console.error(`Failed to send abandoned cart email to ${toEmail}:`, error);
    return false;
  }
}

// Utility to generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendContactFormEmail({ name, email, phone, subject, message }) {
  try {
    const adminEmail = 'shop@ipmckart.com';
    const bccEmail = 'cyrilspencer12345@gmail.com';

    const emailBody = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    const textBody = `
      New Contact Form Submission
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Subject: ${subject}
      Message:
${message}
    `;

    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.EMAIL_SENDER,
            Name: 'Contact Form',
          },
          To: [
            {
                Email: toEmail,
                Name: userName || 'Valued Customer',
            },
          ],
          Bcc: [{ Email: bccEmail }],
          Subject: `New Contact Inquiry: ${subject}`,
          HTMLPart: emailBody,
          TextPart: textBody,
        },
      ],
    });

    console.log(`Contact form email sent successfully to ${adminEmail} (BCC: ${bccEmail})`);
    return true;
  } catch (error) {
    console.error(`Failed to send contact form email:`, error);
    return false;
  }
}

async function sendRepairUpgradeEmail({ name, email, phone, serviceType, deviceType, issueDescription }) {
  try {
    const adminEmail = 'shop@ipmckart.com';
    const bccEmail = 'cyrilspencer12345@gmail.com';

    const emailBody = `
      <h1>New Repair/Upgrade Request</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Service Type:</strong> ${serviceType}</p>
      <p><strong>Device Type:</strong> ${deviceType}</p>
      <p><strong>Issue Description:</strong></p>
      <p>${issueDescription}</p>
    `;

    const textBody = `
      New Repair/Upgrade Request
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Service Type: ${serviceType}
      Device Type: ${deviceType}
      Issue Description:
${issueDescription}
    `;

    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.EMAIL_SENDER,
            Name: 'Repair/Upgrade Form',
          },
          To: [{ Email: adminEmail }],
          Bcc: [{ Email: bccEmail }],
          Subject: `New ${serviceType} Request for ${deviceType}`,
          HTMLPart: emailBody,
          TextPart: textBody,
        },
      ],
    });

    console.log(`Repair/Upgrade form email sent successfully to ${adminEmail} (BCC: ${bccEmail})`);
    return true;
  } catch (error) {
    console.error(`Failed to send Repair/Upgrade form email:`, error);
    return false;
  }
}

async function sendNewsletterSubscriptionEmail({ toEmail, userName }) {
  if (process.env.NODE_ENV === 'test') return true;
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'welcome-email.html');
    let template = await fs.readFile(templatePath, 'utf-8');
    template = cleanTemplate(template)
      .replace(/{user_name}/g, userName || 'Subscriber')
      .replace(/{website_url}/g, process.env.WEBSITE_URL)
      .replace(/{current_year}/g, new Date().getFullYear())
      .replace(/{unsubscribe_link}/g, `${process.env.WEBSITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`);

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.EMAIL_SENDER,
              Name: 'IPMC Kart Newsletter'
            },
            To: [{ Email: toEmail }],
            Subject: 'Welcome to IPMC Kart Newsletter',
            HTMLPart: template,
            TextPart: `Hi ${userName || 'Subscriber'},\n\nThank you for subscribing to our newsletter!\n\nRegards,\nIPMC Kart`
          }
        ]
      });

    console.log('Newsletter subscription email sent:', request.body);
    return true;
  } catch (err) {
    console.error('Failed to send newsletter email:', err);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendAbandonedCartEmail,
  generateToken,
  sendContactFormEmail,
  sendRepairUpgradeEmail,
  sendNewsletterSubscriptionEmail,
};