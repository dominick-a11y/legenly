import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function useInView(ref, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, 0.1);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function GridBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,229,160,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,160,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 100%)',
      }}
    />
  );
}

const WHAT_YOULL_LEARN = [
  { icon: '📱', text: 'The exact Facebook ad setup that generates leads for $18–23' },
  { icon: '📋', text: 'The lead form that filters low-quality calls automatically' },
  { icon: '📞', text: 'Word-for-word closing script with 65%+ conversion rate' },
  { icon: '🗺️', text: 'How to pick a territory and own it before someone else does' },
  { icon: '💰', text: 'The pricing formula that protects your margin on every job' },
  { icon: '🚀', text: 'How to scale from 1 truck to a real business with systems' },
];

const WHO_IS_THIS_FOR = [
  "You run a junk removal company and want more consistent leads",
  "You're thinking about starting a junk removal business",
  "You're tired of sharing leads on Angie's List or Thumbtack",
  "You want to build a real system — not just hustle job to job",
];

// Upcoming webinar date — 7 days out, Saturday at 7PM ET
function getNextWebinarDate() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilSat);
  next.setHours(19, 0, 0, 0);
  return next;
}

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = targetDate - new Date();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { val: timeLeft.d, label: 'days' },
    { val: timeLeft.h, label: 'hrs' },
    { val: timeLeft.m, label: 'min' },
    { val: timeLeft.s, label: 'sec' },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {units.map(({ val, label }) => (
        <div
          key={label}
          className="text-center rounded-xl px-4 py-3 min-w-[64px]"
          style={{ background: '#111118', border: '1px solid #1e1e2a' }}
        >
          <p className="font-heading font-black text-2xl text-accent leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {String(val ?? 0).padStart(2, '0')}
          </p>
          <p className="text-muted text-[10px] uppercase tracking-wide mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function Webinar() {
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', business: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const webinarDate = getNextWebinarDate();

  const inputClass =
    'w-full bg-bg border border-subtle rounded-xl px-4 py-3.5 text-white text-sm ' +
    'placeholder-muted focus:outline-none focus:border-accent ' +
    'focus:shadow-[0_0_0_3px_rgba(0,229,160,0.1)] transition-all duration-200';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/webinar/register', form);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
    ' at 7:00 PM ET';

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <GridBg />
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)', boxShadow: '0 0 40px rgba(0,229,160,0.2)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-white mb-3">You're registered.</h1>
          <p className="text-muted text-lg mb-2">
            Check <span className="text-accent font-semibold">{form.email}</span> for the Zoom link.
          </p>
          <p className="text-white font-semibold mt-4 mb-1">{formatDate(webinarDate)}</p>
          <p className="text-muted text-sm mb-10">Add it to your calendar so you don't miss it.</p>

          <div
            className="rounded-2xl p-6 text-left mb-6"
            style={{ background: '#111118', border: '1px solid #1e1e2a' }}
          >
            <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-4">What to expect</p>
            <div className="space-y-3">
              {WHAT_YOULL_LEARN.slice(0, 3).map((item) => (
                <div key={item.text} className="flex gap-3">
                  <span>{item.icon}</span>
                  <p className="text-white text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <a
            href="/bundle"
            className="inline-block px-8 py-3.5 bg-accent text-bg font-heading font-bold rounded-xl text-sm hover:bg-accent-dim transition-colors"
          >
            Skip the webinar — get the full bundle now →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GridBg />

      {/* Hero glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.11) 0%, transparent 65%)' }}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-subtle bg-surface/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm bg-accent text-bg font-heading font-bold px-5 py-2 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Register Free →
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-14 pb-10 px-4 text-center max-w-3xl mx-auto">

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          Free live training — {formatDate(webinarDate)}
        </div>

        <h1
          className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-6"
          style={{ letterSpacing: '-0.015em', lineHeight: '1.1' }}
        >
          <span className="block text-white">How to Get 8–12 Exclusive</span>
          <span className="block text-white">Junk Removal Leads</span>
          <span
            className="block mt-1"
            style={{
              background: 'linear-gradient(120deg, #00e5a0 0%, #00c487 40%, #00e5a0 80%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient-shift 5s ease infinite',
            }}
          >
            Every Single Month
          </span>
        </h1>

        <p className="text-white/60 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Without Angie's List. Without Thumbtack. Without splitting your leads with 4 competitors.
          Live training with a junk removal operator doing it right now.
        </p>

        {/* Host info */}
        <div
          className="inline-flex items-center gap-4 px-5 py-3.5 rounded-2xl mb-10"
          style={{ background: '#111118', border: '1px solid #1e1e2a' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-black text-lg text-bg shrink-0"
            style={{ background: 'linear-gradient(135deg, #00e5a0, #00c487)' }}
          >
            H
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">Hunter Patrick</p>
            <p className="text-muted text-xs">Founder, Dumpire — Forsyth County, GA</p>
            <p className="text-accent text-xs mt-0.5">$8,400 in first month using this system</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-4">Training starts in</p>
          <Countdown targetDate={webinarDate} />
        </div>

        <button
          onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="px-12 py-4 bg-accent text-bg font-heading font-bold text-base rounded-xl transition-all hover:bg-accent-dim active:scale-95"
          style={{ boxShadow: '0 0 28px rgba(0,229,160,0.3), 0 4px 16px rgba(0,0,0,0.3)' }}
        >
          Reserve My Free Seat →
        </button>
        <p className="text-muted text-xs mt-3">100% free. No credit card required.</p>
      </section>

      {/* ── What you'll learn ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-14">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">The training</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              What you'll walk away with
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4">
          {WHAT_YOULL_LEARN.map((item, i) => (
            <Reveal key={item.text} delay={i * 60}>
              <div
                className="flex gap-4 items-start p-5 rounded-xl"
                style={{ background: '#111118', border: '1px solid #1e1e2a' }}
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <p className="text-white text-sm leading-relaxed">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Who is this for ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 pb-14">
        <Reveal>
          <div
            className="rounded-2xl p-8"
            style={{ background: '#111118', border: '1px solid #1e1e2a' }}
          >
            <h3 className="font-heading text-xl font-bold text-white mb-6">This training is for you if…</h3>
            <div className="space-y-4">
              {WHO_IS_THIS_FOR.map((item) => (
                <div key={item} className="flex gap-3 items-start">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Registration form ─────────────────────────────────────────────────── */}
      <section ref={formRef} className="relative z-10 max-w-xl mx-auto px-4 md:px-8 pb-36">
        <Reveal>
          <div
            className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
            style={{
              background: '#0e0e16',
              border: '1px solid rgba(0,229,160,0.2)',
              boxShadow: '0 0 100px rgba(0,229,160,0.07), 0 8px 64px rgba(0,0,0,0.65)',
            }}
          >
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(0,229,160,0.1) 0%, transparent 70%)' }}
            />

            <div className="relative text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                Free live training
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-white mb-2">
                Reserve your seat
              </h2>
              <p className="text-muted text-sm">{formatDate(webinarDate)}</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm relative">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">First Name *</label>
                  <input
                    className={inputClass}
                    placeholder="John"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Phone</label>
                  <input
                    className={inputClass}
                    placeholder="770-555-0100"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Email *</label>
                <input
                  className={inputClass}
                  placeholder="you@yourcompany.com"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                  Business name <span className="text-muted/50 normal-case font-normal">(optional)</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="Your Junk Removal Co."
                  value={form.business}
                  onChange={e => setForm(p => ({ ...p, business: e.target.value }))}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-accent hover:bg-accent-dim disabled:opacity-60 text-bg font-heading font-bold text-base rounded-xl transition-all active:scale-[0.99]"
                  style={{ boxShadow: '0 0 28px rgba(0,229,160,0.25)' }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 0 48px rgba(0,229,160,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,160,0.25)'; }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full spin" />
                      Saving your seat…
                    </span>
                  ) : (
                    'Save My Free Seat →'
                  )}
                </button>
                <p className="text-center text-xs text-muted mt-3">
                  You'll get the Zoom link immediately. No spam, ever.
                </p>
              </div>
            </form>

            {/* Upsell nudge */}
            <div
              className="mt-6 rounded-xl p-4 text-center relative"
              style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.15)' }}
            >
              <p className="text-muted text-xs mb-1">Want everything now without waiting?</p>
              <a
                href="/bundle"
                className="text-accent text-sm font-semibold hover:underline"
              >
                Get the full Operator Accelerator bundle for $997 →
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
