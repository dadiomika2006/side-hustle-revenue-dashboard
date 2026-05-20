const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'sidehustlesecretkey123456789012', 'salt', 32);
const IV_LENGTH = 16;

/**
 * Encrypts cleartext into hex format
 * @param {string} text 
 * @returns {string} iv:encryptedText
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypts hex format iv:encryptedText back into cleartext
 * @param {string} text 
 * @returns {string} cleartext
 */
function decrypt(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const parts = text.split(':');
    if (parts.length < 2) return text; // plaintext fallback
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, return original text to handle legacy plaintext data safely
    return text;
  }
}

module.exports = { encrypt, decrypt };
