const express = require("express");
const cookieParser = require("cookie-parser"); 
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");

// Load .env.test if NODE_ENV is test, otherwise load .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

const { handle404Error, handleGlobalError } = require("./middlewares");
const { createUserRateLimiter, strictRateLimiter, getRateLimitStatus } = require("./middlewares/user-rate-limiter");
const { v1Routes } = require("./routes/v1");
const { cors, logger } = require("./config");
const swaggerSpecs = require("./config/swagger");
const path = require("path");

const app = express();

// Serve static files BEFORE security middleware to set proper CORS headers
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.UI_URL || 'http://localhost');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}));

// Security middleware - configure Helmet without CORP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:", "http://localhost"],
  },
}));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
// Skip crossOriginResourcePolicy - we'll set it manually

// Set CORP header manually to allow cross-origin
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware
app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// User-based rate limiting (applied after authentication middleware in routes)
const userRateLimiter = createUserRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  maxRequestsAuthenticated: 1000, // Authenticated users get higher limit
  maxRequestsUnauthenticated: 100, // Unauthenticated users get lower limit
});

// Note: Rate limiting is applied per-route in v1 routes for better control

// Rate limit status endpoint
app.get('/api/v1/rate-limit-status', getRateLimitStatus);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'School Management API Documentation',
}));

// API routes
app.use("/api/v1", v1Routes);

// Error handling middleware (must be last)
app.use(handle404Error);
app.use(handleGlobalError);

module.exports = { app };
