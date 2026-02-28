const express = require('express');
const { db } = require('../db/setup');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/community/posts — authenticated users, pinned first then newest
router.get('/posts', requireAuth, (req, res) => {
  const posts = db.prepare(`
    SELECT p.*,
           CASE WHEN pl.userId IS NOT NULL THEN 1 ELSE 0 END as likedByMe
    FROM posts p
    LEFT JOIN post_likes pl ON pl.postId = p.id AND pl.userId = ?
    ORDER BY p.pinned DESC, p.createdAt DESC
    LIMIT 150
  `).all(req.user.id);
  res.json(posts);
});

// POST /api/community/posts — any authenticated user, supports tag + parentId
router.post('/posts', requireAuth, (req, res) => {
  const { message, tag, parentId } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const { id: userId, name: userName, market } = req.user;
  const validTags = ['wins', 'tips', 'questions', 'other'];
  const cleanTag = validTags.includes(tag) ? tag : null;

  const result = db.prepare(
    'INSERT INTO posts (userId, userName, market, message, tag, parentId) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, userName || 'Member', market || 'General', message.trim(), cleanTag, parentId || null);

  const post = db.prepare(`
    SELECT p.*, 0 as likedByMe FROM posts p WHERE p.id = ?
  `).get(result.lastInsertRowid);

  req.app.locals.io?.to('community').emit('newPost', post);
  res.status(201).json(post);
});

// POST /api/community/posts/:id/like — toggle like for current user
router.post('/posts/:id/like', requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  const userId = req.user.id;

  const existing = db.prepare(
    'SELECT id FROM post_likes WHERE postId = ? AND userId = ?'
  ).get(postId, userId);

  let likedByMe;
  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE postId = ? AND userId = ?').run(postId, userId);
    db.prepare('UPDATE posts SET likeCount = MAX(0, likeCount - 1) WHERE id = ?').run(postId);
    likedByMe = false;
  } else {
    db.prepare('INSERT INTO post_likes (postId, userId) VALUES (?, ?)').run(postId, userId);
    db.prepare('UPDATE posts SET likeCount = likeCount + 1 WHERE id = ?').run(postId);
    likedByMe = true;
  }

  const { likeCount } = db.prepare('SELECT likeCount FROM posts WHERE id = ?').get(postId);
  req.app.locals.io?.to('community').emit('postLiked', { postId, likeCount });
  res.json({ likedByMe, likeCount });
});

// POST /api/community/posts/:id/pin — admin only, toggle pin (max 1 pinned)
router.post('/posts/:id/pin', requireAuth, requireAdmin, (req, res) => {
  const postId = Number(req.params.id);
  const post = db.prepare('SELECT pinned FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newPinned = post.pinned ? 0 : 1;
  if (newPinned) db.prepare('UPDATE posts SET pinned = 0').run();
  db.prepare('UPDATE posts SET pinned = ? WHERE id = ?').run(newPinned, postId);

  req.app.locals.io?.to('community').emit('postPinned', { postId, pinned: newPinned });
  res.json({ pinned: newPinned });
});

// DELETE /api/community/posts/:id — admin only
router.delete('/posts/:id', requireAuth, requireAdmin, (req, res) => {
  const postId = Number(req.params.id);
  db.prepare('DELETE FROM post_likes WHERE postId = ?').run(postId);
  db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
  res.json({ success: true });
});

module.exports = router;
