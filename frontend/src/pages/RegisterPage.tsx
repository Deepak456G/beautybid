import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Mail, User as UserIcon, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role: 'BRAND',
        brandName: brandName || name,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
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
          <h1 className="font-serif text-3xl font-bold text-noir-900">Register Brand Account</h1>
          <p className="text-xs text-noir-600">
            Create an account to submit beauty formulations, track promotional bids, and view conversion logs.
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
              <label className="block font-semibold text-noir-700 mb-1">Your Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs"
                  required
                />
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-noir-400" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-noir-700 mb-1">Brand Name *</label>
              <div className="relative">
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. PureGlow Botanicals"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs"
                  required
                />
                <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-noir-400" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-noir-700 mb-1">Work Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="growth@pureglow.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-noir-400" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-noir-700 mb-1">Password (min 6 chars) *</label>
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
                  <span>Create Brand Account</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-noir-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-gold-700 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
