const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'cls-secret-2025-change-in-production';

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });

module.exports = { auth, sign };
