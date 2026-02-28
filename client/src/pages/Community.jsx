import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';

// SQLite UTC fix
function parseDate(ds) {
  if (!ds) return new Date(0);
  if (typeof ds === 'string' && !ds.includes('T') && !ds.includes('Z')) {
    return new Date(ds.replace(' ', 'T') + 'Z');
  }
  return new Date(ds);
}

function timeAgo(ds) {
  if (!ds) return '';
  const diff = Date.now() - parseDate(ds).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const AVATAR_COLORS = [
  'bg-accent/20 text-accent border-accent/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
];
function getAvatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

const TAGS = [
  { key: 'wins',      label: '🏆 Win',      badge: 'bg-accent/10 border-accent/30 text-accent' },
  { key: 'tips',      label: '💡 Tip',       badge: 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' },
  { key: 'questions', label: '❓ Question',  badge: 'bg-blue-400/10 border-blue-400/30 text-blue-400' },
  { key: 'other',     label: '📢 Other',     badge: 'bg-white/5 border-white/10 text-muted' },
];
function getTagStyle(tagKey) {
  return TAGS.find(t => t.key === tagKey) || TAGS[3];
}

// ── Profile Mini-Modal ───────────────────────────────────────────────────────
function ProfileModal({ profileUser, allPosts, onClose }) {
  const userPosts = allPosts.filter(p => p.userId === profileUser.userId && !p.parentId).slice(0, 3);
  const isActiveThisWeek = allPosts.some(p => {
    if (p.userId !== profileUser.userId) return false;
    const d = parseDate(p.createdAt);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-surface border border-subtle rounded-2xl p-6 w-full max-w-sm"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-heading font-bold text-lg ${getAvatarColor(profileUser.userName)}`}>
            {(profileUser.userName || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{profileUser.userName}</span>
              {profileUser.isFounder ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">⚡ Founder</span>
              ) : null}
              {isActiveThisWeek && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">Active this week</span>
              )}
            </div>
            <p className="text-xs text-accent/80 mt-0.5">📍 {profileUser.market}</p>
          </div>
        </div>

        <div className="text-xs text-muted mb-3 font-medium uppercase tracking-wide">Recent posts</div>
        {userPosts.length === 0 ? (
          <p className="text-muted text-sm">No posts yet.</p>
        ) : (
          <div className="space-y-2">
            {userPosts.map(p => (
              <div key={p.id} className="bg-bg border border-subtle/50 rounded-xl px-3 py-2.5">
                {p.tag && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium mr-1.5 ${getTagStyle(p.tag).badge}`}>
                    {getTagStyle(p.tag).label}
                  </span>
                )}
                <span className="text-sm text-white/80 line-clamp-2">{p.message}</span>
                <p className="text-xs text-muted/50 mt-1">{timeAgo(p.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single post card ─────────────────────────────────────────────────────────
function PostCard({ post, replies, token, user, onLike, onReply, onProfile, isAdmin, onPin, onDelete }) {
  const [replyText, setReplyText] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const avatarColor = getAvatarColor(post.userName);
  const tagStyle = post.tag ? getTagStyle(post.tag) : null;
  const isWin = post.tag === 'wins';

  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);
  const hiddenCount = replies.length - 2;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(post.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
    setSubmitting(false);
    setShowAllReplies(true);
  };

  return (
    <div
      className={[
        'bg-surface border rounded-xl p-5 post-slide-in',
        post.pinned ? 'border-accent/30' : isWin ? 'border-accent/20' : 'border-subtle',
      ].join(' ')}
      style={{ boxShadow: post.pinned ? '0 2px 20px rgba(0,229,160,0.08)' : '0 2px 12px rgba(0,0,0,0.25)' }}
    >
      {/* Pinned banner */}
      {post.pinned ? (
        <div className="flex items-center gap-1.5 text-xs text-accent font-medium mb-3 -mt-1">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2L7 7H2l4 3.5L4.5 16 10 12.5 15.5 16 14 10.5 18 7h-5L10 2z"/></svg>
          Pinned by admin
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <button onClick={() => onProfile(post)} className="flex-shrink-0">
          <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-heading font-bold text-sm hover:ring-2 ring-accent/30 transition-all ${avatarColor}`}>
            {(post.userName || '?')[0].toUpperCase()}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onProfile(post)}
              className="font-semibold text-white text-sm hover:text-accent transition-colors"
            >
              {post.userName}
            </button>
            {post.market && (
              <span className="text-xs text-accent/70 font-medium">{post.market}</span>
            )}
            {tagStyle && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${tagStyle.badge}`}>
                {tagStyle.label}
              </span>
            )}
          </div>

          <p className={`text-sm mt-2 leading-relaxed ${isWin ? 'text-white' : 'text-white/80'}`}>
            {post.message}
          </p>

          {/* Actions row */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.likedByMe ? 'text-accent' : 'text-muted hover:text-white'}`}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill={post.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
              </svg>
              {post.likeCount > 0 ? post.likeCount : ''}
            </button>

            <button
              onClick={() => setReplyOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"/>
              </svg>
              {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>

            <span className="text-xs text-muted/50 ml-auto">{timeAgo(post.createdAt)}</span>

            {/* Admin controls */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button onClick={() => onPin(post.id)} className="text-xs text-muted hover:text-accent transition-colors">
                  {post.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => onDelete(post.id)} className="text-xs text-red-400/50 hover:text-red-400 transition-colors">
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Reply composer */}
          {replyOpen && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                placeholder="Write a reply..."
                className="flex-1 bg-bg border border-subtle rounded-xl px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <button
                onClick={submitReply}
                disabled={submitting || !replyText.trim()}
                className="px-3 py-2 bg-accent hover:bg-accent-dim text-bg font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {submitting ? '…' : '↑'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 ml-12 space-y-2.5 border-l-2 border-subtle pl-4">
          {visibleReplies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <div className={`w-7 h-7 rounded-full border flex-shrink-0 flex items-center justify-center font-heading font-bold text-xs ${getAvatarColor(reply.userName)}`}>
                {(reply.userName || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => onProfile(reply)} className="text-xs font-semibold text-white hover:text-accent transition-colors">
                    {reply.userName}
                  </button>
                  <span className="text-xs text-muted/50">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">{reply.message}</p>
              </div>
            </div>
          ))}
          {!showAllReplies && hiddenCount > 0 && (
            <button onClick={() => setShowAllReplies(true)} className="text-xs text-accent hover:underline">
              See {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Community page ──────────────────────────────────────────────────────
export default function Community() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [posting, setPosting] = useState(false);
  const [tagFilter, setTagFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [profileUser, setProfileUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ─── Load posts ────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get('/api/community/posts', authHeaders)
      .then(({ data }) => setPosts(data))
      .catch(err => console.error('[Community] Load error:', err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ─── Socket.io ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io({ auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 5 });

    socket.on('newPost', post => {
      setPosts(prev => prev.find(p => p.id === post.id) ? prev : [post, ...prev]);
    });
    socket.on('postLiked', ({ postId, likeCount }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likeCount } : p));
    });
    socket.on('postPinned', ({ postId, pinned }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, pinned } : (pinned ? { ...p, pinned: 0 } : p)));
    });

    return () => socket.disconnect();
  }, [token]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handlePost = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    try {
      const { data } = await axios.post('/api/community/posts', { message, tag: selectedTag }, authHeaders);
      setPosts(prev => prev.find(p => p.id === data.id) ? prev : [data, ...prev]);
      setMessage('');
      setSelectedTag(null);
    } catch (err) {
      console.error('[Community] Post error:', err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? Math.max(0, p.likeCount - 1) : (p.likeCount || 0) + 1 }
      : p
    ));
    try {
      await axios.post(`/api/community/posts/${postId}/like`, {}, authHeaders);
    } catch {
      // Revert
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? Math.max(0, p.likeCount - 1) : (p.likeCount || 0) + 1 }
        : p
      ));
    }
  };

  const handleReply = async (parentId, text) => {
    const { data } = await axios.post('/api/community/posts', { message: text, parentId }, authHeaders);
    setPosts(prev => prev.find(p => p.id === data.id) ? prev : [...prev, data]);
  };

  const handlePin = async (postId) => {
    try {
      await axios.post(`/api/community/posts/${postId}/pin`, {}, authHeaders);
    } catch (err) {
      console.error('[Community] Pin error:', err.message);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`/api/community/posts/${postId}`, authHeaders);
      setPosts(prev => prev.filter(p => p.id !== postId && p.parentId !== postId));
    } catch (err) {
      console.error('[Community] Delete error:', err.message);
    }
  };

  // ─── Derived feed ─────────────────────────────────────────────────────────
  const { pinned, topLevelItems } = useMemo(() => {
    const filtered = posts.filter(p => {
      if (p.parentId) return false; // replies handled separately
      if (tagFilter !== 'all' && p.tag !== tagFilter) return false;
      if (marketFilter === 'mine' && p.market !== user?.market) return false;
      return true;
    });

    const pinnedPost = filtered.find(p => p.pinned);
    const normalPosts = filtered.filter(p => !p.pinned);
    const replyMap = {};
    posts.filter(p => p.parentId).forEach(r => {
      if (!replyMap[r.parentId]) replyMap[r.parentId] = [];
      replyMap[r.parentId].push(r);
    });

    return {
      pinned: pinnedPost,
      topLevelItems: normalPosts.map(p => ({ post: p, replies: replyMap[p.id] || [] }))
    };
  }, [posts, tagFilter, marketFilter, user?.market]);

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:block w-64 flex-shrink-0" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3.5 border-b border-subtle bg-surface sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-muted hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <h1 className="font-heading font-bold text-lg">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </h1>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Operator Community</h2>
                <p className="text-muted text-sm mt-1">Share wins, ask questions, help your peers</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent"
                style={{ boxShadow: '0 0 10px rgba(0,229,160,0.12)' }}>
                ⚡ Founders Only
              </span>
            </div>

            {/* Composer */}
            <form onSubmit={handlePost} className="bg-surface border border-subtle rounded-2xl p-5 mb-5"
              style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Share a win, ask a question, or help a fellow operator..."
                className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none h-20"
              />

              {/* Tag picker */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-muted">Tag:</span>
                {TAGS.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === t.key ? null : t.key)}
                    className={[
                      'text-xs px-2.5 py-1 rounded-full border transition-all',
                      selectedTag === t.key ? t.badge : 'bg-bg border-subtle text-muted hover:text-white hover:border-muted/40'
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="submit"
                  disabled={posting || !message.trim()}
                  className="ml-auto px-5 py-1.5 bg-accent hover:bg-accent-dim text-bg font-heading font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? '...' : 'Post'}
                </button>
              </div>
            </form>

            {/* Filters */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[{ key: 'all', label: 'All' }, ...TAGS.map(t => ({ key: t.key, label: t.label }))].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTagFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${tagFilter === f.key ? 'bg-accent text-bg' : 'bg-surface border border-subtle text-muted hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
              <div className="ml-auto flex gap-1">
                {[{ key: 'all', label: 'All Markets' }, { key: 'mine', label: 'My Market' }].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setMarketFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${marketFilter === f.key ? 'bg-white/15 text-white' : 'text-muted hover:text-white'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Pinned post */}
                {pinned && (
                  <PostCard
                    post={pinned}
                    replies={posts.filter(p => p.parentId === pinned.id)}
                    token={token}
                    user={user}
                    onLike={handleLike}
                    onReply={handleReply}
                    onProfile={p => setProfileUser(p)}
                    isAdmin={isAdmin}
                    onPin={handlePin}
                    onDelete={handleDelete}
                  />
                )}

                {topLevelItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-white font-heading font-semibold">No posts yet.</p>
                    <p className="text-muted text-sm mt-1">Be the first to share something.</p>
                  </div>
                ) : (
                  topLevelItems.map(({ post, replies }) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      replies={replies}
                      token={token}
                      user={user}
                      onLike={handleLike}
                      onReply={handleReply}
                      onProfile={p => setProfileUser(p)}
                      isAdmin={isAdmin}
                      onPin={handlePin}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile modal */}
      {profileUser && (
        <ProfileModal
          profileUser={profileUser}
          allPosts={posts}
          onClose={() => setProfileUser(null)}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .post-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
