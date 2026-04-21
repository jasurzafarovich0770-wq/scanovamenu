import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './infrastructure/logger';
import { connectRedis } from './infrastructure/redis';
import { apiRoutes } from './api/routes';
import { errorHandler } from './api/middleware/errorHandler';
import { AuthService } from './domain/services/AuthService';
import { AuthRepository } from './infrastructure/repositories/AuthRepository';
import { seedDemoMenu } from './infrastructure/demoMenuSeeder';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));

// Umumiy rate limit — 15 daqiqada 1000 ta so'rov (normal foydalanish uchun yetarli)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Menyu va health check so'rovlarini limitdan o'tkazib yuborish
    const path = req.path;
    return path.startsWith('/api/menu/') || path === '/health';
  },
});
app.use('/api/', limiter);

// Login brute-force himoyasi — 15 daqiqada 10 ta urinish
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// Verification — 1 daqiqada 3 ta so'rov
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, error: 'Juda ko\'p tasdiqlash so\'rovi. 1 daqiqa kuting.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/verify/send', verifyLimiter);

// Body parsing — rasm yuklash uchun limit oshirildi
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    await connectRedis();

    // Seed default users
    try {
      const authService = new AuthService(new AuthRepository());
      await authService.seedDefaultUsers();
      await seedDemoMenu();
      logger.info('Default users seeded');
    } catch (e) {
      logger.warn('Seed skipped (DB may not be ready):', e);
    }
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
