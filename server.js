require('dotenv').config();

const logger = require('./logger');

process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(error);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./passport');
const expressStaticGzip = require('express-static-gzip');

const connectDB = require('./db');
const cacheService = require('./services/cacheService');
const initQuotaResetJob = require('./scripts/resetQuotas');

const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const meRouter = require('./routes/me');
const adminRouter = require('./routes/admin');
const cartRouter = require('./routes/cart');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://ssl.google-analytics.com", "https://analytics.google.com", "https://www.google.com", "https://elfsightcdn.com", "https://*.elfsight.com", "https://stats.g.doubleclick.net", "https://region1.google-analytics.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://www.google-analytics.com", "https://analytics.google.com", "https://region1.google-analytics.com", "https://www.google.com/measurement/conversion", "https://www.googletagmanager.com", "https://core.service.elfsight.com", "https://*.elfsight.com", "https://analytics.google.com/g/collect", "https://stats.g.doubleclick.net", "https://www.google.com", "https://*.google-analytics.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
      frameSrc: ["'self'", "https://www.googletagmanager.com", "https://elfsightcdn.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(compression());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

const corsOptions = {
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/me', meRouter);
app.use('/api/cart', cartRouter);
app.use('/api/admin', adminRouter);
app.use(userRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname)));

app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, 'offline.html'));
    return;
  }
  res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 4040;
let server;

async function startServer() {
  try {
    await connectDB();
    logger.info('Database connection successful.');

    await cacheService.connect();
    
    initQuotaResetJob();

    server = app.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`HTTP server listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error('Unhandled Rejection at:', promise, 'Reason:', reason);
  server?.close(() => {
    process.exit(1);
  });
});

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  cacheService.disconnect().catch(err => {
    logger.error('Error disconnecting Redis:', err.message);
  });
  
  server?.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
