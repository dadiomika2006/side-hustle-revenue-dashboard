const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      console.warn('Auth failed: Decoded token missing user ID');
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    req.user = { id: decoded.id, role: decoded.role || 'user' };
    next();
  } catch (err) {
    console.error('Auth middleware error details:', {
      name: err.name,
      message: err.message,
      tokenPresent: !!req.header('Authorization')
    });
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;