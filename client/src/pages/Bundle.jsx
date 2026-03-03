import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

// ─── Shared primitives ─────────────────────────────────────────────────────

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

function useTilt(intensity = 6) {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform =
      `perspective(900px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(8px)`;
  }, [intensity]);
  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  }, []);
  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
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
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
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

// ─── Included items ─────────────────────────────────────────────────────────

const COURSE_ITEMS = [
  { icon: '📱', label: 'Facebook & Instagram Ad Setup', desc: 'The exact campaign structure Hunter runs for $18–23 CPL' },
  { icon: '📋', label: 'Lead Form Optimization', desc: 'The form that filters tire-kickers and pulls high-intent buyers' },
  { icon: '📞', label: 'Closing Scripts', desc: '65% close rate framework — word-for-word call scripts' },
  { icon: '🚛', label: 'Operations Playbook', desc: 'Hiring, dispatching, and scaling to multiple trucks' },
  { icon: '📊', label: 'Pricing & Profit Formula', desc: 'Job costing, margin targets, and how to never underprice' },
  { icon: '🎯', label: 'Market Selection System', desc: 'How to identify and own a high-demand territory' },
];

const LEGENLY_ITEMS = [
  { icon: '🔒', label: 'Exclusive Territory (3 months)', desc: 'Your city locked — no competitors get your leads' },
  { icon: '⚡', label: 'Real-Time Lead Delivery', desc: 'Leads hit your dashboard in seconds via SMS + app' },
  { icon: '📍', label: 'We Run the Ads for You', desc: 'We manage Facebook campaigns — you just answer the phone' },
  { icon: '🏆', label: 'Founding Member Status', desc: 'Locked-in pricing forever. Never pay more.' },
];

const TESTIMONIALS = [
  {
    name: 'Hunter Patrick',
    company: 'Dumpire, Forsyth County GA',
    text: "I was skeptical at first. But the exclusive lead model changed everything — I'm closing at 65%+ and not fighting 4 other operators for the same customer.",
    result: '$8,400 revenue in first month',
  },
];

// ─── Bundle Page ────────────────────────────────────────────────────────────

export default function Bundle() {
  const ctaRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const tilt = useTilt(5);

  const inputClass =
    'w-full bg-bg border border-subtle rounded-xl px-4 py-3.5 text-white text-sm ' +
    'placeholder-muted focus:outline-none focus:border-accent ' +
    'focus:shadow-[0_0_0_3px_rgba(0,229,160,0.1)] transition-all duration-200';

  const scrollToCta = () => ctaRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/bundle/reserve', formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
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
          <h1 className="font-heading text-4xl font-extrabold text-white mb-3">You're in.</h1>
          <p className="text-muted text-lg mb-2">
            We'll reach out within <span className="text-accent font-semibold">24 hours</span> to get you set up.
          </p>
          <p className="text-muted text-sm mb-8">
            Check your email — onboarding details coming shortly.
          </p>
          <a
            href="/waitlist"
            className="text-accent text-sm hover:underline"
          >
            Also join the Legenly waitlist →
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
            onClick={scrollToCta}
            className="text-sm bg-accent text-bg font-heading font-bold px-5 py-2 rounded-lg hover:bg-accent-dim transition-colors"
          >
            Get the Bundle →
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-10 px-4 text-center max-w-4xl mx-auto">

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          Limited spots — one operator per territory
        </div>

        <h1
          className="font-heading font-black text-5xl md:text-6xl lg:text-[4.5rem] mb-6"
          style={{ letterSpacing: '-0.015em', lineHeight: '1.1' }}
        >
          <span className="block text-white">Build a Junk Removal</span>
          <span className="block text-white">Business That Prints</span>
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
            Cash Every Month.
          </span>
        </h1>

        <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Get the complete system — the course that teaches you how,{' '}
          <span className="text-white font-semibold">plus 3 months of exclusive leads</span>{' '}
          delivered directly to your phone. Everything you need to hit $10K+/month.
        </p>

        {/* Price block */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="flex items-baseline gap-3">
            <span className="text-muted text-xl line-through">$1,994</span>
            <span
              className="font-heading font-black text-6xl text-accent"
              style={{ letterSpacing: '-0.03em' }}
            >
              $997
            </span>
          </div>
          <p className="text-muted text-sm">One-time — course + 3 months Legenly included</p>
        </div>

        <button
          onClick={scrollToCta}
          className="relative px-12 py-5 bg-accent text-bg font-heading font-bold text-lg rounded-xl transition-all hover:bg-accent-dim active:scale-95"
          style={{ boxShadow: '0 0 28px rgba(0,229,160,0.35), 0 4px 16px rgba(0,0,0,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(0,229,160,0.5), 0 4px 20px rgba(0,0,0,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,160,0.35), 0 4px 16px rgba(0,0,0,0.3)'; }}
        >
          Claim Your Spot — $997 →
        </button>

        <p className="text-muted text-xs mt-4">
          No subscription. No hidden fees. You own the course forever.
        </p>
      </section>

      {/* ── What's included ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-16">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">What you get</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Two products. One price. Complete system.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Course card */}
          <Reveal delay={0}>
            <div
              className="rounded-2xl p-8 h-full relative overflow-hidden"
              style={{
                background: '#111118',
                border: '1px solid #1e1e2a',
                boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                aria-hidden
                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)' }}
              />
              <div className="relative">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                  style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}
                >
                  Part 1 — The Course
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-1">Operator Accelerator</h3>
                <p className="text-muted text-sm mb-6">
                  The exact system Hunter used to build Dumpire — ads, lead handling, closing, and scaling.
                </p>
                <div className="space-y-4">
                  {COURSE_ITEMS.map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-white text-sm font-semibold leading-snug">{item.label}</p>
                        <p className="text-muted text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-subtle flex justify-between items-center">
                  <span className="text-muted text-xs">Standalone value</span>
                  <span className="text-white/50 text-sm line-through">$997</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Legenly card */}
          <Reveal delay={80}>
            <div
              className="rounded-2xl p-8 h-full relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(0,229,160,0.06) 0%, #111118 50%)',
                border: '1px solid rgba(0,229,160,0.2)',
                boxShadow: '0 4px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,229,160,0.05)',
              }}
            >
              <div
                aria-hidden
                className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.1) 0%, transparent 70%)' }}
              />
              <div className="relative">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                  style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)', color: '#00e5a0' }}
                >
                  Part 2 — Legenly (3 months)
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-1">Exclusive Lead Delivery</h3>
                <p className="text-muted text-sm mb-6">
                  We lock your territory, run the Facebook ads, and send every lead directly to your phone.
                </p>
                <div className="space-y-4">
                  {LEGENLY_ITEMS.map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-accent text-sm font-semibold leading-snug">{item.label}</p>
                        <p className="text-muted text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-accent/20 flex justify-between items-center">
                  <span className="text-muted text-xs">3 months @ $500/mo</span>
                  <span className="text-white/50 text-sm line-through">$1,500</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Total value banner */}
        <Reveal delay={160}>
          <div
            className="mt-6 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.2)' }}
          >
            <div>
              <p className="text-accent font-semibold text-sm">Total combined value</p>
              <p className="text-white/50 text-sm line-through mt-0.5">$2,497 if bought separately</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-sm">Bundle price — today only</p>
              <p className="font-heading font-black text-4xl text-accent" style={{ letterSpacing: '-0.03em' }}>$997</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Proof / testimonial ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pb-16">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">Proof it works</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Real operator. Real numbers.
            </h2>
          </div>
        </Reveal>

        {TESTIMONIALS.map((t) => (
          <Reveal key={t.name}>
            <div
              className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
              style={{
                background: '#111118',
                border: '1px solid #1e1e2a',
                boxShadow: '0 4px 48px rgba(0,0,0,0.5)',
              }}
            >
              <div
                aria-hidden
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)' }}
              />
              <svg
                className="text-accent/20 mb-6"
                width="40" height="40" viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-white text-lg md:text-xl leading-relaxed mb-6 relative">{t.text}</p>
              <div className="flex items-center justify-between flex-wrap gap-4 relative">
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-muted text-xs">{t.company}</p>
                </div>
                <div
                  className="px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', color: '#00e5a0' }}
                >
                  {t.result}
                </div>
              </div>
            </div>
          </Reveal>
        ))}

        {/* Stats row */}
        <Reveal>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { val: '$25K', label: 'generated in 1.5 months' },
              { val: '65%', label: 'average close rate' },
              { val: '$18', label: 'average cost per lead' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="rounded-xl p-5 text-center"
                style={{ background: '#111118', border: '1px solid #1e1e2a' }}
              >
                <p className="font-heading font-black text-3xl text-accent mb-1" style={{ letterSpacing: '-0.02em' }}>{val}</p>
                <p className="text-muted text-xs leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <Reveal>
          <h2 className="font-heading text-2xl font-black text-white mb-8 text-center" style={{ letterSpacing: '-0.02em' }}>
            Questions
          </h2>
        </Reveal>
        <div className="space-y-4">
          {[
            {
              q: 'Do I need a junk removal business already?',
              a: "No. The course is designed for both beginners and operators who already have a truck. If you're starting from scratch, module 1 walks you through setup. If you're already running, skip ahead to the ad system.",
            },
            {
              q: 'What happens after 3 months of Legenly?',
              a: 'You can continue at $500/month to keep your territory. Or not — you own the course and skills regardless. Many operators earn back the bundle cost in their first 2–3 weeks.',
            },
            {
              q: 'Is my city available?',
              a: "We operate on a one-operator-per-territory model. After you claim, we confirm availability within 24 hours. If your exact city isn't available, we'll work with you on an adjacent market.",
            },
            {
              q: 'What if I already have leads — do I need Legenly?',
              a: 'The course alone is worth $997. You can still buy the bundle and defer your Legenly territory start — your 3 months begins when you activate, not when you buy.',
            },
          ].map(({ q, a }) => (
            <Reveal key={q}>
              <div
                className="rounded-xl p-6"
                style={{ background: '#111118', border: '1px solid #1e1e2a' }}
              >
                <p className="text-white font-semibold text-sm mb-2">{q}</p>
                <p className="text-muted text-sm leading-relaxed">{a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA / Claim form ──────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="relative z-10 max-w-xl mx-auto px-4 md:px-8 pb-36">
        <Reveal>
          <div className="text-center mb-8">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">Ready to build</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              Claim your territory.
            </h2>
            <p className="text-muted text-sm max-w-sm mx-auto">
              One operator per city. First come, first served.
              We'll follow up within 24 hours to get you onboarded.
            </p>
          </div>

          <div
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
            style={{
              background: '#0e0e16',
              border: '1px solid rgba(0,229,160,0.2)',
              boxShadow: '0 0 100px rgba(0,229,160,0.07), 0 0 40px rgba(0,229,160,0.04), 0 8px 64px rgba(0,0,0,0.65)',
              transition: 'transform 0.2s ease-out',
              willChange: 'transform',
            }}
          >
            {/* Inner glow */}
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(0,229,160,0.1) 0%, transparent 70%)' }}
            />

            {/* Price header */}
            <div className="relative text-center mb-8">
              <div className="flex items-baseline justify-center gap-3 mb-1">
                <span className="text-white/40 text-xl line-through">$2,497</span>
                <span className="font-heading font-black text-5xl text-accent" style={{ letterSpacing: '-0.03em' }}>$997</span>
              </div>
              <p className="text-muted text-xs">Operator Accelerator Course + 3 months Legenly</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm relative">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Full Name *</label>
                  <input
                    className={inputClass}
                    placeholder="John Smith"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Phone *</label>
                  <input
                    className={inputClass}
                    placeholder="770-555-0100"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
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
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                  Your city / territory *{' '}
                  <span className="text-accent normal-case font-normal">— we lock it for you</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Dallas, TX or Forsyth County, GA"
                  required
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-accent hover:bg-accent-dim disabled:opacity-60 text-bg font-heading font-bold text-base rounded-xl transition-all active:scale-[0.99]"
                  style={{ boxShadow: '0 0 28px rgba(0,229,160,0.25)', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.boxShadow = '0 0 48px rgba(0,229,160,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,160,0.25)'; }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full spin" />
                      Reserving your spot…
                    </span>
                  ) : (
                    'Get the Bundle — $997 →'
                  )}
                </button>
                <p className="text-center text-xs text-muted mt-3 leading-relaxed">
                  We'll send you a secure payment link + onboarding call invite within 24 hours.
                </p>
              </div>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
