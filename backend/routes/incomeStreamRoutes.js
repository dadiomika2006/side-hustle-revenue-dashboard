const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listIncomeStreams,
  createIncomeStream,
  updateIncomeStream,
  deleteIncomeStream
} = require('../controllers/incomeStreamController');

router.use(auth);

router.get('/', listIncomeStreams);
router.post('/', createIncomeStream);
router.put('/:id', updateIncomeStream);
router.delete('/:id', deleteIncomeStream);

module.exports = router;
