import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { RankingService } from '../ranking/ranking.service';

export class ProductService {
  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            verified: true,
            description: true,
          },
        },
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        rankingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            rank: true,
            verifiedSpend: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found.');
    }

    // Determine current rank and costs
    const minIncrement = await RankingService.getMinIncrement();
    const activeProducts = await prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [
        { verifiedSpend: 'desc' },
        { lastPromotedAt: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true, verifiedSpend: true },
    });

    const index = activeProducts.findIndex((p) => p.id === product.id);
    const currentRank = index !== -1 ? index + 1 : null;
    const currentSpend = Number(product.verifiedSpend);

    let costToNextRank = minIncrement;
    if (index > 0) {
      const higherSpend = Number(activeProducts[index - 1].verifiedSpend);
      costToNextRank = higherSpend + minIncrement;
    }

    const costToClaimRankOne =
      activeProducts.length > 0
        ? Number(activeProducts[0].verifiedSpend) + minIncrement
        : minIncrement;

    return {
      ...product,
      verifiedSpend: currentSpend,
      currentRank,
      costToNextRank: Math.max(minIncrement, costToNextRank),
      costToClaimRankOne: Math.max(minIncrement, costToClaimRankOne),
      minIncrement,
      totalActiveProducts: activeProducts.length,
    };
  }

  static async getCategories() {
    return await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: { where: { status: ProductStatus.ACTIVE } } },
        },
      },
    });
  }

  static async createProduct(userId: string, data: {
    name: string;
    brandId?: string;
    categoryId: string;
    description: string;
    productUrl: string;
    imageUrl: string;
  }) {
    let brandId = data.brandId;
    if (!brandId) {
      const brand = await prisma.brand.findFirst({
        where: { userId },
      });
      if (!brand) {
        throw new Error('No brand found for this user. Please register a brand first.');
      }
      brandId = brand.id;
    }

    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    return await prisma.product.create({
      data: {
        name: data.name.trim(),
        slug,
        brandId,
        categoryId: data.categoryId,
        description: data.description.trim(),
        productUrl: data.productUrl.trim(),
        imageUrl: data.imageUrl.trim(),
        status: ProductStatus.ACTIVE,
        verifiedSpend: 0,
      },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  static async getBrandProducts(userId: string) {
    const brands = await prisma.brand.findMany({
      where: { userId },
      select: { id: true },
    });
    const brandIds = brands.map((b) => b.id);

    const products = await prisma.product.findMany({
      where: { brandId: { in: brandIds } },
      orderBy: { verifiedSpend: 'desc' },
      include: {
        brand: true,
        category: true,
        payments: {
          where: { status: 'captured' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Compute rank for each
    const allActive = await prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [
        { verifiedSpend: 'desc' },
        { lastPromotedAt: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true, verifiedSpend: true },
    });

    const minIncrement = await RankingService.getMinIncrement();

    return products.map((p) => {
      const idx = allActive.findIndex((a) => a.id === p.id);
      const currentRank = idx !== -1 ? idx + 1 : null;
      let costToNextRank = minIncrement;
      if (idx > 0) {
        costToNextRank = Number(allActive[idx - 1].verifiedSpend) + minIncrement;
      }
      return {
        ...p,
        currentRank,
        costToNextRank,
      };
    });
  }
}
