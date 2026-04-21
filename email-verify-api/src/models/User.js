const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email majburiy'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email formati noto\'g\'ri'],
    },
    password: {
      type: String,
      required: [true, 'Parol majburiy'],
      minlength: [6, 'Parol kamida 6 ta belgi bo\'lishi kerak'],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      select: false,
    },
    verifyTokenExpire: {
      type: Date,
      select: false,
    },
    // Rate limiting: oxirgi verification email yuborilgan vaqt
    lastVerifyEmailSentAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Parolni saqlashdan oldin hash qilish
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Parolni tekshirish
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
