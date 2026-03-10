// src/middleware/auth.js
const { auth } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token', detail: err.message });
  }
};

module.exports = { verifyToken };
