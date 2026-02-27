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
  const socketRef = useRef(null);

  // ─── Fetch initial leads ─────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get('/api/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setLeads(data))
      .catch(err => console.error('[Dashboard] Failed to load leads:', err.message))
      .finally(() => setLoading(false));
  }, [token]);

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

    socket.on('new-lead', (lead) => {
      console.log('[Socket] New lead received:', lead.name);
      // Prepend new lead to the feed
      setLeads(prev => [lead, ...prev]);
      // Add toast notification with a unique id
      setNotifications(prev => [
        ...prev,
        { id: `${lead.id}-${Date.now()}`, lead }
      ]);
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
  const filteredLeads = filter === 'all'
    ? leads
    : leads.filter(l => l.status === filter);

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
            {!loading && <StatsRow leads={leads} />}

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
                  {filter === 'all'
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

      {/* Toast notification stack */}
      <Notification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
