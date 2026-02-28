const express = require('express');
const { db } = require('../db/setup');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/community/posts — readable by all authenticated users, newest first, limit 50
router.get('/posts', requireAuth, (req, res) => {
  const posts = db.prepare(
    'SELECT * FROM posts ORDER BY createdAt DESC LIMIT 50'
  ).all();
  res.json(posts);
});

// POST /api/community/posts — any authenticated user can post
router.post('/posts', requireAuth, (req, res) => {
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const { id: userId, name: userName, market } = req.user;

  const result = db.prepare(
    'INSERT INTO posts (userId, userName, market, message) VALUES (?, ?, ?, ?)'
  ).run(userId, userName || 'Member', market || 'General', message.trim());

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

  // Emit to community room so all connected clients get the new post
  req.app.locals.io?.to('community').emit('newPost', post);

  res.status(201).json(post);
});

// DELETE /api/community/posts/:id — admin only
router.delete('/posts/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
