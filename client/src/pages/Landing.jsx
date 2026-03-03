import React, { useState } from 'react';
import axios from 'axios';

const STEPS = 3;

const JOB_TYPES = [
  { label: 'Garage Cleanout', icon: '🏠' },
  { label: 'Estate Cleanout', icon: '🏡' },
  { label: 'Appliances', icon: '🧊' },
  { label: 'Yard Debris', icon: '🌿' },
  { label: 'Furniture', icon: '🛋️' },
  { label: 'Other', icon: '📦' },
];

const SIZES = [
  { label: 'Small load', sub: 'Truck bed or less' },
  { label: 'Medium load', sub: '1–2 rooms of stuff' },
  { label: 'Large load', sub: 'Full truckload+' },
];

export default function Landing() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    jobType: '', size: '', city: '', state: 'GA', name: '', phone: '', email: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function next() {
    setError('');
    if (step === 2 && !form.city.trim()) {
      setError('Please enter your city.');
      return;
    }
    setStep(s => s + 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/leads/public', {
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city || 'Unknown',
        state: form.state,
        jobType: form.jobType,
        description: form.size,
      });
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const progress = submitted ? 100 : ((step - 1) / STEPS) * 100;

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logo}>LEGENLY</span>
        </div>

        {/* Progress bar */}
        {!submitted && (
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>
        )}

        {/* ── STEP 1: Job type ── */}
        {!submitted && step === 1 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>Step 1 of 3</p>
            <h1 style={s.heading}>What do you need removed?</h1>
            <p style={s.sub}>Select all that apply — no obligation to book.</p>
            <div style={s.jobGrid}>
              {JOB_TYPES.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  style={{ ...s.jobBtn, ...(form.jobType === label ? s.jobBtnActive : {}) }}
                  onClick={() => set('jobType', label)}
                >
                  <span style={s.jobIcon}>{icon}</span>
                  <span style={s.jobLabel}>{label}</span>
                </button>
              ))}
            </div>
            <button
              style={{ ...s.cta, ...(form.jobType ? {} : s.ctaDisabled) }}
              disabled={!form.jobType}
              onClick={next}
            >
              Continue →
            </button>
            <p style={s.skip} onClick={() => { set('jobType', 'Other'); next(); }}>Skip this step</p>
          </div>
        )}

        {/* ── STEP 2: Location + size ── */}
        {!submitted && step === 2 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>Step 2 of 3</p>
            <h1 style={s.heading}>Where are you located?</h1>
            <p style={s.sub}>We'll match you with a local operator who can help fast.</p>

            <div style={s.field}>
              <label style={s.label}>Your city *</label>
              <input
                style={s.input}
                type="text"
                placeholder="Cumming"
                autoFocus
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>How much stuff?</label>
              <div style={s.sizeGrid}>
                {SIZES.map(({ label, sub }) => (
                  <button
                    key={label}
                    type="button"
                    style={{ ...s.sizeBtn, ...(form.size === label ? s.sizeBtnActive : {}) }}
                    onClick={() => set('size', label)}
                  >
                    <span style={s.sizeName}>{label}</span>
                    <span style={s.sizeSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button style={s.cta} onClick={next}>
              Continue →
            </button>
            <p style={s.back} onClick={() => setStep(1)}>← Back</p>
          </div>
        )}

        {/* ── STEP 3: Contact info ── */}
        {!submitted && step === 3 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>Step 3 of 3</p>
            <h1 style={s.heading}>How should we reach you?</h1>
            <p style={s.sub}>A local operator will call you — usually within the hour.</p>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Your name *</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Jane Smith"
                  autoFocus
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Phone number *</label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="(770) 555-0100"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email (optional)</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="jane@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>

              {error && <div style={s.error}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ ...s.cta, ...(loading ? s.ctaDisabled : {}) }}
              >
                {loading ? 'Sending…' : 'Get My Free Quote →'}
              </button>
            </form>

            <p style={s.disclaimer}>
              No spam. No obligation. A local operator calls you — not a call center.
            </p>
            <p style={s.back} onClick={() => setStep(2)}>← Back</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {submitted && (
          <div style={s.stepWrap}>
            <div style={s.successIcon}>✓</div>
            <h1 style={s.heading}>You're all set, {form.name.split(' ')[0]}!</h1>
            <p style={s.sub}>
              A local operator will call you at <strong>{form.phone}</strong> — usually within the hour.
            </p>

            {/* Extended content — keeps user on page, feeds pixel more data */}
            <div style={s.extendedWrap}>
              <div style={s.extCard}>
                <span style={s.extIcon}>⚡</span>
                <div>
                  <div style={s.extTitle}>Same-week availability</div>
                  <div style={s.extText}>Most jobs scheduled within 24–48 hours of your call.</div>
                </div>
              </div>
              <div style={s.extCard}>
                <span style={s.extIcon}>📍</span>
                <div>
                  <div style={s.extTitle}>Local, not a franchise</div>
                  <div style={s.extText}>
                    We work exclusively with owner-operated junk removal companies in your area.
                    {form.city ? ` Serving ${form.city} and surrounding communities.` : ''}
                  </div>
                </div>
              </div>
              <div style={s.extCard}>
                <span style={s.extIcon}>🤝</span>
                <div>
                  <div style={s.extTitle}>Verified & insured</div>
                  <div style={s.extText}>Every operator is vetted before joining the Legenly network.</div>
                </div>
              </div>
            </div>

            <div style={s.partnerBadge}>
              Powered by <strong>Dumpire</strong> in Forsyth County, GA
            </div>
          </div>
        )}

        {/* Bottom trust bar */}
        {!submitted && (
          <div style={s.trustBar}>
            <span>✓ Free estimate</span>
            <span>✓ No obligation</span>
            <span>✓ Local operator</span>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #0a0f1e 0%, #0f172a 70%, #12102b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  logoRow: {
    padding: '20px 28px 0',
  },
  logo: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '4px',
    color: '#7c3aed',
  },
  progressTrack: {
    height: '3px',
    background: '#f1f5f9',
    margin: '16px 0 0',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #6366f1)',
    transition: 'width 0.4s ease',
    borderRadius: '0 2px 2px 0',
  },
  stepWrap: {
    padding: '28px 28px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#7c3aed',
    letterSpacing: '0.5px',
    margin: 0,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.25',
  },
  sub: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.6',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  jobBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    background: '#f8fafc',
    cursor: 'pointer',
    textAlign: 'left',
  },
  jobBtnActive: {
    background: '#ede9fe',
    borderColor: '#7c3aed',
  },
  jobIcon: {
    fontSize: '20px',
  },
  jobLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#0f172a',
    outline: 'none',
    background: '#f8fafc',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  sizeGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sizeBtn: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 16px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    background: '#f8fafc',
    cursor: 'pointer',
    textAlign: 'left',
  },
  sizeBtnActive: {
    background: '#ede9fe',
    borderColor: '#7c3aed',
  },
  sizeName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
  },
  sizeSub: {
    fontSize: '12px',
    color: '#64748b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cta: {
    padding: '15px',
    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
  },
  ctaDisabled: {
    background: '#c4b5fd',
    cursor: 'not-allowed',
  },
  skip: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
    margin: '-4px 0 0',
  },
  back: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
    margin: 0,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '13px',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5',
  },
  trustBar: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
  },
  // Success
  successIcon: {
    width: '60px',
    height: '60px',
    background: '#d1fae5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    color: '#10b981',
    margin: '0 auto',
  },
  extendedWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '4px',
  },
  extCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  extIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  extTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '2px',
  },
  extText: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
  },
  partnerBadge: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    padding: '8px 0 4px',
  },
};
