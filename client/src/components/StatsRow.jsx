import React from 'react';

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

function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisMonth(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function StatsRow({ leads }) {
  const total = leads.length;
  const leadsToday = leads.filter(l => isToday(l.createdAt)).length;
  const leadsThisMonth = leads.filter(l => isThisMonth(l.createdAt)).length;

  // Estimated revenue: leads × $200 avg job × 40% close rate
  const AVG_JOB = 200;
  const CLOSE_RATE = 0.4;
  const estRevenue = Math.round(total * AVG_JOB * CLOSE_RATE);

  // ROI vs $500/mo subscription
  const SUB_COST = 500;
  const roi = SUB_COST > 0 ? Math.round((estRevenue / SUB_COST) * 100) : 0;

  const stats = [
    {
      label: 'Leads Today',
      value: leadsToday,
      sub: `${leadsThisMonth} this month`,
      color: 'text-accent',
      icon: '⚡'
    },
    {
      label: 'This Month',
      value: leadsThisMonth,
      sub: `${total} total`,
      color: 'text-white',
      icon: '📅'
    },
    {
      label: 'Est. Revenue',
      value: `$${estRevenue.toLocaleString()}`,
      sub: `@ $${AVG_JOB}/job × ${CLOSE_RATE * 100}% close`,
      color: 'text-accent',
      icon: '💰'
    },
    {
      label: 'ROI vs $500/mo',
      value: `${roi}%`,
      sub: roi >= 100 ? '✓ Profitable' : 'Building up...',
      color: roi >= 100 ? 'text-accent' : 'text-yellow-400',
      icon: '📈'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map(({ label, value, sub, color, icon }) => (
        <div
          key={label}
          className="bg-surface border border-subtle rounded-xl p-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{icon}</span>
            <p className="text-xs text-muted uppercase tracking-wider font-medium">{label}</p>
          </div>
          <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export { timeAgo };
