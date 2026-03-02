import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = pick territory, 2 = account details
  const [markets, setMarkets] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/markets')
      .then(({ data }) => setMarkets(data))
      .catch(() => setMarkets([]))
      .finally(() => setMarketsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create account
      const { data: authData } = await axios.post('/api/auth/register', {
        name, email, password, market: selectedMarket
      });
      login(authData.token, authData.user);

      // 2. Kick off Stripe checkout (skip if not configured yet)
      try {
        const { data: billing } = await axios.post(
          '/api/billing/create-checkout',
          {},
          { headers: { Authorization: `Bearer ${authData.token}` } }
        );
        window.location.href = billing.url;
      } catch {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl font-extrabold tracking-tight leading-none">
            <span className="text-white">Legen</span>
            <span className="text-accent">ly</span>
          </h1>
          <p className="text-muted text-sm mt-2 tracking-wide">
            Exclusive Junk Removal Leads
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-surface rounded-2xl border border-subtle p-8"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'bg-accent' : 'bg-subtle'}`}
              />
            ))}
          </div>

          {/* ── Step 1: Choose Territory ── */}
          {step === 1 && (
            <>
              <h2 className="font-heading text-xl font-semibold mb-1 text-white">
                Claim Your Territory
              </h2>
              <p className="text-muted text-sm mb-5">
                Each market is exclusive — one operator per territory.
              </p>

              {marketsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent spin" />
                </div>
              ) : markets.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-3xl mb-3">🗺️</div>
                  <p className="text-white font-medium text-sm">No territories available right now.</p>
                  <p className="text-muted text-xs mt-1">Check back soon or contact us.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {markets.map(m => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedMarket(m.name)}
                      className={[
                        'w-full text-left px-4 py-3.5 rounded-xl border transition-all',
                        selectedMarket === m.name
                          ? 'bg-accent/10 border-accent/40'
                          : 'bg-bg border-subtle hover:border-muted'
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-semibold ${selectedMarket === m.name ? 'text-accent' : 'text-white'}`}>
                            {m.name}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {m.cities.split(',').slice(0, 3).join(', ')}
                            {m.cities.split(',').length > 3 ? ' & more' : ''}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          selectedMarket === m.name
                            ? 'bg-accent/20 text-accent'
                            : 'bg-subtle text-muted'
                        }`}>
                          Available
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                disabled={!selectedMarket}
                onClick={() => setStep(2)}
                className="w-full mt-5 bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
              >
                Claim {selectedMarket ? selectedMarket.split(' ').slice(0, 2).join(' ') : 'Territory'} →
              </button>
            </>
          )}

          {/* ── Step 2: Create Account ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-muted hover:text-white transition-colors text-sm"
                >
                  ←
                </button>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-white">Create Account</h2>
                  <p className="text-xs text-accent mt-0.5">Territory: {selectedMarket}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide font-medium">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted mb-1.5 uppercase tracking-wide font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-bg border border-subtle rounded-xl px-4 py-3 text-white text-sm placeholder-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <p className="text-xs text-muted pt-1">
                  By continuing you'll be taken to Stripe to complete your{' '}
                  <span className="text-white font-medium">$500/mo</span> subscription.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
                >
                  {loading ? 'Setting up your account…' : 'Continue to Payment →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-muted text-xs mt-5">
          Already have an account?{' '}
          <Link to="/" className="text-accent hover:underline">Sign In</Link>
        </p>

      </div>
    </div>
  );
}
