const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidator = [
  body('email')
    .optional()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Business name cannot exceed 100 characters'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'AUD', 'CAD']).withMessage('Currency must be one of USD, EUR, GBP, AUD, CAD'),
  body('themeMode')
    .optional()
    .isIn(['light', 'dark']).withMessage('Theme mode must be light or dark'),
];

module.exports = { registerValidator, loginValidator, updateProfileValidator };