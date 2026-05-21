const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, listUsers, updateUserRole } = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfileValidator, validate, updateProfile);

// Admin-only user routes
router.get('/users', auth, admin, listUsers);
router.put('/users/:id/role', auth, admin, updateUserRole);

module.exports = router;