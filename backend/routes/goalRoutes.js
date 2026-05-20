const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const goalController = require('../controllers/goalController');

router.use(auth);

router.get('/', goalController.getActiveGoals);
router.get('/progress', goalController.getGoalProgress);
router.post(
  '/',
  [
    body('name', 'Name is required').notEmpty(),
    body('targetAmount', 'Target amount must be a number').isNumeric(),
    body('frequency', 'Frequency must be monthly or annual').isIn(['monthly', 'annual'])
  ],
  validate,
  goalController.createGoal
);
router.put('/:id',
  [
    param('id', 'Invalid goal ID').isMongoId(),
    body('targetAmount').optional().isNumeric(),
    body('frequency').optional().isIn(['monthly', 'annual'])
  ],
  validate,
  goalController.updateGoal
);
router.delete('/:id',
  [param('id', 'Invalid goal ID').isMongoId()],
  validate,
  goalController.deleteGoal
);

module.exports = router;
