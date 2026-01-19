const express = require("express");
const cookieParser = require("cookie-parser"); 
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
dotenv.config();

const { handle404Error, handleGlobalError } = require("./middlewares");
const { createUserRateLimiter, strictRateLimiter, getRateLimitStatus } = require("./middlewares/user-rate-limiter");
const { v1Routes } = require("./routes/v1");
const { cors, logger } = require("./config");
const swaggerSpecs = require("./config/swagger");
const path = require("path");

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware
app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
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
