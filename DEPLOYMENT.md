# IPMC Kart - Production Deployment with Let's Encrypt SSL

## Quick Summary of Changes

1. **Added nginx reverse proxy** - Handles HTTPS on port 443, redirects HTTP to HTTPS
2. **Added certbot** - Automatically renews Let's Encrypt SSL certificates
3. **Fixed REDIS_URL** - Now uses Docker network hostname (`redis://redis:6379`)
4. **Production-ready SSL** - Let's Encrypt certificates (free, auto-renewing)

## Step 1: Commit and Push to GitHub

Run these commands in your terminal:

```bash
cd /var/www/ipmckart

# Stage all changes
git add -A

# Check what will be committed
git status

# Commit with message
git commit -m "fix: add nginx reverse proxy with Let's Encrypt SSL

- Add nginx reverse proxy for HTTPS termination
- Add certbot for automatic SSL certificate renewal
- Fix REDIS_URL to use Docker network hostname
- Add rate limiting for API endpoints
- Add security headers (HSTS, X-Frame-Options, etc.)
- Expose standard ports 80/443 instead of 4040"

# Push to GitHub
git push origin main
```

**If git asks for credentials:**
- **Username**: `SpencerGeee`
- **Password**: Use your GitHub **Personal Access Token** (not your regular password)
  - Get token at: https://github.com/settings/tokens
  - Token needs `repo` scope
  - Or use SSH if configured

**Alternative: Use SSH (if set up)**
```bash
git remote set-url origin git@github.com:SpencerGeee/ipmckart-v3.git
git push origin main
```

## Step 2: Deploy on Hostinger Docker Manager

After pushing to GitHub:

1. Go to Hostinger Docker Manager
2. Select your stack
3. Click **Redeploy** or **Pull and Update**
4. Wait for deployment to complete (~2-3 minutes)

## Step 3: Get SSL Certificate (First Time Only)

After containers are running, get the Let's Encrypt certificate:

```bash
# Run certbot to get initial certificate
docker run --rm -it \
  -v /var/www/ipmckart/certbot/www:/var/www/certbot \
  -v /var/www/ipmckart/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email shop@ipmckart.com \
  --agree-tos \
  --no-eff-email \
  -d ipmckart.com \
  -d www.ipmckart.com
```

**Important:** 
- Make sure port 80 is open on Hostinger firewall (required for certificate validation)
- DNS for `ipmckart.com` must point to your server IP (`147.93.62.224`)

## Step 4: Restart Nginx

After getting the certificate:

```bash
docker restart ipmc-kart-nginx
```

## Step 5: Verify Everything Works

```bash
# Check all containers are running
docker ps

# Check nginx logs
docker logs ipmc-kart-nginx

# Test HTTPS
curl -I https://ipmckart.com

# Test health endpoint
curl https://ipmckart.com/api/health
```

## Step 6: Open Firewall Ports on Hostinger

In Hostinger control panel, ensure these ports are open:
- **80** (HTTP - for Let's Encrypt validation)
- **443** (HTTPS - for secure traffic)

## Automatic Certificate Renewal

Certbot is already configured to auto-renew:
- Runs every 12 hours in background
- Let's Encrypt certs are valid for 90 days
- Renewal happens automatically at ~60 days

**Manual renewal if needed:**
```bash
docker exec ipmc-kart-certbot certbot renew
docker restart ipmc-kart-nginx
```

## File Structure

```
/var/www/ipmckart/
├── docker-compose.yml      # Updated with nginx, certbot
├── nginx/
│   └── nginx.conf          # Reverse proxy config
├── certbot/
│   ├── www/                # Let's Encrypt webroot
│   └── conf/               # SSL certificates stored here
└── .env                    # Fixed REDIS_URL
```

## Troubleshooting

### Certificate request failed
- Ensure port 80 is open on firewall
- Check DNS propagation: `nslookup ipmckart.com`
- Wait 5-10 minutes for DNS to propagate

### Nginx won't start
```bash
docker logs ipmc-kart-nginx
# Check for SSL certificate path errors
```

### Still seeing port 4040 errors
- Clear browser cache
- Access via https://ipmckart.com (not http://IP:4040)

### Check all services
```bash
docker-compose ps
docker-compose logs app
docker-compose logs nginx
docker-compose logs certbot
```

## Architecture

```
Internet (Port 443/HTTPS)
         ↓
    ┌─────────────┐
    │   nginx     │ (Reverse Proxy, SSL Termination)
    └─────────────┘
         ↓
    ┌─────────────┐
    │  Node.js    │ (Port 4040 - internal only)
    │    App      │
    └─────────────┘
         ↓
    ┌─────────────┐
    │  MongoDB    │  Redis
    │   (Atlas)   │  (Docker)
    └─────────────┘
```

## Security Features

✅ HTTPS with Let's Encrypt SSL
✅ HTTP → HTTPS redirect
✅ HSTS header (force HTTPS)
✅ X-Frame-Options (clickjacking protection)
✅ X-Content-Type-Options (MIME sniffing protection)
✅ Rate limiting on API endpoints
✅ Internal network isolation (app not directly exposed)
