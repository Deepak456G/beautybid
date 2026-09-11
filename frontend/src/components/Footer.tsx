import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-noir-900 text-cream-100 border-t border-noir-800 mt-24">
      {/* Top Banner Notice */}
      <div className="border-b border-noir-800 bg-noir-800/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-noir-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
            <p>
              <strong className="text-cream-50 font-semibold">Strict Transparency Notice:</strong>{' '}
              BeautyBid is a paid promotional leaderboard. Rankings reflect verified brand investment, not product reviews or medical efficacy.
            </p>
          </div>
          <Link
            to="/how-it-works"
            className="text-gold-400 hover:text-gold-300 underline underline-offset-4 flex items-center gap-1 shrink-0"
          >
            Learn How It Works <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-serif text-2xl font-bold text-cream-50">BeautyBid</span>
            </div>
            <p className="text-xs text-noir-400 leading-relaxed">
              India's first promotional beauty product leaderboard. Brands compete transparently for digital visibility through verified promotional spend.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-noir-800 border border-noir-700 text-[11px] text-gold-400 font-medium">
              <span>🇮🇳 Powered for Indian Beauty Tech</span>
            </div>
          </div>

          {/* Col 2: Discover */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-gold-300 mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs text-noir-400">
              <li>
                <Link to="/" className="hover:text-cream-50 transition-colors">
                  Top Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-cream-50 transition-colors">
                  All Beauty Categories
                </Link>
              </li>
              <li>
                <Link to="/?sort=trending" className="hover:text-cream-50 transition-colors">
                  Trending Formulations
                </Link>
              </li>
              <li>
                <Link to="/?sort=newest" className="hover:text-cream-50 transition-colors">
                  Newest Promotions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Brands & Developers */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-gold-300 mb-4">
              For Brands
            </h4>
            <ul className="space-y-2.5 text-xs text-noir-400">
              <li>
                <Link to="/promote" className="hover:text-cream-50 transition-colors font-medium text-cream-100">
                  Promote Your Product
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-cream-50 transition-colors">
                  Developer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-cream-50 transition-colors">
                  Ranking Mechanics & Bidding Rules
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cream-50 transition-colors">
                  Brand Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Integrity */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-gold-300 mb-4">
              Integrity & Trust
            </h4>
            <p className="text-xs text-noir-400 leading-relaxed mb-3">
              Every rank change is permanently backed by an encrypted payment hash and Razorpay settlement verification.
            </p>
            <div className="bg-noir-800/80 p-3 rounded-xl border border-noir-700 text-[11px] text-noir-300 space-y-1">
              <div className="flex justify-between">
                <span>Minimum Outbid:</span>
                <span className="text-gold-400 font-semibold">₹500 INR</span>
              </div>
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className="text-emerald-400 font-semibold">Instant & Automated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-noir-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-noir-500">
          <p>© {new Date().getFullYear()} BeautyBid India. All promotional rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="hover:text-cream-50 transition-colors">
              Disclosure Policy
            </Link>
            <Link to="/how-it-works" className="hover:text-cream-50 transition-colors">
              Terms of Promotion
            </Link>
            <Link to="/admin" className="hover:text-gold-400 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
