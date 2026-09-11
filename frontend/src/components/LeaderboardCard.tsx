import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowUpRight, TrendingUp, CheckCircle2, Award, Zap } from 'lucide-react';
import { Product } from '../types';
import { analyticsApi } from '../services/api';

interface LeaderboardCardProps {
  product: Product;
  index: number;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ product, index }) => {
  const navigate = useNavigate();
  const rank = product.rank || index + 1;

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    analyticsApi.trackEvent(product.id, 'external_click');
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    analyticsApi.trackEvent(product.id, 'card_click');
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Luxury Rank Badges
  const getRankBadge = () => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-gold-400 to-amber-500 text-noir-900 font-bold text-xs shadow-md border border-amber-300">
          <Award className="w-3.5 h-3.5 text-noir-900" />
          <span>#1 RANK</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 text-noir-800 font-bold text-xs shadow-sm border border-slate-300">
          <span>#2 RANK</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600/30 to-amber-700/40 text-amber-900 font-bold text-xs border border-amber-500/30">
          <span>#3 RANK</span>
        </div>
      );
    }
    return (
      <div className="px-2.5 py-1 rounded-full bg-cream-200 text-noir-700 font-semibold text-xs border border-cream-300">
        <span>#{rank}</span>
      </div>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden hover:shadow-editorial-hover ${
        rank === 1
          ? 'border-gold-400/80 shadow-gold-glow/40 ring-1 ring-gold-400/30'
          : 'border-cream-300/80 shadow-editorial hover:border-gold-300'
      }`}
    >
      {/* Editorial Card Layout */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Product Image and Rank Badge */}
        <div className="relative shrink-0 w-full sm:w-36 h-48 sm:h-36 rounded-xl overflow-hidden bg-cream-100 border border-cream-200">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2.5 left-2.5">{getRankBadge()}</div>

          {product.isFeatured && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-noir-900/80 backdrop-blur-xs text-cream-50 text-[10px] font-bold uppercase tracking-wider">
              Featured
            </div>
          )}
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Brand & Category row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-noir-900 uppercase tracking-wider flex items-center gap-1">
              {product.brand.name}
              {product.brand.verified && <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 inline" />}
            </span>
            <span className="text-noir-300">•</span>
            <span className="text-noir-500 bg-cream-100 px-2 py-0.5 rounded text-[11px] font-medium border border-cream-200">
              {product.category.name}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug}`}
            className="block font-serif text-lg sm:text-xl font-bold text-noir-900 hover:text-gold-700 transition-colors line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Description */}
          <p className="text-xs text-noir-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Metrics row */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <div className="flex items-center gap-1.5 bg-gold-50/80 border border-gold-200/60 px-3 py-1 rounded-lg">
              <span className="text-noir-600">Verified Spend:</span>
              <strong className="text-noir-900 font-bold tracking-tight">
                {formatINR(product.verifiedSpend)}
              </strong>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-noir-500 text-[11px]">
              <span>{product.viewsCount.toLocaleString()} views</span>
              <span>•</span>
              <span>{product.clicksCount.toLocaleString()} clicks</span>
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div className="shrink-0 w-full sm:w-auto flex flex-col sm:items-end gap-2.5 border-t sm:border-t-0 pt-4 sm:pt-0 border-cream-200">
          {/* Outbid / Claim Next Rank button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/promote?productId=${product.id}&targetRank=${Math.max(1, rank - 1)}`);
            }}
            className="w-full sm:w-48 px-4 py-2.5 rounded-xl bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300/80 text-xs font-semibold flex items-center justify-between shadow-xs transition-colors group/btn"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider text-gold-700 font-medium">
                {rank === 1 ? 'Defend #1 Rank' : `Claim Rank #${rank - 1}`}
              </span>
              <span className="font-bold text-noir-900">
                {formatINR(product.costToNextRank || 500)}
              </span>
            </div>
            <TrendingUp className="w-4 h-4 text-gold-700 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>

          {/* Action links */}
          <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
            <Link
              to={`/products/${product.slug}`}
              className="text-xs font-semibold text-noir-700 hover:text-noir-900 px-3 py-1.5 rounded-lg hover:bg-cream-100 transition-colors"
            >
              View Details
            </Link>

            <button
              onClick={handleExternalClick}
              className="inline-flex items-center gap-1 text-xs font-semibold text-cream-50 bg-noir-900 hover:bg-noir-800 px-3.5 py-1.5 rounded-lg transition-all"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3 text-gold-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
