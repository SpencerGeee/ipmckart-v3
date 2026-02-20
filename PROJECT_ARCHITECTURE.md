# IPMC Kart E-Commerce Platform - Complete Architecture Documentation

## AI Context Document
This document provides a comprehensive overview of the IPMC Kart e-commerce platform. Use this as context for any AI coding assistant to understand the complete system architecture.

---

## 1. PROJECT OVERVIEW

**Stack**: Node.js + Express.js + MongoDB + Redis + Vanilla JavaScript Frontend
**Type**: Monolithic e-commerce application with hybrid data model
**Architecture**: MVC-ish with separation of routes, models, and middleware

### Key Features
- Complete authentication system (Local + OAuth via Google/Facebook)
- Multi-step checkout with Paystack payment integration
- Server-side cart synchronization
- Admin panel with bulk product management via Excel
- Product JSON export system for high-performance frontend rendering
- Redis caching layer for API responses
- Service worker for offline-first Progressive Web App capabilities
- Brotli/Gzip pre-compression for optimal asset delivery

---

## 2. SERVER CONFIGURATION & ENTRY POINT

### File: `/server.js`
**Purpose**: Main application entry point

#### Core Responsibilities:
1. Initialize Express app with security middleware (Helmet, CSP, Rate-limiting)
2. Connect to MongoDB via Mongoose
3. Connect to Redis for caching
4. Mount all API routes
5. Serve static files with compression support
6. Handle graceful shutdown

#### Key Dependencies:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `passport` - Authentication
- `helmet` - Security headers
- `compression` - Response compression
- `express-static-gzip` - Pre-compressed asset serving
- `ioredis` - Redis client

#### Environment Variables Required:
```bash
NODE_ENV=production
PORT=4040
MONGODB_URI=mongodb://localhost:27017/ipmckart
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
PAYSTACK_SECRET_KEY=your_paystack_secret
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret
FRONTEND_URL=https://ipmckart.com
```

---

## 3. DATABASE MODELS

### 3.1 User Model (`/models/User.js`)

#### Schema Fields:
```javascript
{
  email: String (unique, required, lowercase),
  passwordHash: String (bcrypt hashed),
  firstName: String (required),
  lastName: String (required),
  name: String (full name),
  provider: String (default: 'local', values: 'local' | 'google' | 'facebook'),
  role: String (default: 'customer', values: 'customer' | 'admin'),
  emailVerified: Boolean (default: false),
  billingAddress: {
    firstName, lastName, company, country, streetAddress1, streetAddress2,
    city, state, zip, phone, email
  },
  shippingAddress: { ...same as billing },
  cart: [{
    productId: ObjectId (ref: Product),
    qty: Number (min: 1, max: 999)
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- `email` (unique)
- `role`
- `emailVerified`
- `provider`
- `createdAt` (descending)

### 3.2 Product Model (`/models/Product.js`)

#### Schema Fields:
```javascript
{
  slug: String (unique),
  category: String (required - e.g., 'computing-devices'),
  subcategory: String (e.g., 'laptops'),
  brand: String,
  name: String (required),
  price: Number (required),
  stock: Number (default: 0),
  rating: Number (default: 0),
  images: [String],
  description: String,
  fullDescription: String,
  active: Boolean (default: true),
  
  // Promotional Flags
  isFlashSale: Boolean,
  flashSalePrice: Number,
  flashSaleImage: String,
  flashSaleStock: Number,
  isBlackFriday: Boolean,
  blackFridayPrice: Number,
  isChristmas: Boolean,
  christmasPrice: Number,
  isBackToSchool: Boolean,
  backToSchoolPrice: Number,
  isNewYear: Boolean,
  newYearPrice: Number,
  isComboDeals: Boolean,
  comboDealsPrice: Number,
  isTopSelling: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- `slug` (unique)
- Compound: `category` + `subcategory` + `active`
- Individual promotional flags for fast filtering
- Text search on `name` + `description`

### 3.3 Order Model (`/models/Order.js`)

#### Schema Fields:
```javascript
{
  user: ObjectId (ref: User, nullable for guest checkout),
  items: [{
    productId: Mixed (ObjectId or String for test products),
    name: String,
    image: String,
    price: Number (captured at order time),
    qty: Number (1-999),
    lineTotal: Number,
    custom: { color, size, design }
  }],
  billing: {
    name, email, companyName, country, streetAddress, streetAddress2,
    town, state, zipCode, phone, notes
  },
  shipping: { ...same structure as billing },
  subtotal: Number,
  shippingCost: Number,
  total: Number,
  currency: String (default: 'GHS'),
  status: String (enum: 'placed', 'processing', 'paid', 'failed', 
                  'shipped', 'delivered', 'cancelled', 'refunded'),
  gateway: String (default: 'none'),
  gatewayRef: String (Paystack reference),
  shippingMethod: String (enum: 'standard', 'express'),
  paymentMethod: String (default: 'cod'),
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes:
- Compound: `user` + `createdAt` (descending)
- Compound: `status` + `createdAt` (descending)
- `billing.email`
- `gatewayRef` (unique, sparse)

### 3.4 RefreshToken Model (`/models/RefreshToken.js`)
Used for long-lived JWT session management

---

## 4. API ROUTES & ENDPOINTS

### 4.1 Authentication Routes (`/routes/auth.js`)
**Base Path**: `/api/auth`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/register` | POST | Create new user account | No |
| `/login` | POST | Login with email/password | No |
| `/logout` | POST | Clear authentication cookie | Yes |
| `/verify` | GET | Verify email address | No |
| `/request-password-reset` | POST | Request password reset email | No |
| `/reset-password` | POST | Reset password with token | No |
| `/google` | GET | Initiate Google OAuth flow | No |
| `/google/callback` | GET | Google OAuth callback | No |
| `/facebook` | GET | Initiate Facebook OAuth | No |
| `/facebook/callback` | GET | Facebook OAuth callback | No |
| `/refresh` | POST | Refresh JWT token | Yes |

#### Key Flows:
1. **Signup**: Validates → Hashes password → Creates user → Sends verification email
2. **Login**: Validates credentials → Generates JWT → Sets HTTP-only cookie
3. **OAuth**: Passport.js → Creates/updates user → Sets cookie

### 4.2 Product Routes (`/routes/products.js`)
**Base Path**: `/api/products`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/` | GET | List all products (with filters) | No |
| `/search` | GET | Search products by query | No |
| `/:slug` | GET | Get single product by slug | No |
| `/` | POST | Create new product | Admin |
| `/:slug` | PATCH | Update product | Admin |
| `/:slug` | DELETE | Delete product | Admin |
| `/upload-image` | POST | Upload product image | Admin |
| `/regenerate-json` | POST | Regenerate products.grouped2.json | Admin |

#### JSON Regeneration System:
Products are exported to `/products.grouped2.json` for high-performance frontend rendering:
```javascript
{
  categories: [{
    id: 'computing-devices',
    name: 'Computing Devices',
    subcategories: [{
      id: 'laptops',
      name: 'Laptops',
      products: [{...product data}]
    }]
  }]
}
```

### 4.3 Order Routes (`/routes/orders.js`)
**Base Path**: `/api/orders`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/` | POST | Create new order | Optional |
| `/my-orders` | GET | Get user's orders | Yes |
| `/verify-payment` | POST | Verify Paystack payment | No |
| `/paystack-webhook` | POST | Paystack webhook handler | No |
| `/:id` | GET | Get single order | Yes (own orders only) |

#### Order Flow:
1. **Client**: Submits cart + billing info
2. **Server**: Validates → Checks stock → Creates order → Initializes Paystack payment
3. **Client**: Redirects to Paystack popup
4. **Paystack**: User pays → Redirects back to site
5. **Server**: Verifies payment → Updates order status → Sends confirmation email

### 4.4 Cart Routes (`/routes/cart.js`)
**Base Path**: `/api/cart`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/` | GET | Get server-side cart | Yes |
| `/` | POST | Replace server cart | Yes |
| `/merge` | POST | Merge local cart with server cart | Yes |

#### Cart Synchronization:
- **Local Storage**: `ipmc_cart` (managed by `cart-manager.js`)
- **Server**: User.cart array
- **Merge Logic**: On login, client sends local cart → server merges → returns updated cart

### 4.5 Admin Routes (`/routes/admin.js`)
**Base Path**: `/api/admin`

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/stats` | GET | Dashboard statistics | Admin |
| `/orders` | GET | All orders (paginated) | Admin |
| `/users` | GET | All users (paginated) | Admin |
| `/promos/assign` | POST | Assign products to promo | Admin |
| `/bulk-price-update/preview` | POST | Preview Excel price updates | Admin |
| `/bulk-price-update/apply` | POST | Apply Excel price updates | Admin |

#### Bulk Price Update System:
1. Admin uploads Excel file with columns: Name, New Price
2. Server uses fuzzy matching to match product names
3. Preview shows matches for confirmation
4. Apply updates products in database
5. Triggers JSON regeneration

### 4.6 Other Routes
- `/api/me` - User profile management
- `/api/forms` - Contact forms, repair requests
- `/api/newsletter` - Newsletter subscriptions
- `/api/home-assets` - Homepage data management

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Product Data Flow

#### Data Sources:
```
MongoDB (Source of Truth)
    ↓
products.grouped2.json (Export for frontend)
    ↓
Frontend JavaScript (Renders from JSON)
```

#### Key Files:
1. **`products.grouped2.json`** - Main product catalog (905KB)
2. **`products.flat2.json`** - Flattened product list (1.1MB)
3. **`flash-sales.json`** - Flash sale products
4. **`combo-offers.json`** - Combo deals
5. **`christmas-sale.json`** - Seasonal promotions

### 5.2 Frontend JavaScript Files

#### Core Files:
| File | Purpose | Key Functions |
|------|---------|---------------|
| `cart-manager.js` | Cart state management | `addToCart()`, `syncWithServer()`, `calculateTotal()` |
| `search.js` | Product search | Fuzzy search, filtering, batch rendering |
| `checkout.js` | Checkout flow | Form validation, shipping calculation, Paystack integration |
| `order-complete.js` | Order confirmation | Payment verification, order details display |
| `index-products.js` | Homepage rendering | Category display, featured products |

#### Cart Manager API:
```javascript
window.CartManager = {
  add(productId, qty),
  remove(productId),
  update(productId, qty),
  clear(),
  getItems(),
  getTotal(),
  syncWithServer() // If logged in
}
```

### 5.3 HTML Pages

#### Customer-Facing:
- `index.html` - Homepage
- `category-page.html` - Category/subcategory listings
- `product.html` - Product detail page
- `search-results.html` - Search results
- `cart.html` - Shopping cart
- `checkout.html` - Checkout page
- `order-complete.html` - Order confirmation
- `track-order.html` - Order tracking
- `login.html`, `register.html` - Authentication
- `dashboard.html` - User dashboard

#### Admin:
- `admin.html` - Admin dashboard with product management, order management, bulk updates

---

## 6. MIDDLEWARE & UTILITIES

### 6.1 Authentication Middleware (`/middleware/auth.js`)
```javascript
isAuthenticated(req, res, next) // Requires valid JWT
requireRole(role) // Requires specific role (e.g., 'admin')
```

### 6.2 Caching Middleware (`/middleware/cacheMiddleware.js`)
Redis-based caching for GET requests:
- Caches API responses for configurable TTL
- Automatically invalidates on POST/PATCH/DELETE
- Reduces database load

### 6.3 Sanitization Middleware (`/middleware/sanitize.js`)
Recursively cleans request body to prevent:
- XSS attacks
- NoSQL injection
- Script injection

### 6.4 Email Utility (`/utils/mailjet.js`)
Functions using Mailjet:
- `sendWelcomeEmail(user)`
- `sendVerificationEmail(user, token)`
- `sendPasswordResetEmail(user, token)`
- `sendOrderConfirmationEmail(order)`
- `sendOrderShippedEmail(order)`
- `sendOrderDeliveredEmail(order)`

### 6.5 Payment Utility (`/utils/paystack.js`)
Paystack integration:
- `initializePayment(email, amount, reference)`
- `verifyPayment(reference)`
- `verifyWebhookSignature(req)`

---

## 7. SERVICE WORKER & CACHING STRATEGY

### File: `/sw.js` (Enterprise-Grade Implementation)

#### Caching Strategies by Resource Type:

| Resource Type | Strategy | TTL | Rationale |
|---------------|----------|-----|-----------|
| **HTML Pages** | Network-First | Always fresh | Critical: users must see latest content |
| **JSON Data** (products) | Network-First | Always fresh | Prices and stock must be current |
| **API Calls** | Network-First | 1 minute | Fresh data preferred, fallback to cache |
| **Static Assets** (hashed) | Cache-First | 7 days | Immutable, never changes |
| **Images** | Cache-First | 30 days | Rarely change, heavy bandwidth |
| **Fonts** | Cache-First | 7 days | Static, infrequent changes |

#### Key Features:
1. **Auto-Activation**: Uses `skipWaiting()` + `clients.claim()` for instant updates
2. **Version-Based Cache Names**: `ipmc-kart-v5.0-timestamp`
3. **Update Notifications**: Notifies users when new version available
4. **Offline Support**: Cached content available when offline
5. **Network Bypass**: HTML/JSON always fetched fresh to prevent stale content

#### Cache Manager API (`/assets/js/cache-manager.js`):
```javascript
window.CacheManager = {
  clearAll(),        // Clear all caches and reload
  forceUpdate(),     // Force service worker update
  checkForUpdate(),  // Manually check for SW update
  getRegistration()  // Get SW registration object
}

// Keyboard shortcut: Ctrl+Shift+K to clear all caches
```

---

## 8. BUILD & OPTIMIZATION SCRIPTS

### 8.1 Bundle Scripts (`/scripts/bundle-homepage-scripts.js`)
Combines multiple JS files into single minified bundle:
```bash
npm run bundle:homepage
```

### 8.2 Pre-compression (`/scripts/precompress-assets.js`)
Generates `.gz` and `.br` (Brotli) versions of static files:
```bash
npm run precompress
```

### 8.3 Minification (`/scripts/minify.js`)
Uses Terser to minify JavaScript bundles:
```bash
npm run minify-js
```

### 8.4 Build All (`package.json`)
```bash
npm run build:all  # Runs bundle + precompress
```

---

## 9. SECURITY MEASURES

### 9.1 Implemented Security:
- **Helmet.js**: Sets security headers (CSP, HSTS, etc.)
- **Rate Limiting**: Protects against brute force (5 attempts/15min for auth)
- **Input Sanitization**: Prevents XSS and NoSQL injection
- **HTTPS Enforcement**: Redirects HTTP to HTTPS in production
- **JWT in HTTP-only Cookies**: Prevents XSS token theft
- **CORS Configuration**: Restricts cross-origin requests
- **Password Hashing**: bcryptjs with salt rounds
- **Webhook Signature Verification**: Validates Paystack webhooks

### 9.2 CSP (Content Security Policy):
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com ...;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https:;
connect-src 'self' https://www.google-analytics.com;
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Frontend:
- **Asset Pre-compression**: Brotli (.br) and Gzip (.gz) versions served based on Accept-Encoding
- **Image Optimization**: WebP format for all images
- **Lazy Loading**: Images loaded on viewport entry
- **Resource Hints**: Preconnect, preload for critical resources
- **Code Splitting**: Separate bundles for homepage vs other pages
- **Service Worker Caching**: Offline-first architecture

### 10.2 Backend:
- **Redis Caching**: API responses cached with auto-invalidation
- **MongoDB Indexes**: Optimized queries with compound indexes
- **Connection Pooling**: Mongoose connection reuse
- **Compression Middleware**: Gzip response compression
- **Static Asset Caching**: Long-term caching with versioned filenames

### 10.3 Rendering:
- **JSON Export System**: Products served from static JSON (no DB queries)
- **Batch Rendering**: Virtual scrolling for large product lists
- **Conditional Serving**: ETags and Last-Modified headers

---

## 11. DEPLOYMENT CHECKLIST

### Environment Setup:
```bash
# Production .env
NODE_ENV=production
PORT=4040
MONGODB_URI=mongodb://production-server/ipmckart
REDIS_URL=redis://production-server:6379
JWT_SECRET=secure_random_string_here
PAYSTACK_SECRET_KEY=sk_live_xxx
MAILJET_API_KEY=xxx
MAILJET_SECRET_KEY=xxx
FRONTEND_URL=https://ipmckart.com
```

### Pre-Deployment:
1. Run build scripts: `npm run build:all`
2. Update service worker version in `/sw.js` (change timestamp)
3. Verify MongoDB indexes exist
4. Test Paystack webhook endpoint
5. Check Redis connection
6. Verify email sending works

### Post-Deployment:
1. Clear Redis cache
2. Regenerate products JSON: `POST /api/products/regenerate-json`
3. Test service worker registration
4. Verify CSP headers
5. Check HTTPS redirect
6. Test checkout flow end-to-end

---

## 12. COMMON WORKFLOWS

### 12.1 Adding a New Product:
1. Admin logs in → `/admin.html`
2. Fills product form with images
3. Server creates product in MongoDB
4. Admin clicks "Regenerate JSON"
5. Server exports to `products.grouped2.json`
6. Frontend automatically picks up new product

### 12.2 Running a Flash Sale:
1. Admin selects products
2. Sets `isFlashSale: true` and `flashSalePrice`
3. Regenerates `flash-sales.json`
4. Homepage displays flash sale section

### 12.3 Bulk Price Update:
1. Admin prepares Excel: | Product Name | New Price |
2. Uploads to bulk update interface
3. Server fuzzy-matches product names
4. Preview shows matches
5. Admin confirms → prices updated
6. JSON regenerated automatically

---

## 13. TESTING

### Test Files:
- `__tests__/products.test.js` - Product API tests
- `__tests__/checkout.test.js` - Checkout flow tests

### Run Tests:
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

---

## 14. TROUBLESHOOTING

### Common Issues:

#### Service Worker Not Updating:
```javascript
// In browser console:
CacheManager.forceUpdate()  // Force update and clear caches
// OR
Ctrl+Shift+K  // Keyboard shortcut
```

#### Cart Not Syncing:
1. Check if user is logged in
2. Verify `/api/cart` endpoint returns 200
3. Check browser localStorage for `ipmc_cart`
4. Clear cookies and re-login

#### Products Not Showing:
1. Verify `products.grouped2.json` exists
2. Check file size (should be ~900KB)
3. Regenerate JSON via admin panel
4. Clear service worker cache

#### Payment Not Working:
1. Verify Paystack keys are correct (live vs test)
2. Check webhook is accessible: `POST /api/orders/paystack-webhook`
3. Verify order status updates after payment
4. Check Mailjet for confirmation email

---

## 15. FILE STRUCTURE SUMMARY

```
/var/www/ipmckart/
├── server.js                  # Main entry point
├── package.json               # Dependencies & scripts
├── .env                       # Environment variables
│
├── models/                    # Mongoose schemas
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── RefreshToken.js
│
├── routes/                    # Express routes
│   ├── auth.js               # Authentication
│   ├── products.js           # Product CRUD + JSON export
│   ├── orders.js             # Order processing
│   ├── cart.js               # Cart sync
│   ├── admin.js              # Admin panel
│   ├── me.js                 # User profile
│   ├── forms.js              # Contact forms
│   └── newsletter.js         # Newsletter
│
├── middleware/               # Express middleware
│   ├── auth.js              # JWT verification
│   ├── cacheMiddleware.js   # Redis caching
│   └── sanitize.js          # Input sanitization
│
├── utils/                   # Utilities
│   ├── mailjet.js          # Email sending
│   └── paystack.js         # Payment processing
│
├── services/               # Services
│   └── cacheService.js    # Redis client
│
├── scripts/               # Build scripts
│   ├── bundle-homepage-scripts.js
│   ├── minify.js
│   └── precompress-assets.js
│
├── assets/               # Frontend assets
│   ├── css/
│   ├── js/
│   │   ├── cache-manager.js
│   │   └── common.bundle.min.js
│   └── data/           # Product JSON exports
│       ├── products.grouped2.json
│       ├── products.flat2.json
│       ├── flash-sales.json
│       └── combo-offers.json
│
├── HTML Files (41 total)
│   ├── index.html         # Homepage
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout
│   ├── admin.html         # Admin panel
│   └── ...               # Other pages
│
├── sw.js                 # Service Worker
├── logger.js            # Winston logger
└── passport.js          # Passport config
```

---

## 16. AI ASSISTANT USAGE GUIDE

When using this project with an AI coding assistant, provide this context:

**For Backend Work**:
> "This is a Node.js/Express e-commerce platform using MongoDB and Redis. Products are stored in MongoDB but exported to JSON files for frontend performance. Use the route files in /routes/ and model files in /models/ for reference."

**For Frontend Work**:
> "Frontend uses vanilla JavaScript with CartManager for state. Products are loaded from /products.grouped2.json. Check cart-manager.js and search.js for examples."

**For Payment Integration**:
> "Payment is handled via Paystack. See /routes/orders.js for the flow: initialize payment → redirect to Paystack → verify via webhook. Use /utils/paystack.js for API calls."

**For Service Worker**:
> "Service worker uses Network-First for HTML/JSON to ensure fresh content, Cache-First for static assets. Version is timestamp-based. See /sw.js and /assets/js/cache-manager.js."

---

## 17. SUMMARY FOR AI

This is a production-ready Node.js e-commerce platform with:
- **Hybrid data model**: MongoDB (source of truth) + JSON exports (frontend performance)
- **Enterprise caching**: Redis for API, Service Worker for frontend
- **Complete auth**: Local + OAuth with email verification
- **Payment flow**: Paystack integration with webhook verification
- **Admin tools**: Bulk updates via Excel, promo management, JSON regeneration
- **Performance**: Brotli compression, lazy loading, optimized caching strategies

**Critical paths to understand**:
1. Product flow: MongoDB → JSON export → Frontend rendering
2. Order flow: Cart → Checkout → Paystack → Verification → Email
3. Auth flow: Register → Verify → Login → JWT cookie → Protected routes
4. Caching: Service Worker (frontend) + Redis (backend) + MongoDB indexes
