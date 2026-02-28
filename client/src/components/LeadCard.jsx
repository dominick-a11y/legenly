import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { timeAgo } from './StatsRow.jsx';

// SQLite stores "YYYY-MM-DD HH:MM:SS" without timezone — treat as UTC
function parseLeadDate(ds) {
  if (!ds) return new Date();
  if (typeof ds === 'string' && !ds.includes('T') && !ds.includes('Z')) {
    return new Date(ds.replace(' ', 'T') + 'Z');
  }
  return new Date(ds);
}

function useCallTimer(createdAt, status) {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - parseLeadDate(createdAt).getTime());

  useEffect(() => {
    if (status !== 'new') return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - parseLeadDate(createdAt).getTime());
    }, 10000);
    return () => clearInterval(id);
  }, [createdAt, status]);

  return elapsedMs;
}

function CallTimerBadge({ createdAt, status }) {
  const elapsedMs = useCallTimer(createdAt, status);
  if (status !== 'new') return null;

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);

  if (elapsedMin < 5) {
    const remaining = 300 - elapsedSec;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border bg-accent/10 border-accent/30 text-accent font-mono font-medium animate-pulse">
        Call in {mins}:{String(secs).padStart(2, '0')}
      </span>
    );
  }
  if (elapsedMin < 60) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/15 border-red-500/40 text-red-400 font-medium">
        ⚠ {elapsedMin}m old — Call Now
      </span>
    );
  }
  const hrs = Math.floor(elapsedMin / 60);
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-muted font-medium">
      {hrs}h old
    </span>
  );
}

const JOB_VALUES = {
  Garage:     { min: 300,  max: 600  },
  Estate:     { min: 800,  max: 1500 },
  Appliance:  { min: 150,  max: 300  },
  Commercial: { min: 500,  max: 1200 },
};

const CALL_SCRIPTS = {
  Garage: `Hi [firstName], I'm calling about your garage cleanout request — I have a crew available this week. Could I swing by Wednesday or Thursday to take a quick look and give you a free quote?`,
  Estate: `Hi [firstName], I'm calling about your estate cleanout request. We handle these with complete care and discretion. Would a same-day or next-day walkthrough work for you?`,
  Appliance: `Hi [firstName], I'm calling about your appliance removal. We can usually pick those up within 24 hours — does tomorrow morning or afternoon work better for you?`,
  Commercial: `Hi [firstName], I'm calling about your commercial cleanout. We work around business hours and can handle any volume. When would be a good time for us to take a look?`,
};

const JOB_TYPE_COLORS = {
  Garage:     { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400' },
  Estate:     { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  Appliance:  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  Commercial: { bg: 'bg-teal-500/10',   border: 'border-teal-500/30',   text: 'text-teal-400' }
};

const STATUS_CONFIG = {
  new:    { label: 'New',    borderClass: 'border-l-accent',       bg: 'bg-accent/10',     border: 'border-accent/30',     text: 'text-accent' },
  called: { label: 'Called', borderClass: 'border-l-yellow-400',   bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-400' },
  closed: { label: 'Closed', borderClass: 'border-l-blue-400',     bg: 'bg-white/5',       border: 'border-white/10',      text: 'text-muted' }
};

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function defaultReminderDT() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
}

function formatReminderDate(dtStr) {
  if (!dtStr) return '';
  return new Date(dtStr).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export default function LeadCard({ lead, token, onStatusChange }) {
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const jobTypeCfg = JOB_TYPE_COLORS[lead.jobType] || {
    bg: 'bg-white/5', border: 'border-white/10', text: 'text-muted'
  };

  const [copyMsg, setCopyMsg] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const noteLoaded = useRef(false);

  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState(defaultReminderDT);
  const [reminderNote, setReminderNote] = useState('');
  const [reminderSavedAt, setReminderSavedAt] = useState('');
  const [reminderSaving, setReminderSaving] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPitch, setAiPitch] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Load existing note on first expand
  useEffect(() => {
    if (noteOpen && !noteLoaded.current) {
      noteLoaded.current = true;
      axios.get(`/api/leads/${lead.id}/note`, { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => setNoteText(data.note || ''))
        .catch(() => {});
    }
  }, [noteOpen, lead.id, token]);

  const updateStatus = async (newStatus) => {
    try {
      await axios.put(
        `/api/leads/${lead.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onStatusChange(lead.id, newStatus);
    } catch (err) {
      console.error('[LeadCard] Failed to update status:', err.message);
    }
  };

  const handleCallClick = () => {
    if (isMobile()) {
      window.location.href = `tel:${lead.phone}`;
    } else {
      navigator.clipboard.writeText(lead.phone).then(() => {
        setCopyMsg('Copied!');
        setTimeout(() => setCopyMsg(''), 2000);
      });
    }
  };

  const saveNote = async () => {
    try {
      await axios.put(
        `/api/leads/${lead.id}/note`,
        { note: noteText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    } catch (err) {
      console.error('[LeadCard] Failed to save note:', err.message);
    }
  };

  const copyScript = () => {
    const firstName = lead.name?.split(' ')[0] || lead.name || 'there';
    const script = (CALL_SCRIPTS[lead.jobType] || '').replace(/\[firstName\]/g, firstName);
    navigator.clipboard.writeText(script).then(() => {
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
    });
  };

  const saveReminder = async () => {
    if (!reminderDateTime) return;
    setReminderSaving(true);
    try {
      await axios.post(
        `/api/leads/${lead.id}/reminder`,
        { remindAt: reminderDateTime, note: reminderNote || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReminderSavedAt(reminderDateTime);
      setReminderOpen(false);
    } catch (err) {
      console.error('[LeadCard] Failed to save reminder:', err.message);
    } finally {
      setReminderSaving(false);
    }
  };

  const firstName = lead.name?.split(' ')[0] || lead.name || 'there';
  const script = lead.jobType && CALL_SCRIPTS[lead.jobType]
    ? CALL_SCRIPTS[lead.jobType].replace(/\[firstName\]/g, firstName)
    : null;

  const fetchAiPitch = async () => {
    if (aiPitch) { setAiOpen(o => !o); return; }
    setAiOpen(true);
    setAiLoading(true);
    setAiError('');
    try {
      const { data } = await axios.post(
        `/api/leads/${lead.id}/ai-pitch`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiPitch(data);
    } catch (err) {
      setAiError(err.response?.data?.error || 'AI assist failed. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const nowLocal = (() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div
      className={[
        'bg-surface rounded-xl p-5 border-l-4 border border-subtle transition-all',
        statusCfg.borderClass
      ].join(' ')}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-white text-base">{lead.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
            {lead.jobType && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${jobTypeCfg.bg} ${jobTypeCfg.border} ${jobTypeCfg.text}`}>
                {lead.jobType}
              </span>
            )}
            <CallTimerBadge createdAt={lead.createdAt} status={lead.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
            {lead.city && <span>📍 {lead.city}{lead.state ? `, ${lead.state}` : ''}</span>}
            {lead.createdAt && <span>· {timeAgo(lead.createdAt)}</span>}
          </div>
        </div>

        {/* Contact info */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
          {lead.phone && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-accent">{lead.phone}</span>
              <button
                onClick={handleCallClick}
                title={isMobile() ? `Call ${lead.phone}` : `Copy ${lead.phone}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors relative"
              >
                {copyMsg && (
                  <span className="text-[9px] font-bold absolute -top-6 left-1/2 -translate-x-1/2 bg-surface border border-subtle text-accent px-1.5 py-0.5 rounded whitespace-nowrap">
                    {copyMsg}
                  </span>
                )}
                <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </button>
            </div>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="text-xs text-muted hover:text-white truncate max-w-[180px] block"
            >
              {lead.email}
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {lead.description && (
        <p className="text-sm text-muted mt-3 leading-relaxed line-clamp-2">{lead.description}</p>
      )}

      {/* Estimated job value */}
      {lead.jobType && JOB_VALUES[lead.jobType] && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs text-muted">Est. value:</span>
          <span className="text-xs font-semibold text-accent font-mono">
            ${JOB_VALUES[lead.jobType].min.toLocaleString()}–${JOB_VALUES[lead.jobType].max.toLocaleString()}
          </span>
        </div>
      )}

      {/* Call script (collapsible) */}
      {script && scriptOpen && (
        <div className="mt-3 border border-accent/20 rounded-xl bg-accent/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">📞 Call Script</span>
            <button
              onClick={copyScript}
              className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
            >
              {scriptCopied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-white leading-relaxed">{script}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {lead.status === 'new' && (
          <button
            onClick={() => updateStatus('called')}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors font-medium"
          >
            Call Now
          </button>
        )}
        {lead.status === 'called' && (
          <button
            onClick={() => updateStatus('closed')}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 transition-colors font-medium"
          >
            Mark as Closed
          </button>
        )}
        {lead.status === 'closed' && (
          <span className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400 font-medium flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Closed
          </span>
        )}

        {/* Script toggle — show for new/called leads */}
        {script && lead.status !== 'closed' && (
          <button
            onClick={() => setScriptOpen(o => !o)}
            className={[
              'text-xs px-3.5 py-1.5 rounded-lg border transition-colors',
              scriptOpen
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-white/5 border-white/10 text-muted hover:text-white hover:bg-white/10'
            ].join(' ')}
          >
            📞 Script
          </button>
        )}

        {/* Schedule Callback — show for called leads */}
        {lead.status === 'called' && (
          <button
            onClick={() => setReminderOpen(o => !o)}
            className={[
              'text-xs px-3.5 py-1.5 rounded-lg border transition-colors',
              reminderOpen || reminderSavedAt
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                : 'bg-white/5 border-white/10 text-muted hover:text-white hover:bg-white/10'
            ].join(' ')}
          >
            {reminderSavedAt ? `📅 ${formatReminderDate(reminderSavedAt)}` : '📅 Schedule Callback'}
          </button>
        )}

        {/* AI Assist */}
        {lead.status !== 'closed' && (
          <button
            onClick={fetchAiPitch}
            className={[
              'text-xs px-3.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5',
              aiOpen
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-white/5 border-white/10 text-muted hover:text-white hover:bg-white/10'
            ].join(' ')}
          >
            {aiLoading ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full border border-purple-400 border-t-transparent animate-spin" />
                <span>Thinking…</span>
              </>
            ) : (
              <>🤖 AI Assist</>
            )}
          </button>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setNoteOpen(o => !o)}
          className="text-xs px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          {noteOpen ? 'Hide Note' : (noteText ? `Note: ${noteText.slice(0, 30)}${noteText.length > 30 ? '…' : ''}` : 'Add Note')}
        </button>
      </div>

      {/* AI Assist panel */}
      {aiOpen && (
        <div className="mt-3 border border-purple-500/20 rounded-xl bg-purple-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-purple-500/10">
            <span className="text-sm">🤖</span>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">AI Sales Assist</span>
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 px-4 py-6 text-purple-300/60 text-sm">
              <span className="w-3 h-3 rounded-full border border-purple-400 border-t-transparent animate-spin" />
              <span>Analyzing lead data…</span>
            </div>
          )}

          {aiError && (
            <div className="px-4 py-4 text-red-400 text-sm">{aiError}</div>
          )}

          {aiPitch && !aiLoading && (
            <div className="p-4 space-y-4">
              {/* Opening line */}
              <div>
                <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold mb-1.5">Opening Line</p>
                <p className="text-sm text-white leading-relaxed bg-purple-500/10 rounded-lg px-3 py-2.5 border border-purple-500/15">
                  "{aiPitch.opening}"
                </p>
              </div>

              {/* Key points */}
              {aiPitch.keyPoints?.length > 0 && (
                <div>
                  <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold mb-1.5">Key Talking Points</p>
                  <ul className="space-y-1">
                    {aiPitch.keyPoints.map((pt, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5 flex-shrink-0">›</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Objections */}
              {aiPitch.objections?.length > 0 && (
                <div>
                  <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold mb-1.5">Likely Objections</p>
                  <div className="space-y-2">
                    {aiPitch.objections.map((o, i) => (
                      <div key={i} className="bg-bg rounded-lg px-3 py-2 border border-subtle">
                        <p className="text-xs text-yellow-400 font-medium">"{o.objection}"</p>
                        <p className="text-xs text-white/70 mt-1">{o.rebuttal}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price + Close */}
              <div className="grid grid-cols-2 gap-3">
                {aiPitch.priceRange && (
                  <div className="bg-bg rounded-lg px-3 py-2.5 border border-subtle">
                    <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold mb-1">Price Range</p>
                    <p className="text-sm text-accent font-semibold font-mono">{aiPitch.priceRange}</p>
                  </div>
                )}
                {aiPitch.closeLines && (
                  <div className="bg-bg rounded-lg px-3 py-2.5 border border-subtle">
                    <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-semibold mb-1">Close Line</p>
                    <p className="text-xs text-white/80 italic">"{aiPitch.closeLines}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminder scheduler (collapsible) */}
      {reminderOpen && lead.status === 'called' && (
        <div className="mt-3 border border-yellow-400/20 rounded-xl bg-yellow-400/5 p-4">
          <p className="text-xs font-semibold text-yellow-400 mb-3">📅 Schedule Callback</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Date &amp; time</label>
              <input
                type="datetime-local"
                value={reminderDateTime}
                min={nowLocal}
                onChange={e => setReminderDateTime(e.target.value)}
                className="w-full bg-bg border border-subtle rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Note (optional)</label>
              <input
                type="text"
                value={reminderNote}
                onChange={e => setReminderNote(e.target.value)}
                placeholder="e.g. Asked about weekend availability"
                className="w-full bg-bg border border-subtle rounded-lg px-3 py-2 text-white text-sm placeholder-muted focus:outline-none focus:border-yellow-400/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReminderOpen(false)}
                className="px-3 py-1.5 text-xs text-muted border border-subtle rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveReminder}
                disabled={reminderSaving}
                className="flex-1 px-3 py-1.5 text-xs bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 rounded-lg hover:bg-yellow-400/30 transition-colors font-medium disabled:opacity-50"
              >
                {reminderSaving ? 'Saving…' : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes section (collapsible) */}
      {noteOpen && (
        <div className="mt-3 border-t border-subtle pt-3">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onBlur={saveNote}
            placeholder="Type a note about this lead..."
            className="w-full bg-bg border border-subtle rounded-xl px-3 py-2.5 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors resize-none h-20"
          />
          <p className={`text-xs mt-1 transition-opacity ${noteSaved ? 'text-accent opacity-100' : 'opacity-0'}`}>
            Saved ✓
          </p>
        </div>
      )}
    </div>
  );
}
