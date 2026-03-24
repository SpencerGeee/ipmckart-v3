const Redis = require('ioredis');
const logger = require('../logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    this.cacheTypes = {
      PRODUCTS: { ttl: 300, prefix: 'product' },
      CATEGORIES: { ttl: 600, prefix: 'category' },
      CART: { ttl: 86400, prefix: 'cart' },
      API: { ttl: 120, prefix: 'api' },
      SEARCH: { ttl: 180, prefix: 'search' },
      USER: { ttl: 300, prefix: 'user' },
      SESSION: { ttl: 1800, prefix: 'session' },
      FEATURED: { ttl: 300, prefix: 'featured' },
      FLASH_SALE: { ttl: 300, prefix: 'flashsale' }
    };
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 5000
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully.');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        logger.warn('Redis connection error (running without cache):', err.message);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed.');
      });

      await this.redis.ping();
      this.isConnected = true;
      logger.info('Redis cache is available.');
      return true;
    } catch (err) {
      logger.warn('Redis cache connection failed (running without cache):', err.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis cache disconnected.');
    }
  }

  _getKey(key, type) {
    const typeConfig = this.cacheTypes[type] || this.cacheTypes.API;
    return `${typeConfig.prefix}:${key}`;
  }

  async get(key, type = 'API') {
    try {
      if (this.isConnected && this.redis) {
        const cacheKey = this._getKey(key, type);
        const value = await this.redis.get(cacheKey);
        
        if (value !== null) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      }

      this.stats.misses++;
      return null;
    } catch (err) {
      logger.error('Cache get error:', err.message);
      this.stats.misses++;
      return null;
    }
  }

  async set(key, value, type = 'API', customTtl = null) {
    try {
      const typeConfig = this.cacheTypes[type] || this.cacheTypes.API;
      const ttl = customTtl !== null ? customTtl : typeConfig.ttl;
      const cacheKey = this._getKey(key, type);

      if (this.isConnected && this.redis) {
        await this.redis.setex(cacheKey, ttl, JSON.stringify(value));
      }

      this.stats.sets++;
      return true;
    } catch (err) {
      logger.error('Cache set error:', err.message);
      return false;
    }
  }

  async delete(key, type = 'API') {
    try {
      const cacheKey = this._getKey(key, type);

      if (this.isConnected && this.redis) {
        await this.redis.del(cacheKey);
      }

      this.stats.deletes++;
      return true;
    } catch (err) {
      logger.error('Cache delete error:', err.message);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = [];
      
      if (this.isConnected && this.redis) {
        const allKeys = await this.redis.keys(`*${pattern}*`);
        if (allKeys.length > 0) {
          await this.redis.del(...allKeys);
          keys.push(...allKeys);
        }
      }

      this.stats.deletes += keys.length;
      logger.info(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
      return keys.length;
    } catch (err) {
      logger.error('Cache invalidate pattern error:', err.message);
      return 0;
    }
  }

  async getOrSet(key, fetchFn, type = 'API', customTtl = null) {
    try {
      const cached = await this.get(key, type);
      
      if (cached !== null) {
        return cached;
      }

      const value = await fetchFn();
      await this.set(key, value, type, customTtl);
      return value;
    } catch (err) {
      logger.error('Cache getOrSet error:', err.message);
      return await fetchFn();
    }
  }

  async mget(keys, type = 'API') {
    try {
      if (!keys || keys.length === 0) {
        return [];
      }

      if (this.isConnected && this.redis) {
        const cacheKeys = keys.map(key => this._getKey(key, type));
        const values = await this.redis.mget(...cacheKeys);
        
        return values.map(value => 
          value !== null ? JSON.parse(value) : null
        );
      }

      return keys.map(() => null);
    } catch (err) {
      logger.error('Cache mget error:', err.message);
      return keys.map(() => null);
    }
  }

  async mset(items, type = 'API', customTtl = null) {
    try {
      if (!items || items.length === 0) {
        return false;
      }

      const typeConfig = this.cacheTypes[type] || this.cacheTypes.API;
      const ttl = customTtl !== null ? customTtl : typeConfig.ttl;

      if (this.isConnected && this.redis) {
        const pipeline = this.redis.pipeline();
        
        items.forEach(([key, value]) => {
          const cacheKey = this._getKey(key, type);
          pipeline.setex(cacheKey, ttl, JSON.stringify(value));
        });

        await pipeline.exec();
      }

      this.stats.sets += items.length;
      return true;
    } catch (err) {
      logger.error('Cache mset error:', err.message);
      return false;
    }
  }

  getStats() {
    const totalOps = this.stats.hits + this.stats.misses;
    const hitRate = totalOps > 0 ? ((this.stats.hits / totalOps) * 100).toFixed(2) : '0.00';

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      hitRate: `${hitRate}%`,
      totalOperations: totalOps + this.stats.sets + this.stats.deletes,
      isConnected: this.isConnected,
      cacheType: this.isConnected ? 'redis' : 'memory'
    };
  }

  async healthCheck() {
    if (!this.isConnected || !this.redis) {
      return {
        status: 'degraded',
        type: 'memory',
        message: 'Redis not connected, using memory cache'
      };
    }

    try {
      const result = await this.redis.ping();
      return {
        status: result === 'PONG' ? 'healthy' : 'unhealthy',
        type: 'redis',
        message: 'Redis cache connected and responding'
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        type: 'memory',
        message: `Redis error: ${err.message}`
      };
    }
  }

  clearStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
}

const cacheService = new CacheService();

module.exports = cacheService;
