const rotationManager = require('../services/RotationManager');
const logger = require('../logger');

const accountRotation = async (req, res, next) => {
  try {
    const account = await rotationManager.getAvailableAccount();
    
    if (!account) {
      return res.status(503).json({
        message: 'AI services are currently unavailable due to quota limits. Please try again later.'
      });
    }

    req.account = account;
    next();
  } catch (error) {
    logger.error('Account rotation middleware error:', error);
    res.status(500).json({ message: 'Internal Server Error during account rotation' });
  }
};

const withAccountRetry = async (fn, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    const account = await rotationManager.getAvailableAccount();
    if (!account) break;

    try {
      return await fn(account);
    } catch (error) {
      lastError = error;
      if (error.status === 429 || (error.message && error.message.includes('quota'))) {
        logger.warn(`Account ${account.name} quota exhausted or rate limited. Retrying...`);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('All accounts failed or no accounts available');
};

module.exports = { accountRotation, withAccountRetry };
