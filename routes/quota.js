const express = require('express');
const router = express.Router();
const rotationManager = require('../services/RotationManager');
const { isAuthenticated, requireRole } = require('../middleware/auth');

router.get('/', isAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    const stats = await rotationManager.getStats();
    const formattedStats = stats.map(acc => ({
      id: acc._id,
      name: acc.name,
      quotaLimit: acc.quotaLimit,
      quotaUsed: acc.quotaUsed,
      remaining: acc.quotaLimit - acc.quotaUsed,
      usagePercent: ((acc.quotaUsed / acc.quotaLimit) * 100).toFixed(2),
      priority: acc.priority,
      isActive: acc.isActive,
      lastUsedAt: acc.lastUsedAt,
      resetAt: acc.resetAt
    }));

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quota stats', error: error.message });
  }
});

router.post('/reset', isAuthenticated, requireRole('admin'), async (req, res) => {
  try {
    await rotationManager.resetAllQuotas();
    res.json({ message: 'All account quotas reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset quotas', error: error.message });
  }
});

module.exports = router;
