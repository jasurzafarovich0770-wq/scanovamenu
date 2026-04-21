const crypto = require('crypto');

/**
 * Tasodifiy token yaratish va uni hash qilish
 * @returns {{ rawToken: string, hashedToken: string }}
 */
const generateVerifyToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

/**
 * Kelgan tokenni sha256 bilan hash qilish
 * @param {string} token
 * @returns {string}
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { generateVerifyToken, hashToken };
