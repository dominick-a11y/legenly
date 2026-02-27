import React from 'react';
import axios from 'axios';
import { timeAgo } from './StatsRow.jsx';

const JOB_TYPE_COLORS = {
  Garage:     { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400' },
  Estate:     { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  Appliance:  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  Commercial: { bg: 'bg-teal-500/10',   border: 'border-teal-500/30',   text: 'text-teal-400' }
};

const STATUS_CONFIG = {
  new:    { label: 'New',    bg: 'bg-accent/10',         border: 'border-accent/30',         text: 'text-accent' },
  called: { label: 'Called', bg: 'bg-yellow-400/10',     border: 'border-yellow-400/30',     text: 'text-yellow-400' },
  closed: { label: 'Closed', bg: 'bg-white/5',           border: 'border-white/10',           text: 'text-muted' }
};

export default function LeadCard({ lead, token, onStatusChange }) {
  const isNew = lead.status === 'new';
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const jobTypeCfg = JOB_TYPE_COLORS[lead.jobType] || {
    bg: 'bg-white/5', border: 'border-white/10', text: 'text-muted'
  };

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

  return (
    <div
      className={[
        'bg-surface rounded-xl p-5 border transition-all',
        isNew
          ? 'border-l-4 border-l-accent border-subtle'
          : 'border-subtle'
      ].join(' ')}
      style={{ boxShadow: isNew ? '0 4px 20px rgba(0,0,0,0.35), -2px 0 0 rgba(0,229,160,0.15)' : '0 2px 12px rgba(0,0,0,0.25)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-white text-base">{lead.name}</h3>
            {/* Status badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
            {/* Job type badge */}
            {lead.jobType && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${jobTypeCfg.bg} ${jobTypeCfg.border} ${jobTypeCfg.text}`}>
                {lead.jobType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
            {lead.city && <span>📍 {lead.city}{lead.state ? `, ${lead.state}` : ''}</span>}
            {lead.createdAt && <span>· {timeAgo(lead.createdAt)}</span>}
          </div>
        </div>

        {/* Contact info */}
        <div className="text-right flex-shrink-0">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="text-sm font-medium text-accent hover:underline block"
            >
              📞 {lead.phone}
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="text-xs text-muted hover:text-white block mt-0.5 truncate max-w-[180px]"
            >
              {lead.email}
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {lead.description && (
        <p className="text-sm text-muted mt-3 leading-relaxed line-clamp-2">
          {lead.description}
        </p>
      )}

      {/* Action buttons */}
      {lead.status !== 'closed' && (
        <div className="flex gap-2 mt-4">
          {lead.status === 'new' && (
            <button
              onClick={() => updateStatus('called')}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 transition-colors font-medium"
            >
              Mark as Called
            </button>
          )}
          <button
            onClick={() => updateStatus('closed')}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted hover:bg-white/10 hover:text-white transition-colors"
          >
            Mark as Closed
          </button>
        </div>
      )}
    </div>
  );
}
