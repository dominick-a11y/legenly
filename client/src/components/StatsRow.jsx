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

export default function StatsRow({ leads, market }) {
  const leadsToday = leads.filter(l => isToday(l.createdAt)).length;
  const leadsThisMonth = leads.filter(l => isThisMonth(l.createdAt)).length;

  const stats = [
    {
      label: 'Leads Today',
      value: leadsToday,
      sub: 'new inquiries today',
      color: 'text-accent',
      icon: '⚡'
    },
    {
      label: 'Leads This Month',
      value: leadsThisMonth,
      sub: 'this calendar month',
      color: 'text-white',
      icon: '📅'
    }
  ];

  return (
    <div className={`grid gap-3 mb-8 ${market ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}`}>
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

      {market && (
        <div
          className="bg-surface border border-subtle rounded-xl p-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📍</span>
            <p className="text-xs text-muted uppercase tracking-wider font-medium">Your Territory</p>
          </div>
          <p className="text-lg font-heading font-bold text-white leading-tight">{market}</p>
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">
            Exclusive
          </span>
        </div>
      )}
    </div>
  );
}

export { timeAgo };
