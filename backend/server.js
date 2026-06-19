const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
// Global apiLimiter removed: it caused 429s on GET /auth/me and read routes behind shared IPs (Render).
// Per-route limiters remain on auth (login/register), withdrawals, and tasks.

// Import database
const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const walletRoutes = require('./routes/wallet');
const packageRoutes = require('./routes/packages');
const taskRoutes = require('./routes/tasks');
const referralRoutes = require('./routes/referrals');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');

// Initialize Express app
const app = express();

// Behind Render (reverse proxy), ensure req.ip uses X-Forwarded-For
// so rate limiting isn't shared across all users.
app.set('trust proxy', true);

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LibertyPath API',
      version: '1.0.0',
      description: 'LibertyPath Ltd. - Participation & Rewards Platform API Documentation',
      contact: {
        name: 'LibertyPath Ltd.',
        email: 'support@libertypath.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://libertypath.com'
      }
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL
          ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/api/${config.API_VERSION}`
          : `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(compression());
app.use(helmet()); // Security headers
app.use(cors(config.cors)); // CORS configuration
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL encoded parser
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTP request logger

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LibertyPath API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LibertyPath API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API Routes
const apiBase = `/api/${config.API_VERSION}`;
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/users`, userRoutes);
app.use(`${apiBase}/wallet`, walletRoutes);
app.use(`${apiBase}/packages`, packageRoutes);
app.use(`${apiBase}/tasks`, taskRoutes);
app.use(`${apiBase}/referrals`, referralRoutes);
app.use(`${apiBase}/chat`, chatRoutes);
app.use(`${apiBase}/admin`, adminRoutes);
app.use(`${apiBase}/settings`, settingsRoutes);

// Serve frontend build when bundled with backend (optional — not used when frontend is on Vercel)
if (config.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false') {
  const buildPath = path.resolve(__dirname, '..', 'frontend', 'build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith(apiBase) ||
        req.path.startsWith('/api-docs') ||
        req.path.startsWith('/health')
      ) {
        return next();
      }
      return res.sendFile(path.join(buildPath, 'index.html'));
    });
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to LibertyPath API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const PORT = config.PORT || 5000;
const HOST = config.HOST || '127.0.0.1';

const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync database (use with caution in production - prefer migrations)
    if (config.NODE_ENV === 'development') {
      // Only sync in development
      // await db.sequelize.sync({ alter: true });
      logger.info('Database models loaded.');
    }

    // Start server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Server is running on http://${HOST}:${PORT} in ${config.NODE_ENV} mode`);
      logger.info(`API Documentation available at http://${HOST}:${PORT}/api-docs`);
    });
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await db.sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;

