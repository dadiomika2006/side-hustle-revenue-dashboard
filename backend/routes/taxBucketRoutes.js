const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const taxBucketController = require('../controllers/taxBucketController');

router.use(auth);

router.get('/', taxBucketController.getTaxBuckets);
router.get('/summary', taxBucketController.getTaxBucketSummary);
router.post(
  '/',
  [
    body('name', 'Bucket name is required').notEmpty(),
    body('percentage', 'Percentage must be a number between 0 and 100').isFloat({ min: 0, max: 100 }),
    body('category').optional().trim()
  ],
  validate,
  taxBucketController.createTaxBucket
);
router.put('/:id',
  [
    param('id', 'Invalid bucket ID').isMongoId(),
    body('name').optional().trim(),
    body('percentage').optional().isFloat({ min: 0, max: 100 }),
    body('category').optional().trim(),
    body('active').optional().isBoolean()
  ],
  validate,
  taxBucketController.updateTaxBucket
);
router.delete('/:id',
  [param('id', 'Invalid bucket ID').isMongoId()],
  validate,
  taxBucketController.deleteTaxBucket
);

module.exports = router;
