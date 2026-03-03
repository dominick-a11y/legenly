import React, { useState } from 'react';
import axios from 'axios';

const JOB_TYPES = ['Garage', 'Estate', 'Appliance', 'Yard', 'Commercial', 'Other'];

export default function Landing() {
  const [form, setForm] = useState({
    name: '', phone: '', city: '', state: 'GA', jobType: '', description: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim() || !form.city.trim()) {
      setError('Name, phone, and city are required.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/leads/public', form);
      // Fire pixel Lead event on successful submission
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

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navLogo}>LEGENLY</div>
        <a href="/login" style={s.navLink}>Operator Login →</a>
      </nav>

      <div style={s.main}>
        {/* LEFT — COPY */}
        <div style={s.left}>
          <div style={s.badge}>🤝 Proud partner with Dumpire · Forsyth County, GA</div>

          <h1 style={s.headline}>
            Get Your Junk Gone <span style={s.accent}>This Week</span>
          </h1>

          <p style={s.sub}>
            We connect Georgia homeowners with local, vetted junk removal operators.
            Fill out the form and a pro will call you within the hour — no call centers, no runaround.
          </p>

          <div style={s.trustList}>
            {['Local operator calls you — not a call center', 'Free estimate, zero obligation', 'Same-week availability in most areas'].map(t => (
              <div key={t} style={s.trustItem}>
                <span style={s.check}>✓</span>
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div style={s.markets}>
            <div style={s.marketsLabel}>Currently serving:</div>
            <div style={s.marketTags}>
              {['Cumming', 'Alpharetta', 'Johns Creek', 'Suwanee', 'Dawsonville', 'Ball Ground'].map(city => (
                <span key={city} style={s.tag}>{city}, GA</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div style={s.right}>
          {submitted ? (
            <div style={s.card}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>You're all set!</h2>
              <p style={s.successText}>
                A local junk removal operator will call you within the hour.
              </p>
              <p style={s.successSub}>Free estimate · No obligation</p>
            </div>
          ) : (
            <div style={s.card}>
              <h2 style={s.formTitle}>Get a Free Quote</h2>
              <p style={s.formSub}>Takes 30 seconds. A local pro calls you fast.</p>

              <form onSubmit={handleSubmit} style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Your Name *</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Phone Number *</label>
                  <input
                    style={s.input}
                    type="tel"
                    placeholder="(770) 555-0100"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>City *</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Cumming"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.label}>What needs to go?</label>
                  <div style={s.jobGrid}>
                    {JOB_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        style={{ ...s.jobBtn, ...(form.jobType === type ? s.jobBtnActive : {}) }}
                        onClick={() => set('jobType', type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Anything else? (optional)</label>
                  <textarea
                    style={{ ...s.input, ...s.textarea }}
                    placeholder="Old couch, appliances, full garage cleanout…"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {error && <div style={s.error}>{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...s.submitBtn, ...(loading ? s.submitDisabled : {}) }}
                >
                  {loading ? 'Sending…' : 'Get My Free Quote →'}
                </button>

                <p style={s.disclaimer}>
                  No spam. No obligation. A local operator will call you — not a call center.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer style={s.footer}>
        <span>© {new Date().getFullYear()} Legenly · Lead Marketplace</span>
        <a href="/login" style={s.footerLink}>Operator Login</a>
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #0a0f1e 0%, #0f172a 60%, #1a1035 100%)',
    color: '#f8fafc',
    fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  navLogo: {
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '4px',
    color: '#a78bfa',
  },
  navLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '60px',
    padding: '60px 40px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  },
  left: {
    flex: '1 1 380px',
    minWidth: '300px',
  },
  right: {
    flex: '1 1 380px',
    minWidth: '300px',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(167, 139, 250, 0.12)',
    border: '1px solid rgba(167, 139, 250, 0.3)',
    borderRadius: '999px',
    padding: '6px 16px',
    fontSize: '13px',
    color: '#a78bfa',
    marginBottom: '24px',
    fontWeight: '500',
  },
  headline: {
    fontSize: 'clamp(32px, 5vw, 52px)',
    fontWeight: '800',
    lineHeight: '1.15',
    margin: '0 0 20px 0',
    color: '#f1f5f9',
  },
  accent: {
    color: '#a78bfa',
  },
  sub: {
    fontSize: '17px',
    color: '#94a3b8',
    lineHeight: '1.7',
    margin: '0 0 32px 0',
  },
  trustList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '36px',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    color: '#cbd5e1',
  },
  check: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: '16px',
  },
  markets: {
    marginTop: '8px',
  },
  marketsLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  marketTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '36px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    color: '#0f172a',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '800',
    margin: '0 0 6px 0',
    color: '#0f172a',
  },
  formSub: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    padding: '11px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '80px',
    lineHeight: '1.5',
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  jobBtn: {
    padding: '10px 8px',
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
    borderColor: '#7c3aed',
    color: '#5b21b6',
  },
  submitBtn: {
    padding: '14px',
    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  submitDisabled: {
    background: '#a5b4fc',
    cursor: 'not-allowed',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '14px',
  },
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
    margin: '0 auto 20px',
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 12px 0',
  },
  successText: {
    color: '#475569',
    textAlign: 'center',
    fontSize: '15px',
    margin: '0 0 8px 0',
    lineHeight: '1.6',
  },
  successSub: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: '13px',
    color: '#475569',
  },
  footerLink: {
    color: '#64748b',
    textDecoration: 'none',
  },
};
