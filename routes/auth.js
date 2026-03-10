// src/routes/auth.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const admin = require('firebase-admin');

// POST /api/auth/sync  — called after every login to upsert user doc
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    if (uid !== req.user.uid) {
      return res.status(403).json({ error: 'UID mismatch' });
    }

    const userRef = db.collection('users').doc(uid);
    await userRef.set(
      {
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        lastSeen:  admin.firestore.FieldValue.serverTimestamp(),
        isOnline:  true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }   // upsert — don't overwrite createdAt
    );

    const snap = await userRef.get();
    res.json({ success: true, user: snap.data() });
  } catch (err) {
    console.error('sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    res.json(snap.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout — mark user offline
router.post('/logout', verifyToken, async (req, res) => {
  try {
    await db.collection('users').doc(req.user.uid).update({
      isOnline: false,
      lastSeen:  admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
