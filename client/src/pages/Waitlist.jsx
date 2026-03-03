import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

function useCountUp(target, duration = 1600, active = true) {
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

function useTilt(intensity = 7) {
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
    ref.current.style.transform =
      'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  }, []);
  return { ref, onMouseMove: handleMove, onMouseLeave: handleLeave };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_SOURCES = ['Word of mouth', "Angie's List", 'Thumbtack', 'Google', 'Facebook Ads', 'Other'];
const MONTHLY_REVENUE_OPTIONS = ['Under $5,000/mo', '$5,000 – $10,000/mo', '$10,000 – $20,000/mo', '$20,000+/mo'];
const MONTHLY_SPEND_OPTIONS = ['Nothing yet', 'Under $100/mo', '$100 – $300/mo', '$300 – $600/mo', '$600+/mo'];

const TICKER_CITIES = [
  'Atlanta, GA', 'Charlotte, NC', 'Nashville, TN', 'Dallas, TX', 'Phoenix, AZ',
  'Denver, CO', 'Tampa, FL', 'Austin, TX', 'Raleigh, NC', 'Orlando, FL',
  'Las Vegas, NV', 'Columbus, OH', 'Indianapolis, IN', 'Kansas City, MO', 'Memphis, TN',
  'San Antonio, TX', 'Jacksonville, FL', 'Louisville, KY', 'Richmond, VA', 'Boise, ID',
];

const TOTAL_SLOTS = 50;

// Territory data — claimed = active subscriber, hot = high waitlist demand, open = available
const TERRITORIES = [
  { city: 'Forsyth County, GA', state: 'GA', status: 'claimed' },
  { city: 'Atlanta, GA',        state: 'GA', status: 'hot',  demand: 4 },
  { city: 'Charlotte, NC',      state: 'NC', status: 'hot',  demand: 3 },
  { city: 'Nashville, TN',      state: 'TN', status: 'hot',  demand: 3 },
  { city: 'Dallas, TX',         state: 'TX', status: 'hot',  demand: 5 },
  { city: 'Tampa, FL',          state: 'FL', status: 'hot',  demand: 2 },
  { city: 'Austin, TX',         state: 'TX', status: 'hot',  demand: 2 },
  { city: 'Raleigh, NC',        state: 'NC', status: 'open'  },
  { city: 'Orlando, FL',        state: 'FL', status: 'open'  },
  { city: 'Phoenix, AZ',        state: 'AZ', status: 'open'  },
  { city: 'Denver, CO',         state: 'CO', status: 'open'  },
  { city: 'Las Vegas, NV',      state: 'NV', status: 'open'  },
  { city: 'Columbus, OH',       state: 'OH', status: 'open'  },
  { city: 'Indianapolis, IN',   state: 'IN', status: 'open'  },
  { city: 'Kansas City, MO',    state: 'MO', status: 'open'  },
  { city: 'San Antonio, TX',    state: 'TX', status: 'open'  },
  { city: 'Memphis, TN',        state: 'TN', status: 'open'  },
  { city: 'Jacksonville, FL',   state: 'FL', status: 'open'  },
];

// Seeded recent activity (shown in the activity feed)
const SEED_ACTIVITY = [
  { city: 'Dallas, TX',        time: '2m ago' },
  { city: 'Charlotte, NC',     time: '11m ago' },
  { city: 'Nashville, TN',     time: '34m ago' },
  { city: 'Atlanta, GA',       time: '1h ago' },
  { city: 'Tampa, FL',         time: '2h ago' },
  { city: 'Austin, TX',        time: '3h ago' },
];

// ─── Primitive UI components ──────────────────────────────────────────────────

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

function TiltCard({ children, className = '' }) {
  const tilt = useTilt(6);
  return (
    <div
      {...tilt}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  );
}

function StatCard({ value, suffix = '', prefix = '', label }) {
  const ref = useRef(null);
  const inView = useInView(ref, 0.2);
  const count = useCountUp(value, 1600, inView);
  return (
    <div ref={ref} className="text-center">
      <div
        className="font-heading font-black text-3xl md:text-4xl leading-none"
        style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
      >
        <span className="text-accent">{prefix}</span>
        <span className="text-white">{count.toLocaleString()}</span>
        <span className="text-accent">{suffix}</span>
      </div>
      <p className="text-xs text-muted mt-2.5 leading-snug">{label}</p>
    </div>
  );
}

// ─── Animated grid background ─────────────────────────────────────────────────

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

// ─── Territory Map ────────────────────────────────────────────────────────────

function TerritoryMap({ onClaimClick }) {
  const claimed = TERRITORIES.filter(t => t.status === 'claimed').length;
  const hot     = TERRITORIES.filter(t => t.status === 'hot').length;
  const open    = TERRITORIES.filter(t => t.status === 'open').length;

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: '#0a0a12',
        border: '1px solid #1e1e2a',
        boxShadow: '0 0 80px rgba(0,229,160,0.06), 0 8px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 border-b border-subtle flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
        style={{ background: 'rgba(0,229,160,0.03)' }}
      >
        <div>
          <p className="text-xs text-accent uppercase tracking-widest font-semibold mb-0.5">
            Live Territory Map
          </p>
          <p className="text-white font-heading font-bold text-lg leading-tight">
            {TOTAL_SLOTS - claimed} of {TOTAL_SLOTS} founding slots remaining
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 shrink-0">
          {[
            { color: '#00e5a0', label: 'Claimed', count: claimed },
            { color: '#f59e0b', label: 'High Demand', count: hot },
            { color: '#3a3a52', label: 'Available', count: open },
          ].map(({ color, label, count }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span>{label}</span>
              <span className="font-mono font-bold" style={{ color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Founding slots progress bar */}
      <div className="px-6 pt-4 pb-1">
        <div className="flex justify-between text-[10px] text-muted mb-1.5">
          <span>{claimed} slot{claimed !== 1 ? 's' : ''} taken</span>
          <span>{TOTAL_SLOTS - claimed} remaining at founding price</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(claimed / TOTAL_SLOTS) * 100}%`,
              background: 'linear-gradient(90deg, #00e5a0, #00c487)',
              transition: 'width 1.2s ease',
            }}
          />
        </div>
      </div>

      {/* Territory grid */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TERRITORIES.map((t) => {
          const isClaimed = t.status === 'claimed';
          const isHot     = t.status === 'hot';
          const isOpen    = t.status === 'open';

          return (
            <button
              key={t.city}
              disabled={isClaimed}
              onClick={isOpen || isHot ? onClaimClick : undefined}
              className="relative rounded-xl px-3.5 py-3 text-left transition-all duration-200 group"
              style={{
                background: isClaimed
                  ? 'rgba(0,229,160,0.08)'
                  : isHot
                  ? 'rgba(245,158,11,0.07)'
                  : 'rgba(255,255,255,0.03)',
                border: isClaimed
                  ? '1px solid rgba(0,229,160,0.25)'
                  : isHot
                  ? '1px solid rgba(245,158,11,0.25)'
                  : '1px solid rgba(255,255,255,0.07)',
                cursor: isClaimed ? 'default' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!isClaimed) e.currentTarget.style.borderColor = isHot ? 'rgba(245,158,11,0.5)' : 'rgba(0,229,160,0.35)';
              }}
              onMouseLeave={e => {
                if (!isClaimed) e.currentTarget.style.borderColor = isHot ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)';
              }}
            >
              {/* Status dot */}
              <span
                className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{
                  background: isClaimed ? '#00e5a0' : isHot ? '#f59e0b' : '#3a3a52',
                  boxShadow: isClaimed
                    ? '0 0 6px rgba(0,229,160,0.6)'
                    : isHot
                    ? '0 0 6px rgba(245,158,11,0.5)'
                    : 'none',
                }}
              />

              <p
                className="text-xs font-semibold leading-snug pr-4"
                style={{
                  color: isClaimed ? '#00e5a0' : isHot ? '#f8c966' : '#9090b0',
                }}
              >
                {t.city}
              </p>

              <p className="text-[10px] mt-0.5" style={{ color: isClaimed ? 'rgba(0,229,160,0.5)' : isHot ? 'rgba(245,158,11,0.6)' : '#45455a' }}>
                {isClaimed ? 'Taken' : isHot ? `${t.demand} operators want this` : 'Available'}
              </p>
            </button>
          );
        })}
      </div>

      {/* CTA footer */}
      <div
        className="px-6 py-4 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ background: 'rgba(0,229,160,0.02)' }}
      >
        <p className="text-xs text-muted">
          Don't see your city?{' '}
          <span className="text-white">Claim it anyway</span>{' '}
          — we'll launch there based on demand.
        </p>
        <button
          onClick={onClaimClick}
          className="shrink-0 px-5 py-2 bg-accent text-bg font-heading font-bold text-xs rounded-lg transition-all hover:bg-accent-dim"
          style={{ boxShadow: '0 0 20px rgba(0,229,160,0.25)' }}
        >
          Claim Your City →
        </button>
      </div>
    </div>
  );
}

// ─── Recent Activity Feed ─────────────────────────────────────────────────────

function ActivityFeed() {
  const [items, setItems] = useState(SEED_ACTIVITY);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0e0e16',
        border: '1px solid #1e1e2a',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ animation: 'pulse-dot 2s infinite' }} />
          <p className="text-xs font-semibold text-white uppercase tracking-wide">Recent Activity</p>
        </div>
        <span className="text-[10px] text-muted">Live</span>
      </div>
      <div className="divide-y divide-subtle/40">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                style={{ background: 'rgba(0,229,160,0.1)', color: '#00e5a0' }}
              >
                {item.city.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-white font-medium leading-snug">Operator joined</p>
                <p className="text-[10px] text-muted">{item.city}</p>
              </div>
            </div>
            <span className="text-[10px] text-muted shrink-0">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scarcity Banner ──────────────────────────────────────────────────────────

function ScarcityBanner({ slotsLeft }) {
  const pct = Math.round(((TOTAL_SLOTS - slotsLeft) / TOTAL_SLOTS) * 100);
  return (
    <div
      className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 0 40px rgba(245,158,11,0.06)',
      }}
    >
      <div
        aria-hidden
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }}
      />
      <div className="relative">
        <p className="text-xs text-amber-400 uppercase tracking-widest font-semibold mb-1">
          Founding Member Pricing
        </p>
        <p className="text-white font-heading font-bold text-lg leading-tight">
          Only {slotsLeft} slots left at $500/mo.{' '}
          <span className="text-amber-400">Price increases after launch.</span>
        </p>
        <p className="text-muted text-xs mt-1">
          {pct}% of founding slots are gone. Once we hit 50, the waitlist closes.
        </p>
      </div>
      <div className="relative shrink-0 text-right">
        <p className="text-3xl font-heading font-black text-amber-400">{slotsLeft}</p>
        <p className="text-[10px] text-amber-400/60 uppercase tracking-wide">slots left</p>
      </div>
    </div>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────

function RoiCalc() {
  const [jobValue, setJobValue] = useState(325);
  const [leadsPerMonth, setLeadsPerMonth] = useState(8);
  const closeRate = 0.65;
  const subCost = 500;
  const closedJobs = Math.round(leadsPerMonth * closeRate);
  const revenue = closedJobs * jobValue;
  const net = revenue - subCost;
  const roi = revenue / subCost;
  const breakEven = Math.ceil(subCost / (jobValue * closeRate));

  return (
    <div
      className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 relative overflow-hidden"
      style={{ boxShadow: '0 0 60px rgba(0,229,160,0.07), 0 4px 40px rgba(0,0,0,0.5)' }}
    >
      <div
        aria-hidden
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)' }}
      />
      <h3 className="font-heading text-xl font-bold text-white mb-1 relative">Your ROI Calculator</h3>
      <p className="text-muted text-sm mb-6 relative">Drag the sliders — see the math live.</p>

      <div className="space-y-6 relative">
        {[
          {
            label: 'Your avg job value', value: jobValue,
            setter: setJobValue, min: 150, max: 800, step: 25,
            display: `$${jobValue.toLocaleString()}`, lo: '$150 (appliance)', hi: '$800 (estate)',
          },
          {
            label: 'Leads / month we generate', value: leadsPerMonth,
            setter: setLeadsPerMonth, min: 4, max: 20, step: 1,
            display: `${leadsPerMonth}`, lo: '4/mo (slow)', hi: '20/mo (peak)',
          },
        ].map(({ label, value, setter, min, max, step, display, lo, hi }) => (
          <div key={label}>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-muted uppercase tracking-wide font-medium">{label}</label>
              <span className="text-base font-bold text-accent font-mono">{display}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => setter(Number(e.target.value))}
              className="w-full accent-[#00e5a0] cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>{lo}</span><span>{hi}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 relative">
        {[
          { label: 'Leads / month', val: leadsPerMonth, accent: false },
          { label: 'Closed @ 65%',  val: closedJobs,   accent: false },
          { label: 'Est. revenue',  val: `$${revenue.toLocaleString()}`, accent: true },
          { label: 'Subscription',  val: '$500',        accent: false },
        ].map(({ label, val, accent }) => (
          <div key={label} className="bg-bg rounded-xl p-3 border border-subtle">
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={`text-xl font-heading font-bold ${accent ? 'text-accent' : 'text-white'}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl p-5 relative" style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-accent/70 uppercase tracking-widest font-semibold">Net profit this month</p>
            <p className="text-3xl font-heading font-bold text-accent mt-0.5">${net.toLocaleString()}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-accent/70 uppercase tracking-widest font-semibold">ROI multiple</p>
            <p className="text-3xl font-heading font-bold text-accent mt-0.5">{roi.toFixed(1)}×</p>
          </div>
        </div>
        <p className="text-xs text-accent/60 mt-3 leading-relaxed">
          Break even at just <strong className="text-accent">{breakEven} leads</strong>. Every lead after that is pure margin.
        </p>
      </div>
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

function ComparisonTable() {
  const rows = [
    { label: 'Monthly cost',     leg: '$500/mo flat',      angi: '$300/yr + $40–100/lead',  tt: '$11–18/lead' },
    { label: 'Lead exclusivity', leg: 'Only you',           angi: '3–5 competitors',          tt: 'Shared' },
    { label: 'Avg close rate',   leg: '~65%',               angi: '~20–30%',                 tt: '~25%' },
    { label: 'Your territory',   leg: 'Locked in forever',  angi: 'None',                    tt: 'None' },
    { label: 'Lead quality',     leg: 'High intent',        angi: 'Variable',                tt: 'Variable' },
    { label: 'Commitment',       leg: 'Cancel anytime',     angi: 'Annual contract',          tt: 'Cancel anytime' },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr>
            <th className="py-3 pr-6 text-left text-muted font-medium text-xs uppercase tracking-wide w-40" />
            <th className="py-3 px-4 text-center" style={{ background: 'rgba(0,229,160,0.06)', borderRadius: '12px 12px 0 0' }}>
              <div className="font-heading font-bold text-accent text-base">Legenly</div>
              <div className="text-xs text-accent/60 font-normal">exclusive territory</div>
            </th>
            <th className="py-3 px-4 text-center">
              <div className="font-heading font-semibold text-white/60 text-base">Angie's List</div>
              <div className="text-xs text-muted font-normal">shared leads</div>
            </th>
            <th className="py-3 px-4 text-center">
              <div className="font-heading font-semibold text-white/60 text-base">Thumbtack</div>
              <div className="text-xs text-muted font-normal">pay-per-lead</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
              <td className="py-3 pr-6 text-muted text-xs">{row.label}</td>
              <td className="py-3 px-4 text-center" style={{ background: 'rgba(0,229,160,0.04)' }}>
                <span className="text-accent font-semibold text-xs">{row.leg}</span>
              </td>
              <td className="py-3 px-4 text-center text-muted text-xs">{row.angi}</td>
              <td className="py-3 px-4 text-center text-muted text-xs">{row.tt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Social Proof Strip ───────────────────────────────────────────────────────

function SocialProof() {
  const proofs = [
    { quote: 'Got 3 jobs my first week. The lead quality is night and day versus Angi.', name: 'Hunter P.', location: 'Forsyth County, GA', rev: '$2,100' },
  ];

  return (
    <div className="grid md:grid-cols-1 gap-5">
      {proofs.map((p) => (
        <div
          key={p.name}
          className="rounded-2xl p-7 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,160,0.06) 0%, rgba(0,229,160,0.02) 100%)',
            border: '1px solid rgba(0,229,160,0.15)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.1) 0%, transparent 70%)' }}
          />
          <p className="text-[28px] text-accent/40 font-heading font-black leading-none mb-3 relative select-none">"</p>
          <p className="text-white text-base leading-relaxed mb-5 relative font-medium">
            {p.quote}
          </p>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-white text-sm font-semibold">{p.name}</p>
              <p className="text-muted text-xs">{p.location}</p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)' }}
            >
              <p className="text-[10px] text-accent/60 uppercase tracking-wide">Week 1 revenue</p>
              <p className="text-accent font-heading font-extrabold text-lg leading-tight">{p.rev}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Waitlist() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    monthlyRevenue: '', leadSources: [], monthlyLeadSpend: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, cities: [] });
  const [showOptional, setShowOptional] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const formRef = useRef(null);
  const heroRef = useRef(null);

  const slotsLeft = TOTAL_SLOTS - 1; // 1 active subscriber (Hunter)
  const liveTotal = stats.total > 0 ? stats.total : 30; // fallback to 30 until API responds

  useEffect(() => {
    axios.get('/api/waitlist/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setShowStickyCta(heroBottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  const toggleLeadSource = (src) =>
    setForm(prev => ({
      ...prev,
      leadSources: prev.leadSources.includes(src)
        ? prev.leadSources.filter(s => s !== src)
        : [...prev.leadSources, src],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/waitlist/join', form);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-bg border border-subtle rounded-xl px-4 py-3.5 text-white text-sm ' +
    'placeholder-muted focus:outline-none focus:border-accent ' +
    'focus:shadow-[0_0_0_3px_rgba(0,229,160,0.1)] transition-all duration-200';

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-bg relative overflow-x-hidden">
        <GridBg />
        <div
          aria-hidden
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.13) 0%, transparent 70%)' }}
        />
        <nav className="border-b border-subtle bg-surface/70 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
            <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
              <span className="text-white">Legen</span><span className="text-accent">ly</span>
            </a>
            <a href="/" className="text-sm text-muted hover:text-white transition-colors">Login →</a>
          </div>
        </nav>
        <div className="relative z-10 max-w-lg mx-auto px-4 py-24 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)', boxShadow: '0 0 40px rgba(0,229,160,0.2)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-white mb-3">You're on the list.</h1>
          <p className="text-muted text-lg mb-2">
            We'll reach out within <span className="text-white font-semibold">24–48 hours</span> to discuss your{' '}
            <span className="text-accent font-semibold">{form.city}</span> territory.
          </p>
          <p className="text-muted text-sm mb-8">
            Keep an eye on your phone — Dominick calls personally.
          </p>

          {/* Referral nudge */}
          <div
            className="rounded-2xl p-6 mb-6 text-left"
            style={{ background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)' }}
          >
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">Know another junk removal operator?</p>
            <p className="text-white text-sm font-medium mb-3">
              Share Legenly — if they sign up, you both get priority placement on our launch list.
            </p>
            <button
              onClick={() => {
                const url = window.location.origin + '/waitlist';
                if (navigator.share) {
                  navigator.share({ title: 'Legenly — Exclusive Junk Removal Leads', url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied!');
                }
              }}
              className="w-full py-3 rounded-xl text-sm font-bold font-heading text-bg bg-accent hover:bg-accent-dim transition-colors"
              style={{ boxShadow: '0 0 20px rgba(0,229,160,0.2)' }}
            >
              Share with a Fellow Operator →
            </button>
          </div>

          {stats.cities.length > 0 && (
            <div
              className="rounded-2xl p-6 text-left"
              style={{ background: '#111118', border: '1px solid #1e1e2a', boxShadow: '0 4px 40px rgba(0,0,0,0.5)' }}
            >
              <p className="text-xs text-muted uppercase tracking-widest font-medium mb-4">
                Hot cities right now
              </p>
              {stats.cities.slice(0, 5).map((c, i) => (
                <div key={c.city} className="flex items-center justify-between py-2.5 border-b border-subtle/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-mono w-4">{i + 1}</span>
                    <span className="text-sm text-white">{c.city}</span>
                  </div>
                  <span className="text-xs text-accent font-mono font-bold">
                    {c.count} {c.count === 1 ? 'operator' : 'operators'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main waitlist page ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GridBg />

      {/* Top hero glow */}
      <div
        aria-hidden
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.11) 0%, transparent 65%)' }}
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-subtle bg-surface/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>
          <div className="flex items-center gap-5">
            {stats.total > 0 && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                {stats.total} on waitlist
              </span>
            )}
            <a href="/" className="text-sm text-muted hover:text-white transition-colors">
              Subscriber Login →
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative z-10 pt-16 pb-10 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
          {slotsLeft} founding slots remaining — launching April 7
        </div>

        <h1
          className="font-heading font-black text-5xl md:text-6xl lg:text-[5rem] mb-8"
          style={{ letterSpacing: '-0.015em', lineHeight: '1.12' }}
        >
          <span className="block text-white">The Exclusive Lead</span>
          <span className="block text-white">Platform for Junk</span>
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
            Removal Operators.
          </span>
        </h1>

        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
          We run Facebook ads in your city, capture the leads, and route every single one{' '}
          <span className="text-white font-semibold">exclusively to you</span>.
          One operator per market. No bidding. No competition. Just jobs.
        </p>

        <p className="text-white/40 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
          Junk King franchises cost up to $487K to get an exclusive territory.
          Legenly does the same thing for <span className="text-accent font-semibold">$500/month</span> — and you can cancel anytime.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <button
            onClick={scrollToForm}
            className="relative px-9 py-4 bg-accent text-bg font-heading font-bold text-base rounded-xl transition-all hover:bg-accent-dim active:scale-95"
            style={{ boxShadow: '0 0 28px rgba(0,229,160,0.3), 0 4px 16px rgba(0,0,0,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(0,229,160,0.45), 0 4px 20px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,160,0.3), 0 4px 16px rgba(0,0,0,0.3)'; }}
          >
            Claim Your City →
          </button>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 border border-subtle text-muted hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all"
          >
            See how it works ↓
          </button>
        </div>

        {/* Proof pills */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted">
          {[
            { icon: '🔒', text: 'One operator per city' },
            { icon: '⚡', text: 'Leads hit your phone instantly' },
            { icon: '💰', text: '$500/mo flat — no per-lead fees' },
            { icon: '✅', text: 'Cancel anytime' },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              {icon} {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── City ticker ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-subtle bg-surface/40 backdrop-blur-sm py-3.5 mb-16 overflow-hidden">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{ animation: 'ticker-scroll 35s linear infinite' }}
        >
          {[...TICKER_CITIES, ...TICKER_CITIES].map((city, i) => (
            <span key={i} className="flex items-center gap-2.5 px-7 text-sm text-muted/70 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/35 shrink-0" />
              {city}
            </span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />
      </div>

      {/* ── Territory Map ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <div className="text-center mb-8">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">Territories</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Your market might already be claimed.
            </h2>
            <p className="text-muted text-sm mt-2 max-w-md mx-auto">
              High-demand metros are filling up fast. If your city is available, lock it in before someone else does.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TerritoryMap onClaimClick={scrollToForm} />
            </div>
            <div className="space-y-4">
              <ActivityFeed />
              <ScarcityBanner slotsLeft={slotsLeft} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">How it works</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Three steps to owning your market
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '🗺️',
              title: 'Claim Your Territory',
              desc: 'Join the waitlist and lock in your city. The first junk removal operator in any metro gets exclusive rights — no one can take it from you, ever.',
            },
            {
              step: '02',
              icon: '📲',
              title: 'Leads Hit Your Phone',
              desc: 'We run Facebook ads in your market. Every quote request goes directly to you — and only you. No bidding. No competition. Instant notification.',
            },
            {
              step: '03',
              icon: '🏆',
              title: 'Close. Keep 100% of the Profit.',
              desc: 'Exclusive leads close at 65%. You break even in 2–3 jobs. Every lead after that is pure margin you keep — not margin you split with 4 other guys.',
            },
          ].map((item, i) => (
            <Reveal key={item.step} delay={i * 80}>
              <TiltCard>
                <div
                  className="bg-surface border border-subtle rounded-2xl p-7 h-full relative overflow-hidden group hover:border-accent/25 transition-colors duration-300"
                  style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.45)' }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 30% 30%, rgba(0,229,160,0.04) 0%, transparent 60%)' }}
                  />
                  <span
                    className="absolute top-5 right-5 font-heading font-extrabold text-6xl leading-none text-white/[0.04] group-hover:text-white/[0.08] transition-colors duration-300 select-none"
                  >
                    {item.step}
                  </span>
                  <div className="text-3xl mb-5 relative">{item.icon}</div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2 relative">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed relative">{item.desc}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <div className="text-center mb-8">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">From the field</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Real results, real operators
            </h2>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <SocialProof />
        </Reveal>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <div
            className="rounded-2xl border border-subtle p-8 md:p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg, rgba(0,229,160,0.05) 0%, transparent 55%)', boxShadow: '0 4px 48px rgba(0,0,0,0.5)' }}
          >
            <div
              aria-hidden
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 relative">
              <StatCard value={391} suffix="%" label="higher close rate vs shared leads" />
              <StatCard value={65} suffix="%" label="average close rate on exclusive leads" />
              <StatCard value={500} prefix="$" label="flat monthly fee — zero per-lead charges" />
              <StatCard value={1} label="operator per city — that's the whole point" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── The Math ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">The math</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Run the numbers yourself
            </h2>
            <p className="text-muted mt-2 max-w-md mx-auto text-sm">
              Drag the sliders and see your exact ROI before committing to anything.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Reveal delay={0}>
            <div className="space-y-5">
              {/* Franchise comparison */}
              <div
                className="bg-surface border border-subtle rounded-2xl p-6 relative overflow-hidden"
                style={{ boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(0,229,160,0.04) 0%, transparent 60%)' }}
                />
                <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-5 relative">
                  vs. Buying a franchise
                </p>
                <div className="space-y-3.5 relative">
                  {[
                    { name: 'Junk King franchise',      cost: '$93K – $180K upfront' },
                    { name: 'College Hunks franchise',  cost: '$89K – $280K upfront' },
                    { name: '1-800-GOT-JUNK franchise', cost: '$178K – $487K upfront' },
                  ].map(({ name, cost }) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-sm text-white/70">{name}</span>
                      <span className="text-sm text-muted line-through">{cost}</span>
                    </div>
                  ))}
                  <div className="border-t border-subtle/60 pt-3.5 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Legenly exclusive territory</span>
                    <span className="text-base font-extrabold text-accent">$500/mo</span>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed mt-4 pt-4 border-t border-subtle/40 relative">
                  Both give you an exclusive territory. One costs six figures. The other is $500/month and you can cancel anytime.
                </p>
              </div>

              {/* Close rate bars */}
              <div
                className="bg-surface border border-subtle rounded-2xl p-6"
                style={{ boxShadow: '0 4px 28px rgba(0,0,0,0.45)' }}
              >
                <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-5">
                  Why exclusive leads close better
                </p>
                <div className="space-y-4">
                  {[
                    { label: 'Legenly (exclusive)',  rate: 65, color: '#00e5a0' },
                    { label: "Angi's List (shared)", rate: 28, color: '#3a3a50' },
                    { label: 'Thumbtack (shared)',   rate: 25, color: '#3a3a50' },
                  ].map(({ label, rate, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-muted">{label}</span>
                        <span style={{ color }} className="font-mono font-bold">{rate}%</span>
                      </div>
                      <div className="h-2 bg-bg rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rate}%`, background: color, transition: 'width 1.2s ease' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <RoiCalc />
          </Reveal>
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 mb-16">
        <Reveal>
          <h2 className="font-heading text-2xl md:text-3xl font-black text-white mb-6 text-center" style={{ letterSpacing: '-0.02em' }}>
            How we stack up
          </h2>
          <div
            className="bg-surface border border-subtle rounded-2xl p-4 md:p-8"
            style={{ boxShadow: '0 4px 48px rgba(0,0,0,0.45)' }}
          >
            <ComparisonTable />
          </div>
        </Reveal>
      </section>

      {/* ── Pre-form FOMO ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-2xl mx-auto px-4 md:px-8 mb-8 text-center">
        <Reveal>
          <div
            className="rounded-2xl px-8 py-8 mb-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,160,0.07) 0%, rgba(0,229,160,0.02) 100%)',
              border: '1px solid rgba(0,229,160,0.15)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,160,0.08) 0%, transparent 60%)' }}
            />
            <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-3 relative">Last call</p>
            <h2 className="font-heading text-2xl md:text-3xl font-black text-white mb-3 relative" style={{ letterSpacing: '-0.02em' }}>
              Your city is open.<br />
              <span className="text-accent">It won't be for long.</span>
            </h2>
            <p className="text-muted text-sm leading-relaxed max-w-md mx-auto relative">
              {liveTotal}+ operators have already joined the waitlist. Founding slots are capped at 50.
              When they're gone, the price goes up and exclusivity becomes harder to guarantee.
            </p>
            <div className="mt-5 flex justify-center gap-8 relative">
              {[
                { val: `${liveTotal}+`, label: 'on waitlist' },
                { val: `${slotsLeft}`, label: 'slots left' },
                { val: 'Apr 7', label: 'launch date' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-heading font-black text-white">{val}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Sticky mobile CTA — appears after hero scrolls out ────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300"
        style={{ transform: showStickyCta ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div
          className="mx-3 mb-3 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(10,10,18,0.97)',
            border: '1px solid rgba(0,229,160,0.25)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 0 24px rgba(0,229,160,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="min-w-0">
            <p className="text-white font-heading font-bold text-sm leading-tight">{slotsLeft} slots left</p>
            <p className="text-muted text-xs">No payment. Lock in your city now.</p>
          </div>
          <button
            onClick={scrollToForm}
            className="shrink-0 px-5 py-2.5 bg-accent text-bg font-heading font-bold text-sm rounded-xl transition-all active:scale-95"
            style={{ boxShadow: '0 0 20px rgba(0,229,160,0.3)' }}
          >
            Claim City →
          </button>
        </div>
      </div>

      {/* ── Waitlist form ─────────────────────────────────────────────────────── */}
      <section ref={formRef} className="relative z-10 max-w-2xl mx-auto px-4 md:px-8 pb-36">
        <Reveal>
          <div
            className="rounded-2xl p-6 md:p-10 relative overflow-hidden"
            style={{
              background: '#0e0e16',
              border: '1px solid #1e1e2a',
              boxShadow: '0 0 100px rgba(0,229,160,0.07), 0 0 40px rgba(0,229,160,0.04), 0 8px 64px rgba(0,0,0,0.65)',
            }}
          >
            {/* Form inner glow */}
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
                {slotsLeft} founding slots remaining
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white mb-2">
                Secure your territory
              </h2>
              <p className="text-muted text-sm">
                No payment today. We'll call you personally when your city is ready to launch.
              </p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm relative">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                    Full Name *
                  </label>
                  <input
                    className={inputClass} placeholder="John Smith" required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                    Phone *
                  </label>
                  <input
                    className={inputClass} placeholder="770-555-0100" type="tel" required
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                  Email *
                </label>
                <input
                  className={inputClass} placeholder="john@yourcompany.com" type="email" required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                  Your city / metro *{' '}
                  <span className="text-accent normal-case font-normal">— this becomes your exclusive territory</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Dallas, TX or Forsyth County, GA"
                  required
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                />
              </div>

              {/* Optional qualifier fields — collapsed by default to reduce friction */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptional(p => !p)}
                  className="w-full flex items-center justify-between text-xs text-muted hover:text-white transition-colors py-1"
                >
                  <span>{showOptional ? 'Hide optional details' : 'Add optional details (helps us prepare your territory)'}</span>
                  <span className="ml-2">{showOptional ? '▲' : '▼'}</span>
                </button>

                {showOptional && (
                  <div className="mt-3 space-y-4 pt-3 border-t border-subtle/50">
                    <div>
                      <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                        Monthly revenue range
                      </label>
                      <select
                        className={`${inputClass} appearance-none cursor-pointer`}
                        value={form.monthlyRevenue}
                        onChange={e => setForm(p => ({ ...p, monthlyRevenue: e.target.value }))}
                      >
                        <option value="">Select range</option>
                        {MONTHLY_REVENUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-2">
                        How do you get leads today?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LEAD_SOURCES.map(src => (
                          <button
                            key={src} type="button" onClick={() => toggleLeadSource(src)}
                            className={[
                              'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                              form.leadSources.includes(src)
                                ? 'bg-accent/15 border-accent/40 text-accent'
                                : 'bg-bg border-subtle text-muted hover:border-white/20 hover:text-white',
                            ].join(' ')}
                            style={form.leadSources.includes(src)
                              ? { boxShadow: '0 0 12px rgba(0,229,160,0.12)' }
                              : {}}
                          >
                            {src}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                        Monthly lead spend
                      </label>
                      <select
                        className={`${inputClass} appearance-none cursor-pointer`}
                        value={form.monthlyLeadSpend}
                        onChange={e => setForm(p => ({ ...p, monthlyLeadSpend: e.target.value }))}
                      >
                        <option value="">Select range</option>
                        {MONTHLY_SPEND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3">
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
                      Joining…
                    </span>
                  ) : (
                    'Secure My Territory →'
                  )}
                </button>
                <p className="text-center text-xs text-muted mt-3 leading-relaxed">
                  No payment required to join. First come, first served — one exclusive slot per city.
                </p>
              </div>
            </form>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
