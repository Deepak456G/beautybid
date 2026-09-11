import React, { useState, useEffect } from 'react';
import {
  Crown,
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
  Users,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Save,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'payments' | 'products' | 'settings'>('metrics');

  // Setting edit state
  const [minIncrementInput, setMinIncrementInput] = useState('500');
  const [settingSaveStatus, setSettingSaveStatus] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, p, prods, s] = await Promise.all([
        adminApi.getMetrics().catch(() => null),
        adminApi.getPayments().catch(() => ({ items: [] })),
        adminApi.getProducts().catch(() => ({ items: [] })),
        adminApi.getSettings().catch(() => []),
      ]);
      setMetrics(m);
      setPayments(p.items || []);
      setProducts(prods.items || []);
      setSettings(s);

      const foundMinInc = s.find((x: any) => x.key === 'MIN_RANK_INCREMENT');
      if (foundMinInc) setMinIncrementInput(foundMinInc.value);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProductStatus = async (productId: string, newStatus: string) => {
    try {
      await adminApi.updateProductStatus(productId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product status');
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      await adminApi.updateProductStatus(productId, 'ACTIVE', !currentFeatured);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle featured status');
    }
  };

  const handleSaveMinIncrement = async () => {
    try {
      await adminApi.updateSetting(
        'MIN_RANK_INCREMENT',
        minIncrementInput,
        'Minimum promotional spend increment (in INR) required to outbid a rank'
      );
      setSettingSaveStatus('Minimum increment updated successfully!');
      setTimeout(() => setSettingSaveStatus(null), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save setting');
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-300 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-200 text-noir-900 flex items-center justify-center">
              <Crown className="w-6 h-6 text-gold-700" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gold-700 font-bold">
                Platform Administration
              </span>
              <h1 className="font-serif text-3xl font-bold text-noir-900">
                BeautyBid Control Console
              </h1>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-cream-300 hover:bg-cream-100 text-xs font-semibold text-noir-800 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Revenue Cards */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
                All-Time Revenue
              </span>
              <p className="font-serif text-2xl font-bold text-noir-900">
                {formatINR(metrics.revenue?.allTime)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
                Today's Revenue
              </span>
              <p className="font-serif text-2xl font-bold text-emerald-700">
                {formatINR(metrics.revenue?.today)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
                This Month's Revenue
              </span>
              <p className="font-serif text-2xl font-bold text-gold-700">
                {formatINR(metrics.revenue?.thisMonth)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-noir-500 font-semibold">
                Verified Transactions
              </span>
              <p className="font-serif text-2xl font-bold text-noir-900">
                {metrics.payments?.successful} / {metrics.payments?.total}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-cream-300 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            Platform Overview
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            Payments & Gateway Logs ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            Product Moderation ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-noir-900 text-noir-900'
                : 'border-transparent text-noir-500 hover:text-noir-900'
            }`}
          >
            Platform Settings & Increment
          </button>
        </div>

        {/* Tab 1: Metrics & Revenue Chart */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-editorial space-y-4">
              <h3 className="font-serif text-base font-bold text-noir-900">
                7-Day Promotional Revenue Trend (INR)
              </h3>

              <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44 border-b border-cream-200 pb-2">
                {metrics.revenueChart?.map((day: any) => {
                  const max = Math.max(...metrics.revenueChart.map((d: any) => d.revenue), 1000);
                  const heightPercent = Math.max(8, Math.round((day.revenue / max) * 100));

                  return (
                    <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-bold text-noir-700">
                        ₹{(day.revenue / 1000).toFixed(0)}k
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[40px] bg-gradient-to-t from-gold-600 to-gold-400 rounded-t-lg transition-all"
                      />
                      <span className="text-[10px] text-noir-500">
                        {day.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-cream-300 text-xs">
                <span className="text-noir-500">Active Formulations:</span>
                <p className="font-bold text-noir-900 text-lg">{metrics.stats?.activeProducts}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cream-300 text-xs">
                <span className="text-noir-500">Registered Brands:</span>
                <p className="font-bold text-noir-900 text-lg">{metrics.stats?.registeredBrands}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cream-300 text-xs">
                <span className="text-noir-500">Total Views:</span>
                <p className="font-bold text-noir-900 text-lg">{metrics.stats?.totalViews?.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-cream-300 text-xs">
                <span className="text-noir-500">Total Clicks:</span>
                <p className="font-bold text-noir-900 text-lg">{metrics.stats?.totalClicks?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments List */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 border-b border-cream-200 text-noir-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product & Brand</th>
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Razorpay Order ID</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 text-noir-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-cream-50/70">
                      <td className="py-3 px-4 text-noir-500">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-noir-900">
                        {p.product?.name || 'New Product'}
                        <span className="block text-[11px] font-normal text-noir-500">
                          {p.brand?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-noir-600">{p.user?.email}</td>
                      <td className="py-3 px-4 text-right font-bold text-noir-900">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-noir-500">
                        {p.gatewayOrderId}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'captured'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Products Moderation */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-cream-300 shadow-editorial overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 border-b border-cream-200 text-noir-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Verified Spend</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Featured</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 text-noir-800">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-cream-50/70">
                      <td className="py-3 px-4 font-semibold text-noir-900">{prod.name}</td>
                      <td className="py-3 px-4 text-noir-600">{prod.brand?.name}</td>
                      <td className="py-3 px-4 text-noir-600">{prod.category?.name}</td>
                      <td className="py-3 px-4 text-right font-bold text-noir-900">
                        {formatINR(prod.verifiedSpend)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            prod.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prod.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(prod.id, prod.isFeatured)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            prod.isFeatured
                              ? 'bg-gold-200 text-gold-900 border border-gold-400'
                              : 'bg-cream-100 text-noir-500'
                          }`}
                        >
                          {prod.isFeatured ? 'Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {prod.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateProductStatus(prod.id, 'SUSPENDED')}
                            className="px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold border border-red-200"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateProductStatus(prod.id, 'ACTIVE')}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Platform Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-cream-300 p-8 shadow-editorial max-w-2xl space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-noir-900">
                Minimum Ranking Increment
              </h3>
              <p className="text-xs text-noir-600 mt-1">
                Configure the mandatory promotional money (in INR) required to outbid an existing rank position.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-noir-700 mb-1">
                  Minimum Increment (₹ INR)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-noir-500">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={minIncrementInput}
                    onChange={(e) => setMinIncrementInput(e.target.value)}
                    className="w-48 p-3 rounded-xl bg-cream-50 border border-cream-300 font-bold text-sm text-noir-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                  <button
                    onClick={handleSaveMinIncrement}
                    className="px-5 py-3 rounded-xl bg-noir-900 hover:bg-noir-800 text-cream-50 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4 text-gold-400" />
                    <span>Save Setting</span>
                  </button>
                </div>
              </div>

              {settingSaveStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  {settingSaveStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
