import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import LeadCard from '../components/LeadCard.jsx';
import StatsRow from '../components/StatsRow.jsx';
import Notification from '../components/Notification.jsx';
import { isThisMonth, parseDate } from '../components/StatsRow.jsx';

const FILTER_OPTIONS = [
  { key: 'all',    label: 'All' },
  { key: 'new',    label: 'New' },
  { key: 'called', label: 'Called' },
  { key: 'closed', label: 'Closed' }
];

// Estimated average job value (midpoint of min/max) for ROI calculation
const JOB_VALUE_AVGS = {
  Garage: 450, Estate: 1150, Appliance: 225, Commercial: 850
};

function fmtMoney(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatReminderTime(dtStr) {
  if (!dtStr) return '';
  return new Date(dtStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardPhone, setOnboardPhone] = useState('');
  const [onboardJobFocus, setOnboardJobFocus] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pushDenied, setPushDenied] = useState(false);
  const [reminders, setReminders] = useState([]);
  const socketRef = useRef(null);

  // ─── Fetch initial leads ─────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get('/api/leads', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setLeads(data))
      .catch(err => console.error('[Dashboard] Failed to load leads:', err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ─── Fetch today's reminders ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    axios
      .get('/api/leads/reminders/today', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setReminders(data))
      .catch(() => {});
  }, [token]);

  const dismissReminder = async (reminderId) => {
    try {
      await axios.delete(`/api/leads/reminders/${reminderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch {}
  };

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
      await axios.post(
        '/api/auth/dismiss-onboarding',
        { phone: onboardPhone || null, jobFocus: onboardJobFocus.length ? onboardJobFocus.join(',') : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {}
    setShowOnboarding(false);
  };

  const toggleJobFocus = (type) => {
    setOnboardJobFocus(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // ─── Socket.io real-time connection ──────────────────────────────────────
  useEffect(() => {
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
      setLeads(prev => [lead, ...prev]);
      setNotifications(prev => [
        ...prev,
        { id: `${lead.id}-${Date.now()}`, lead }
      ]);
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

  // ─── Derived stats ────────────────────────────────────────────────────────
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

  const counts = {
    all:    leads.length,
    new:    leads.filter(l => l.status === 'new').length,
    called: leads.filter(l => l.status === 'called').length,
    closed: leads.filter(l => l.status === 'closed').length
  };

  // Pipeline strip values
  const calledEst = leads
    .filter(l => l.status === 'called')
    .reduce((sum, l) => sum + (JOB_VALUE_AVGS[l.jobType] || 350), 0);

  // ROI tracker
  const closedThisMonth = leads.filter(l => l.status === 'closed' && isThisMonth(l.createdAt));
  const closedRevenue = closedThisMonth.reduce((sum, l) => sum + (JOB_VALUE_AVGS[l.jobType] || 350), 0);
  const roiMultiple = closedRevenue > 0 ? (closedRevenue / 500).toFixed(1) : null;

  const PIPELINE_ITEMS = [
    {
      key: 'new',
      icon: '🟢',
      label: 'New',
      count: counts.new,
      sub: null
    },
    {
      key: 'called',
      icon: '🟡',
      label: 'Called',
      count: counts.called,
      sub: calledEst > 0 ? `Est. ${fmtMoney(calledEst)}` : null
    },
    {
      key: 'closed',
      icon: '✅',
      label: 'Closed',
      count: counts.closed,
      sub: closedRevenue > 0 ? fmtMoney(closedRevenue) + ' captured' : null
    }
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden md:block w-64 flex-shrink-0" />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
                <span className="text-xs text-accent font-medium">Live</span>
              </div>
            </div>

            {/* Stats */}
            {!loading && <StatsRow leads={leads} />}

            {/* ROI tracker strip */}
            {!loading && roiMultiple && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/15 rounded-xl">
                <span className="text-base flex-shrink-0">💰</span>
                <p className="text-sm text-white">
                  Your <span className="text-accent font-semibold">$500/mo</span> subscription has returned an estimated{' '}
                  <span className="text-accent font-semibold">{fmtMoney(closedRevenue)}</span> this month
                  {' '}
                  <span className="text-accent font-bold">({roiMultiple}× ROI)</span>
                </p>
              </div>
            )}

            {/* Pipeline summary strip */}
            {!loading && leads.length > 0 && (
              <div className="mb-6 grid grid-cols-3 rounded-xl overflow-hidden border border-subtle">
                {PIPELINE_ITEMS.map((item, i) => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={[
                      'flex flex-col items-center py-3 px-2 transition-all group',
                      i < 2 ? 'border-r border-subtle' : '',
                      filter === item.key
                        ? 'bg-accent/10'
                        : 'bg-surface hover:bg-white/5'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{item.icon}</span>
                      <span className={`text-sm font-heading font-bold ${filter === item.key ? 'text-accent' : 'text-white'}`}>
                        {item.count}
                      </span>
                      <span className={`text-xs font-medium hidden sm:block ${filter === item.key ? 'text-accent' : 'text-muted'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.sub && (
                      <span className="text-[10px] text-muted group-hover:text-white/60 transition-colors">
                        {item.sub}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Push notification denied banner */}
            {pushDenied && (
              <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-sm text-yellow-300">
                <span className="text-base">🔔</span>
                <span>Enable browser notifications to get alerted about new leads even when this tab is in the background. Check your browser's site settings.</span>
                <button onClick={() => setPushDenied(false)} className="ml-auto text-yellow-300/50 hover:text-yellow-300 flex-shrink-0 transition-colors">✕</button>
              </div>
            )}

            {/* Reminders banner */}
            {reminders.length > 0 && (
              <div className="mb-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-yellow-400/10">
                  <span className="text-sm">📅</span>
                  <span className="text-sm font-semibold text-yellow-300">
                    {reminders.length === 1 ? '1 callback scheduled for today' : `${reminders.length} callbacks scheduled for today`}
                  </span>
                </div>
                <div className="divide-y divide-yellow-400/10">
                  {reminders.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium">{r.leadName}</span>
                        <span className="text-xs text-muted ml-2">{r.leadPhone}</span>
                        {r.note && <span className="text-xs text-muted ml-2">· {r.note}</span>}
                        <div className="text-xs text-yellow-400/70 mt-0.5">{formatReminderTime(r.remindAt)}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.leadPhone && (
                          <a
                            href={`tel:${r.leadPhone}`}
                            className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium"
                          >
                            Call
                          </a>
                        )}
                        <button
                          onClick={() => dismissReminder(r.id)}
                          className="text-muted hover:text-white transition-colors p-1"
                          title="Dismiss reminder"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent spin" />
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

      {/* Onboarding Modal — 2-step */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center px-4">
          <div
            className="bg-surface border border-subtle rounded-2xl p-8 max-w-md w-full"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,229,160,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${onboardingStep >= s ? 'bg-accent' : 'bg-subtle'}`}
                />
              ))}
            </div>

            {onboardingStep === 1 && (
              <div className="text-center">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight mb-2">
                  <span className="text-white">Legen</span><span className="text-accent">ly</span>
                </h1>
                <h2 className="font-heading text-xl font-bold text-white mt-4">
                  Welcome, {user?.name?.split(' ')[0] || 'there'} 👋
                </h2>
                <p className="text-muted text-sm mt-2">You own exclusive lead rights to</p>
                <p className="text-accent font-heading text-2xl font-bold mt-1">{user?.market}</p>
                <ul className="mt-6 space-y-3 text-left">
                  {[
                    ['⚡', 'Leads flow in automatically from our ad campaigns'],
                    ['🔒', "You're the only operator in your territory — no competition"],
                    ['📞', 'Call leads within 5 minutes for the highest close rate'],
                    ['💰', 'Track your pipeline value right from your dashboard'],
                  ].map(([icon, text]) => (
                    <li key={text} className="flex items-start gap-3 text-sm text-white">
                      <span className="flex-shrink-0">{icon}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="mt-8 w-full bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-4 rounded-xl transition-colors text-base tracking-wide"
                >
                  Next →
                </button>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-white mb-1">Quick setup</h2>
                <p className="text-muted text-sm mb-6">Help us personalize your experience</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-2">
                      Best phone # for lead alerts
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 770-555-0100"
                      value={onboardPhone}
                      onChange={e => setOnboardPhone(e.target.value)}
                      className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-2">
                      Job types you focus on (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Garage', 'Estate', 'Appliance', 'Commercial'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleJobFocus(type)}
                          className={[
                            'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left',
                            onboardJobFocus.includes(type)
                              ? 'bg-accent/15 border-accent/40 text-accent'
                              : 'bg-bg border-subtle text-muted hover:border-muted hover:text-white'
                          ].join(' ')}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="px-4 py-3 text-muted hover:text-white border border-subtle rounded-xl text-sm transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={dismissOnboarding}
                    className="flex-1 bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
                  >
                    Go to My Leads →
                  </button>
                </div>
              </div>
            )}
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
