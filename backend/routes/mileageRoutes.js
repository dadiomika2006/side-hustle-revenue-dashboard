const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mileageController = require('../controllers/mileageController');

router.post('/', auth, mileageController.createMileage);
router.get('/', auth, mileageController.listMileage);
router.get('/summary/monthly', auth, mileageController.summaryByMonth);
router.get('/:id', auth, mileageController.getMileage);
router.delete('/:id', auth, mileageController.deleteMileage);

module.exports = router;
