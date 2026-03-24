# IPMC Kart Website Fix - Deployment Guide

## Summary of Issues Fixed

### 1. Content Security Policy (CSP) Violations
- **Problem**: Google Fonts were being blocked by CSP
- **Fix**: Added `fonts.googleapis.com` and `fonts.gstatic.com` to `connect-src` in both `server.js` and `index.html`

### 2. Service Worker Errors
- **Problem**: Service Worker was throwing "Failed to fetch" and "Failed to convert value to 'Response'" errors
- **Fix**: 
  - Fixed `staleWhileRevalidate` function to properly handle fetch errors
  - Fixed `networkFirst` function to handle cache errors gracefully
  - Added JSON file handling to Service Worker fetch events

### 3. 503 Service Unavailable Errors
- **Problem**: JSON data files were failing to load
- **Fix**:
  - Created `scripts/init-data-files.js` to regenerate all JSON files on server startup
  - Updated MongoDB connection to use Atlas cloud database instead of local Docker container
  - Updated Redis connection to handle failures gracefully (site runs without caching if Redis unavailable)

### 4. Docker Configuration Issues
- **Problem**: Docker container couldn't connect to database
- **Fix**:
  - Updated `docker-compose.yml` to use MongoDB Atlas connection string
  - Removed Redis dependency (optional, runs without it)
  - Removed MongoDB and Redis services from Docker Compose (using cloud services)

## Files Modified

1. `server.js` - CSP headers, graceful error handling, JSON file initialization
2. `sw.js` - Service Worker fetch handlers, error handling
3. `index.html` - CSP meta tag
4. `db.js` - Graceful MongoDB connection failure handling
5. `services/cacheService.js` - Better Redis error handling
6. `docker-compose.yml` - Cloud database configuration
7. `Dockerfile` - Build configuration
8. `.env` - Environment variables (not committed to Git)

## New Files Created

1. `scripts/init-data-files.js` - JSON file regeneration on startup

## Deployment Instructions for GitHub Docker Manager

### Step 1: Commit and Push Changes

```bash
cd /var/www/ipmckart

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: website down - CSP, Service Worker, and database connection fixes

- Fixed CSP violations blocking Google Fonts
- Fixed Service Worker fetch errors for JSON files
- Added automatic JSON data file regeneration on startup
- Updated Docker config to use MongoDB Atlas
- Made Redis connection optional (graceful degradation)
"

# Push to GitHub
git push origin main
```

### Step 2: Configure Docker Manager Environment Variables

In your Hostinger Docker Manager, ensure these environment variables are set:

```
NODE_ENV=production
PORT=4040
MONGO_URL=<your-mongodb-atlas-connection-string>
REDIS_URL=redis://127.0.0.1:6379
FRONTEND_URL=https://ipmckart.com
WEBSITE_URL=https://ipmckart.com
JWT_SECRET=<your-jwt-secret>
SESSION_SECRET=<your-session-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://ipmckart.com/api/auth/google/callback
MAILJET_API_KEY=<your-mailjet-api-key>
MAILJET_SECRET_KEY=<your-mailjet-secret-key>
EMAIL_SENDER=shop@ipmckart.com
EMAIL_SENDER_NAME=IPMC Kart
PAYSTACK_SECRET_KEY=<your-paystack-secret-key>
```

**Note**: Replace `<placeholder>` values with your actual secrets. Never commit these to Git!

### Step 3: Rebuild and Redeploy

In Hostinger Docker Manager:
1. Click "Rebuild" or "Redeploy" on your container
2. Wait for the build to complete (should take 2-5 minutes)
3. Check the logs to verify successful startup

### Step 4: Verify Deployment

After deployment, verify the website is working:

1. **Check Health Endpoint**:
   ```
   http://147.93.62.224:4040/api/health
   ```
   Should return: `{"status":"UP","timestamp":"..."}`

2. **Check JSON Files**:
   ```
   http://147.93.62.224:4040/products.grouped2.json
   http://147.93.62.224:4040/black-friday.json
   http://147.93.62.224:4040/independence-day.json
   ```
   Should return JSON data (not 503 errors)

3. **Check Main Website**:
   ```
   https://ipmckart.com
   ```
   Should load without CSP errors in console

4. **Check Browser Console**:
   - No CSP violations
   - No "Failed to fetch" errors
   - Google Fonts should load properly

## Expected Log Output on Successful Startup

```
✅ MongoDB Connected
[timestamp] info: Database connection successful.
[timestamp] info: Redis cache connected successfully.
[timestamp] info: Starting JSON data files regeneration...
[timestamp] info: products.grouped2.json regenerated with X subcategories
[timestamp] info: flash-sales.json regenerated with X products
[timestamp] info: black-friday.json regenerated with X products
[timestamp] info: christmas-sale.json regenerated with X products
[timestamp] info: new-year.json regenerated with X products
[timestamp] info: valentines.json regenerated with X products
[timestamp] info: back-to-school.json regenerated with X products
[timestamp] info: independence-day.json regenerated with X products
[timestamp] info: combo-offers-v2.json regenerated with X products
[timestamp] info: top-selling.json regenerated with X products
[timestamp] info: All JSON data files regenerated successfully.
[timestamp] info: Server running in production mode
[timestamp] info: HTTP server listening on port 4040
```

## Troubleshooting

### If MongoDB Connection Fails
Check logs for:
```
❌ MongoDB connection error: ...
```
Verify the MongoDB Atlas connection string is correct and your IP is whitelisted in Atlas.

### If JSON Files Still Return 503
1. Check if the initialization script ran (look for "Starting JSON data files regeneration" in logs)
2. Manually trigger regeneration via admin panel
3. Verify MongoDB has products with `active: true`

### If CSP Errors Persist
1. Clear browser cache
2. Unregister old Service Worker in Chrome DevTools > Application > Service Workers
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Security Notes

- Never commit `.env` file to GitHub (it's in `.gitignore`)
- Store secrets in Docker Manager environment variables
- Consider rotating database passwords and API keys periodically
- MongoDB Atlas should have IP whitelist configured for production IPs only
