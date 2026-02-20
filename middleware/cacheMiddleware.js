const cacheService = require('../services/cacheService');
const logger = require('../logger');

class CacheMiddleware {
  static createCacheKey(req) {
    const parts = [
      req.method,
      req.originalUrl,
      req.query ? JSON.stringify(req.query).split('').sort().join('') : '',
      req.user ? req.user._id : 'public'
    ];
    return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '');
  }

  static cache({ type = 'API', ttl = null, keyGenerator = null }) {
    return async (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      // Check both authenticated user role AND query parameter
      if ((req.user && req.user.role === 'admin') || req.query.admin === 'true') {
        logger.debug('[Cache Middleware] Skipping cache for admin request');
        return next();
      }

      const cacheKey = keyGenerator ? keyGenerator(req) : CacheMiddleware.createCacheKey(req);

      try {
        const cached = await cacheService.get(cacheKey, type);
        
        if (cached) {
          logger.debug(`[Cache Middleware] Hit: ${cacheKey}`);
          return res.json(cached);
        }

        logger.debug(`[Cache Middleware] Miss: ${cacheKey}`);

        const originalJson = res.json.bind(res);
        const cacheData = [];

        res.json = function(data) {
          cacheData.push(data);
          return originalJson(data);
        };

        res.on('finish', () => {
          if (cacheData.length > 0 && res.statusCode === 200) {
            cacheService.set(cacheKey, cacheData[0], type, ttl)
              .then(() => logger.debug(`[Cache Middleware] Set: ${cacheKey}`))
              .catch(err => logger.error('[Cache Middleware] Set error:', err.message));
          }
        });

        next();
      } catch (err) {
        logger.error('[Cache Middleware] Error:', err.message);
        next();
      }
    };
  }

  static invalidate(pattern) {
    return async (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        cacheService.invalidatePattern(pattern)
          .then(count => logger.info(`[Cache Middleware] Invalidated ${count} entries for pattern: ${pattern}`))
          .catch(err => logger.error('[Cache Middleware] Invalidation error:', err.message));
        
        return originalJson(data);
      };

      next();
    };
  }

  static cacheProducts() {
    return CacheMiddleware.cache({
      type: 'PRODUCTS',
      keyGenerator: (req) => {
        const parts = [
          'products',
          req.query.category || 'all',
          req.query.subcategory || 'all',
          req.query.page || '1',
          req.query.limit || '20',
          req.query.sort || 'createdAt',
          req.query.q || '',
          req.query.admin || '',
          req.query.minPrice || '',
          req.query.maxPrice || ''
        ];
        return parts.join(':');
      }
    });
  }

  static cacheProduct() {
    return CacheMiddleware.cache({
      type: 'PRODUCTS',
      ttl: 3600,
      keyGenerator: (req) => `product:${req.params.id}`
    });
  }

  static cacheCategories() {
    return CacheMiddleware.cache({
      type: 'CATEGORIES',
      ttl: 600,
      keyGenerator: (req) => `categories:${req.query.type || 'all'}`
    });
  }

  static cacheSearch() {
    return CacheMiddleware.cache({
      type: 'SEARCH',
      ttl: 180,
      keyGenerator: (req) => `search:${req.query.q || ''}:${req.query.category || 'all'}:${req.query.page || '1'}`
    });
  }

  static cacheFeatured() {
    return CacheMiddleware.cache({
      type: 'FEATURED',
      ttl: 300,
      keyGenerator: (req) => `featured:${req.query.limit || '10'}:${req.query.category || 'all'}`
    });
  }

  static cacheFlashSales() {
    return CacheMiddleware.cache({
      type: 'FLASH_SALE',
      ttl: 60,
      keyGenerator: (req) => `flashsales:active`
    });
  }

  static invalidateProducts() {
    return CacheMiddleware.invalidate('product');
  }

  static invalidateCategories() {
    return CacheMiddleware.invalidate('category');
  }

  static invalidateSearch() {
    return CacheMiddleware.invalidate('search');
  }

  static invalidateAll() {
    return async (req, res, next) => {
      const patterns = ['product', 'category', 'search', 'featured', 'flashsale'];
      
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        Promise.all(patterns.map(p => cacheService.invalidatePattern(p)))
          .then(counts => {
            const totalInvalidated = counts.reduce((sum, count) => sum + count, 0);
            logger.info(`[Cache Middleware] Invalidated ${totalInvalidated} cache entries (all patterns)`);
          })
          .catch(err => logger.error('[Cache Middleware] Invalidate all error:', err.message));
        
        return originalJson(data);
      };

      next();
    };
  }
}

module.exports = CacheMiddleware;
