const { body } = require('express-validator');

exports.validateInvoice = [
  body('client').notEmpty().withMessage('Client is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
];
