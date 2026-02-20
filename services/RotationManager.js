const Account = require('../models/Account');
const cacheService = require('./cacheService');
const logger = require('../logger');

class RotationManager {
  /**
   * Get an available account based on weighted rotation and quota availability.
   * Prefer accounts with more remaining quota and higher priority.
   */
  async getCachedAiOutput(key) {
    return await cacheService.get(`ai_output:${key}`);
  }

  async cacheAiOutput(key, output, ttl = 3600 * 24) {
    return await cacheService.set(`ai_output:${key}`, output, 'json', ttl);
  }

  async getAvailableAccount() {
    try {
      const accounts = await Account.find({
        isActive: true,
        $expr: { $lt: ['$quotaUsed', '$quotaLimit'] }
      }).sort({ priority: -1, quotaUsed: 1 });

      if (accounts.length === 0) {
        logger.warn('All accounts have exhausted their quotas or are inactive.');
        return null;
      }

      const scoredAccounts = accounts.map(acc => {
        const remaining = acc.quotaLimit - acc.quotaUsed;
        const ratio = remaining / acc.quotaLimit;
        return {
          account: acc,
          score: acc.priority * ratio
        };
      });

      scoredAccounts.sort((a, b) => b.score - a.score);

      const selected = scoredAccounts[0].account;
      
      selected.lastUsedAt = new Date();
      await selected.save();

      return selected;
    } catch (error) {
      logger.error('Error in getAvailableAccount:', error);
      throw error;
    }
  }

  /**
   * Mark usage for a specific account.
   * @param {string} accountId - The ID of the account.
   * @param {number} tokens - Number of tokens consumed.
   */
  async markUsage(accountId, tokens) {
    try {
      const account = await Account.findByIdAndUpdate(
        accountId,
        { $inc: { quotaUsed: tokens }, lastUsedAt: new Date() },
        { new: true }
      );
      
      if (account && account.quotaUsed >= account.quotaLimit) {
        logger.warn(`Account ${account.name} has reached its quota limit.`);
      }

      return account;
    } catch (error) {
      logger.error(`Error marking usage for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Get all accounts for monitoring purposes.
   */
  async getStats() {
    return await Account.find({}).sort({ name: 1 });
  }

  /**
   * Reset quotas for all accounts.
   */
  async resetAllQuotas() {
    try {
      await Account.updateMany({}, { quotaUsed: 0, resetAt: new Date() });
      logger.info('All account quotas have been reset.');
    } catch (error) {
      logger.error('Error resetting quotas:', error);
      throw error;
    }
  }
}

module.exports = new RotationManager();
