import dotenv from 'dotenv';

dotenv.config();

// JWT_SECRET zaif bo'lsa ogohlantirish
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your-super-secret-jwt-key-change-in-production' || jwtSecret.length < 32) {
  console.warn('[SECURITY] JWT_SECRET zaif yoki o\'zgartirilmagan! .env faylida kuchli secret o\'rnating.');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
  
  cors: {
    origins: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.ADMIN_URL || 'http://localhost:5174',
    ],
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
