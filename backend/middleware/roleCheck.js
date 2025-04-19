const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

const isUser = (req, res, next) => {
  if (req.user && (req.user.role === 'user' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. User privileges required.' });
  }
};

module.exports = {
  isAdmin,
  isUser
}; 