import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LEAD_SOURCES = [
  'Word of mouth',
  "Angie's List",
  'Thumbtack',
  'Google',
  'Facebook Ads',
  'Other'
];

const MONTHLY_REVENUE_OPTIONS = [
  'Under $5,000/mo',
  '$5,000 – $10,000/mo',
  '$10,000 – $20,000/mo',
  '$20,000+/mo'
];

const MONTHLY_SPEND_OPTIONS = [
  'Nothing yet',
  'Under $100/mo',
  '$100 – $300/mo',
  '$300 – $600/mo',
  '$600+/mo'
];

function RoiCalc() {
  const [jobValue, setJobValue] = useState(325);
  const [leadsPerMonth, setLeadsPerMonth] = useState(8);
  const closeRate = 0.65;
  const subCost = 500;

  const closedJobs = Math.round(leadsPerMonth * closeRate);
  const revenue = closedJobs * jobValue;
  const net = revenue - subCost;
  const roi = revenue / subCost;
  const breakEvenLeads = Math.ceil(subCost / (jobValue * closeRate));

  return (
    <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <h3 className="font-heading text-xl font-bold text-white mb-2">ROI Calculator</h3>
      <p className="text-muted text-sm mb-6">See your projected return before you commit to anything.</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs text-muted uppercase tracking-wide font-medium">Your average job value</label>
            <span className="text-sm font-semibold text-accent font-mono">${jobValue.toLocaleString()}</span>
          </div>
          <input
            type="range" min="150" max="800" step="25"
            value={jobValue}
            onChange={e => setJobValue(Number(e.target.value))}
            className="w-full accent-[#00e5a0] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted mt-0.5">
            <span>$150 (appliance)</span>
            <span>$800 (estate)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs text-muted uppercase tracking-wide font-medium">Leads per month we generate</label>
            <span className="text-sm font-semibold text-accent font-mono">{leadsPerMonth}</span>
          </div>
          <input
            type="range" min="4" max="20" step="1"
            value={leadsPerMonth}
            onChange={e => setLeadsPerMonth(Number(e.target.value))}
            className="w-full accent-[#00e5a0] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted mt-0.5">
            <span>4/mo (slow month)</span>
            <span>20/mo (peak)</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-bg rounded-xl p-3 border border-subtle">
          <p className="text-xs text-muted mb-1">Leads / month</p>
          <p className="text-xl font-heading font-bold text-white">{leadsPerMonth}</p>
        </div>
        <div className="bg-bg rounded-xl p-3 border border-subtle">
          <p className="text-xs text-muted mb-1">Closed jobs (65%)</p>
          <p className="text-xl font-heading font-bold text-white">{closedJobs}</p>
        </div>
        <div className="bg-bg rounded-xl p-3 border border-subtle">
          <p className="text-xs text-muted mb-1">Est. revenue</p>
          <p className="text-xl font-heading font-bold text-white">${revenue.toLocaleString()}</p>
        </div>
        <div className="bg-bg rounded-xl p-3 border border-subtle">
          <p className="text-xs text-muted mb-1">Subscription cost</p>
          <p className="text-xl font-heading font-bold text-muted">$500</p>
        </div>
      </div>

      {/* Net ROI highlight */}
      <div className="mt-3 rounded-xl p-4 bg-accent/10 border border-accent/25">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-accent/70 uppercase tracking-wide font-medium">Net profit this month</p>
            <p className="text-2xl font-heading font-bold text-accent mt-0.5">${net.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-accent/70 uppercase tracking-wide font-medium">ROI</p>
            <p className="text-2xl font-heading font-bold text-accent mt-0.5">{roi.toFixed(1)}×</p>
          </div>
        </div>
        <p className="text-xs text-accent/60 mt-2">
          You only need <strong className="text-accent">{breakEvenLeads} leads</strong> to break even. Everything above that is profit.
        </p>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    { label: 'Monthly cost',         legenly: '$500/mo',      angi: '$300/yr + $40–100/lead',  thumbtack: '$11–18/lead' },
    { label: 'Lead exclusivity',      legenly: '✅ Only you',  angi: '❌ 3–5 competitors',       thumbtack: '❌ Shared' },
    { label: 'Avg close rate',        legenly: '~65%',         angi: '~20–30%',                 thumbtack: '~25%' },
    { label: 'Lead quality',          legenly: 'High intent',  angi: 'Variable',                thumbtack: 'Variable' },
    { label: 'Your territory',        legenly: '✅ Locked in', angi: '❌ None',                  thumbtack: '❌ None' },
    { label: 'Cancel anytime',        legenly: '✅ Yes',        angi: '❌ Annual contract',       thumbtack: '✅ Yes' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr>
            <th className="text-left py-3 pr-4 text-muted font-medium w-40"></th>
            <th className="py-3 px-4 text-center">
              <div className="font-heading font-bold text-accent text-base">Legenly</div>
              <div className="text-xs text-accent/60">exclusive territory</div>
            </th>
            <th className="py-3 px-4 text-center">
              <div className="font-heading font-bold text-white text-base">Angie's List</div>
              <div className="text-xs text-muted">shared leads</div>
            </th>
            <th className="py-3 px-4 text-center">
              <div className="font-heading font-bold text-white text-base">Thumbtack</div>
              <div className="text-xs text-muted">pay-per-lead</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? 'bg-surface/40' : ''}>
              <td className="py-3 pr-4 text-muted text-xs">{row.label}</td>
              <td className="py-3 px-4 text-center text-accent font-medium">{row.legenly}</td>
              <td className="py-3 px-4 text-center text-muted">{row.angi}</td>
              <td className="py-3 px-4 text-center text-muted">{row.thumbtack}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Waitlist() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    monthlyRevenue: '', leadSources: [], monthlyLeadSpend: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, cities: [] });
  const formRef = useRef(null);

  useEffect(() => {
    axios.get('/api/waitlist/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const toggleLeadSource = (src) => {
    setForm(prev => ({
      ...prev,
      leadSources: prev.leadSources.includes(src)
        ? prev.leadSources.filter(s => s !== src)
        : [...prev.leadSources, src]
    }));
  };

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

  const inputClass = "w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors";

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="border-b border-subtle bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <a href="/" className="font-heading font-extrabold text-xl tracking-tight">
            <span className="text-white">Legen</span><span className="text-accent">ly</span>
          </a>
          <a
            href="/"
            className="text-sm text-muted hover:text-white transition-colors"
          >
            Subscriber Login →
          </a>
        </div>
      </nav>

      {/* Success state */}
      {submitted ? (
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="font-heading text-3xl font-bold text-white mb-3">You're on the list.</h1>
          <p className="text-muted text-lg mb-2">
            We'll reach out when a slot in <span className="text-accent font-semibold">{form.city}</span> opens.
          </p>
          <p className="text-muted text-sm">
            In the meantime, we'll keep you posted on launch dates and how many operators are signing up in your area.
          </p>
          <div className="mt-8 p-4 bg-surface border border-subtle rounded-2xl text-left">
            <p className="text-xs text-muted uppercase tracking-wide mb-3 font-medium">Top cities on the waitlist right now</p>
            {stats.cities.slice(0, 5).map((c, i) => (
              <div key={c.city} className="flex items-center justify-between py-1.5 border-b border-subtle/50 last:border-0">
                <span className="text-sm text-white">{c.city}</span>
                <span className="text-xs text-accent font-mono font-semibold">{c.count} {c.count === 1 ? 'operator' : 'operators'}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <section className="max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-12 text-center">
            {stats.total > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                {stats.total} operators on the waitlist
              </div>
            )}
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              The Only Lead Platform That<br />
              <span className="text-accent">Doesn't Share Your Leads</span>
            </h1>
            <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Pay $500/month. Get every junk removal lead we generate in your city — and <strong className="text-white">only you</strong> gets them.
              No competing with 4 other contractors on the same customer.
            </p>
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-block px-8 py-4 bg-accent hover:bg-accent-dim text-bg font-heading font-bold text-base rounded-xl transition-colors"
            >
              Claim Your Territory →
            </button>
            <p className="text-xs text-muted mt-3">One operator per city. No commitment to join the waitlist.</p>
          </section>

          {/* 3 bullet hooks */}
          <section className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: '🔒',
                  title: 'Exclusive Territory',
                  desc: "One operator per city. When a lead comes in from your area, it goes to you and only you — forever."
                },
                {
                  icon: '⚡',
                  title: 'Real-Time Delivery',
                  desc: "Leads hit your phone in seconds. Calling within 5 minutes gives you a 391% higher conversion rate."
                },
                {
                  icon: '💰',
                  title: 'Break Even in 2 Jobs',
                  desc: "At $325/job and 65% close rate, you need 3–4 leads to pay for your subscription. Everything else is profit."
                }
              ].map(item => (
                <div key={item.title} className="bg-surface border border-subtle rounded-2xl p-6">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-heading font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ROI Calculator */}
          <section className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="font-heading text-2xl font-bold text-white mb-3">
                  Run the math yourself
                </h2>
                <p className="text-muted mb-6 leading-relaxed">
                  We don't want you to take our word for it. Enter your average job value and see exactly how fast you break even — and how much you profit above that.
                </p>
                {/* Franchise anchor */}
                <div className="bg-surface border border-subtle rounded-2xl p-5 mb-6">
                  <p className="text-xs text-muted uppercase tracking-wide font-medium mb-3">The franchise comparison</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Junk King franchise fee</span>
                      <span className="text-muted line-through">$93K – $180K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">What you get</span>
                      <span className="text-muted">Exclusive territory</span>
                    </div>
                    <div className="border-t border-subtle pt-2 flex justify-between">
                      <span className="text-white font-semibold">Legenly</span>
                      <span className="text-accent font-bold">$500/month · Same exclusivity</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Close rate assumes exclusive leads (65%). Shared leads on Angi/Thumbtack typically close at 20–30%.
                </p>
              </div>
              <RoiCalc />
            </div>
          </section>

          {/* Comparison table */}
          <section className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
            <h2 className="font-heading text-2xl font-bold text-white mb-6 text-center">
              How we stack up
            </h2>
            <div className="bg-surface border border-subtle rounded-2xl p-4 md:p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <ComparisonTable />
            </div>
          </section>

          {/* Waitlist form */}
          <section ref={formRef} className="max-w-2xl mx-auto px-4 md:px-8 pb-24">
            <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-10" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(0,229,160,0.05)' }}>
              <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">Claim your territory</h2>
                <p className="text-muted text-sm">
                  We're launching in hotspot cities first — based on demand.
                  Join the waitlist to lock your city before someone else does.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Full Name *</label>
                    <input
                      className={inputClass}
                      placeholder="John Smith"
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Phone *</label>
                    <input
                      className={inputClass}
                      placeholder="770-555-0100"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Email *</label>
                  <input
                    className={inputClass}
                    placeholder="john@yourcompany.com"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                    Your city / metro area * <span className="text-accent">(this determines your territory)</span>
                  </label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Dallas, TX or Forsyth County, GA"
                    required
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">Monthly revenue range</label>
                  <select
                    className={`${inputClass} appearance-none`}
                    value={form.monthlyRevenue}
                    onChange={e => setForm(p => ({ ...p, monthlyRevenue: e.target.value }))}
                  >
                    <option value="">Select range (optional)</option>
                    {MONTHLY_REVENUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-2">
                    How do you currently get leads? (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LEAD_SOURCES.map(src => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => toggleLeadSource(src)}
                        className={[
                          'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                          form.leadSources.includes(src)
                            ? 'bg-accent/15 border-accent/40 text-accent'
                            : 'bg-bg border-subtle text-muted hover:border-muted hover:text-white'
                        ].join(' ')}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted uppercase tracking-wide font-medium mb-1.5">
                    How much do you spend on leads per month?
                  </label>
                  <select
                    className={`${inputClass} appearance-none`}
                    value={form.monthlyLeadSpend}
                    onChange={e => setForm(p => ({ ...p, monthlyLeadSpend: e.target.value }))}
                  >
                    <option value="">Select range (optional)</option>
                    {MONTHLY_SPEND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent hover:bg-accent-dim disabled:opacity-60 text-bg font-heading font-bold py-4 rounded-xl transition-colors text-base tracking-wide mt-2"
                >
                  {submitting ? 'Joining…' : 'Claim My Territory →'}
                </button>

                <p className="text-center text-xs text-muted">
                  No payment required to join. We'll reach out when your city opens.
                  <br />One slot per city — first come, first served.
                </p>
              </form>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
