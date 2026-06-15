require('dotenv').config();

const splitOrigins = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
const matchesDomainSuffix = (hostname, suffixes) => {
  if (!hostname || !suffixes.length) return false;
  return suffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
};

module.exports = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  API_VERSION: process.env.API_VERSION || 'v1',

  // Database
  database: process.env.DB_DIALECT === 'sqlite' || process.env.USE_SQLITE === 'true' ? {
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || './database.sqlite'
  } : {
    url: process.env.DATABASE_URL,
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'libertypath',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : undefined
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // CORS
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3005',
        'http://localhost:3001',
        ...splitOrigins(process.env.FRONTEND_URL),
        ...splitOrigins(process.env.CORS_ORIGINS),
        ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : [])
      ];
      const allowedDomainSuffixes = splitOrigins(process.env.CORS_DOMAIN_SUFFIXES);

      let isRenderPreview = false;
      let isVercelPreview = false;
      let originHostname = null;
      if (typeof origin === 'string') {
        try {
          originHostname = new URL(origin).hostname;
          isRenderPreview = /\.onrender\.com$/i.test(originHostname);
          isVercelPreview = /\.vercel\.app$/i.test(originHostname);
        } catch (error) {
          isRenderPreview = false;
          isVercelPreview = false;
        }
      }
      const isCustomDomainAllowed = matchesDomainSuffix(originHostname, allowedDomainSuffixes);
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isRenderPreview ||
        isVercelPreview ||
        isCustomDomainAllowed ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Business Rules
  business: {
    serviceFeePercentage: parseFloat(process.env.SERVICE_FEE_PERCENTAGE) || 15,
    minWithdrawalAmount: parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT) || 500,
    maxWithdrawalPerWeek: parseFloat(process.env.MAX_WITHDRAWAL_PER_WEEK) || 15000,
    currency: 'LRD'
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    // In development, use more lenient rate limits
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 60000 : 900000), // 1 minute in dev, 15 minutes in prod
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100) // 1000 in dev, 100 in prod
  },

  // Email/SMS (optional for verification)
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  sms: {
    apiKey: process.env.SMS_API_KEY
  }
};

