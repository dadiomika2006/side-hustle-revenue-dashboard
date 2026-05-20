const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportController');

router.get('/csv', auth, exportController.exportCSV);
router.get('/schedule-c', auth, exportController.exportScheduleC);

module.exports = router;
