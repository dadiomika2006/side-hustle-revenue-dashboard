const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reminderController = require('../controllers/reminderController');

// Secure all routes with auth middleware
router.use(auth);

// @route GET /api/reminders
// @desc Get all reminders for logged in user (with auto-generation)
router.get('/', reminderController.getReminders);

// @route POST /api/reminders
// @desc Create custom reminder
router.post('/', reminderController.createReminder);

// @route PUT /api/reminders/:id
// @desc Toggle reminder completion status
router.put('/:id', reminderController.toggleReminder);

// @route DELETE /api/reminders/:id
// @desc Delete reminder
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
