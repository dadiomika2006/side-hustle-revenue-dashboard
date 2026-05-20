const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary } = require('../controllers/transactionController');

// @desc All routes below are protected
// @access Private
router.use(auth);

// @route GET /api/transactions
// @desc Get all transactions for logged in user
// @access Private
router.get('/', getTransactions);

// @route GET /api/transactions/summary
// @desc Get transaction summary
// @access Private
router.get('/summary', getTransactionSummary);

// @route GET /api/transactions/:id
// @desc Get single transaction by ID
// @access Private
router.get(
  '/:id',
  [param('id', 'Invalid transaction ID').isMongoId()],
  validate,
  getTransaction
);

// @route POST /api/transactions
// @desc Create new transaction
// @access Private
router.post(
  '/',
  [
    body('amount', 'Amount is required').isNumeric(),
    body('type', 'Type must be income or expense').isIn(['income', 'expense']),
    body('category', 'Category is required').notEmpty(),
    body('date', 'Valid date is required').isISO8601(),
    body('client', 'Client must be a valid ID').optional().isMongoId(),
    body('incomeStream', 'Income Stream must be a valid ID').optional().isMongoId(),
    body('receipt', 'Receipt must be a valid ID').optional().isMongoId()
  ],
  validate,
  createTransaction
);

// @route PUT /api/transactions/:id
// @desc Update transaction
// @access Private
router.put(
  '/:id',
  [
    param('id', 'Invalid transaction ID').isMongoId(),
    body('amount').optional().isNumeric(),
    body('type').optional().isIn(['income', 'expense']),
    body('date').optional().isISO8601(),
    body('client').optional().isMongoId(),
    body('incomeStream').optional().isMongoId(),
    body('receipt').optional().isMongoId()
  ],
  validate,
  updateTransaction
);

// @route DELETE /api/transactions/:id
// @desc Delete transaction
// @access Private
router.delete(
  '/:id',
  [param('id', 'Invalid transaction ID').isMongoId()],
  validate,
  deleteTransaction
);

module.exports = router;