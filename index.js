// src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes  = require('./routes/auth');
const userRoutes  = require('./routes/users');
const chatRoutes  = require('./routes/chats');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',   // ✅ In production, replace with your app's origin
  methods: ['GET','POST','PATCH','DELETE'],
}));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// ── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 ChatApp backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
