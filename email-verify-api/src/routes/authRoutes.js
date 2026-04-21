const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, verifyEmail, resendVerification, login } = require('../controllers/authController');

const router = express.Router();

// Register rate limit: 5 ta so'rov / 15 daqiqa
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limit: 10 ta so'rov / 15 daqiqa
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Resend rate limit: 3 ta so'rov / 5 daqiqa (qo'shimcha himoya)
const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Juda ko\'p so\'rov. 5 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendLimiter, resendVerification);
router.post('/login', loginLimiter, login);

module.exports = router;
