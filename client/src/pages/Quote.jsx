import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JOB_TYPES = [
  { key: 'Garage',     label: '🏠 Garage' },
  { key: 'Estate',     label: '🏡 Estate' },
  { key: 'Appliance',  label: '🧊 Appliance' },
  { key: 'Commercial', label: '🏢 Commercial' },
  { key: 'Other',      label: '📦 Other' },
];

export default function Quote() {
  const [jobType, setJobType]       = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone]           = useState('');
  const [sent, setSent]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Fire Meta pixel Lead event the moment this page loads
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Enter your phone number so we can match your details.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/leads/enrich', { phone: phone.trim(), jobType, description });
      setSent(true);
    } catch {
      setError('Something went wrong — but we still have your info and will call you soon.');
      setSent(true); // still show success, don't block them
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Brand */}
        <div style={s.logo}>LEGENLY</div>

        {/* Confirmation header — always visible */}
        <div style={s.checkWrap}>
          <div style={s.check}>✓</div>
        </div>
        <h1 style={s.heading}>You're all set!</h1>
        <p style={s.sub}>
          A local junk removal pro will call you <strong>within the hour</strong>.
          No obligation. Free estimate.
        </p>

        {/* Social proof strip */}
        <div style={s.proofRow}>
          <span style={s.proofItem}>⭐ 4.9 avg rating</span>
          <span style={s.proofDivider}>·</span>
          <span style={s.proofItem}>65% book same day</span>
          <span style={s.proofDivider}>·</span>
          <span style={s.proofItem}>Local operator</span>
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Enrichment form */}
        {!sent ? (
          <>
            <p style={s.enrichHeading}>Speed up your quote <span style={s.badge}>30 sec</span></p>
            <p style={s.enrichSub}>Optional — helps us give you a more accurate estimate before we call.</p>

            <form onSubmit={handleSubmit} style={s.form}>

              {/* Job type */}
              <div style={s.fieldGroup}>
                <label style={s.label}>What needs to go?</label>
                <div style={s.jobGrid}>
                  {JOB_TYPES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      style={{ ...s.jobBtn, ...(jobType === key ? s.jobBtnActive : {}) }}
                      onClick={() => setJobType(prev => prev === key ? '' : key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Describe it briefly</label>
                <textarea
                  style={{ ...s.input, ...s.textarea }}
                  placeholder="e.g. Full garage cleanout — old furniture, boxes, broken appliances..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Phone to match */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Your phone number</label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="(770) 555-0100"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              {error && <div style={s.error}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
              >
                {loading ? 'Sending…' : 'Send Details →'}
              </button>

            </form>
          </>
        ) : (
          <div style={s.sentWrap}>
            <p style={s.sentText}>Got it — we'll have your estimate ready when we call. Talk soon!</p>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  logo: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '4px',
    color: '#6366f1',
    marginBottom: '24px',
  },
  checkWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  check: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#d1fae5',
    color: '#10b981',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },
  heading: {
    textAlign: 'center',
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  sub: {
    textAlign: 'center',
    color: '#475569',
    fontSize: '15px',
    margin: '0 0 20px 0',
    lineHeight: '1.6',
  },
  proofRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  proofItem: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  proofDivider: {
    color: '#cbd5e1',
    fontSize: '13px',
  },
  divider: {
    borderTop: '1px solid #f1f5f9',
    marginBottom: '24px',
  },
  enrichHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    background: '#ede9fe',
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  enrichSub: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
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
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    minHeight: '80px',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  jobBtn: {
    padding: '10px 6px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  jobBtnActive: {
    background: '#ede9fe',
    borderColor: '#6366f1',
    color: '#4f46e5',
  },
  btn: {
    padding: '14px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  btnDisabled: {
    background: '#a5b4fc',
    cursor: 'not-allowed',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '13px',
  },
  sentWrap: {
    textAlign: 'center',
    padding: '8px 0',
  },
  sentText: {
    color: '#475569',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: 0,
  },
};
