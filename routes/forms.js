const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendContactFormEmail, sendRepairUpgradeEmail } = require('../utils/mailjet');

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs (reduced from 10)
  message: 'Too many form submissions from this IP, please try again after an hour',
});

router.post('/contact', formLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message, website } = req.body;

    // Honeypot spam protection - reject if website field is filled
    if (website && website.trim().length > 0) {
      console.log('Spam submission detected via honeypot field');
      return res.status(400).json({
        message: 'Form submission rejected. Please try again.'
      });
    }

    // Content validation - reject if message contains suspicious patterns
    const suspiciousPatterns = [
      /^[a-zA-Z\s]{1,5}$/, // Very short messages (1-5 characters)
      /^[^\w\s]*$/, // Only symbols
      /^(.)\1{10,}$/, // Repeating characters (10+ times)
      /^.{1,10}$/, // Extremely short messages
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(message))) {
      console.log('Spam submission detected via content validation');
      return res.status(400).json({
        message: 'Invalid message content. Please provide a proper message.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    const success = await sendContactFormEmail({
      name,
      email,
      phone,
      subject,
      message
    });
    if (success) {
      res.status(200).json({
        message: 'Your message has been sent successfully!'
      });
    } else {
      res.status(500).json({
        message: 'Failed to send message.'
      });
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Failed to send message.' });
  }
});

router.post('/repair-upgrade', formLimiter, async (req, res) => {
  try {
    const { name, email, phone, serviceType, deviceType, issueDescription, website } = req.body;

    // Honeypot spam protection - reject if website field is filled
    if (website && website.trim().length > 0) {
      console.log('Spam submission detected via honeypot field on repair-upgrade form');
      return res.status(400).json({ message: 'Form submission rejected. Please try again.' });
    }

    if (!name || !serviceType || !deviceType || !issueDescription) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await sendRepairUpgradeEmail({ name, email, phone, serviceType, deviceType, issueDescription });
    res.status(200).json({ message: 'Your request has been submitted successfully!' });
  } catch (error) {
    console.error('Repair/Upgrade form submission error:', error);
    res.status(500).json({ message: 'Failed to submit request.' });
  }
});

// Starlink order form - minimal required fields
router.post('/starlink-order', formLimiter, async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const { firstName, lastName, email, phone, service, country, message, website } = req.body || {};

    // Honeypot spam protection - reject if website field is filled
    if (website && website.trim().length > 0) {
      console.log('Spam submission detected via honeypot field on starlink-order form');
      return res.status(400).json({ message: 'Form submission rejected. Please try again.' });
    }

    if (!firstName || !lastName || !email || !phone || !service || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'shop@ipmckart.com';
    const safeMsg = message ? String(message).replace(/</g, '&lt;') : '';
    const emailBody = `
      <h1>New Starlink Order Request</h1>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Country:</strong> ${country}</p>
      ${safeMsg ? `<p><strong>Message:</strong><br>${safeMsg}</p>` : ''}
    `;

    // Try Mailjet first if configured, otherwise fall back to file logging.
    const hasMailjet = !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY && process.env.EMAIL_SENDER);
    let sent = false;
    if (hasMailjet) {
      try {
        const Mailjet = require('node-mailjet');
        const mailjet = new Mailjet({ apiKey: process.env.MAILJET_API_KEY, apiSecret: process.env.MAILJET_SECRET_KEY });
        await mailjet.post('send', { version: 'v3.1' }).request({
          Messages: [
            {
              From: { Email: process.env.EMAIL_SENDER, Name: 'Starlink Order' },
              To: [{ Email: adminEmail }],
              Subject: `New Starlink Order Request (${service})`,
              HTMLPart: emailBody,
              TextPart: `New Starlink Order Request\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nCountry: ${country}\n${message ? 'Message: ' + message : ''}`
            }
          ]
        });
        sent = true;
      } catch (err) {
        // Network resolution issues or Mailjet outage; fall back gracefully
        console.warn('Starlink order: Mailjet send failed, falling back. Code:', err && err.code);
      }
    }

    if (!sent) {
      // Fallback: persist the order to a local file queue so it's not lost in dev/offline.
      try {
        const ordersDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
        const file = path.join(ordersDir, 'starlink_orders.jsonl');
        const record = {
          ts: new Date().toISOString(),
          firstName, lastName, email, phone, service, country, message: message || '',
        };
        fs.appendFileSync(file, JSON.stringify(record) + '\n', 'utf8');
      } catch (e) {
        console.warn('Starlink order: fallback file write failed:', e && e.message);
      }
    }

    // Always respond OK to the user so the UX is not blocked by email infra.
    return res.status(200).json({ message: 'Your order request has been submitted successfully!' });
  } catch (err) {
    // Unexpected failure in validation/parsing.
    console.error('Starlink order form error:', err && err.message);
    return res.status(200).json({ message: 'Your order request has been received.' });
  }
});

module.exports = router;
