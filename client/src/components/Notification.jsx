import React, { useEffect, useState } from 'react';

/**
 * Toast notification stack — renders in the bottom-right corner.
 * Each notification slides up on mount and auto-dismisses after 5 seconds.
 *
 * Props:
 *   notifications: Array<{ id: string, lead: Lead }>
 *   onDismiss: (id: string) => void
 */
export default function Notification({ notifications, onDismiss }) {
  if (!notifications.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-xs w-full pointer-events-none">
      {notifications.map(notif => (
        <ToastItem key={notif.id} notif={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  } catch {}
};

function ToastItem({ notif, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Play chime when notification appears
    playChime();
    // Tiny delay to trigger the CSS transition
    const showTimer = setTimeout(() => setVisible(true), 15);
    // Auto-dismiss after 5 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false);
      // Wait for slide-out transition before removing
      setTimeout(() => onDismiss(notif.id), 350);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notif.id, onDismiss]);

  const { lead } = notif;

  return (
    <div
      className={[
        'pointer-events-auto bg-surface border border-accent/40 rounded-xl p-4',
        'transform transition-all duration-300 ease-out',
        visible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-8 opacity-0'
      ].join(' ')}
      style={{
        boxShadow: '0 0 24px rgba(0, 229, 160, 0.2), 0 8px 32px rgba(0,0,0,0.4)'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Pulsing indicator */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-2 h-2 rounded-full bg-accent pulse-dot" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-accent font-heading uppercase tracking-wide">
            New Lead
          </p>
          <p className="text-sm font-medium text-white mt-0.5 truncate">
            {lead.name}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {[lead.city, lead.jobType].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss(notif.id), 350);
          }}
          className="flex-shrink-0 text-muted hover:text-white transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full"
          style={{
            animation: 'shrink-bar 5s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes shrink-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
