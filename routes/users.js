// src/routes/users.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// GET /api/users  — list all users (excluding self)
router.get('/', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('users').get();
    const users = snap.docs
      .map(d => d.data())
      .filter(u => u.uid !== req.user.uid);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:uid
router.get('/:uid', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.params.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    res.json(snap.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me  — update display name
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    await db.collection('users').doc(req.user.uid).update({ displayName });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
