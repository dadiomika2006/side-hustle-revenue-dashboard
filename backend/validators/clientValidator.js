const { body } = require('express-validator');

exports.validateClient = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email')
];
