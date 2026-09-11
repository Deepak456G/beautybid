export type Role = 'USER' | 'BRAND' | 'ADMIN';
export type ProductStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REJECTED';
export type PaymentStatus = 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  brand?: Brand | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  displayOrder: number;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  productUrl: string;
  imageUrl: string;
  verifiedSpend: number;
  status: ProductStatus;
  isFeatured: boolean;
  viewsCount: number;
  clicksCount: number;
  rank?: number;
  currentRank?: number | null;
  minIncrement?: number;
  costToClaimRank?: number;
  costToNextRank?: number;
  lastPromotedAt?: string;
  createdAt: string;
  brand: Brand;
  category: Category;
  rankingHistory?: {
    id: string;
    rank: number;
    verifiedSpend: number;
    createdAt: string;
  }[];
}

export interface RankingCalculation {
  targetRank: number;
  currentRank: number | null;
  targetProductSpend: number;
  minimumIncrement: number;
  currentProductSpend: number;
  requiredAmount: number;
  newTotalSpend: number;
  targetProductName?: string;
}

export interface SafePaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  rankAchieved: number;
  totalSpendAchieved: number;
  date: string;
}

export interface LeaderboardResponse {
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  disclosure: string;
  minIncrement: number;
}
