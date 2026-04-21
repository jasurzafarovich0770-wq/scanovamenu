const User = require('../models/User');
const { generateVerifyToken, hashToken } = require('../utils/tokenUtils');
const { sendVerificationEmail } = require('../services/emailService');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email va parol majburiy' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const { rawToken, hashedToken } = generateVerifyToken();

    const user = await User.create({
      email,
      password,
      verifyToken: hashedToken,
      verifyTokenExpire: new Date(Date.now() + 60 * 60 * 1000), // 1 soat
      lastVerifyEmailSentAt: new Date(),
    });

    // Email foydalanuvchining o'z emailiga yuboriladi (user.email)
    await sendVerificationEmail(user.email, rawToken);

    res.status(201).json({
      success: true,
      message: `Verification email ${user.email} manziliga yuborildi. Iltimos emailingizni tekshiring.`,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token taqdim etilmadi' });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyTokenExpire: { $gt: Date.now() },
    }).select('+verifyToken +verifyTokenExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token yaroqsiz yoki muddati tugagan',
      });
    }

    // Tasdiqlash
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Email muvaffaqiyatli tasdiqlandi! Endi tizimga kirishingiz mumkin.',
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// ─── Resend Verification ──────────────────────────────────────────────────────
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email majburiy' });
    }

    const user = await User.findOne({ email })
      .select('+verifyToken +verifyTokenExpire +lastVerifyEmailSentAt');

    if (!user) {
      // Xavfsizlik: foydalanuvchi mavjudligini oshkor qilmaslik
      return res.json({
        success: true,
        message: 'Agar bu email ro\'yxatdan o\'tgan bo\'lsa, verification email yuborildi.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Bu email allaqachon tasdiqlangan' });
    }

    // Rate limiting: 60 soniyada 1 ta so'rov
    if (user.lastVerifyEmailSentAt) {
      const secondsSinceLast = (Date.now() - user.lastVerifyEmailSentAt.getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Iltimos ${waitSeconds} soniya kuting`,
        });
      }
    }

    const { rawToken, hashedToken } = generateVerifyToken();

    user.verifyToken = hashedToken;
    user.verifyTokenExpire = new Date(Date.now() + 60 * 60 * 1000);
    user.lastVerifyEmailSentAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Email foydalanuvchining o'z emailiga yuboriladi
    await sendVerificationEmail(user.email, rawToken);

    res.json({
      success: true,
      message: `Yangi verification email ${user.email} manziliga yuborildi.`,
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email va parol majburiy' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });
    }

    // Email tasdiqlanmagan bo'lsa — login taqiqlangan
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Emailingiz tasdiqlanmagan. Iltimos emailingizni tekshiring.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    res.json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirdingiz',
      user: { id: user._id, email: user.email, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
};

module.exports = { register, verifyEmail, resendVerification, login };
