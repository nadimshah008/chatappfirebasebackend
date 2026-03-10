// src/routes/chats.js
const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const admin = require('firebase-admin');

// GET /api/chats  — list user's chats
router.get('/', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('chats')
      .where('participants', 'array-contains', req.user.uid)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats  — create or find existing DM
router.post('/', verifyToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

    // Check if chat already exists
    const existing = await db.collection('chats')
      .where('participants', 'array-contains', req.user.uid)
      .get();

    const found = existing.docs.find(d => {
      const p = d.data().participants;
      return p.includes(otherUserId);
    });

    if (found) return res.json({ id: found.id, ...found.data() });

    // Create new chat
    const ref = await db.collection('chats').add({
      participants: [req.user.uid, otherUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: '',
    });

    const newSnap = await ref.get();
    res.status(201).json({ id: ref.id, ...newSnap.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    let q = db.collection('chats').doc(req.params.chatId)
      .collection('messages').orderBy('createdAt', 'desc').limit(Number(limit));

    if (before) {
      const beforeSnap = await db.collection('chats').doc(req.params.chatId)
        .collection('messages').doc(before).get();
      q = q.startAfter(beforeSnap);
    }

    const snap = await q.get();
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/:chatId/messages
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });

    const msgRef = await db.collection('chats').doc(req.params.chatId)
      .collection('messages').add({
        text: text.trim(),
        senderId: req.user.uid,
        senderName: req.user.name || req.user.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

    await db.collection('chats').doc(req.params.chatId).update({
      lastMessage: text.trim(),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: msgRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
