import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import LeadCard from '../components/LeadCard.jsx';
import StatsRow from '../components/StatsRow.jsx';

const TABS = [
  { key: 'leads',          label: 'All Leads',      icon: '📋' },
  { key: 'add-lead',       label: 'Add Lead',        icon: '➕' },
  { key: 'subscribers',    label: 'Subscribers',     icon: '👥' },
  { key: 'add-subscriber', label: 'Add Subscriber',  icon: '👤' },
  { key: 'markets',        label: 'Markets',         icon: '🗺️' },
  { key: 'waitlist',       label: 'Waitlist',        icon: '📬' },
  { key: 'bundle',         label: 'Bundle Leads',    icon: '💼' },
  { key: 'webinar',        label: 'Webinar Signups', icon: '🎓' },
];

const JOB_TYPES = ['Garage', 'Estate', 'Appliance', 'Commercial'];


function MarketsTab({ markets, setMarkets, token, authHeaders, showMsg, inputClass }) {
  const [editingId, setEditingId] = useState(null);
  const [editCities, setEditCities] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', cities: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/admin/markets', addForm, authHeaders);
      setMarkets(prev => [...prev, data]);
      setAddForm({ name: '', cities: '' });
      setShowAddModal(false);
      showMsg('success', `Market "${data.name}" created`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to create market');
    }
  };

  const handleEditSave = async (market) => {
    try {
      const { data } = await axios.put(`/api/admin/markets/${market.id}`, { cities: editCities }, authHeaders);
      setMarkets(prev => prev.map(m => m.id === data.id ? { ...data, subscriberCount: m.subscriberCount } : m));
      setEditingId(null);
      showMsg('success', 'Market updated');
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to update market');
    }
  };

  const handleDelete = async (market) => {
    try {
      await axios.delete(`/api/admin/markets/${market.id}`, authHeaders);
      setMarkets(prev => prev.filter(m => m.id !== market.id));
      setConfirmDelete(null);
      showMsg('success', `Market "${market.name}" deleted`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to delete market');
      setConfirmDelete(null);
    }
  };

  const totalSubs = markets.reduce((sum, m) => sum + (m.subscriberCount || 0), 0);
  const available = markets.filter(m => !m.status || m.status === 'available').length;

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Markets', value: markets.length },
          { label: 'Active Subscribers', value: totalSubs },
          { label: 'Available Markets', value: available }
        ].map(s => (
          <div key={s.label} className="bg-surface border border-subtle rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-heading font-bold text-accent mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-white">Markets</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-dim text-bg font-heading font-bold rounded-xl text-sm transition-colors"
        >
          + Add Market
        </button>
      </div>

      {/* Table */}
      {markets.length === 0 ? (
        <p className="text-muted text-center py-12">No markets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-subtle text-muted">
                <th className="text-left py-3 pr-4 font-medium">Market Name</th>
                <th className="text-left py-3 pr-4 font-medium">Cities</th>
                <th className="text-left py-3 pr-4 font-medium">Subscribers</th>
                <th className="text-left py-3 pr-4 font-medium">Status</th>
                <th className="text-left py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {markets.map(market => (
                <tr key={market.id} className="border-b border-subtle/50">
                  <td className="py-3 pr-4 text-white font-medium">{market.name}</td>
                  <td className="py-3 pr-4">
                    {editingId === market.id ? (
                      <input
                        className="bg-bg border border-accent/40 rounded-lg px-2 py-1 text-white text-xs w-48 focus:outline-none"
                        value={editCities}
                        onChange={e => setEditCities(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave(market); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                      />
                    ) : (
                      <span className="text-muted text-xs">{market.cities}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted">{market.subscriberCount || 0}</td>
                  <td className="py-3 pr-4">
                    {market.status === 'taken' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-medium">Taken</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">Available</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {editingId === market.id ? (
                        <>
                          <button onClick={() => handleEditSave(market)} className="text-xs text-accent hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-muted hover:text-white">Cancel</button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingId(market.id); setEditCities(market.cities); }}
                          className="text-xs text-muted hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(market)}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Market Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface border border-subtle rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-semibold mb-5 text-white">Add New Market</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input
                className={inputClass}
                placeholder="Market Name (e.g. Forsyth County GA) *"
                required
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
              />
              <div>
                <input
                  className={inputClass}
                  placeholder="Cities (comma separated) *"
                  required
                  value={addForm.cities}
                  onChange={e => setAddForm(p => ({ ...p, cities: e.target.value }))}
                />
                <p className="text-xs text-muted mt-1 px-1">e.g. Cumming, Alpharetta, Johns Creek</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3 rounded-xl transition-colors text-sm">
                  Create Market
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-3 text-muted hover:text-white border border-subtle rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-surface border border-subtle rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-heading text-lg font-semibold text-white mb-2">Delete Market?</h3>
            <p className="text-muted text-sm mb-6">Are you sure you want to delete <span className="text-white font-medium">"{confirmDelete.name}"</span>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-colors">
                Delete
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-surface border border-subtle text-muted hover:text-white py-3 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BundleTab({ authHeaders }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/bundle/reservations', authHeaders)
      .then(({ data }) => setReservations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm py-12 text-center">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-xl font-semibold text-white">Bundle Reservations</h3>
          <p className="text-muted text-sm mt-0.5">Operator Accelerator — $997 bundle leads</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-bold">
          {reservations.length} total · ${(reservations.length * 997).toLocaleString()} pipeline
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">💼</div>
          <p className="text-white font-heading font-semibold">No reservations yet</p>
          <p className="text-muted text-sm mt-1">Share <span className="text-accent font-mono">/bundle</span> to start getting leads.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-subtle text-muted">
                {['Name', 'Email', 'Phone', 'City / Territory', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 pr-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-b border-subtle/50 hover:bg-surface/60 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{r.name}</td>
                  <td className="py-3 pr-4 text-muted">{r.email}</td>
                  <td className="py-3 pr-4 text-muted font-mono text-xs">{r.phone}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">{r.city}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 capitalize">{r.status || 'pending'}</span>
                  </td>
                  <td className="py-3 text-muted text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WebinarTab({ authHeaders }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/webinar/registrations', authHeaders)
      .then(({ data }) => setRegistrations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted text-sm py-12 text-center">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading text-xl font-semibold text-white">Webinar Registrations</h3>
          <p className="text-muted text-sm mt-0.5">Free training signups — warm leads for Nick to work</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-bold">
          {registrations.length} registered
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-white font-heading font-semibold">No registrations yet</p>
          <p className="text-muted text-sm mt-1">Share <span className="text-accent font-mono">/webinar</span> to start filling seats.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-subtle text-muted">
                {['Name', 'Email', 'Phone', 'Business', 'Registered'].map(h => (
                  <th key={h} className="text-left py-3 pr-4 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} className="border-b border-subtle/50 hover:bg-surface/60 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{r.name}</td>
                  <td className="py-3 pr-4 text-muted">{r.email}</td>
                  <td className="py-3 pr-4 text-muted font-mono text-xs">{r.phone || '—'}</td>
                  <td className="py-3 pr-4 text-muted text-xs">{r.business || '—'}</td>
                  <td className="py-3 text-muted text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', email: '', city: '', state: '',
    jobType: '', description: '', market: ''
  });
  const [subForm, setSubForm] = useState({
    name: '', email: '', password: '', market: ''
  });
  const [marketForm, setMarketForm] = useState({ name: '', cities: '' });

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [leadsMarketFilter, setLeadsMarketFilter] = useState('');
  const [editSub, setEditSub] = useState(null);
  const [editSubForm, setEditSubForm] = useState({ name: '', email: '', market: '', password: '' });
  const [confirmDeleteSub, setConfirmDeleteSub] = useState(null);
  const [waitlistData, setWaitlistData] = useState({ signups: [], cityStats: [], total: 0 });
  const [waitlistLoaded, setWaitlistLoaded] = useState(false);
  const [waitlistNoteEditing, setWaitlistNoteEditing] = useState(null); // id of row being edited
  const [waitlistNoteVal, setWaitlistNoteVal] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/leads', authHeaders),
      axios.get('/api/admin/subscribers', authHeaders),
      axios.get('/api/admin/markets', authHeaders)
    ])
      .then(([leadsRes, subsRes, marketsRes]) => {
        setLeads(leadsRes.data);
        setSubscribers(subsRes.data);
        setMarkets(marketsRes.data);
      })
      .catch(err => console.error('[Admin] Load error:', err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Load waitlist lazily when tab selected
  useEffect(() => {
    if (activeTab === 'waitlist' && !waitlistLoaded) {
      axios.get('/api/admin/waitlist', authHeaders)
        .then(({ data }) => { setWaitlistData(data); setWaitlistLoaded(true); })
        .catch(() => {});
    }
  }, [activeTab, waitlistLoaded]);

  const showMsg = (type, text) => {
    setFormMsg({ type, text });
    setTimeout(() => setFormMsg({ type: '', text: '' }), 4000);
  };

  // ─── Create lead ──────────────────────────────────────────────────────────
  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/admin/leads', leadForm, authHeaders);
      setLeads(prev => [data, ...prev]);
      setLeadForm({ name: '', phone: '', email: '', city: '', state: '', jobType: '', description: '', market: '' });
      showMsg('success', `Lead created for ${data.name}`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to create lead');
    }
  };

  // ─── Create subscriber ────────────────────────────────────────────────────
  const handleCreateSubscriber = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/admin/subscribers', subForm, authHeaders);
      setSubscribers(prev => [...prev, data]);
      setSubForm({ name: '', email: '', password: '', market: '' });
      showMsg('success', `Subscriber ${data.email} created`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to create subscriber');
    }
  };

  // ─── Create market ────────────────────────────────────────────────────────
  const handleCreateMarket = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/admin/markets', marketForm, authHeaders);
      setMarkets(prev => [...prev, data]);
      setMarketForm({ name: '', cities: '' });
      showMsg('success', `Market "${data.name}" created`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to create market');
    }
  };

  const handleEditSubSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: editSubForm.name, email: editSubForm.email, market: editSubForm.market };
      if (editSubForm.password) payload.password = editSubForm.password;
      const { data } = await axios.put(`/api/admin/subscribers/${editSub.id}`, payload, authHeaders);
      setSubscribers(prev => prev.map(s => s.id === data.id ? { ...s, ...data } : s));
      setEditSub(null);
      showMsg('success', `Updated ${data.email}`);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to update subscriber');
    }
  };

  const handleDeleteSub = async () => {
    try {
      await axios.delete(`/api/admin/subscribers/${confirmDeleteSub.id}`, authHeaders);
      setSubscribers(prev => prev.filter(s => s.id !== confirmDeleteSub.id));
      setConfirmDeleteSub(null);
      showMsg('success', 'Subscriber deleted');
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to delete subscriber');
      setConfirmDeleteSub(null);
    }
  };

  const handleLeadStatusChange = (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const handleWaitlistStatusChange = async (id, status) => {
    try {
      await axios.patch(`/api/admin/waitlist/${id}`, { status }, authHeaders);
      setWaitlistData(prev => ({
        ...prev,
        signups: prev.signups.map(s => s.id === id ? { ...s, status } : s)
      }));
    } catch { /* silent */ }
  };

  const handleWaitlistNoteSave = async (id) => {
    try {
      await axios.patch(`/api/admin/waitlist/${id}`, { notes: waitlistNoteVal }, authHeaders);
      setWaitlistData(prev => ({
        ...prev,
        signups: prev.signups.map(s => s.id === id ? { ...s, notes: waitlistNoteVal } : s)
      }));
      setWaitlistNoteEditing(null);
    } catch { /* silent */ }
  };

  const handleWaitlistDelete = async (id) => {
    if (!window.confirm('Remove this person from the waitlist?')) return;
    try {
      await axios.delete(`/api/admin/waitlist/${id}`, authHeaders);
      setWaitlistData(prev => ({
        ...prev,
        signups: prev.signups.filter(s => s.id !== id),
        total: prev.total - 1
      }));
    } catch { /* silent */ }
  };

  const handleConvertToSubscriber = (signup) => {
    // Pre-fill the Add Subscriber form with their waitlist data
    setSubForm({
      name: signup.name || '',
      email: signup.email || '',
      password: '',
      market: ''
    });
    setActiveTab('subscribers');
    showMsg('success', `Pre-filled from ${signup.name}'s waitlist entry — set a password and market to finish.`);
  };

  const inputClass = "w-full bg-bg border border-subtle rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors";
  const selectClass = `${inputClass} appearance-none`;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop spacer */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 md:py-8">
          <div className="max-w-5xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">Admin Panel</h2>
              <p className="text-muted text-sm mt-1">Manage leads, subscribers, and markets</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {TABS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setFormMsg({ type: '', text: '' }); }}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all font-medium',
                    activeTab === key
                      ? 'bg-accent text-bg font-semibold'
                      : 'bg-surface border border-subtle text-muted hover:text-white'
                  ].join(' ')}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Form feedback */}
            {formMsg.text && (
              <div className={[
                'mb-6 px-4 py-3 rounded-xl border text-sm',
                formMsg.type === 'success'
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-red-950/40 border-red-500/30 text-red-400'
              ].join(' ')}>
                {formMsg.text}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent spin" />
              </div>
            ) : (
              <>
                {/* ── ALL LEADS ── */}
                {activeTab === 'leads' && (() => {
                  const displayedLeads = leadsMarketFilter
                    ? leads.filter(l => l.market === leadsMarketFilter)
                    : leads;
                  const marketOptions = [...new Set(leads.map(l => l.market).filter(Boolean))].sort();
                  return (
                    <>
                      <StatsRow leads={displayedLeads} />

                      {/* Market filter */}
                      {marketOptions.length > 1 && (
                        <div className="flex items-center gap-3 mb-6">
                          <label className="text-xs text-muted uppercase tracking-wide font-medium">Market:</label>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setLeadsMarketFilter('')}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!leadsMarketFilter ? 'bg-accent text-bg' : 'bg-surface border border-subtle text-muted hover:text-white'}`}
                            >
                              All ({leads.length})
                            </button>
                            {marketOptions.map(m => (
                              <button
                                key={m}
                                onClick={() => setLeadsMarketFilter(m)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${leadsMarketFilter === m ? 'bg-accent text-bg' : 'bg-surface border border-subtle text-muted hover:text-white'}`}
                              >
                                {m} ({leads.filter(l => l.market === m).length})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {displayedLeads.length === 0 ? (
                        <p className="text-muted text-center py-12">No leads yet. Add one using the "Add Lead" tab.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {displayedLeads.map(lead => (
                            <div key={lead.id}>
                              <span className="text-xs text-muted px-1 mb-1 block">
                                Market: <span className="text-accent">{lead.market}</span>
                              </span>
                              <LeadCard
                                lead={lead}
                                token={token}
                                onStatusChange={handleLeadStatusChange}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── ADD LEAD ── */}
                {activeTab === 'add-lead' && (
                  <div className="max-w-xl">
                    <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8">
                      <h3 className="font-heading text-xl font-semibold mb-6 text-white">Create New Lead</h3>
                      <form onSubmit={handleCreateLead} className="space-y-4">
                        <input
                          className={inputClass}
                          placeholder="Full Name *"
                          required
                          value={leadForm.name}
                          onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className={inputClass}
                            placeholder="Phone"
                            value={leadForm.phone}
                            onChange={e => setLeadForm(p => ({ ...p, phone: e.target.value }))}
                          />
                          <input
                            className={inputClass}
                            placeholder="Email"
                            type="email"
                            value={leadForm.email}
                            onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            className={inputClass}
                            placeholder="City"
                            value={leadForm.city}
                            onChange={e => setLeadForm(p => ({ ...p, city: e.target.value }))}
                          />
                          <input
                            className={inputClass}
                            placeholder="State (e.g. GA)"
                            value={leadForm.state}
                            onChange={e => setLeadForm(p => ({ ...p, state: e.target.value }))}
                          />
                        </div>
                        <select
                          className={selectClass}
                          value={leadForm.jobType}
                          onChange={e => setLeadForm(p => ({ ...p, jobType: e.target.value }))}
                        >
                          <option value="">Job Type</option>
                          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          className={selectClass}
                          required
                          value={leadForm.market}
                          onChange={e => setLeadForm(p => ({ ...p, market: e.target.value }))}
                        >
                          <option value="">Assign to Market *</option>
                          {markets.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <textarea
                          className={`${inputClass} h-24 resize-none`}
                          placeholder="Job description..."
                          value={leadForm.description}
                          onChange={e => setLeadForm(p => ({ ...p, description: e.target.value }))}
                        />
                        <button
                          type="submit"
                          className="w-full bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wide"
                        >
                          Create Lead →
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── SUBSCRIBERS ── */}
                {activeTab === 'subscribers' && (
                  <div className="overflow-x-auto">
                    {subscribers.length === 0 ? (
                      <p className="text-muted text-center py-12">No subscribers yet.</p>
                    ) : (
                      <table className="w-full text-sm min-w-[640px]">
                        <thead>
                          <tr className="border-b border-subtle text-muted">
                            <th className="text-left py-3 pr-4 font-medium">Name</th>
                            <th className="text-left py-3 pr-4 font-medium">Email</th>
                            <th className="text-left py-3 pr-4 font-medium">Market</th>
                            <th className="text-left py-3 pr-4 font-medium">Joined</th>
                            <th className="text-left py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subscribers.map(sub => (
                            <tr key={sub.id} className="border-b border-subtle/50 hover:bg-surface/60 transition-colors">
                              <td className="py-3 pr-4 text-white font-medium">{sub.name || '—'}</td>
                              <td className="py-3 pr-4 text-muted">{sub.email}</td>
                              <td className="py-3 pr-4">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                                  {sub.market || 'Unassigned'}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-muted">
                                {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => { setEditSub(sub); setEditSubForm({ name: sub.name || '', email: sub.email, market: sub.market || '', password: '' }); }}
                                    className="text-xs text-muted hover:text-white transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteSub(sub)}
                                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* ── ADD SUBSCRIBER ── */}
                {activeTab === 'add-subscriber' && (
                  <div className="max-w-xl">
                    <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8">
                      <h3 className="font-heading text-xl font-semibold mb-6 text-white">Add Subscriber</h3>
                      <form onSubmit={handleCreateSubscriber} className="space-y-4">
                        <input
                          className={inputClass}
                          placeholder="Full Name"
                          value={subForm.name}
                          onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))}
                        />
                        <input
                          className={inputClass}
                          placeholder="Email *"
                          type="email"
                          required
                          value={subForm.email}
                          onChange={e => setSubForm(p => ({ ...p, email: e.target.value }))}
                        />
                        <input
                          className={inputClass}
                          placeholder="Password *"
                          type="password"
                          required
                          value={subForm.password}
                          onChange={e => setSubForm(p => ({ ...p, password: e.target.value }))}
                        />
                        <select
                          className={selectClass}
                          value={subForm.market}
                          onChange={e => setSubForm(p => ({ ...p, market: e.target.value }))}
                        >
                          <option value="">Assign to Market (optional)</option>
                          {markets.filter(m => !m.status || m.status === 'available').map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                        </select>
                        <button
                          type="submit"
                          className="w-full bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3.5 rounded-xl transition-colors text-sm tracking-wide"
                        >
                          Add Subscriber →
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ── MARKETS ── */}
                {activeTab === 'markets' && (
                  <MarketsTab
                    markets={markets}
                    setMarkets={setMarkets}
                    token={token}
                    authHeaders={authHeaders}
                    showMsg={showMsg}
                    inputClass={inputClass}
                  />
                )}

                {/* ── WAITLIST ── */}
                {activeTab === 'waitlist' && (
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-white">Waitlist Signups</h3>
                        <p className="text-muted text-sm mt-0.5">
                          {waitlistData.total} total · use this to identify hotspot markets before launch
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const cols = ['Name','Email','Phone','City','Monthly Revenue','Lead Sources','Lead Spend','Status','Notes','Signed Up'];
                          const rows = waitlistData.signups.map(s => [
                            s.name, s.email, s.phone||'', s.city,
                            s.monthlyRevenue||'', s.leadSources||'', s.monthlyLeadSpend||'',
                            s.status||'new', s.notes||'', s.createdAt||''
                          ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
                          const blob = new Blob([[cols.join(','),...rows].join('\n')], { type: 'text/csv' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob); a.download = 'legenly-waitlist.csv'; a.click();
                        }}
                        disabled={waitlistData.signups.length === 0}
                        className="px-4 py-2 text-sm bg-surface border border-subtle rounded-xl text-muted hover:text-white hover:border-muted transition-colors font-medium disabled:opacity-40"
                      >
                        ↓ Export CSV
                      </button>
                    </div>

                    {/* City hotspot leaderboard */}
                    {waitlistData.cityStats.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-xs text-muted uppercase tracking-wide font-medium mb-3">Hotspot Cities (by signup count)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {waitlistData.cityStats.slice(0, 12).map((c, i) => (
                            <div
                              key={c.city}
                              className={`bg-surface border rounded-xl p-4 ${i === 0 ? 'border-accent/40' : 'border-subtle'}`}
                              style={i === 0 ? { boxShadow: '0 0 20px rgba(0,229,160,0.08)' } : {}}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-white text-sm font-medium leading-tight">{c.city}</p>
                                {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-medium flex-shrink-0">#1</span>}
                              </div>
                              <p className="text-2xl font-heading font-bold text-accent mt-1">{c.count}</p>
                              <p className="text-[10px] text-muted">{c.count === 1 ? 'operator' : 'operators'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full signup list */}
                    {waitlistData.signups.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-4xl mb-3">📬</div>
                        <p className="text-white font-heading font-semibold">No signups yet</p>
                        <p className="text-muted text-sm mt-1">
                          Share <span className="text-accent font-mono">/waitlist</span> with operators to start building your list.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {waitlistData.signups.map(s => {
                          const statusColors = {
                            new:       'bg-blue-500/10 border-blue-500/30 text-blue-400',
                            contacted: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                            committed: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                            converted: 'bg-accent/10 border-accent/30 text-accent',
                            passed:    'bg-surface border-subtle text-muted',
                          };
                          const statusLabel = {
                            new: 'New', contacted: 'Contacted', committed: 'Committed',
                            converted: 'Converted', passed: 'Passed'
                          };
                          const st = s.status || 'new';
                          return (
                            <div
                              key={s.id}
                              className={`bg-surface border rounded-xl p-4 transition-colors ${st === 'converted' ? 'border-accent/30' : 'border-subtle'}`}
                            >
                              {/* Top row */}
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="min-w-0">
                                    <p className="text-white font-medium text-sm">{s.name}</p>
                                    <p className="text-muted text-xs">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Status dropdown */}
                                  <select
                                    value={st}
                                    onChange={e => handleWaitlistStatusChange(s.id, e.target.value)}
                                    className={`text-xs px-2 py-1 rounded-full border bg-transparent font-medium cursor-pointer focus:outline-none ${statusColors[st]}`}
                                  >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="committed">Committed</option>
                                    <option value="converted">Converted</option>
                                    <option value="passed">Passed</option>
                                  </select>

                                  {/* Convert button — only for non-converted */}
                                  {st !== 'converted' && st !== 'passed' && (
                                    <button
                                      onClick={() => handleConvertToSubscriber(s)}
                                      className="text-xs px-3 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors font-medium"
                                    >
                                      + Convert
                                    </button>
                                  )}

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleWaitlistDelete(s.id)}
                                    className="text-xs px-2 py-1 rounded-lg text-muted hover:text-red-400 transition-colors"
                                    title="Remove from waitlist"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>

                              {/* Detail row */}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">{s.city}</span>
                                {s.monthlyRevenue && <span>Rev: {s.monthlyRevenue}</span>}
                                {s.monthlyLeadSpend && <span>Lead spend: {s.monthlyLeadSpend}</span>}
                                {s.leadSources && <span>Via: {s.leadSources}</span>}
                                <span>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</span>
                              </div>

                              {/* Notes row */}
                              <div className="mt-2">
                                {waitlistNoteEditing === s.id ? (
                                  <div className="flex gap-2 items-center">
                                    <input
                                      autoFocus
                                      value={waitlistNoteVal}
                                      onChange={e => setWaitlistNoteVal(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleWaitlistNoteSave(s.id); if (e.key === 'Escape') setWaitlistNoteEditing(null); }}
                                      placeholder="Add a note…"
                                      className="flex-1 bg-bg border border-subtle rounded-lg px-3 py-1.5 text-white text-xs placeholder-muted focus:outline-none focus:border-accent"
                                    />
                                    <button onClick={() => handleWaitlistNoteSave(s.id)} className="text-xs text-accent hover:text-white transition-colors font-medium">Save</button>
                                    <button onClick={() => setWaitlistNoteEditing(null)} className="text-xs text-muted hover:text-white transition-colors">Cancel</button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setWaitlistNoteEditing(s.id); setWaitlistNoteVal(s.notes || ''); }}
                                    className="text-xs text-muted hover:text-white transition-colors text-left"
                                  >
                                    {s.notes ? <span className="text-white/70">{s.notes}</span> : <span className="italic">+ add note</span>}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── BUNDLE LEADS ── */}
                {activeTab === 'bundle' && (
                  <BundleTab token={token} authHeaders={authHeaders} />
                )}

                {/* ── WEBINAR SIGNUPS ── */}
                {activeTab === 'webinar' && (
                  <WebinarTab token={token} authHeaders={authHeaders} />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Edit Subscriber Modal */}
      {editSub && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setEditSub(null)}>
          <div className="bg-surface border border-subtle rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-semibold mb-5 text-white">Edit Subscriber</h3>
            <form onSubmit={handleEditSubSave} className="space-y-4">
              <input
                className={inputClass}
                placeholder="Full Name"
                value={editSubForm.name}
                onChange={e => setEditSubForm(p => ({ ...p, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Email *"
                type="email"
                required
                value={editSubForm.email}
                onChange={e => setEditSubForm(p => ({ ...p, email: e.target.value }))}
              />
              <select
                className={`${inputClass} appearance-none`}
                value={editSubForm.market}
                onChange={e => setEditSubForm(p => ({ ...p, market: e.target.value }))}
              >
                <option value="">No Market</option>
                {markets.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <input
                className={inputClass}
                placeholder="New Password (leave blank to keep current)"
                type="password"
                value={editSubForm.password}
                onChange={e => setEditSubForm(p => ({ ...p, password: e.target.value }))}
              />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3 rounded-xl transition-colors text-sm">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditSub(null)} className="px-4 py-3 text-muted hover:text-white border border-subtle rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subscriber Confirmation */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-surface border border-subtle rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-heading text-lg font-semibold text-white mb-2">Delete Subscriber?</h3>
            <p className="text-muted text-sm mb-6">
              Remove <span className="text-white font-medium">{confirmDeleteSub.email}</span> and release their market? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDeleteSub} className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-colors">
                Delete
              </button>
              <button onClick={() => setConfirmDeleteSub(null)} className="flex-1 bg-surface border border-subtle text-muted hover:text-white py-3 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
