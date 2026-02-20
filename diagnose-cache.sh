#!/bin/bash

echo "=== Diagnosing Cache Issue ===" && \
echo "1. Checking cacheService.js for CACHE_CONFIG references..." && \
grep -n "CACHE_CONFIG" /var/www/ipmckart/services/cacheService.js && \
echo && \
echo "2. Current PM2 status:" && \
pm2 list | grep ipmckart && \
echo && \
echo "3. Last 10 error lines:" && \
pm2 logs ipmckart --lines 10 --nostream | grep -i error && \
echo && \
echo "=== Recommendation ===" && \
echo "The issue is CACHE_CONFIG being accessed too early." && \
echo "The cacheService.js file needs to be reordered." && \
echo && \
echo "Until this is fixed, let's check if the old routes/products.js works:" && \
echo "(It should work without cache)" && \
echo && \
echo "Would you like me to:" && \
echo "1. Roll back to products.js (no cache) - fast to restore" && \
echo "2. Fix cacheService.js ordering issue - safer but requires more testing" && \
echo "3. Wait for me to debug cacheService.js fully" && \
echo "" && \
read -p "Please choose option (1/2/3): "