import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { analyticsApi } from '../services/api';

interface LeaderboardTableProps {
  products: Product[];
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ products }) => {
  const navigate = useNavigate();

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100 border-b border-cream-200 text-noir-600 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-semibold text-center w-16">Rank</th>
              <th className="py-3.5 px-4 font-semibold">Product & Brand</th>
              <th className="py-3.5 px-4 font-semibold">Category</th>
              <th className="py-3.5 px-4 font-semibold text-right">Verified Spend</th>
              <th className="py-3.5 px-4 font-semibold text-right">To Outbid</th>
              <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200 text-noir-800">
            {products.map((product, idx) => {
              const rank = product.rank || idx + 1;
              return (
                <tr
                  key={product.id}
                  className="hover:bg-cream-50/80 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  {/* Rank */}
                  <td className="py-4 px-4 text-center font-serif font-bold text-sm">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        rank === 1
                          ? 'bg-amber-400 text-noir-900 font-bold shadow-xs'
                          : rank === 2
                          ? 'bg-slate-200 text-noir-800'
                          : rank === 3
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'text-noir-500 font-sans text-xs'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  {/* Product & Brand */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-cream-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-noir-900 hover:text-gold-700 transition-colors truncate max-w-xs sm:max-w-md">
                          {product.name}
                        </p>
                        <p className="text-noir-500 text-[11px] flex items-center gap-1">
                          {product.brand.name}
                          {product.brand.verified && <CheckCircle2 className="w-3 h-3 text-gold-600 inline" />}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-4 px-4">
                    <span className="bg-cream-100 text-noir-700 px-2 py-0.5 rounded text-[11px] border border-cream-200">
                      {product.category.name}
                    </span>
                  </td>

                  {/* Verified Spend */}
                  <td className="py-4 px-4 text-right font-semibold text-noir-900">
                    {formatINR(product.verifiedSpend)}
                  </td>

                  {/* Cost to Next Rank */}
                  <td className="py-4 px-4 text-right">
                    <span className="font-medium text-gold-800 bg-gold-50 px-2.5 py-1 rounded-md border border-gold-200 text-[11px]">
                      {formatINR(product.costToNextRank || 500)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/promote?productId=${product.id}&targetRank=${Math.max(1, rank - 1)}`)}
                        className="px-3 py-1 rounded-lg bg-noir-900 hover:bg-noir-800 text-cream-50 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Outbid</span>
                        <ArrowUpRight className="w-3 h-3 text-gold-400" />
                      </button>
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => analyticsApi.trackEvent(product.id, 'external_click')}
                        className="p-1.5 rounded-lg text-noir-600 hover:text-noir-900 hover:bg-cream-200 transition-colors"
                        title="Visit official website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
