import React, { useState, useEffect, useRef } from 'react';

// ─── Registration closes & webinar date ──────────────────────────────────────
// Webinar: next Saturday at 7 PM ET
function getWebinarDate() {
  const d = new Date('2026-03-22T19:00:00-04:00');
  return d;
}
// Registration closes: Friday before webinar at 11:59 PM ET
const REG_CLOSE = new Date('2026-03-20T23:59:00-04:00');
const SPOTS_TOTAL = 47;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(ref, threshold = 0.1) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function useCountUp(target, duration = 1600, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

// ─── Reveal ───────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, from = 'bottom', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, 0.08);
  const origins = {
    bottom: 'translateY(28px)',
    left:   'translateX(-28px)',
    right:  'translateX(28px)',
    scale:  'scale(0.96) translateY(16px)',
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : origins[from],
        transition: `opacity 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

// ─── Grid bg ─────────────────────────────────────────────────────────────────

function GridBg() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,229,160,0.035) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,229,160,0.035) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage:
          'radial-gradient(ellipse 90% 55% at 50% 0%, black 0%, transparent 100%)',
      }}
    />
  );
}

// ─── Ambient orbs ─────────────────────────────────────────────────────────────

function Orbs() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute orb-drift"
        style={{
          top: '-15%', left: '20%',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(0,229,160,0.09) 0%, transparent 65%)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute"
        style={{
          top: '30%', right: '-10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(0,180,130,0.07) 0%, transparent 65%)',
          animation: 'orb-drift 24s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: '10%', left: '-5%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 65%)',
          animation: 'orb-drift 20s ease-in-out infinite',
          animationDelay: '-14s',
        }}
      />
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

const TICKER = [
  'Eric Everly — $30K/month after leaving car sales',
  'Exclusive territories — 1 operator per market',
  'Leads delivered in real time to your phone',
  '65%+ close rate on exclusive leads',
  'Zero Angie\'s List. Zero shared leads.',
  'New operators launching every week',
];

function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div
      className="overflow-hidden py-2.5 relative"
      style={{ background: 'rgba(0,229,160,0.04)', borderBottom: '1px solid rgba(0,229,160,0.1)', borderTop: '1px solid rgba(0,229,160,0.1)' }}
    >
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{ animation: 'ticker-scroll 30s linear infinite' }}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-xs font-semibold text-muted shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 opacity-80" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ targetDate }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = targetDate - Date.now();
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
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
    { v: t.d, l: 'DAYS' },
    { v: t.h, l: 'HRS' },
    { v: t.m, l: 'MIN' },
    { v: t.s, l: 'SEC' },
  ];

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
      {units.map(({ v, l }, i) => (
        <React.Fragment key={l}>
          <div
            className="flex flex-col items-center justify-center rounded-2xl min-w-[68px] py-4 px-2"
            style={{
              background: 'linear-gradient(160deg, #141420 0%, #0e0e18 100%)',
              border: '1px solid #22223a',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <span
              className="text-accent font-heading font-black text-3xl leading-none"
              style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {String(v ?? 0).padStart(2, '0')}
            </span>
            <span className="text-muted text-[9px] uppercase tracking-[0.16em] mt-1.5 font-bold">{l}</span>
          </div>
          {i < 3 && (
            <span className="text-accent/60 font-black text-xl mb-4">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Spots bar ────────────────────────────────────────────────────────────────

function SpotsBar({ filled = 28 }) {
  const pct = Math.round((filled / SPOTS_TOTAL) * 100);
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex justify-between text-xs font-semibold mb-2">
        <span className="text-accent">{filled} spots claimed</span>
        <span className="text-muted">{SPOTS_TOTAL - filled} remaining</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a28' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00c487, #00e5a0)',
            boxShadow: '0 0 12px rgba(0,229,160,0.5)',
            transition: 'width 1.2s cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
      <p className="text-center text-xs text-muted mt-2">
        Registration closes <span className="text-white font-semibold">Friday, March 20 at midnight</span>
      </p>
    </div>
  );
}

// ─── Pain cards ───────────────────────────────────────────────────────────────

const PAINS = [
  {
    icon: '📵',
    title: 'You lose jobs before you even get a chance',
    body: "The platform calls you, then calls three other contractors. Whoever answers first gets the job. You're not competing on quality — you're competing on speed. And you're paying for that privilege.",
  },
  {
    icon: '📉',
    title: 'Slow weeks feel like a death spiral',
    body: "No jobs this week means no money next week. You never know if things are going to pick up or if this is the slow season that finally breaks you. You can't run a business on hope.",
  },
  {
    icon: '🔁',
    title: "Every dollar you spend makes them stronger, not you",
    body: "Angie's List doesn't care if you win or lose. They keep your money either way. You're renting access to customers who should've come to you directly — and building nothing of your own.",
  },
];

function PainCard({ icon, title, body, delay }) {
  return (
    <Reveal delay={delay} from="bottom">
      <div
        className="rounded-2xl p-7 h-full relative overflow-hidden group cursor-default transition-all duration-300"
        style={{ background: '#0e0e16', border: '1px solid #1c1c2a' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(0,229,160,0.2)';
          e.currentTarget.style.background = '#111120';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#1c1c2a';
          e.currentTarget.style.background = '#0e0e16';
        }}
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,160,0.04) 0%, transparent 60%)' }}
        />
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-heading font-bold text-white text-lg mb-3 leading-snug">{title}</h3>
        <p className="text-muted text-sm leading-relaxed">{body}</p>
      </div>
    </Reveal>
  );
}

// ─── Learn items ──────────────────────────────────────────────────────────────

const LEARN = [
  {
    n: '01',
    title: 'Why Shared Leads Are Costing You More Than You Think',
    body: 'The math behind what you actually pay per booked job on shared platforms — and why the house always wins.',
  },
  {
    n: '02',
    title: 'The Exclusive Territory Model',
    body: "How to lock down your market so you're the only operator receiving leads in it. One territory. One operator. No exceptions.",
  },
  {
    n: '03',
    title: 'How Leads Flow Directly to Your Phone',
    body: 'See the exact system that delivers a new customer inquiry to your phone the moment it comes in — no logging in, no waiting, no missing it.',
  },
  {
    n: '04',
    title: 'What to Say When They Call',
    body: 'The word-for-word script our operators use to close exclusive leads at a rate that would make most salespeople uncomfortable.',
  },
  {
    n: '05',
    title: 'Pricing So You Never Leave Money on the Table',
    body: 'The pricing formula that protects your margin on every single job — so you stop undercharging people who were ready to pay more.',
  },
  {
    n: '06',
    title: 'Live Q&A — Your Questions, Your Market',
    body: "Bring your specific situation. We'll map out what this looks like for your market and how fast you could have it running.",
  },
];

// ─── Territory map ────────────────────────────────────────────────────────────

const MARKETS = [
  // Row 1
  { name: 'Seattle, WA',      status: 'available' },
  { name: 'Portland, OR',     status: 'available' },
  { name: 'Boise, ID',        status: 'available' },
  { name: 'Salt Lake City, UT', status: 'available' },
  { name: 'Denver, CO',       status: 'available' },
  { name: 'Minneapolis, MN',  status: 'available' },
  // Row 2
  { name: 'Sacramento, CA',   status: 'available' },
  { name: 'Las Vegas, NV',    status: 'available' },
  { name: 'Phoenix, AZ',      status: 'available' },
  { name: 'Albuquerque, NM',  status: 'available' },
  { name: 'Kansas City, MO',  status: 'available' },
  { name: 'Chicago, IL',      status: 'available' },
  // Row 3
  { name: 'Los Angeles, CA',  status: 'available' },
  { name: 'San Diego, CA',    status: 'available' },
  { name: 'Tucson, AZ',       status: 'available' },
  { name: 'Dallas, TX',       status: 'available' },
  { name: 'Houston, TX',      status: 'available' },
  { name: 'St. Louis, MO',    status: 'available' },
  // Row 4
  { name: 'San Antonio, TX',  status: 'available' },
  { name: 'Austin, TX',       status: 'available' },
  { name: 'Oklahoma City, OK', status: 'available' },
  { name: 'Nashville, TN',    status: 'available' },
  { name: 'Indianapolis, IN', status: 'available' },
  { name: 'Columbus, OH',     status: 'available' },
  // Row 5
  { name: 'Memphis, TN',      status: 'available' },
  { name: 'Birmingham, AL',   status: 'available' },
  { name: 'Atlanta, GA',      status: 'claimed' },
  { name: 'Charlotte, NC',    status: 'claimed' },
  { name: 'Raleigh, NC',      status: 'available' },
  { name: 'Richmond, VA',     status: 'available' },
  // Row 6
  { name: 'Tampa, FL',        status: 'available' },
  { name: 'Orlando, FL',      status: 'available' },
  { name: 'Miami, FL',        status: 'available' },
  { name: 'Louisville, KY',   status: 'available' },
  { name: 'Pittsburgh, PA',   status: 'available' },
  { name: 'Philadelphia, PA', status: 'available' },
  // Row 7
  { name: 'Jacksonville, FL', status: 'available' },
  { name: 'Baltimore, MD',    status: 'available' },
  { name: 'Washington, DC',   status: 'available' },
  { name: 'New York, NY',     status: 'available' },
  { name: 'Hartford, CT',     status: 'available' },
  { name: 'Boston, MA',       status: 'available' },
];

function MarketTile({ name, status }) {
  const [hovered, setHovered] = useState(false);
  const claimed = status === 'claimed';
  return (
    <div
      className={`relative rounded-xl px-3 py-2.5 cursor-default transition-all duration-200 ${claimed ? 'market-pulse' : ''}`}
      style={{
        background: claimed
          ? 'rgba(0,229,160,0.08)'
          : hovered ? '#141422' : '#0e0e18',
        border: claimed
          ? '1px solid rgba(0,229,160,0.35)'
          : hovered ? '1px solid rgba(0,229,160,0.2)' : '1px solid #1e1e2e',
        boxShadow: claimed ? '0 0 18px rgba(0,229,160,0.12)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${claimed ? 'pulse-dot' : ''}`}
          style={{ background: claimed ? '#00e5a0' : hovered ? 'rgba(0,229,160,0.4)' : '#2a2a3a' }}
        />
        <span
          className="text-[11px] font-semibold leading-tight whitespace-nowrap"
          style={{ color: claimed ? '#00e5a0' : hovered ? '#ccc' : '#5a5a70' }}
        >
          {name}
        </span>
      </div>
      {claimed && (
        <span
          className="absolute -top-2 -right-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: '#00e5a0', color: '#0a0a0f' }}
        >
          ACTIVE
        </span>
      )}
      {!claimed && hovered && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap z-20 pointer-events-none"
          style={{ background: '#00e5a0', color: '#0a0a0f' }}
        >
          Available →
        </div>
      )}
    </div>
  );
}

function TerritoryMap() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {MARKETS.map((m) => (
        <MarketTile key={m.name} name={m.name} status={m.status} />
      ))}
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Eric Everly',
    location: 'Midwest',
    role: 'Former car salesman → Junk Removal Operator',
    quote:
      "I was working 60-hour weeks selling cars, missing my kids' games, stressed out of my mind. Three months after I started with this system, I cleared $30,000 in one month from junk removal alone. I genuinely wish I'd found this two years earlier.",
    result: '$30K/month',
    resultLabel: '3 months in',
    initials: 'EE',
  },
  {
    name: 'Marcus D.',
    location: 'Dallas, TX',
    role: 'Construction worker turned operator',
    quote:
      "I didn't have any experience running a business. But the leads came in, I answered the phone, and I followed the script. $0 to my first $12,000 month in 60 days. I was shocked it worked that fast.",
    result: '$12K',
    resultLabel: 'First 60 days',
    initials: 'MD',
  },
  {
    name: 'Tasha R.',
    location: 'Phoenix, AZ',
    role: 'Side hustle to full-time',
    quote:
      "I kept my day job for the first two months because I didn't believe it would hold. By month three I had more booked from junk removal than my salary. I put in my notice that Friday.",
    result: 'Full-time in 90 days',
    resultLabel: 'Quit her job',
    initials: 'TR',
  },
];

function TestimonialCard({ t, delay }) {
  return (
    <Reveal delay={delay} from="bottom">
      <div
        className="flex flex-col rounded-2xl p-7 h-full relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #111120 0%, #0e0e18 100%)',
          border: '1px solid #1e1e2e',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Quote mark */}
        <div
          className="absolute top-4 right-6 font-heading font-black text-7xl leading-none pointer-events-none select-none"
          style={{ color: 'rgba(0,229,160,0.07)' }}
        >
          "
        </div>

        {/* Result badge */}
        <div
          className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black mb-5"
          style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)', color: '#00e5a0' }}
        >
          <span>{t.result}</span>
          <span style={{ color: 'rgba(0,229,160,0.5)' }}>·</span>
          <span className="font-medium">{t.resultLabel}</span>
        </div>

        <p className="text-white/75 text-sm leading-relaxed flex-1 mb-6 italic">"{t.quote}"</p>

        <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid #1e1e2e' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-black text-sm text-bg shrink-0"
            style={{ background: 'linear-gradient(135deg, #00c487, #00e5a0)' }}
          >
            {t.initials}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{t.name}</p>
            <p className="text-muted text-xs">{t.location} · {t.role}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, suffix = '', prefix = '', label, delay, active }) {
  const counted = useCountUp(value, 1600, active);
  return (
    <Reveal delay={delay} from="scale">
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(145deg, #111120 0%, #0e0e18 100%)',
          border: '1px solid #1e1e2e',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <p
          className="font-heading font-black text-3xl text-accent mb-1"
          style={{ letterSpacing: '-0.02em' }}
        >
          {prefix}{active ? counted : 0}{suffix}
        </p>
        <p className="text-muted text-xs font-medium leading-snug">{label}</p>
      </div>
    </Reveal>
  );
}

// ─── WebinarJam embed ─────────────────────────────────────────────────────────

function WebinarForm() {
  const ref = useRef(null);
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;
    const s = document.createElement('script');
    s.src =
      'https://event.webinarjam.com/register/6ry5gc2/embed-form' +
      '?formButtonText=Reserve+My+Free+Spot+%E2%86%92' +
      '&formAccentColor=%2300e5a0' +
      '&formAccentOpacity=1' +
      '&formBgColor=%230e0e16' +
      '&formBgOpacity=1';
    s.async = true;
    ref.current.appendChild(s);
  }, []);
  return (
    <div ref={ref} className="wj-embed-wrapper" data-webinar-hash="6ry5gc2" style={{ minHeight: 200 }} />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 47, suffix: '', prefix: '', label: 'Spots available for this training' },
  { value: 30, suffix: '+', prefix: '', label: 'Operators on the waitlist' },
  { value: 65, suffix: '%', prefix: '', label: 'Close rate on exclusive leads' },
  { value: 100, suffix: '%', prefix: '', label: 'Free — no card required' },
];

export default function Waitlist() {
  const formRef = useRef(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);
  const webinarDate = getWebinarDate();

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GridBg />
      <Orbs />

      {/* ── Sticky nav ──────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-subtle backdrop-blur-xl"
        style={{ background: 'rgba(10,10,15,0.88)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight shrink-0">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(0,229,160,0.8)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot shrink-0" />
            <span className="text-white/60">Registration closes</span>
            <span className="text-white font-semibold">Fri, March 20</span>
          </div>

          <button
            onClick={scrollToForm}
            className="shrink-0 text-sm bg-accent text-bg font-heading font-bold px-5 py-2 rounded-lg transition-all active:scale-95 hover:bg-accent-dim"
            style={{ boxShadow: '0 0 18px rgba(0,229,160,0.3)' }}
          >
            Register Free →
          </button>
        </div>
      </nav>

      <Ticker />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 md:pt-20 pb-10 px-4 text-center max-w-5xl mx-auto">

        {/* Top badge */}
        <div
          className="badge-pop inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-black mb-8 uppercase tracking-widest"
          style={{
            background: 'rgba(0,229,160,0.07)',
            border: '1px solid rgba(0,229,160,0.28)',
            color: '#00e5a0',
            boxShadow: '0 0 40px rgba(0,229,160,0.08)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          Free Live Masterclass — {SPOTS_TOTAL} Spots Only
        </div>

        <p className="text-xs font-black uppercase tracking-[0.28em] mb-5" style={{ color: 'rgba(0,229,160,0.7)' }}>
          Legenly Presents
        </p>

        <h1
          className="font-heading font-black mb-6 leading-none"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', letterSpacing: '-0.03em' }}
        >
          <span className="block text-white mb-2">How Junk Removal Operators</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(110deg, #00e5a0 0%, #00ffbb 45%, #00c487 75%, #00e5a0 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient-shift 5s ease infinite',
            }}
          >
            Get Exclusive Jobs On Autopilot
          </span>
        </h1>

        <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop competing against four other contractors for the same lead.
          Join this <span className="text-white font-semibold">free live training</span> and see exactly how operators are getting exclusive jobs flowing into their phones every week — no middlemen, no bidding, no shared territories.
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            { e: '📅', t: formatDate(webinarDate) },
            { e: '🕖', t: '7:00 PM ET' },
            { e: '💻', t: '100% Online & FREE' },
            { e: '🎟️', t: `${SPOTS_TOTAL} Spots Max` },
          ].map(({ e, t }) => (
            <div
              key={t}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/80"
              style={{ background: '#111120', border: '1px solid #1e1e2e' }}
            >
              <span>{e}</span>{t}
            </div>
          ))}
        </div>

        {/* Countdown */}
        <div className="mb-10">
          <p className="text-muted text-[10px] uppercase tracking-[0.22em] font-bold mb-5">
            ⏱ Masterclass begins in
          </p>
          <Countdown targetDate={webinarDate} />
        </div>

        {/* Spots bar */}
        <div className="mb-10">
          <SpotsBar filled={28} />
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={scrollToForm}
            className="group relative px-14 py-5 font-heading font-black text-xl rounded-2xl overflow-hidden transition-all active:scale-[0.98] text-bg"
            style={{
              background: 'linear-gradient(110deg, #00e5a0, #00c487)',
              boxShadow: '0 0 50px rgba(0,229,160,0.4), 0 8px 40px rgba(0,0,0,0.5)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 70px rgba(0,229,160,0.65), 0 8px 40px rgba(0,0,0,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 50px rgba(0,229,160,0.4), 0 8px 40px rgba(0,0,0,0.5)'; }}
          >
            <span className="relative z-10">Reserve My Free Spot →</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <p className="text-muted text-xs">100% free · Zoom link sent immediately · No credit card</p>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, suffix, prefix, label }, i) => (
            <StatCard key={label} value={value} suffix={suffix} prefix={prefix} label={label} delay={i * 80} active={statsInView} />
          ))}
        </div>
      </section>

      {/* ── Pain section ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-3">Sound familiar?</p>
            <h2
              className="font-heading text-3xl md:text-4xl font-black text-white"
              style={{ letterSpacing: '-0.025em' }}
            >
              The problems this training solves
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {PAINS.map((p, i) => (
            <PainCard key={p.title} {...p} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── What you'll learn ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <Reveal>
          <div
            className="rounded-3xl p-8 md:p-12"
            style={{
              background: 'linear-gradient(135deg, #111120 0%, #0e0e18 100%)',
              border: '1px solid #1e1e2e',
            }}
          >
            <div className="text-center mb-10">
              <p className="text-accent text-xs uppercase tracking-widest font-bold mb-3">The Agenda</p>
              <h2 className="font-heading text-3xl md:text-4xl font-black text-white" style={{ letterSpacing: '-0.025em' }}>
                What we're covering
              </h2>
              <p className="text-muted text-base mt-3">90 minutes. No filler. No pitch. Just the system.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {LEARN.map((item, i) => (
                <Reveal key={item.n} delay={i * 60} from="bottom">
                  <div
                    className="flex gap-5 group cursor-default p-5 rounded-2xl transition-all duration-300"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #1e1e2e' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,160,0.18)'; e.currentTarget.style.background = 'rgba(0,229,160,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
                  >
                    <span
                      className="font-heading font-black text-sm shrink-0 mt-0.5"
                      style={{ color: 'rgba(0,229,160,0.4)' }}
                    >
                      {item.n}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-sm mb-1.5 leading-snug">{item.title}</p>
                      <p className="text-muted text-xs leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={scrollToForm}
                className="px-10 py-4 bg-accent text-bg font-heading font-bold rounded-xl transition-all active:scale-95 hover:bg-accent-dim"
                style={{ boxShadow: '0 0 30px rgba(0,229,160,0.3)' }}
              >
                I Want To Attend →
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <Reveal>
          <div className="text-center mb-12">
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-3">Proof</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white" style={{ letterSpacing: '-0.025em' }}>
              Operators who've been where you are
            </h2>
            <p className="text-muted text-base mt-3 max-w-xl mx-auto">
              These are real results from real operators using this exact system.
            </p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} delay={i * 90} />
          ))}
        </div>
      </section>

      {/* ── Host section ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <Reveal>
          <div
            className="rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.04) 0%, rgba(0,229,160,0.01) 100%)',
              border: '1px solid rgba(0,229,160,0.14)',
            }}
          >
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-heading font-black text-4xl text-bg"
                style={{
                  background: 'linear-gradient(135deg, #00e5a0 0%, #00c487 100%)',
                  boxShadow: '0 0 50px rgba(0,229,160,0.3)',
                }}
              >
                H
              </div>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#00e5a0' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-accent text-xs uppercase tracking-widest font-bold mb-2">Your Host</p>
              <h3 className="font-heading text-2xl font-extrabold text-white mb-1">Hunter Patrick</h3>
              <p className="text-muted text-sm mb-4">Junk Removal Operator · Forsyth County, GA · 1M+ followers across platforms</p>
              <p className="text-white/65 text-sm leading-relaxed max-w-lg">
                Hunter runs an active junk removal operation and has built a massive following documenting the real numbers behind it.
                He'll walk you through the exact system he uses in his own market —
                the same one that generated <span className="text-accent font-semibold">$8,400 in his first month</span>.
                No fluff. No theory. Just what's actually working right now.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Territory map ───────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-accent text-xs uppercase tracking-widest font-bold mb-3">Territory Availability</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white" style={{ letterSpacing: '-0.025em' }}>
              Is your market still open?
            </h2>
            <p className="text-muted text-base mt-3 max-w-xl mx-auto">
              We operate one exclusive territory per market. Most are still available — but once a spot is claimed, it's gone.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: '#0e0e16',
              border: '1px solid #1e1e2e',
              boxShadow: '0 0 80px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
                <span className="text-accent">Active territory</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full" style={{ background: '#2a2a3a' }} />
                <span className="text-muted">Available — hover to claim</span>
              </div>
            </div>
            <TerritoryMap />
            <div className="mt-6 text-center">
              <button
                onClick={scrollToForm}
                className="text-sm font-semibold text-accent hover:text-white transition-colors"
              >
                Don't see yours? Register and we'll check →
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Registration form ───────────────────────────────────────────────── */}
      <section ref={formRef} className="relative z-10 max-w-2xl mx-auto px-4 pb-28">
        <Reveal from="scale">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,229,160,0.14) 0%, transparent 70%)' }}
          />

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              border: '1px solid rgba(0,229,160,0.22)',
              boxShadow: '0 0 120px rgba(0,229,160,0.1), 0 24px 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* Form header */}
            <div
              className="px-8 pt-10 pb-7 text-center"
              style={{ background: 'linear-gradient(180deg, #131322 0%, #0e0e18 100%)', borderBottom: '1px solid #1e1e2e' }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-5"
                style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.28)', color: '#00e5a0' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                It's 100% Free
              </div>
              <h2 className="font-heading text-3xl font-black text-white mb-2" style={{ letterSpacing: '-0.025em' }}>
                Claim Your Spot Now
              </h2>
              <p className="text-muted text-sm mb-4">
                {formatDate(webinarDate)} · 7:00 PM ET
              </p>
              <SpotsBar filled={28} />
            </div>

            {/* WebinarJam embed */}
            <div className="px-4 pt-6 pb-4" style={{ background: '#0e0e18' }}>
              <WebinarForm />
              <p className="text-center text-xs text-muted mt-4 pb-2">
                Zoom link delivered instantly to your inbox · No spam, ever.
              </p>
            </div>
          </div>

          <p
            className="text-center text-xs font-semibold mt-5"
            style={{ color: 'rgba(0,229,160,0.65)' }}
          >
            ⚡ {SPOTS_TOTAL - 28} of {SPOTS_TOTAL} spots remaining — registration closes Friday, March 20
          </p>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t border-subtle py-8 px-4 text-center"
        style={{ background: 'rgba(10,10,15,0.9)' }}
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
