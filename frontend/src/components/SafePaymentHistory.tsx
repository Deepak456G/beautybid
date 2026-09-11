import React from 'react';
import { ShieldCheck, CheckCircle2, History, ArrowUpRight } from 'lucide-react';
import { SafePaymentHistoryItem } from '../types';

interface SafePaymentHistoryProps {
  history: SafePaymentHistoryItem[];
  loading?: boolean;
}

export const SafePaymentHistory: React.FC<SafePaymentHistoryProps> = ({ history, loading }) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 p-6 shadow-editorial animate-pulse space-y-4">
        <div className="h-5 bg-cream-200 rounded w-1/3" />
        <div className="h-10 bg-cream-100 rounded" />
        <div className="h-10 bg-cream-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-cream-200 bg-cream-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gold-600" />
          <h3 className="font-serif text-base font-bold text-noir-900">
            Public Promotion & Verification Log
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Razorpay Verified Ledger</span>
        </div>
      </div>

      {/* Transparency Note */}
      <div className="px-5 py-2.5 bg-cream-100/60 border-b border-cream-200/80 text-[11px] text-noir-600">
        In compliance with transparency guidelines, only cryptographic verification timestamps, promotional amounts, and ranks achieved are publicly visible. Private banking identifiers remain strictly confidential.
      </div>

      {/* History Items */}
      {history.length === 0 ? (
        <div className="p-8 text-center text-xs text-noir-500">
          No promotional events recorded yet for this product.
        </div>
      ) : (
        <div className="divide-y divide-cream-200 text-xs">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cream-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center font-bold text-xs shrink-0">
                  #{item.rankAchieved}
                </div>
                <div>
                  <p className="font-semibold text-noir-900 flex items-center gap-1">
                    <span>Rank #{item.rankAchieved} Claimed</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </p>
                  <p className="text-noir-500 text-[11px]">{formatDate(item.date)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                <div>
                  <p className="text-[10px] text-noir-500 uppercase tracking-wider">Promotional Payment</p>
                  <p className="font-bold text-noir-900 text-sm">{formatINR(item.amount)}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-noir-500 uppercase tracking-wider">New Total Spend</p>
                  <p className="font-semibold text-gold-700">{formatINR(item.totalSpendAchieved)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
