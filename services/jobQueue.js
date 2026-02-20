const { Queue, Worker } = require('bullmq');
const rotationManager = require('./RotationManager');
const logger = require('../logger');

const REDIS_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
};

const aiTaskQueue = new Queue('ai-tasks', REDIS_CONFIG);

const aiWorker = new Worker('ai-tasks', async job => {
  const { taskType, data } = job.data;
  
  logger.info(`Processing background AI task: ${taskType} (Job ID: ${job.id})`);

  try {
    const account = await rotationManager.getAvailableAccount();
    if (!account) {
      throw new Error('No accounts available for background task');
    }

    if (taskType === 'GENERATE_DESCRIPTION') {
      logger.info(`Using account ${account.name} for product description generation`);
      await rotationManager.markUsage(account._id, 100);
    } else if (taskType === 'ANALYZE_REVIEWS') {
      await rotationManager.markUsage(account._id, 250);
    }

    return { success: true, accountUsed: account.name };
  } catch (error) {
    logger.error(`Background task failed: ${error.message}`);
    throw error;
  }
}, REDIS_CONFIG);

aiWorker.on('completed', job => {
  logger.info(`Job ${job.id} completed successfully`);
});

aiWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed with error: ${err.message}`);
});

const addAiTask = (taskType, data, priority = 'normal') => {
  const priorityMap = { high: 1, normal: 5, low: 10 };
  return aiTaskQueue.add(taskType, { taskType, data }, {
    priority: priorityMap[priority],
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  });
};

module.exports = { aiTaskQueue, addAiTask };
