import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ArrowLeft,
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  Eye,
  MousePointerClick,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { productsApi, paymentsApi, analyticsApi } from '../services/api';
import { Product, SafePaymentHistoryItem } from '../types';
import { SafePaymentHistory } from '../components/SafePaymentHistory';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<(Product & { costToClaimRankOne: number; totalActiveProducts: number }) | null>(null);
  const [history, setHistory] = useState<SafePaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const prod = await productsApi.getProductBySlug(slug);
        setProduct(prod);

        // Track view
        analyticsApi.trackEvent(prod.id, 'view');

        // Fetch safe public payment history
        paymentsApi.getProductHistory(prod.id).then(setHistory).finally(() => setHistoryLoading(false));
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleVisitOfficial = () => {
    if (!product) return;
    analyticsApi.trackEvent(product.id, 'external_click');
    window.open(product.productUrl, '_blank', 'noopener,noreferrer');
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-96 bg-cream-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-cream-200 rounded w-3/4" />
            <div className="h-4 bg-cream-100 rounded w-1/2" />
            <div className="h-24 bg-cream-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="font-serif text-2xl font-bold text-noir-900">Product Not Found</h2>
        <p className="text-xs text-noir-600 mt-2">The beauty formulation you requested could not be located.</p>
        <Link to="/" className="mt-4 px-6 py-2.5 rounded-full bg-noir-900 text-cream-50 text-xs font-semibold">
          Return to Leaderboard
        </Link>
      </div>
    );
  }

  const rank = product.currentRank || 1;

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb back */}
        <div className="flex items-center gap-2 text-xs text-noir-500 mb-8">
          <Link to="/" className="hover:text-noir-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-noir-400" />
          <Link to={`/?category=${product.category.slug}`} className="hover:text-noir-900 transition-colors">
            {product.category.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-noir-400" />
          <span className="text-noir-900 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Product Media Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-cream-300 shadow-editorial aspect-square">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md ${
                    rank === 1
                      ? 'bg-amber-400 text-noir-900'
                      : rank === 2
                      ? 'bg-slate-200 text-noir-900'
                      : rank === 3
                      ? 'bg-amber-700 text-cream-50'
                      : 'bg-noir-900 text-cream-50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>#{rank} PROMOTIONAL RANK</span>
                </div>
              </div>
            </div>

            {/* Brand Card preview */}
            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">Official Brand</p>
                <p className="font-serif font-bold text-noir-900 text-base flex items-center gap-1.5 mt-0.5">
                  {product.brand.name}
                  {product.brand.verified && <CheckCircle2 className="w-4 h-4 text-gold-600" />}
                </p>
                {product.brand.description && (
                  <p className="text-xs text-noir-600 mt-1 line-clamp-1">{product.brand.description}</p>
                )}
              </div>
              {product.brand.websiteUrl && (
                <a
                  href={product.brand.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-gold-700 hover:text-gold-900 underline underline-offset-4"
                >
                  Brand Site
                </a>
              )}
            </div>
          </div>

          {/* Right: Formulation Details & Promotion Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Category & Status */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-gold-100 text-gold-800 font-semibold border border-gold-200">
                {product.category.name}
              </span>
              <span className="text-noir-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{product.viewsCount.toLocaleString()} views</span>
              </span>
              <span className="text-noir-500 flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>{product.clicksCount.toLocaleString()} clicks</span>
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-noir-900 leading-tight">
              {product.name}
            </h1>

            <p className="text-sm text-noir-700 leading-relaxed">
              {product.description}
            </p>

            {/* Promotional Spend Highlights Box */}
            <div className="bg-white rounded-2xl border border-gold-300/80 p-6 shadow-editorial space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                <div>
                  <span className="text-xs text-noir-500 font-medium">Verified Promotional Spend</span>
                  <p className="font-serif text-3xl font-bold text-noir-900 mt-0.5">
                    {formatINR(product.verifiedSpend)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-noir-500 font-medium">Current Position</span>
                  <p className="font-serif text-2xl font-bold text-gold-700 mt-0.5">
                    #{rank} of {product.totalActiveProducts}
                  </p>
                </div>
              </div>

              {/* Next rank outbid prompt */}
              <div className="bg-cream-100 p-4 rounded-xl border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-noir-900">
                    {rank === 1 ? 'Defend & Boost #1 Rank' : `Claim Rank #${rank - 1}`}
                  </p>
                  <p className="text-[11px] text-noir-600 mt-0.5">
                    Calculated required incremental promotion:
                  </p>
                </div>
                <span className="font-serif text-xl font-bold text-gold-700">
                  {formatINR(product.costToNextRank || product.minIncrement || 500)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() =>
                    navigate(`/promote?productId=${product.id}&targetRank=${Math.max(1, rank - 1)}`)
                  }
                  className="w-full py-3.5 px-6 rounded-full bg-noir-900 text-cream-50 hover:bg-noir-800 text-xs font-semibold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 group transition-all"
                >
                  <TrendingUp className="w-4 h-4 text-gold-400 group-hover:scale-110 transition-transform" />
                  <span>Outbid & Claim Rank</span>
                </button>

                <button
                  onClick={handleVisitOfficial}
                  className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-cream-50 text-noir-900 border border-cream-300 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Visit Product</span>
                  <ExternalLink className="w-4 h-4 text-gold-600" />
                </button>
              </div>
            </div>

            {/* Ranking History Audit Trail */}
            {product.rankingHistory && product.rankingHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-3">
                <h3 className="font-serif text-sm font-bold text-noir-900">
                  Recent Promotional Milestones
                </h3>
                <div className="space-y-2 text-xs">
                  {product.rankingHistory.slice(0, 3).map((rh) => (
                    <div
                      key={rh.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-cream-50 border border-cream-200"
                    >
                      <span className="font-medium text-noir-800">
                        Achieved Rank #{rh.rank}
                      </span>
                      <span className="text-gold-700 font-semibold">
                        {formatINR(Number(rh.verifiedSpend))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Public Safe Payment History Component */}
        <div className="mt-16">
          <SafePaymentHistory history={history} loading={historyLoading} />
        </div>
      </div>
    </div>
  );
};
