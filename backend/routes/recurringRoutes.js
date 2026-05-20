const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const recurringController = require('../controllers/recurringController');

router.post('/', auth, recurringController.createRecurring);
router.get('/', auth, recurringController.listRecurring);
router.get('/:id', auth, recurringController.getRecurring);
router.put('/:id', auth, recurringController.updateRecurring);
router.delete('/:id', auth, recurringController.deleteRecurring);

module.exports = router;
