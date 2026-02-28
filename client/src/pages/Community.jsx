import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const AVATAR_COLORS = [
  'bg-accent/20 text-accent border-accent/30',
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
];

function getAvatarColor(name) {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function Community() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const socketRef = useRef(null);
  const feedRef = useRef(null);

  // ─── Load posts ───────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get('/api/community/posts', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setPosts(data))
      .catch(err => console.error('[Community] Load error:', err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ─── Socket.io real-time ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = io({ auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('newPost', (post) => {
      setPosts(prev => [post, ...prev]);
    });

    return () => socket.disconnect();
  }, [token]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    try {
      const { data } = await axios.post(
        '/api/community/posts',
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Socket will push it to everyone including us, but add locally for instant feedback
      setPosts(prev => {
        if (prev.find(p => p.id === data.id)) return prev;
        return [data, ...prev];
      });
      setMessage('');
    } catch (err) {
      console.error('[Community] Post error:', err.message);
    } finally {
      setPosting(false);
    }
  };

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
            <div className="flex items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Community</h2>
                <p className="text-muted text-sm mt-1">Founding Members Only</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent"
                style={{ boxShadow: '0 0 10px rgba(0,229,160,0.12)' }}>
                ⚡ Founder
              </span>
            </div>

            {/* Composer */}
            <form onSubmit={handlePost} className="bg-surface border border-subtle rounded-2xl p-5 mb-6"
              style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Share a win, ask a question, or help a fellow operator..."
                className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none h-24"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={posting || !message.trim()}
                  className="px-5 py-2 bg-accent hover:bg-accent-dim text-bg font-heading font-bold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>

            {/* Feed */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-white font-heading font-semibold">No posts yet.</p>
                <p className="text-muted text-sm mt-1">Be the first to share something.</p>
              </div>
            ) : (
              <div ref={feedRef} className="flex flex-col gap-4">
                {posts.map(post => {
                  const avatarColor = getAvatarColor(post.userName);
                  return (
                    <div
                      key={post.id}
                      className="bg-surface border border-subtle rounded-xl p-5 post-slide-in"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full border flex-shrink-0 flex items-center justify-center font-heading font-bold text-sm ${avatarColor}`}>
                          {(post.userName || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{post.userName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">Founder</span>
                            <span className="text-xs text-accent/70 font-medium">{post.market}</span>
                          </div>
                          <p className="text-sm text-muted/80 mt-1 leading-relaxed">{post.message}</p>
                          <p className="text-xs text-muted/50 mt-2">{timeAgo(post.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .post-slide-in { animation: slideIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
