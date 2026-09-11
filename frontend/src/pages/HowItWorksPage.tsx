import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Lock,
  Clock,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const HowItWorksPage: React.FC = () => {
  const faqs = [
    {
      q: 'Does a higher rank mean the product is better in quality?',
      a: 'No. Rankings on BeautyBid are strictly promotional rankings determined by verified monetary investment made by brands. They do NOT reflect laboratory efficacy, clinical dermatological trials, or editorial endorsements.',
    },
    {
      q: 'How is the required outbid amount calculated?',
      a: 'To claim Rank #K, the server checks the current verified spend of the product occupying Rank #K ($S_K$) and adds the minimum increment (e.g. ₹500). If your product already has an existing spend, you only pay the difference: Target Spend - Existing Spend.',
    },
    {
      q: 'What happens if two brands pay simultaneously?',
      a: 'BeautyBid uses row-level database transactions with atomic concurrency locking. If two payments arrive simultaneously, the transaction completed first wins the target rank; the second transaction will recalculate according to the newly updated spend.',
    },
    {
      q: 'What if two products have the exact same spend?',
      a: 'Our ranking engine employs a strict tie-breaker: earlier verified promotion timestamp. The product whose promotional payment was verified earlier retains the superior rank.',
    },
    {
      q: 'Can client code tamper with the required payment amount?',
      a: 'Never. Any amount submitted by the browser is strictly discarded. The server computes the required amount directly from live database state before generating the Razorpay payment order.',
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-700" />
            <span>Editorial Transparency</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-noir-900">
            How BeautyBid Works
          </h1>
          <p className="text-xs sm:text-sm text-noir-600 max-w-xl mx-auto leading-relaxed">
            A radical departure from hidden sponsorship deals and biased influencer reviews. BeautyBid makes promotional visibility 100% public, verified, and transparent.
          </p>
        </div>

        {/* The 4-Pillar Mechanics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-editorial space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-noir-900">
              1. Spend-Based Promotion
            </h3>
            <p className="text-xs text-noir-600 leading-relaxed">
              Every rank on the leaderboard is held by the product with the highest verified promotional spend. Brands compete publicly for the #1 spotlight, transparently logging each campaign in INR.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-editorial space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-noir-900">
              2. Server-Side Integrity
            </h3>
            <p className="text-xs text-noir-600 leading-relaxed">
              Frontend inputs are never trusted. All outbid amounts are strictly determined on our server using:
              <br />
              <code className="bg-cream-100 px-2 py-1 rounded text-gold-800 font-mono text-[11px] mt-1 inline-block">
                Required = Target Spend + Min Increment
              </code>
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-editorial space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-noir-900">
              3. Automated Razorpay Verification
            </h3>
            <p className="text-xs text-noir-600 leading-relaxed">
              Rank changes only occur after a payment signature is cryptographically verified via Razorpay webhook. Failed or pending payments never alter the leaderboard.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-editorial space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-100 text-gold-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-noir-900">
              4. Deterministic Tie-Breakers
            </h3>
            <p className="text-xs text-noir-600 leading-relaxed">
              In the event that two products hold identical promotional spend totals, rank priority is awarded to the product whose payment transaction was verified earliest.
            </p>
          </div>
        </div>

        {/* Consumer Protection & Disclosure Box */}
        <div className="bg-cream-200/80 rounded-3xl p-8 border border-gold-300 text-noir-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gold-700" />
            <h3 className="font-serif text-xl font-bold text-noir-900">
              Consumer Disclosure & Ethics
            </h3>
          </div>
          <p className="text-xs text-noir-700 leading-relaxed">
            BeautyBid explicitly rejects disguised advertorials. Traditional media often disguises paid promotions as independent "editor's picks". On BeautyBid, every rupee paid for promotional placement is openly recorded on a public ledger.
          </p>
          <div className="p-4 bg-white/80 rounded-2xl border border-cream-300 text-xs text-noir-700">
            <strong>Mandatory Consumer Rule:</strong> Always consult dermatologist reviews, ingredient labels, and independent patch test results before purchasing any cosmetic formulation.
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-noir-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-cream-300 shadow-xs space-y-2"
              >
                <h4 className="font-serif text-base font-bold text-noir-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-noir-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center pt-8">
          <Link
            to="/promote"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-noir-900 text-cream-50 text-xs font-semibold uppercase tracking-wider shadow-editorial hover:shadow-editorial-hover transition-all"
          >
            <span>Ready to promote your beauty product?</span>
            <ArrowUpRight className="w-4 h-4 text-gold-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
