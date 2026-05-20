/**
 * Admin middleware - restricts access to administrators
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied: Administrative privileges required' });
  }
};

module.exports = admin;
