import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
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
          <h2 className="font-heading text-xl font-semibold mb-6 text-white">Sign In</h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-accent hover:bg-accent-dim text-bg font-heading font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide"
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
