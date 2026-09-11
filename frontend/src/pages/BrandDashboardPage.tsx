import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  CreditCard,
  BarChart3,
  ExternalLink,
  Plus,
  Eye,
  MousePointerClick,
  Award,
  Sparkles,
} from 'lucide-react';
import { productsApi, paymentsApi, analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const BrandDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'payments'>('overview');

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [prods, pays, ana] = await Promise.all([
          productsApi.getMyProducts().catch(() => []),
          paymentsApi.getMyPayments().catch(() => []),
          analyticsApi.getBrandSummary().catch(() => null),
        ]);
        setProducts(prods);
        setPayments(pays);
        setAnalytics(ana);
      } catch (err) {
        console.error('Error loading brand dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalSpend = products.reduce((sum, p) => sum + Number(p.verifiedSpend), 0);
  const bestRank =
    products.length > 0
      ? Math.min(...products.map((p) => p.rank || 999).filter((r) => r < 999))
      : null;
  const totalViews = products.reduce((sum, p) => sum + p.viewsCount, 0);
  const totalClicks = products.reduce((sum, p) => sum + p.clicksCount, 0);

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-300/80 pb-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-gold-700 font-bold">
              Brand Console
            </span>
            <h1 className="font-serif text-3xl font-bold text-noir-900 mt-0.5">
              {user?.brand?.name || user?.name}'s Dashboard
            </h1>
            <p className="text-xs text-noir-600 mt-1">
              Manage your promotional portfolio, monitor outbid costs, and track conversion analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/promote"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-noir-900 text-cream-50 hover:bg-noir-800 text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-gold-400" />
              <span>Promote Product</span>
            </Link>
          </div>
        </div>

        {/* Top 5 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
              Total Spend
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-noir-900">
              {formatINR(totalSpend)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
              Active Formulations
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-noir-900">
              {products.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
              Best Rank
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-gold-700">
              {bestRank && bestRank < 999 ? `#${bestRank}` : '—'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
              Total Views
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-noir-900">
              {totalViews.toLocaleString()}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
              Product Clicks
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-noir-900">
              {totalClicks.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cream-300 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            My Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            Payment History ({payments.length})
          </button>
        </div>

        {/* Products Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {loading ? (
              <div className="h-48 bg-cream-200 rounded-2xl animate-pulse" />
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-cream-300 p-12 text-center shadow-xs">
                <Package className="w-10 h-10 text-cream-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-noir-900">No Products Listed Yet</h3>
                <p className="text-xs text-noir-500 mt-1 max-w-sm mx-auto">
                  Launch your first beauty formulation promotion to start competing on India's leaderboard.
                </p>
                <Link
                  to="/promote"
                  className="mt-4 inline-flex items-center gap-1.5 px-6 py-2.5 bg-noir-900 text-cream-50 text-xs font-semibold rounded-full uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5 text-gold-400" />
                  <span>Promote Your First Product</span>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream-100 border-b border-cream-200 text-noir-600 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4 text-center">Rank</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-right">Verified Spend</th>
                        <th className="py-3 px-4 text-right">Cost to Next Rank</th>
                        <th className="py-3 px-4 text-center">Engagement</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200 text-noir-800">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-cream-50/70 transition-colors">
                          <td className="py-4 px-4 text-center font-bold">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-100 text-gold-800">
                              #{p.rank || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-cream-200 shrink-0"
                              />
                              <div>
                                <Link
                                  to={`/products/${p.slug}`}
                                  className="font-semibold text-noir-900 hover:text-gold-700 block truncate max-w-xs"
                                >
                                  {p.name}
                                </Link>
                                <a
                                  href={p.productUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-noir-500 hover:underline flex items-center gap-1"
                                >
                                  <span>Official Link</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-noir-600">{p.category?.name}</td>
                          <td className="py-4 px-4 text-right font-semibold text-noir-900">
                            {formatINR(Number(p.verifiedSpend))}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="bg-gold-50 text-gold-800 px-2 py-1 rounded font-medium border border-gold-200 text-[11px]">
                              {formatINR(p.costToNextRank || 500)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-noir-500 text-[11px]">
                            {p.viewsCount.toLocaleString()} views • {p.clicksCount.toLocaleString()} clicks
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() =>
                                navigate(
                                  `/promote?productId=${p.id}&targetRank=${Math.max(
                                    1,
                                    (p.rank || 2) - 1
                                  )}`
                                )
                              }
                              className="px-3.5 py-1.5 rounded-lg bg-noir-900 hover:bg-noir-800 text-cream-50 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                            >
                              <TrendingUp className="w-3 h-3 text-gold-400" />
                              <span>Outbid & Boost</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-100 border-b border-cream-200 text-noir-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Gateway Order ID</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Rank Claimed</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200 text-noir-800">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-cream-50/70">
                        <td className="py-3 px-4 text-noir-600">
                          {new Date(pay.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-noir-900">
                          {pay.product?.name || 'New Product'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-noir-500">
                          {pay.gatewayOrderId}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-noir-900">
                          {formatINR(Number(pay.amount))}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-gold-700">
                          #{pay.targetRank}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              pay.status === 'captured'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pay.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
