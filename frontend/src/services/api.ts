import axios from 'axios';
import {
  LeaderboardResponse,
  Product,
  Category,
  RankingCalculation,
  SafePaymentHistoryItem,
  User,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('beautybid_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { email: string; password: string; name: string; role?: string; brandName?: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },
};

export const productsApi = {
  getLeaderboard: async (params?: { category?: string; search?: string; sort?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: LeaderboardResponse }>('/ranking/leaderboard', { params });
    return res.data.data;
  },
  getProductBySlug: async (slug: string) => {
    const res = await api.get<{ success: boolean; product: Product & { costToClaimRankOne: number; totalActiveProducts: number } }>(`/products/${slug}`);
    return res.data.product;
  },
  getCategories: async () => {
    const res = await api.get<{ success: boolean; categories: Category[] }>('/products/categories/all');
    return res.data.categories;
  },
  createProduct: async (data: { name: string; categoryId: string; description: string; productUrl: string; imageUrl: string; brandId?: string }) => {
    const res = await api.post<{ success: boolean; product: Product }>('/products', data);
    return res.data.product;
  },
  getMyProducts: async () => {
    const res = await api.get<{ success: boolean; products: Product[] }>('/products/brand/my-products');
    return res.data.products;
  },
};

export const rankingApi = {
  calculateRequiredAmount: async (data: { productId?: string; targetRank: number }) => {
    const res = await api.post<{ success: boolean; data: RankingCalculation }>('/ranking/calculate', data);
    return res.data.data;
  },
  getMinIncrement: async () => {
    const res = await api.get<{ success: boolean; minIncrement: number }>('/ranking/min-increment');
    return res.data.minIncrement;
  },
};

export const paymentsApi = {
  createOrder: async (data: {
    productId?: string;
    targetRank: number;
    newProductData?: {
      name: string;
      brandId?: string;
      brandName?: string;
      categoryId: string;
      description: string;
      productUrl: string;
      imageUrl: string;
    };
  }) => {
    const res = await api.post<{
      success: boolean;
      data: {
        paymentId: string;
        orderId: string;
        amount: number;
        amountInPaise: number;
        currency: string;
        keyId: string;
        product: { id: string; name: string };
        targetRank: number;
        calculation: RankingCalculation;
        isSandbox: boolean;
      };
    }>('/payments/create-order', data);
    return res.data.data;
  },
  verifyPayment: async (data: {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>('/payments/verify', data);
    return res.data;
  },
  simulateSandboxPayment: async (paymentId: string) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>('/payments/simulate-sandbox-pay', { paymentId });
    return res.data;
  },
  getProductHistory: async (productId: string) => {
    const res = await api.get<{ success: boolean; history: SafePaymentHistoryItem[] }>(`/payments/history/product/${productId}`);
    return res.data.history;
  },
  getMyPayments: async () => {
    const res = await api.get<{ success: boolean; payments: any[] }>('/payments/my-payments');
    return res.data.payments;
  },
};

export const analyticsApi = {
  trackEvent: async (productId: string, eventType: 'view' | 'card_click' | 'external_click') => {
    try {
      await api.post('/analytics/track', { productId, eventType });
    } catch {
      // Non-blocking analytics
    }
  },
  getBrandSummary: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/analytics/brand-summary');
    return res.data.data;
  },
};

export const adminApi = {
  getMetrics: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/admin/metrics');
    return res.data.data;
  },
  getPayments: async (page = 1, limit = 20) => {
    const res = await api.get<{ success: boolean; data: any }>('/admin/payments', { params: { page, limit } });
    return res.data.data;
  },
  getProducts: async (page = 1, limit = 20) => {
    const res = await api.get<{ success: boolean; data: any }>('/admin/products', { params: { page, limit } });
    return res.data.data;
  },
  updateProductStatus: async (productId: string, status: string, isFeatured?: boolean) => {
    const res = await api.patch(`/admin/products/${productId}/status`, { status, isFeatured });
    return res.data;
  },
  updatePaymentStatus: async (paymentId: string, status: string) => {
    const res = await api.patch(`/admin/payments/${paymentId}/status`, { status });
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get<{ success: boolean; settings: any[] }>('/admin/settings');
    return res.data.settings;
  },
  updateSetting: async (key: string, value: string, description?: string) => {
    const res = await api.post('/admin/settings', { key, value, description });
    return res.data;
  },
  getRankingHistory: async (productId?: string) => {
    const res = await api.get<{ success: boolean; history: any[] }>('/admin/ranking-history', { params: { productId } });
    return res.data.history;
  },
};

export default api;
