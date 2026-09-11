import { PaymentStatus, ProductStatus, Role } from '@prisma/client';
import { prisma } from '../../utils/prisma';

export class AdminService {
  static async getOverviewMetrics() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Revenue calculations
    const capturedPayments = await prisma.payment.findMany({
      where: { status: PaymentStatus.captured },
      select: { amount: true, createdAt: true, verifiedAt: true },
    });

    const allTimeRevenue = capturedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const todayRevenue = capturedPayments
      .filter((p) => (p.verifiedAt || p.createdAt) >= startOfToday)
      .reduce((acc, p) => acc + Number(p.amount), 0);
    const thisMonthRevenue = capturedPayments
      .filter((p) => (p.verifiedAt || p.createdAt) >= startOfMonth)
      .reduce((acc, p) => acc + Number(p.amount), 0);

    // 2. Payment status counts
    const [totalPayments, successfulPayments, failedPayments, refundedPayments] =
      await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: PaymentStatus.captured } }),
        prisma.payment.count({ where: { status: PaymentStatus.failed } }),
        prisma.payment.count({ where: { status: PaymentStatus.refunded } }),
      ]);

    // 3. Platform assets count
    const [activeProducts, pendingProducts, registeredBrands, totalUsers] =
      await Promise.all([
        prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
        prisma.product.count({ where: { status: ProductStatus.PENDING } }),
        prisma.brand.count(),
        prisma.user.count(),
      ]);

    // 4. Global Views and Clicks
    const productsStats = await prisma.product.aggregate({
      _sum: {
        viewsCount: true,
        clicksCount: true,
      },
    });

    // 5. Daily revenue for chart (last 7 days)
    const last7Days: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayTotal = capturedPayments
        .filter((p) => {
          const t = p.verifiedAt || p.createdAt;
          return t >= dayStart && t <= dayEnd;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      last7Days.push({ date: dayStr, revenue: dayTotal });
    }

    return {
      revenue: {
        allTime: allTimeRevenue,
        today: todayRevenue,
        thisMonth: thisMonthRevenue,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      stats: {
        activeProducts,
        pendingProducts,
        registeredBrands,
        totalUsers,
        totalViews: productsStats._sum.viewsCount || 0,
        totalClicks: productsStats._sum.clicksCount || 0,
      },
      revenueChart: last7Days,
    };
  }

  static async getPaymentsList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, slug: true, imageUrl: true } },
          brand: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((p) => ({
        ...p,
        amount: Number(p.amount),
        previousSpend: Number(p.previousSpend),
        newSpend: Number(p.newSpend),
      })),
    };
  }

  static async getProductsList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: [{ verifiedSpend: 'desc' }, { createdAt: 'desc' }],
        include: {
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((p) => ({
        ...p,
        verifiedSpend: Number(p.verifiedSpend),
      })),
    };
  }

  static async updateProductStatus(productId: string, status: ProductStatus, isFeatured?: boolean) {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        status,
        ...(isFeatured !== undefined ? { isFeatured } : {}),
      },
    });
  }

  static async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    return await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });
  }

  static async getSettings() {
    return await prisma.siteSettings.findMany();
  }

  static async updateSetting(key: string, value: string, description?: string) {
    return await prisma.siteSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  static async getRankingHistory(productId?: string) {
    const where = productId ? { productId } : {};
    return await prisma.rankingHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        product: { select: { id: true, name: true } },
      },
    });
  }
}
