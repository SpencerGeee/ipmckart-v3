const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendNewsletterSubscriptionEmail } = require('../utils/mailjet');

const newsletterLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 });

router.post('/subscribe', newsletterLimiter, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const ok = await sendNewsletterSubscriptionEmail({ toEmail: email, userName: name });
    if (!ok) return res.status(500).json({ message: 'Subscription failed. Try again later.' });

    return res.status(200).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    return res.status(500).json({ message: 'Subscription failed.' });
  }
});

module.exports = router;
