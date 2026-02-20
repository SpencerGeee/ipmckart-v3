const cron = require('node-cron');
const rotationManager = require('../services/RotationManager');
const logger = require('../logger');
const connectDB = require('../db');

const initQuotaResetJob = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running scheduled quota reset...');
    try {
      await rotationManager.resetAllQuotas();
    } catch (error) {
      logger.error('Scheduled quota reset failed:', error);
    }
  });
};

if (require.main === module) {
  connectDB().then(async () => {
    try {
      await rotationManager.resetAllQuotas();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });
}

module.exports = initQuotaResetJob;
