import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Crown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { rankingApi, paymentsApi, productsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Category, Product, RankingCalculation } from '../types';
import { DisclosureBanner } from '../components/DisclosureBanner';

export const PromotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const queryProductId = searchParams.get('productId');
  const queryTargetRank = searchParams.get('targetRank');

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>(queryProductId ? 'existing' : 'new');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>(queryProductId || '');
  const [targetRank, setTargetRank] = useState<number>(
    queryTargetRank ? parseInt(queryTargetRank, 10) : 1
  );

  // New product inputs
  const [newProduct, setNewProduct] = useState({
    name: '',
    brandName: user?.brand?.name || '',
    categoryId: '',
    description: '',
    productUrl: '',
    imageUrl: '',
    contactEmail: user?.email || '',
  });

  // Server Calculation
  const [calculation, setCalculation] = useState<RankingCalculation | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Payment Execution State
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Load categories and brand products
  useEffect(() => {
    productsApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !newProduct.categoryId) {
        setNewProduct((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    });

    productsApi.getLeaderboard({ limit: 50 }).then((res) => {
      setExistingProducts(res.items);
      if (queryProductId) {
        setSelectedProductId(queryProductId);
      }
    });
  }, [queryProductId]);

  // Recalculate amount required from server whenever selection changes
  useEffect(() => {
    const fetchCalculation = async () => {
      if (targetRank < 1) return;
      setCalcLoading(true);
      setCalcError(null);

      try {
        const prodId = mode === 'existing' && selectedProductId ? selectedProductId : undefined;
        const res = await rankingApi.calculateRequiredAmount({
          productId: prodId,
          targetRank,
        });
        setCalculation(res);
      } catch (err: any) {
        setCalcError(err.response?.data?.message || err.message || 'Calculation error');
        setCalculation(null);
      } finally {
        setCalcLoading(false);
      }
    };

    const timeout = setTimeout(fetchCalculation, 250);
    return () => clearTimeout(timeout);
  }, [mode, selectedProductId, targetRank]);

  const handleLaunchPayment = async () => {
    if (!user) {
      navigate('/login?redirect=/promote');
      return;
    }

    if (mode === 'new') {
      if (
        !newProduct.name ||
        !newProduct.brandName ||
        !newProduct.categoryId ||
        !newProduct.productUrl ||
        !newProduct.imageUrl ||
        !newProduct.description
      ) {
        setPaymentError('Please fill out all product information fields.');
        return;
      }
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Create order on server (server calculates exact amount)
      const orderRes = await paymentsApi.createOrder({
        productId: mode === 'existing' ? selectedProductId : undefined,
        targetRank,
        newProductData:
          mode === 'new'
            ? {
                name: newProduct.name,
                brandName: newProduct.brandName,
                categoryId: newProduct.categoryId,
                description: newProduct.description,
                productUrl: newProduct.productUrl,
                imageUrl: newProduct.imageUrl,
              }
            : undefined,
      });

      // 2. Open Razorpay Checkout or use sandbox simulation
      if (orderRes.isSandbox || !(window as any).Razorpay) {
        // Instant verified test simulation for sandbox testing
        const verifyRes = await paymentsApi.simulateSandboxPayment(orderRes.paymentId);
        triggerSuccessCelebration(verifyRes.data);
      } else {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amountInPaise,
          currency: orderRes.currency,
          name: 'BeautyBid Promotion',
          description: `Promote "${orderRes.product.name}" to Rank #${orderRes.targetRank}`,
          order_id: orderRes.orderId,
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: '#0E0E10',
          },
          handler: async (response: any) => {
            try {
              // 3. Client signature verification
              const verifyRes = await paymentsApi.verifyPayment({
                paymentId: orderRes.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              triggerSuccessCelebration(verifyRes.data);
            } catch (vErr: any) {
              setPaymentError(vErr.response?.data?.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              setProcessingPayment(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || err.message || 'Payment initiation failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const triggerSuccessCelebration = (data: any) => {
    setSuccessData(data);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#C5A880', '#D0B68A', '#0E0E10', '#F4EDE0'],
    });
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen pb-24">
      <DisclosureBanner />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-700" />
            <span>Guaranteed Promotional Placement</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-noir-900">
            Promote Your Beauty Product
          </h1>
          <p className="text-xs sm:text-sm text-noir-600 max-w-lg mx-auto">
            Choose your desired leaderboard rank. Our server calculates the exact promotional spend required to outbid the current holder.
          </p>
        </div>

        {/* Success Modal / State */}
        {successData ? (
          <div className="bg-white rounded-3xl border border-gold-400 p-8 sm:p-12 shadow-gold-glow text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-gold-700 font-bold">
                Promotion Successfully Verified
              </span>
              <h2 className="font-serif text-3xl font-bold text-noir-900">
                Rank #{successData.achievedRank} Claimed!
              </h2>
              <p className="text-xs text-noir-600 max-w-md mx-auto">
                Your payment has been cryptographically confirmed and your product is now publicly ranked at position #{successData.achievedRank}.
              </p>
            </div>

            <div className="bg-cream-100 p-4 rounded-2xl border border-cream-200 max-w-sm mx-auto text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-noir-600">Product:</span>
                <span className="font-semibold text-noir-900">{successData.product?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-noir-600">Total Verified Spend:</span>
                <span className="font-bold text-gold-700">
                  {formatINR(Number(successData.product?.verifiedSpend))}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-noir-900 text-cream-50 text-xs font-semibold uppercase tracking-wider"
              >
                View on Leaderboard
              </Link>
              {successData.product?.slug && (
                <Link
                  to={`/products/${successData.product.slug}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-cream-300 text-noir-900 text-xs font-semibold uppercase tracking-wider"
                >
                  View Product Page
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Main Promotion Multi-Step Wizard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Inputs (Left) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Mode Selector */}
              <div className="bg-cream-200/80 p-1.5 rounded-2xl flex border border-cream-300 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    mode === 'new'
                      ? 'bg-white text-noir-900 shadow-xs'
                      : 'text-noir-600 hover:text-noir-900'
                  }`}
                >
                  Promote New Product
                </button>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`flex-1 py-2.5 rounded-xl transition-all ${
                    mode === 'existing'
                      ? 'bg-white text-noir-900 shadow-xs'
                      : 'text-noir-600 hover:text-noir-900'
                  }`}
                >
                  Outbid Existing Product
                </button>
              </div>

              {/* Mode = Existing: Select from list */}
              {mode === 'existing' ? (
                <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-editorial space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-noir-700">
                    Select Product to Outbid & Boost
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs text-noir-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="">-- Choose a product from leaderboard --</option>
                    {existingProducts.map((p, idx) => (
                      <option key={p.id} value={p.id}>
                        #{idx + 1} {p.name} ({p.brand.name}) — Spend: {formatINR(p.verifiedSpend)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Mode = New: Full submission fields */
                <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-editorial space-y-4">
                  <h3 className="font-serif text-sm font-bold text-noir-900 uppercase tracking-wider">
                    Product & Brand Details
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-noir-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10% Niacinamide Clarifying Serum"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-noir-700 mb-1">
                          Brand Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Minimalist"
                          value={newProduct.brandName}
                          onChange={(e) => setNewProduct({ ...newProduct, brandName: e.target.value })}
                          className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-noir-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={newProduct.categoryId}
                          onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                          className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-noir-700 mb-1">
                        Official Product Purchase URL *
                      </label>
                      <input
                        type="url"
                        placeholder="https://brand.com/products/your-product"
                        value={newProduct.productUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, productUrl: e.target.value })}
                        className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-noir-700 mb-1">
                        High-Resolution Image URL *
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or direct image link"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-noir-700 mb-1">
                        Formulation Description *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Highlight active ingredients, skin benefits, and clinical claims..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-noir-700 mb-1">
                        Developer Contact Email *
                      </label>
                      <input
                        type="email"
                        placeholder="contact@brand.com"
                        value={newProduct.contactEmail}
                        onChange={(e) => setNewProduct({ ...newProduct, contactEmail: e.target.value })}
                        className="w-full p-3 rounded-xl bg-cream-50 border border-cream-300 text-xs focus:ring-2 focus:ring-gold-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Target Rank Selector */}
              <div className="bg-white p-6 rounded-2xl border border-cream-300 shadow-editorial space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-noir-700">
                  Select Desired Leaderboard Rank
                </label>

                {/* Quick rank pills */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRank(r)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        targetRank === r
                          ? 'bg-noir-900 text-cream-50 border-noir-900 shadow-xs'
                          : 'bg-cream-50 text-noir-800 border-cream-300 hover:border-gold-400'
                      }`}
                    >
                      Rank #{r}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs">
                  <span className="text-noir-600 font-medium">Or enter custom rank:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={targetRank}
                    onChange={(e) => setTargetRank(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-24 p-2 rounded-lg bg-cream-50 border border-cream-300 font-bold text-center text-noir-900 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>
            </div>

            {/* Server-Side Calculated Quote & Checkout Card (Right) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-gold-300/80 p-6 sm:p-8 shadow-editorial sticky top-28 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-gold-600" />
                    <span className="font-serif text-lg font-bold text-noir-900">
                      Promotional Order
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 text-[10px] font-bold uppercase tracking-wider">
                    Target: #{targetRank}
                  </span>
                </div>

                {/* Calculation breakdown */}
                {calcLoading ? (
                  <div className="py-8 text-center space-y-2 animate-pulse">
                    <div className="h-4 bg-cream-200 rounded w-1/2 mx-auto" />
                    <div className="h-8 bg-cream-200 rounded w-3/4 mx-auto" />
                  </div>
                ) : calcError ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p>{calcError}</p>
                  </div>
                ) : calculation ? (
                  <div className="space-y-4">
                    <div className="space-y-2 text-xs">
                      {calculation.targetProductName && (
                        <div className="flex justify-between text-noir-600 pb-1">
                          <span>Current Rank #{targetRank} Holder:</span>
                          <span className="font-semibold text-noir-900 truncate max-w-[150px]">
                            {calculation.targetProductName}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-noir-600">
                        <span>Current Target Holder Spend:</span>
                        <span className="font-medium text-noir-900">
                          {formatINR(calculation.targetProductSpend)}
                        </span>
                      </div>

                      <div className="flex justify-between text-noir-600">
                        <span>Minimum Outbid Increment:</span>
                        <span className="font-medium text-noir-900">
                          +{formatINR(calculation.minimumIncrement)}
                        </span>
                      </div>

                      {calculation.currentProductSpend > 0 && (
                        <div className="flex justify-between text-noir-500 text-[11px] pt-1 border-t border-cream-200">
                          <span>Your Previous Verified Spend:</span>
                          <span className="font-medium">
                            {formatINR(calculation.currentProductSpend)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-cream-300 pt-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-noir-700">
                          Required Payment Amount:
                        </span>
                        <span className="font-serif text-2xl sm:text-3xl font-bold text-noir-900">
                          {formatINR(calculation.requiredAmount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-noir-500 mt-1">
                        Upon verified payment, your product's new verified promotional spend will become{' '}
                        <strong className="text-gold-700 font-semibold">
                          {formatINR(calculation.newTotalSpend)}
                        </strong>
                      </p>
                    </div>

                    {paymentError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                        {paymentError}
                      </div>
                    )}

                    {/* Pay CTA Button */}
                    <button
                      type="button"
                      onClick={handleLaunchPayment}
                      disabled={processingPayment || !!calcError}
                      className="w-full py-4 px-6 rounded-full bg-noir-900 hover:bg-noir-800 disabled:bg-noir-600 text-cream-50 font-semibold text-xs uppercase tracking-wider shadow-editorial hover:shadow-editorial-hover transition-all flex items-center justify-center gap-2 group"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
                          <span>Processing Razorpay Order...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-gold-400 group-hover:scale-110 transition-transform" />
                          <span>Pay & Claim Rank #{targetRank}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : null}

                {/* Razorpay badge */}
                <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-noir-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Razorpay Secure 256-Bit</span>
                  </div>
                  <span>Instant Recalculation</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
