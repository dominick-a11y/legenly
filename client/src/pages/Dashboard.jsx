import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import LeadCard from '../components/LeadCard.jsx';
import StatsRow from '../components/StatsRow.jsx';
import Notification from '../components/Notification.jsx';

const FILTER_OPTIONS = [
  { key: 'all',    label: 'All' },
  { key: 'new',    label: 'New' },
  { key: 'called', label: 'Called' },
  { key: 'closed', label: 'Closed' }
];

export default function Dashboard() {
  const { token, user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pushDenied, setPushDenied] = useState(false);
  const socketRef = useRef(null);

  // ─── Fetch initial leads ─────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get('/api/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setLeads(data))
      .catch(err => console.error('[Dashboard] Failed to load leads:', err.message))
      .finally(() => setLoading(false));
  }, [token]);


  // ─── Request browser push notification permission ─────────────────────────
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'denied') setPushDenied(true);
      });
    } else if (Notification.permission === 'denied') {
      setPushDenied(true);
    }
  }, []);

  // ─── Onboarding status check ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axios
      .get('/api/auth/onboarding-status', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (!data.dismissed) setShowOnboarding(true);
      })
      .catch(() => {});
  }, [token]);

  const dismissOnboarding = async () => {
    try {
      await axios.post('/api/auth/dismiss-onboarding', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    setShowOnboarding(false);
  };

  // ─── Socket.io real-time connection ──────────────────────────────────────
  useEffect(() => {
    // Connect to same origin — Vite proxy handles /socket.io → Express
    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('newLead', (lead) => {
      console.log('[Socket] New lead received:', lead.name);
      // Prepend new lead to the feed
      setLeads(prev => [lead, ...prev]);
      // Add toast notification with a unique id
      setNotifications(prev => [
        ...prev,
        { id: `${lead.id}-${Date.now()}`, lead }
      ]);
      // Browser push notification (works when tab is in background)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New Lead — ${lead.market || 'Your Territory'}`, {
          body: `${lead.name} · ${lead.city || ''} · ${lead.jobType || ''}`.replace(/ · $/, ''),
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // ─── Lead status update callback ─────────────────────────────────────────
  const handleStatusChange = useCallback((leadId, newStatus) => {
    setLeads(prev =>
      prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l)
    );
  }, []);

  // ─── Notification dismiss callback ───────────────────────────────────────
  const handleDismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ─── Filter leads ─────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const filteredLeads = leads
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => {
      if (!q) return true;
      return (
        l.name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
      );
    });

  // Count per filter for badges
  const counts = {
    all:    leads.length,
    new:    leads.filter(l => l.status === 'new').length,
    called: leads.filter(l => l.status === 'called').length,
    closed: leads.filter(l => l.status === 'closed').length
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop spacer — keeps content right of the fixed sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3.5 border-b border-subtle bg-surface sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <h1 className="font-heading font-bold text-lg">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </h1>
          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
            <span className="text-xs text-accent font-medium">Live</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-4xl mx-auto">

            {/* Page header */}
            <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">
                  {user?.market || 'My Leads'}
                </h2>
                <p className="text-muted text-sm mt-1">Your exclusive lead territory</p>
              </div>
              {/* Desktop live indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
                <span className="text-xs text-accent font-medium">Live</span>
              </div>
            </div>

            {/* Stats */}
            {!loading && <StatsRow leads={leads} market={user?.market} />}

            {/* Push notification denied banner */}
            {pushDenied && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-sm text-yellow-300">
                <span className="text-base">🔔</span>
                <span>Enable browser notifications to get alerted about new leads even when this tab is in the background. Check your browser's site settings.</span>
                <button onClick={() => setPushDenied(false)} className="ml-auto text-yellow-300/50 hover:text-yellow-300 flex-shrink-0 transition-colors">✕</button>
              </div>
            )}

            {/* Search input */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                width="15" height="15" viewBox="0 0 20 20" fill="currentColor"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
              <input
                type="text"
                placeholder="Search by name, phone, city, or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {FILTER_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={[
                    'px-4 py-1.5 rounded-full text-sm transition-all font-medium',
                    filter === key
                      ? 'bg-accent text-bg font-semibold'
                      : 'bg-surface border border-subtle text-muted hover:text-white hover:border-muted'
                  ].join(' ')}
                >
                  {label}
                  {counts[key] > 0 && (
                    <span className={[
                      'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                      filter === key ? 'bg-bg/30' : 'bg-subtle'
                    ].join(' ')}>
                      {counts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lead feed */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div
                  className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent spin"
                />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-white font-heading font-semibold text-lg">No leads yet</p>
                <p className="text-muted text-sm mt-1">
                  {q
                    ? `No results for "${searchQuery}".`
                    : filter === 'all'
                    ? 'New leads for your market will appear here in real time.'
                    : `No leads with status "${filter}".`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    token={token}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>


      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center px-4">
          <div
            className="bg-surface border border-subtle rounded-2xl p-8 max-w-md w-full text-center"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,229,160,0.08)' }}
          >
            <h1 className="font-heading text-3xl font-extrabold tracking-tight mb-2">
              <span className="text-white">Legen</span><span className="text-accent">ly</span>
            </h1>
            <h2 className="font-heading text-xl font-bold text-white mt-4">
              Welcome to Legenly, {user?.name?.split(' ')[0] || 'there'}
            </h2>
            <p className="text-muted text-sm mt-2">You now own exclusive lead rights to</p>
            <p className="text-accent font-heading text-2xl font-bold mt-2">{user?.market}</p>

            <ul className="mt-6 space-y-3 text-left">
              {[
                'Leads flow in automatically from our ad campaigns',
                "You're the only operator in your territory",
                'Call leads within 5 minutes for best results'
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-white">
                  <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={dismissOnboarding}
              className="mt-8 w-full bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-4 rounded-xl transition-colors text-base tracking-wide"
            >
              Let's Go →
            </button>
          </div>
        </div>
      )}

      {/* Toast notification stack */}
      <Notification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
