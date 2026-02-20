// routes/cart.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticated: requireAuth } = require('../middleware/auth'); // requires logged-in user

const clampQty = (n) => Math.max(1, Math.min(999, Number(n) || 1));

async function normalizeIncoming(items) {
  // items: [{ productId, qty }]
  const ids = Array.from(new Set(items.map(i => i.productId).filter(Boolean)));
  const objectIds = ids.filter(id => id.match(/^[a-f\d]{24}$/i));
  const products = objectIds.length ? await Product.find({ _id: { $in: objectIds } }).lean() : [];
  const byId = new Map(products.map(p => [String(p._id), p]));

  const result = [];
  for (const it of items) {
    const pid = String(it.productId);
    const p = byId.get(pid);
    if (!p) continue; // skip unknown
    result.push({ productId: p._id, qty: clampQty(it.qty) });
  }
  return result;
}

function mergeCarts(a, b) {
  // a, b: [{ productId, qty }]
  const map = new Map();
  [...a, ...b].forEach(it => {
    const key = String(it.productId);
    const prev = map.get(key)?.qty || 0;
    map.set(key, { productId: it.productId, qty: clampQty(prev + clampQty(it.qty)) });
  });
  return Array.from(map.values());
}

// Get current server cart (with snapshots and totals)
router.get('/', requireAuth, async (req, res) => {
  await req.user.populate('cart.productId'); // Changed from 'items.productId' to 'cart.productId'
  const items = (req.user.cart || []).map(it => {
    const p = it.productId;
    const price = Number(p?.price) || 0;
    return {
      id: String(p?._id),
      name: p?.name || '',
      image: p?.images?.[0] || '', // Use images[0] since Product schema defines images as an array
      price,
      qty: it.qty,
      lineTotal: price * it.qty
    };
  });
  const subtotal = items.reduce((a, i) => a + i.lineTotal, 0);
  res.json({ items, subtotal, currency: 'GHS' });
});

// Replace server cart with provided items
router.post('/', requireAuth, async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const normalized = await normalizeIncoming(incoming);
  req.user.cart = normalized;
  await req.user.save();
  res.json({ ok: true });
});

// Merge provided local items into server cart
router.post('/merge', requireAuth, async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const normalized = await normalizeIncoming(incoming);
  const merged = mergeCarts(req.user.cart || [], normalized);
  req.user.cart = merged;
  await req.user.save();
  res.json({ ok: true });
});

module.exports = router;