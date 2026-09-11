import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Eye,
  TrendingUp,
  LayoutGrid,
  List,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DisclosureBanner } from '../components/DisclosureBanner';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { productsApi } from '../services/api';
import { Product, Category, LeaderboardResponse } from '../types';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters from search params
  const activeCategory = searchParams.get('category') || 'all';
  const activeSort = searchParams.get('sort') || 'highest_spend';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await productsApi.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await productsApi.getLeaderboard({
          category: activeCategory,
          sort: activeSort,
          search: searchQuery,
          page: currentPage,
          limit: 30,
        });
        setData(res);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeCategory, activeSort, searchQuery, currentPage]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', searchInput);
  };

  const sortOptions = [
    { id: 'highest_spend', label: 'Highest Spend', icon: TrendingUp },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'newest', label: 'Newest', icon: Clock },
    { id: 'most_viewed', label: 'Most Viewed', icon: Eye },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Top Mandatory Disclosure */}
      <DisclosureBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-cream-300/60 bg-gradient-to-b from-cream-50 to-cream-100/50">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-100/80 border border-gold-300/80 text-xs font-semibold text-gold-900 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-gold-700" />
            <span className="tracking-wide uppercase text-[11px]">
              India's Premier Promotional Beauty Platform
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-noir-900 leading-[1.08]">
            India's Beauty Product{' '}
            <span className="italic font-normal text-gold-600">Leaderboard</span>
          </h1>

          <p className="text-base sm:text-xl text-noir-600 font-light max-w-2xl mx-auto leading-relaxed">
            Brands compete for visibility. You decide what to discover.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/promote"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-noir-900 text-cream-50 hover:bg-noir-800 text-sm font-semibold uppercase tracking-wider shadow-editorial hover:shadow-editorial-hover transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Promote Your Product</span>
              <ArrowUpRight className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <a
              href="#leaderboard-section"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-cream-50 hover:bg-white text-noir-900 text-sm font-semibold uppercase tracking-wider border border-cream-300 hover:border-gold-400 transition-all text-center"
            >
              Explore Leaderboard
            </a>
          </div>

          {/* Hero Metrics Strip */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-cream-300 shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-noir-500 font-medium block">
                Platform Formula
              </span>
              <span className="text-sm font-bold text-noir-900 mt-0.5 block">
                Rank = Verified Spend
              </span>
            </div>

            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-cream-300 shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-noir-500 font-medium block">
                Verification Gateway
              </span>
              <span className="text-sm font-bold text-noir-900 mt-0.5 block">
                Razorpay Automated
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-cream-300 shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-noir-500 font-medium block">
                Minimum Increment
              </span>
              <span className="text-sm font-bold text-gold-700 mt-0.5 block">
                ₹{data?.minIncrement || 500} INR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Leaderboard */}
      <section id="leaderboard-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Controls: Search, Sort & View Mode */}
        <div className="space-y-4 mb-8">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search products or brands (e.g. Minimalist, Serum)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-cream-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-xs text-noir-900 placeholder-noir-400 transition-all shadow-xs"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-noir-400" />
            </form>

            {/* Sort options and View toggle */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-cream-300 shadow-xs overflow-x-auto">
                {sortOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateFilter('sort', opt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        activeSort === opt.id
                          ? 'bg-noir-900 text-cream-50 shadow-xs'
                          : 'text-noir-600 hover:text-noir-900 hover:bg-cream-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-cream-300 shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-cream-200 text-noir-900' : 'text-noir-500 hover:text-noir-900'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-cream-200 text-noir-900' : 'text-noir-500 hover:text-noir-900'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar border-b border-cream-300/60 pb-3">
            <button
              onClick={() => updateFilter('category', 'all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-gold-500 text-white shadow-xs'
                  : 'bg-white text-noir-700 hover:bg-cream-200/80 border border-cream-300'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => updateFilter('category', cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-gold-500 text-white shadow-xs'
                    : 'bg-white text-noir-700 hover:bg-cream-200/80 border border-cream-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Product List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-cream-300 p-6 shadow-editorial animate-pulse flex flex-col sm:flex-row gap-6 items-center"
              >
                <div className="w-36 h-36 bg-cream-200 rounded-xl" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-4 bg-cream-200 rounded w-1/4" />
                  <div className="h-6 bg-cream-200 rounded w-3/4" />
                  <div className="h-4 bg-cream-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="space-y-4">
              {data.items.map((product, idx) => (
                <LeaderboardCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          ) : (
            <LeaderboardTable products={data.items} />
          )
        ) : (
          <div className="bg-white rounded-2xl border border-cream-300 p-12 text-center shadow-editorial">
            <p className="text-base font-semibold text-noir-800">No beauty products found</p>
            <p className="text-xs text-noir-500 mt-1">Try adjusting your filters or search terms.</p>
            <button
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              className="mt-4 px-4 py-2 bg-noir-900 text-cream-50 text-xs font-semibold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* How it works feature spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-cream-200/60 rounded-3xl p-8 sm:p-12 border border-cream-300 text-center space-y-10">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-[11px] uppercase tracking-widest text-gold-700 font-bold">
              Transparent Mechanics
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-noir-900">
              How BeautyBid Promotional Rankings Work
            </h2>
            <p className="text-xs text-noir-600 leading-relaxed">
              Every rank on BeautyBid is determined by verified promotional investment. No opaque algorithms or fake editorial reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-noir-900 text-gold-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-serif text-lg font-bold text-noir-900">Choose Desired Rank</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Pick the rank position your brand wants to claim. Our server calculates the exact increment needed to outbid the current holder.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-noir-900 text-gold-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-serif text-lg font-bold text-noir-900">Verify Via Razorpay</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Pay securely in INR. Our backend verifies the cryptographic payment signature and webhooks with duplicate protection.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-full bg-noir-900 text-gold-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-serif text-lg font-bold text-noir-900">Instant Recalculation</h3>
              <p className="text-xs text-noir-600 leading-relaxed">
                Your product immediately claims its new rank. The promotional spend and timestamp are logged on the public verification ledger.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
