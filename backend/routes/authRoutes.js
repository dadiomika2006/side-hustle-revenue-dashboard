const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  listUsers, 
  updateUserRole,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  otpLoginRequest,
  otpLoginVerify
} = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', auth, getMe);
router.put('/me', auth, updateProfileValidator, validate, updateProfile);

// Verification, recovery, and OTP login routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/otp-login-request', otpLoginRequest);
router.post('/otp-login-verify', otpLoginVerify);

// Admin-only user routes
router.get('/users', auth, admin, listUsers);
router.put('/users/:id/role', auth, admin, updateUserRole);

module.exports = router;