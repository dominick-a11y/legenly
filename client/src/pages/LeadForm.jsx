import React, { useState } from 'react';
import axios from 'axios';

const JOB_TYPES = ['Garage', 'Estate', 'Appliance', 'Commercial', 'Other'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

export default function LeadForm() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: '', state: 'GA', jobType: '', description: ''
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
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Request Received!</h2>
          <p style={styles.successText}>
            A local junk removal professional will contact you shortly — usually within the hour.
          </p>
          <p style={styles.successSub}>No obligation. Free estimate.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>LEGENLY</div>
          <h1 style={styles.title}>Get a Free Junk Removal Quote</h1>
          <p style={styles.subtitle}>
            Tell us what you need hauled — a local pro will call you fast.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name + Phone */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Your Name *</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Phone Number *</label>
              <input
                style={styles.input}
                type="tel"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.fieldFull}>
            <label style={styles.label}>Email (optional)</label>
            <input
              style={styles.input}
              type="email"
              placeholder="jane@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          {/* City + State */}
          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 2 }}>
              <label style={styles.label}>City *</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Cumming"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>State</label>
              <select
                style={styles.input}
                value={form.state}
                onChange={e => set('state', e.target.value)}
              >
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Type */}
          <div style={styles.fieldFull}>
            <label style={styles.label}>What needs to go?</label>
            <div style={styles.jobGrid}>
              {JOB_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  style={{
                    ...styles.jobBtn,
                    ...(form.jobType === type ? styles.jobBtnActive : {})
                  }}
                  onClick={() => set('jobType', type)}
                >
                  {type === 'Garage' && '🏠 '}
                  {type === 'Estate' && '🏡 '}
                  {type === 'Appliance' && '🧊 '}
                  {type === 'Commercial' && '🏢 '}
                  {type === 'Other' && '📦 '}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={styles.fieldFull}>
            <label style={styles.label}>Describe what you need removed (optional)</label>
            <textarea
              style={{ ...styles.input, ...styles.textarea }}
              placeholder="Old furniture, boxes of stuff, broken appliances — give us as much detail as you'd like..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, ...(loading ? styles.submitDisabled : {}) }}
          >
            {loading ? 'Sending…' : 'Get My Free Quote →'}
          </button>

          <p style={styles.disclaimer}>
            No spam. No obligation. A local operator will call you — not a call center.
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Inter', -apple-system, sans-serif"
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '4px',
    color: '#6366f1',
    marginBottom: '16px'
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0',
    lineHeight: '1.2'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '15px',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  fieldFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#0f172a',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    transition: 'border-color 0.15s'
  },
  textarea: {
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
    lineHeight: '1.5'
  },
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
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
    transition: 'all 0.15s'
  },
  jobBtnActive: {
    background: '#ede9fe',
    borderColor: '#6366f1',
    color: '#4f46e5'
  },
  submitBtn: {
    padding: '14px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.15s'
  },
  submitDisabled: {
    background: '#a5b4fc',
    cursor: 'not-allowed'
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '14px'
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: '#d1fae5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    color: '#10b981',
    margin: '0 auto 20px'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    margin: '0 0 12px 0'
  },
  successText: {
    color: '#475569',
    textAlign: 'center',
    fontSize: '15px',
    margin: '0 0 8px 0',
    lineHeight: '1.6'
  },
  successSub: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
    margin: 0
  }
};
