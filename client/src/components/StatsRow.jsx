import React from 'react';

// SQLite stores timestamps without timezone — append 'Z' to treat as UTC
function parseDate(ds) {
  if (!ds) return new Date(0);
  if (typeof ds === 'string' && !ds.includes('T') && !ds.includes('Z')) {
    return new Date(ds.replace(' ', 'T') + 'Z');
  }
  return new Date(ds);
}

function timeAgo(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - parseDate(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function isToday(dateString) {
  if (!dateString) return false;
  const d = parseDate(dateString);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function isThisMonth(dateString) {
  if (!dateString) return false;
  const d = parseDate(dateString);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
}

const JOB_VALUE_MINS = {
  Garage: 300, Estate: 800, Appliance: 150, Commercial: 500
};

function fmtMoney(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

export default function StatsRow({ leads, market }) {
  const leadsToday = leads.filter(l => isToday(l.createdAt)).length;
  const leadsThisMonth = leads.filter(l => isThisMonth(l.createdAt)).length;
  const estRevenue = leads
    .filter(l => l.status !== 'closed')
    .reduce((sum, l) => sum + (JOB_VALUE_MINS[l.jobType] || 200), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      <div className="bg-surface border border-subtle rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">⚡</span>
          <p className="text-xs text-muted uppercase tracking-wider font-medium">Leads Today</p>
        </div>
        <p className="text-2xl font-heading font-bold text-accent">{leadsToday}</p>
        <p className="text-xs text-muted mt-1">new inquiries today</p>
      </div>

      <div className="bg-surface border border-subtle rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">📅</span>
          <p className="text-xs text-muted uppercase tracking-wider font-medium">This Month</p>
        </div>
        <p className="text-2xl font-heading font-bold text-white">{leadsThisMonth}</p>
        <p className="text-xs text-muted mt-1">this calendar month</p>
      </div>

      <div className="bg-surface border border-subtle rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">💰</span>
          <p className="text-xs text-muted uppercase tracking-wider font-medium">Est. Revenue</p>
        </div>
        <p className="text-2xl font-heading font-bold text-accent">{fmtMoney(estRevenue)}</p>
        <p className="text-xs text-muted mt-1">open pipeline (min)</p>
      </div>

      {market ? (
        <div className="bg-surface border border-subtle rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📍</span>
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Your Territory</p>
          </div>
          <p className="text-base font-heading font-bold text-white leading-tight">{market}</p>
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">
            Exclusive
          </span>
        </div>
      ) : (
        <div className="bg-surface border border-subtle rounded-xl p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📊</span>
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Total Leads</p>
          </div>
          <p className="text-2xl font-heading font-bold text-white">{leads.length}</p>
          <p className="text-xs text-muted mt-1">all markets</p>
        </div>
      )}
    </div>
  );
}

export { timeAgo };
