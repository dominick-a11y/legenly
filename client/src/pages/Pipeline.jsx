import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';

const STAGES = [
  { key: 'new',       label: 'New',        color: '#6b6b80', bg: 'rgba(107,107,128,0.12)', border: 'rgba(107,107,128,0.25)' },
  { key: 'contacted', label: 'Contacted',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)' },
  { key: 'called',    label: 'On Call',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)' },
  { key: 'closed',    label: 'Closed',     color: '#00e5a0', bg: 'rgba(0,229,160,0.1)',    border: 'rgba(0,229,160,0.25)' },
  { key: 'lost',      label: 'Lost',       color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
];

const SOURCES = ['Instagram DM', 'Facebook', 'Cold Email', 'Referral', 'Webinar', 'TikTok', 'Other'];

function StageBadge({ stage }) {
  const s = STAGES.find(x => x.key === stage) || STAGES[0];
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function AddContactModal({ onClose, onAdd, token }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'Instagram DM',
    stage: 'new', notes: '', followUpAt: '', dealValue: '997',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputClass =
    'w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm ' +
    'placeholder-muted focus:outline-none focus:border-accent transition-all duration-200';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await axios.post('/api/pipeline/contacts', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onAdd(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8 relative overflow-hidden"
        style={{ background: '#111118', border: '1px solid #1e1e2a', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold text-white">Add Contact</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Name *</label>
              <input className={inputClass} placeholder="John Smith" required
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Phone</label>
              <input className={inputClass} placeholder="770-555-0100" type="tel"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Email</label>
            <input className={inputClass} placeholder="john@company.com" type="email"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Source</label>
              <select className={`${inputClass} appearance-none cursor-pointer`}
                value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Stage</label>
              <select className={`${inputClass} appearance-none cursor-pointer`}
                value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Deal value ($)</label>
              <input className={inputClass} placeholder="997" type="number"
                value={form.dealValue} onChange={e => setForm(p => ({ ...p, dealValue: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Follow-up date</label>
              <input className={inputClass} type="datetime-local"
                value={form.followUpAt} onChange={e => setForm(p => ({ ...p, followUpAt: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Notes</label>
            <textarea
              className={`${inputClass} resize-none`} rows={3} placeholder="Call notes, objections, next step…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-subtle text-muted hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-accent hover:bg-accent-dim text-bg font-heading font-bold rounded-xl text-sm transition-all disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Contact →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactRow({ contact, token, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(contact.notes || '');
  const [stage, setStage] = useState(contact.stage);
  const [followUp, setFollowUp] = useState(contact.followUpAt || '');
  const [saving, setSaving] = useState(false);

  const save = async (fields) => {
    setSaving(true);
    try {
      const { data } = await axios.patch(`/api/pipeline/contacts/${contact.id}`, fields, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate(data);
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = (val) => {
    setStage(val);
    save({ stage: val });
  };

  const isOverdue = contact.followUpAt && new Date(contact.followUpAt) < new Date() && stage !== 'closed' && stage !== 'lost';

  return (
    <>
      <tr
        className="border-b border-subtle/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3.5 px-4">
          <div>
            <p className="text-white text-sm font-medium">{contact.name}</p>
            {contact.email && <p className="text-muted text-xs mt-0.5">{contact.email}</p>}
          </div>
        </td>
        <td className="py-3.5 px-4">
          <p className="text-white text-sm font-mono">{contact.phone || '—'}</p>
        </td>
        <td className="py-3.5 px-4">
          <span className="text-muted text-xs">{contact.source}</span>
        </td>
        <td className="py-3.5 px-4">
          <StageBadge stage={stage} />
        </td>
        <td className="py-3.5 px-4">
          <p className="text-accent text-sm font-semibold font-mono">
            ${Number(contact.dealValue || 997).toLocaleString()}
          </p>
        </td>
        <td className="py-3.5 px-4">
          {contact.followUpAt ? (
            <p className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-muted'}`}>
              {isOverdue ? '⚠ ' : ''}{new Date(contact.followUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
          ) : (
            <p className="text-muted text-xs">—</p>
          )}
        </td>
        <td className="py-3.5 px-4">
          <p className="text-muted text-xs">{new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </td>
        <td className="py-3.5 px-4">
          <span className="text-muted text-xs">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-subtle/50">
          <td colSpan={8} className="px-4 pb-5 pt-2">
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: '#0a0a0f', border: '1px solid #1e1e2a' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Update Stage</label>
                  <select
                    className="w-full bg-bg border border-subtle rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                    value={stage}
                    onChange={e => handleStageChange(e.target.value)}
                  >
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Follow-up Date</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-bg border border-subtle rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-all"
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                    onBlur={() => save({ followUpAt: followUp })}
                  />
                </div>
                <div className="flex items-end">
                  <a
                    href={`tel:${contact.phone}`}
                    className="w-full py-2.5 text-center rounded-xl border border-accent/30 text-accent text-sm font-semibold hover:bg-accent/10 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    Call {contact.phone || 'now'} →
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Call Notes</label>
                <textarea
                  className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-all resize-none"
                  rows={3}
                  placeholder="What happened on the call? Objections? Next step?"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onBlur={() => save({ notes: note })}
                />
              </div>

              {saving && <p className="text-muted text-xs">Saving…</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Pipeline() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    axios.get('/api/pipeline/contacts', authHeaders)
      .then(({ data }) => setContacts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateContact = (updated) =>
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));

  const addContact = (contact) =>
    setContacts(prev => [contact, ...prev]);

  const filtered = contacts
    .filter(c => filter === 'all' || c.stage === filter)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) ||
             c.email?.toLowerCase().includes(q) ||
             c.phone?.includes(q);
    });

  // Stats
  const now = new Date();
  const thisMonth = contacts.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const closedContacts = contacts.filter(c => c.stage === 'closed');
  const openPipelineValue = contacts
    .filter(c => !['closed', 'lost'].includes(c.stage))
    .reduce((sum, c) => sum + Number(c.dealValue || 997), 0);
  const overdueFollowUps = contacts.filter(c =>
    c.followUpAt && new Date(c.followUpAt) < now && !['closed', 'lost'].includes(c.stage)
  );

  const stats = [
    { label: 'Total Contacts', value: contacts.length, accent: false },
    { label: 'Closed', value: closedContacts.length, accent: true },
    { label: 'Open Pipeline', value: `$${openPipelineValue.toLocaleString()}`, accent: true },
    { label: 'Overdue Follow-ups', value: overdueFollowUps.length, accent: overdueFollowUps.length > 0 },
  ];

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Sales Pipeline</h1>
              <p className="text-muted text-sm mt-0.5">Dumpire Academy coaching prospects</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dim text-bg font-heading font-bold rounded-xl text-sm transition-all"
              style={{ boxShadow: '0 0 20px rgba(0,229,160,0.2)' }}
            >
              + Add Contact
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, accent }) => (
              <div
                key={label}
                className="rounded-xl p-5"
                style={{ background: '#111118', border: '1px solid #1e1e2a' }}
              >
                <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-2xl font-heading font-bold ${accent ? 'text-accent' : 'text-white'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface border border-subtle rounded-xl px-4 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-all w-64"
            />
            <div className="flex flex-wrap gap-2">
              {[{ key: 'all', label: 'All' }, ...STAGES].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={[
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    filter === key
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-surface border-subtle text-muted hover:border-white/20 hover:text-white',
                  ].join(' ')}
                >
                  {label}
                  {key !== 'all' && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      {contacts.filter(c => c.stage === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #1e1e2a', background: '#111118' }}
          >
            {loading ? (
              <div className="py-20 text-center text-muted text-sm">Loading pipeline…</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-muted text-sm mb-4">No contacts yet.</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-5 py-2.5 bg-accent text-bg font-heading font-bold rounded-xl text-sm hover:bg-accent-dim transition-all"
                >
                  Add your first contact →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-subtle">
                      {['Contact', 'Phone', 'Source', 'Stage', 'Value', 'Follow-up', 'Added', ''].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-xs text-muted uppercase tracking-wide font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(contact => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        token={token}
                        onUpdate={updateContact}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overdue reminders */}
          {overdueFollowUps.length > 0 && (
            <div
              className="mt-6 rounded-xl p-5"
              style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <p className="text-red-400 font-semibold text-sm mb-3">
                ⚠ {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {overdueFollowUps.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-white">{c.name}</span>
                    <span className="text-red-400/70 text-xs">
                      was due {new Date(c.followUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddContactModal
          token={token}
          onClose={() => setShowAdd(false)}
          onAdd={addContact}
        />
      )}
    </div>
  );
}
