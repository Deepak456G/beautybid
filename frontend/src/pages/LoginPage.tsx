import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(redirect);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      navigate(demoEmail.includes('admin') ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-md mx-auto px-4 pt-16 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-noir-900 text-gold-400 mx-auto flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-noir-900">Sign in to BeautyBid</h1>
          <p className="text-xs text-noir-600">
            Access your promotional brand dashboard or administrative controls.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-cream-300 p-8 shadow-editorial space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-noir-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@brand.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-noir-400" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-noir-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-noir-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-noir-900 hover:bg-noir-800 disabled:bg-noir-600 text-cream-50 font-semibold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-cream-200 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-bold block text-center">
              Quick 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('growth@beminimalist.co', 'BrandPassword@2026')}
                className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-[11px] font-semibold text-noir-900 text-left transition-colors"
              >
                💄 Brand: Minimalist
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@beautybid.in', 'AdminPassword@2026')}
                className="p-2 rounded-xl bg-gold-50 hover:bg-gold-100 border border-gold-300 text-[11px] font-semibold text-gold-900 text-left transition-colors"
              >
                👑 Platform Admin
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-noir-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-gold-700 hover:underline">
              Register brand
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
