import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(ref, threshold = 0.12) {
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

function useCountUp(target, duration = 1800, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '', from = 'bottom' }) {
  const ref = useRef(null);
  const inView = useInView(ref, 0.1);
  const transforms = {
    bottom: 'translateY(32px)',
    left:   'translateX(-32px)',
    right:  'translateX(32px)',
    scale:  'translateY(20px) scale(0.97)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : (transforms[from] || transforms.bottom),
        transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Grid background ──────────────────────────────────────────────────────────

function GridBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,229,160,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,160,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 10%, transparent 100%)',
      }}
    />
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function getNextWebinarDate() {
  const now = new Date();
  const day = now.getDay();
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
    { val: timeLeft.d, label: 'DAYS' },
    { val: timeLeft.h, label: 'HOURS' },
    { val: timeLeft.m, label: 'MINS' },
    { val: timeLeft.s, label: 'SECS' },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {units.map(({ val, label }, i) => (
        <div
          key={label}
          className="relative flex flex-col items-center justify-center rounded-2xl min-w-[72px] py-4 px-3"
          style={{
            background: 'linear-gradient(145deg, #111118 0%, #0e0e16 100%)',
            border: '1px solid #1e1e2a',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <span
            className="font-heading font-black text-3xl leading-none text-accent"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
          >
            {String(val ?? 0).padStart(2, '0')}
          </span>
          <span className="text-muted text-[9px] uppercase tracking-[0.15em] mt-1.5 font-semibold">{label}</span>
          {i < 3 && (
            <span
              className="absolute -right-2 top-1/2 -translate-y-1/2 text-accent font-bold text-lg leading-none z-10"
              style={{ textShadow: '0 0 12px rgba(0,229,160,0.5)' }}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Social proof ticker ──────────────────────────────────────────────────────

const TICKER_ITEMS = [
  'Hunter Patrick — $8,400 first month',
  'Exclusive leads at $18–23 CPL',
  '65%+ close rate on exclusive leads',
  '1 operator per territory — no competition',
  'Leads delivered in real time to your phone',
  'No Angie\'s List. No Thumbtack. No sharing.',
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden py-3" style={{ borderTop: '1px solid #1e1e2a', borderBottom: '1px solid #1e1e2a', background: 'rgba(0,229,160,0.03)' }}>
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{ animation: 'ticker-scroll 28s linear infinite' }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-xs font-semibold text-muted flex items-center gap-3 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── WebinarJam embed ─────────────────────────────────────────────────────────

function WebinarForm() {
  const containerRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;
    const script = document.createElement('script');
    script.src =
      'https://event.webinarjam.com/register/6ry5gc2/embed-form' +
      '?formButtonText=Reserve+My+Spot+%E2%86%92' +
      '&formAccentColor=%2300e5a0' +
      '&formAccentOpacity=1' +
      '&formBgColor=%230e0e16' +
      '&formBgOpacity=1';
    script.async = true;
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      className="wj-embed-wrapper"
      data-webinar-hash="6ry5gc2"
      style={{ minHeight: 200 }}
    />
  );
}

// ─── Stat card (own component to safely use hooks) ────────────────────────────

function StatCard({ value, suffix = '', prefix = '', label, delay = 0, active }) {
  const counted = useCountUp(value, 1800, active);
  return (
    <Reveal delay={delay} from="scale">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(145deg, #111118, #0e0e16)',
          border: '1px solid #1e1e2a',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <p
          className="font-heading font-black text-3xl text-accent mb-1"
          style={{ letterSpacing: '-0.02em' }}
        >
          {prefix}{active ? counted : 0}{suffix}
        </p>
        <p className="text-muted text-xs font-medium">{label}</p>
      </div>
    </Reveal>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LEARN_ITEMS = [
  {
    title: 'The Exclusive Territory Model',
    body: 'How to lock down your market so every lead that comes in is yours alone — no bidding wars, no split leads.',
  },
  {
    title: 'The $18–23 Lead System',
    body: 'The exact Facebook ad setup generating exclusive junk removal leads at a fraction of what Angie\'s List charges.',
  },
  {
    title: 'Real-Time Lead Delivery',
    body: 'How our dashboard sends every lead straight to your phone the second it comes in — no delays, no middlemen.',
  },
  {
    title: 'The Closing Script',
    body: 'Word-for-word what to say when a lead calls so you convert 65%+ into booked jobs — on the first call.',
  },
  {
    title: 'Pricing for Max Margin',
    body: 'The pricing formula that protects your profit on every job — so you stop undercharging and leaving money on the table.',
  },
  {
    title: 'Live Q&A with Hunter',
    body: 'Get your specific questions answered by an operator actively running this system in his own market right now.',
  },
];

const WHO_ITS_FOR = [
  'You own a junk removal company and want more consistent, predictable leads',
  "You're tired of Angie's List and Thumbtack selling your lead to 4 competitors",
  'You want to own a territory — not fight over scraps in an open marketplace',
  'You\'re ready to build a real business with systems instead of grinding job to job',
];

const STATS = [
  { value: 30, suffix: '+', label: 'Operators on waitlist' },
  { value: 65, suffix: '%', label: 'Lead close rate' },
  { value: 23, prefix: '$', label: 'Average cost per lead' },
  { value: 1, suffix: ' spot/market', label: 'Exclusive per territory' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function Waitlist() {
  const formRef = useRef(null);
  const webinarDate = getNextWebinarDate();

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GridBg />

      {/* ── Top glow ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(0,229,160,0.13) 0%, transparent 60%)' }}
      />

      {/* ── Sticky nav ────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-subtle backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.85)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs text-muted font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
              {formatDate(webinarDate)} · 7:00 PM ET
            </span>
            <button
              onClick={scrollToForm}
              className="text-sm bg-accent text-bg font-heading font-bold px-5 py-2 rounded-lg transition-all hover:bg-accent-dim active:scale-95"
              style={{ boxShadow: '0 0 20px rgba(0,229,160,0.25)' }}
            >
              Register Free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Ticker ────────────────────────────────────────────────────────── */}
      <Ticker />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-10 px-4 text-center max-w-4xl mx-auto">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-bold mb-8 uppercase tracking-widest"
          style={{
            background: 'rgba(0,229,160,0.08)',
            border: '1px solid rgba(0,229,160,0.25)',
            color: '#00e5a0',
            boxShadow: '0 0 30px rgba(0,229,160,0.1)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          Free Live Masterclass — Limited Spots
        </div>

        {/* Presenter label */}
        <p
          className="text-xs font-bold uppercase tracking-[0.25em] mb-5"
          style={{ color: '#00e5a0' }}
        >
          Legenly Presents
        </p>

        {/* Headline */}
        <h1
          className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-6"
          style={{ letterSpacing: '-0.025em', lineHeight: '1.05' }}
        >
          <span className="block text-white mb-1">Stop Sharing Leads.</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(120deg, #00e5a0 0%, #00ffb3 40%, #00c487 70%, #00e5a0 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient-shift 4s ease infinite',
            }}
          >
            Own Your Territory.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Join us LIVE and discover the exact system generating exclusive junk removal leads for{' '}
          <span className="text-white font-semibold">$18–23 each</span> — delivered directly to your phone
          while your competitors are still fighting over Angie's List scraps.
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            { icon: '📅', text: `${formatDate(webinarDate)}` },
            { icon: '🕖', text: '7:00 PM ET' },
            { icon: '💻', text: '100% Online & FREE' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#111118', border: '1px solid #1e1e2a' }}
            >
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="mb-10">
          <p className="text-muted text-xs uppercase tracking-[0.2em] font-bold mb-5">
            ⏱ Starts In
          </p>
          <Countdown targetDate={webinarDate} />
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={scrollToForm}
            className="group relative px-14 py-5 bg-accent text-bg font-heading font-black text-lg rounded-2xl transition-all active:scale-[0.98] overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(0,229,160,0.35), 0 8px 32px rgba(0,0,0,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 60px rgba(0,229,160,0.55), 0 8px 32px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 40px rgba(0,229,160,0.35), 0 8px 32px rgba(0,0,0,0.4)'; }}
          >
            <span className="relative z-10">Reserve My Free Spot →</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(120deg, #00e5a0, #00ffb3, #00c487)' }}
            />
          </button>
          <p className="text-muted text-xs">100% free · No credit card · Zoom link sent immediately</p>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="relative z-10 max-w-4xl mx-auto px-4 pb-16"
      >
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map(({ value, suffix = '', prefix = '', label }, i) => (
            <StatCard key={label} value={value} suffix={suffix} prefix={prefix} label={label} delay={i * 80} active={statsInView} />
          ))}
        </div>
      </section>

      {/* ── Host section ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <Reveal>
          <div
            className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center"
            style={{
              background: 'linear-gradient(135deg, #111118 0%, #0e0e16 100%)',
              border: '1px solid #1e1e2a',
              boxShadow: '0 0 80px rgba(0,229,160,0.05)',
            }}
          >
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-heading font-black text-4xl text-bg"
                style={{
                  background: 'linear-gradient(135deg, #00e5a0, #00c487)',
                  boxShadow: '0 0 40px rgba(0,229,160,0.3)',
                }}
              >
                H
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#00e5a0', boxShadow: '0 0 16px rgba(0,229,160,0.5)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Bio */}
            <div className="text-center md:text-left">
              <p className="text-accent text-xs uppercase tracking-widest font-bold mb-2">Your Host</p>
              <h3 className="font-heading text-2xl font-extrabold text-white mb-1">Hunter Patrick</h3>
              <p className="text-muted text-sm mb-4">Founder, Dumpire · Forsyth County, GA · 1M+ followers</p>
              <p className="text-white/70 text-sm leading-relaxed max-w-lg">
                Hunter took over his family's home services business and built a junk removal operation
                that generated <span className="text-accent font-semibold">$8,400 in its first month</span>{' '}
                using the exact lead system he'll walk you through on this call.
                He runs ads, runs jobs, and has the content reach to prove it's working.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── What you'll learn ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-3">The Training</p>
            <h2
              className="font-heading text-3xl md:text-4xl font-black text-white"
              style={{ letterSpacing: '-0.025em' }}
            >
              What you'll walk away with
            </h2>
            <p className="text-muted text-base mt-3 max-w-xl mx-auto">
              90 minutes. No fluff. Just the exact playbook we use to generate exclusive leads in any market.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4">
          {LEARN_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 70} from="bottom">
              <div
                className="flex gap-5 items-start p-6 rounded-2xl h-full transition-all duration-300 group cursor-default"
                style={{
                  background: '#0e0e16',
                  border: '1px solid #1e1e2a',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,160,0.25)'; e.currentTarget.style.background = '#111118'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2a'; e.currentTarget.style.background = '#0e0e16'; }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.3)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-muted text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Mid-section CTA */}
        <Reveal delay={100}>
          <div className="text-center mt-12">
            <button
              onClick={scrollToForm}
              className="px-10 py-4 bg-accent text-bg font-heading font-bold text-base rounded-xl transition-all active:scale-95"
              style={{ boxShadow: '0 0 32px rgba(0,229,160,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(0,229,160,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(0,229,160,0.3)'; }}
            >
              I Want This System →
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 pb-20">
        <Reveal>
          <div
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.05) 0%, rgba(0,229,160,0.02) 100%)',
              border: '1px solid rgba(0,229,160,0.15)',
            }}
          >
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-2">Is this you?</p>
            <h3 className="font-heading text-2xl font-black text-white mb-7" style={{ letterSpacing: '-0.02em' }}>
              This training is for you if…
            </h3>
            <div className="space-y-5">
              {WHO_ITS_FOR.map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.35)' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── Registration form (WebinarJam embed) ──────────────────────────── */}
      <section ref={formRef} className="relative z-10 max-w-2xl mx-auto px-4 pb-28">
        <Reveal from="scale">
          {/* Glow behind form */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,229,160,0.12) 0%, transparent 70%)' }}
          />

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,229,160,0.2)',
              boxShadow: '0 0 120px rgba(0,229,160,0.08), 0 16px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Form header */}
            <div
              className="px-8 pt-8 pb-6 text-center"
              style={{ background: 'linear-gradient(180deg, #111118 0%, #0e0e16 100%)', borderBottom: '1px solid #1e1e2a' }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)', color: '#00e5a0' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                Free Live Masterclass
              </div>
              <h2
                className="font-heading text-2xl md:text-3xl font-black text-white mb-2"
                style={{ letterSpacing: '-0.025em' }}
              >
                Reserve Your Spot
              </h2>
              <p className="text-muted text-sm">
                {formatDate(webinarDate)} · 7:00 PM ET · Free Zoom Call
              </p>
            </div>

            {/* WebinarJam embed */}
            <div
              className="px-4 py-6"
              style={{ background: '#0e0e16' }}
            >
              <WebinarForm />
              <p className="text-center text-xs text-muted mt-4">
                Zoom link delivered instantly to your inbox. No spam, ever.
              </p>
            </div>
          </div>

          {/* Urgency note */}
          <p
            className="text-center text-xs font-semibold mt-5"
            style={{ color: 'rgba(0,229,160,0.7)' }}
          >
            ⚡ Spots are limited. Once this fills, registration closes.
          </p>
        </Reveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t border-subtle py-8 px-4 text-center"
        style={{ background: 'rgba(10,10,15,0.8)' }}
      >
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
