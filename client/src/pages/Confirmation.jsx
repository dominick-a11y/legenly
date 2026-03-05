import React from 'react';

// March 15, 2026 7 PM ET = 23:00 UTC (EDT = UTC-4)
const GOOGLE_CAL_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=Legenly+Free+Masterclass%3A+How+Junk+Removal+Operators+Get+Exclusive+Jobs+On+Autopilot' +
  '&dates=20260315T230000Z%2F20260316T010000Z' +
  '&details=Hosted+by+Hunter+Patrick.+Zoom+link+is+in+your+email.+Join+us+for+90+minutes+of+real+strategy.' +
  '&location=Online+via+Zoom';

function downloadIcs() {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Legenly//Masterclass//EN',
    'BEGIN:VEVENT',
    'DTSTART:20260315T230000Z',
    'DTEND:20260316T010000Z',
    'SUMMARY:Legenly Free Masterclass',
    'DESCRIPTION:How Junk Removal Operators Get Exclusive Jobs On Autopilot\\nHosted by Hunter Patrick.\\nZoom link is in your email.',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'legenly-masterclass-march-15.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function GridBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,229,160,0.03) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,229,160,0.03) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 55% at 50% 0%, black 0%, transparent 100%)',
      }}
    />
  );
}

const NEXT_STEPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Watch your inbox — multiple emails incoming',
    body: "We'll be sending you valuable content every day leading up to the masterclass. Open them, read them, and feel free to reply — we read every response personally.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: 'The emails are your pre-training education',
    body: "Everything we send before the masterclass is designed to get you prepared. Operators who read every email show up ready to implement — and they get results faster.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z" />
      </svg>
    ),
    title: 'Active readers may get a personal call from us',
    body: "If you're opening and engaging with the emails, there's a real chance we'll personally reach out before the masterclass. Think of it as a bonus coaching call — no pitch, just value.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Special gift before the webinar',
    body: "Registered attendees who stay engaged with our emails will get access to an exclusive resource before the training starts. Stay tuned — it's something you'll actually use.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Bookmark this page',
    body: "Save this confirmation page so you can find your registration details easily. Your Zoom link will arrive by email — keep an eye on your inbox (and check spam just in case).",
  },
];

export default function Confirmation() {
  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GridBg />

      {/* Glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.1) 0%, transparent 65%)' }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-subtle backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.88)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 md:py-24">

        {/* Success icon */}
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', boxShadow: '0 0 60px rgba(0,229,160,0.2)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-5"
            style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.25)', color: '#00e5a0' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            You're registered
          </div>

          <h1 className="font-heading font-black text-4xl md:text-5xl text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            You're in. See you Sunday.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Your spot is confirmed for the <span className="text-white font-semibold">Legenly Free Masterclass</span>.
            Check your email — the Zoom link is on its way.
          </p>
        </div>

        {/* Date card */}
        <div
          className="rounded-2xl p-6 text-center mb-8"
          style={{ background: 'linear-gradient(135deg, rgba(0,229,160,0.06) 0%, rgba(0,229,160,0.02) 100%)', border: '1px solid rgba(0,229,160,0.2)' }}
        >
          <p className="text-accent text-xs uppercase tracking-widest font-bold mb-2">Masterclass date</p>
          <p className="font-heading font-black text-2xl text-white mb-1">Sunday, March 15, 2026</p>
          <p className="text-white/60 text-base">7:00 PM Eastern Time</p>
        </div>

        {/* Add to calendar */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: '#0e0e18', border: '1px solid #1e1e2e' }}
        >
          <p className="text-white font-semibold text-sm mb-1">Add to your calendar</p>
          <p className="text-muted text-xs mb-5">Don't let it slip through the cracks. Block off Sunday evening right now.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={GOOGLE_CAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.3)', color: '#00e5a0' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Google Calendar
            </a>
            <button
              onClick={downloadIcs}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#141422', border: '1px solid #2a2a3a', color: '#ccc' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Apple / Outlook (.ics)
            </button>
          </div>
        </div>

        {/* What to expect next */}
        <div className="mb-10">
          <p className="text-accent text-xs uppercase tracking-widest font-bold mb-6">What happens next</p>
          <div className="space-y-4">
            {NEXT_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl"
                style={{ background: '#0e0e18', border: '1px solid #1e1e2e' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.18)' }}
                >
                  {step.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1 leading-snug">{step.title}</p>
                  <p className="text-muted text-xs leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <a
            href="/masterclass"
            className="text-sm text-muted hover:text-accent transition-colors"
          >
            Back to the masterclass page
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-subtle py-8 px-4 text-center" style={{ background: 'rgba(10,10,15,0.9)' }}>
        <a href="/" className="font-heading font-extrabold text-lg tracking-tight inline-block mb-2">
          <span className="text-white">Legen</span><span className="text-accent">ly</span>
        </a>
        <p className="text-muted text-xs">
          Exclusive lead territories for junk removal operators.{' '}
          <a href="/privacy" className="underline hover:text-accent transition-colors">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}
