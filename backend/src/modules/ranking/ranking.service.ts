import { Prisma, ProductStatus, Payment } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { config } from '../../config';

/**
 * Result structure for server-side ranking calculation.
 * All variable names are explicit and unambiguous.
 */
export interface RankingCalculationResult {
  target_rank: number;
  current_rank: number | null;
  target_rank_holder_name: string | null;
  target_rank_holder_spend: number;
  minimum_increment: number;
  previous_verified_spend: number;
  required_payment_amount: number;
  new_verified_spend: number;
  // Aliases for frontend convenience
  targetRank: number;
  currentRank: number | null;
  targetProductSpend: number;
  minimumIncrement: number;
  currentProductSpend: number;
  requiredAmount: number;
  newTotalSpend: number;
  targetProductName?: string | null;
}

export class RankingService {
  /**
   * 1. Get dynamic minimum ranking increment from site_settings (PostgreSQL) or fallback to config.
   * Configurable directly by platform administrators.
   */
  static async getMinIncrement(): Promise<number> {
    try {
      const setting = await prisma.siteSettings.findUnique({
        where: { key: 'MIN_RANK_INCREMENT' },
      });
      if (setting && !isNaN(parseFloat(setting.value))) {
        return parseFloat(setting.value);
      }
    } catch {
      // Fallback to default
    }
    return config.defaultMinRankIncrement;
  }

  /**
   * 2. Calculate the exact required payment amount strictly server-side.
   * 
   * DETERMINISTIC RANKING ECONOMICS:
   * Rule 1: Every product has a verified_spend amount.
   * Rule 2: Products are ranked in descending order of verified_spend.
   * Rule 3: Higher verified_spend = higher promotional rank.
   * Rule 4: Frontend must NEVER decide the final ranking or payment amount.
   * Rule 5: required_payment_amount = target_rank_holder_spend + minimum_increment
   * 
   * Example:
   *   #1 Product A = ₹100,000
   *   #2 Product B = ₹75,000
   *   #3 Product C = ₹50,000
   * 
   * If Product C wants #1 and minimum increment is ₹1:
   *   target_rank_holder_spend = ₹100,000 (Product A)
   *   minimum_increment = ₹1
   *   required_payment_amount = ₹100,000 + ₹1 = ₹100,001
   * 
   * After verified payment:
   *   #1 Product C = ₹100,001
   *   #2 Product A = ₹100,000
   *   #3 Product B = ₹75,000
   */
  static async calculateRequiredAmount(
    productId: string | null,
    targetRank: number
  ): Promise<RankingCalculationResult> {
    if (targetRank < 1) {
      throw new Error('Target rank must be at least 1.');
    }

    const target_rank = targetRank;
    const minimum_increment = await this.getMinIncrement();

    // Fetch all active products ranked in descending order of verified_spend
    // Tie-breaker: earlier promotion timestamp (last_promoted_at), then creation timestamp
    const activeProducts = await prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE },
      orderBy: [
        { verifiedSpend: 'desc' },
        { lastPromotedAt: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        verifiedSpend: true,
        lastPromotedAt: true,
      },
    });

    let current_rank: number | null = null;
    let previous_verified_spend = 0;

    if (productId) {
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!currentProduct) {
        throw new Error('Product not found.');
      }
      previous_verified_spend = Number(currentProduct.verifiedSpend);

      const foundIndex = activeProducts.findIndex((p) => p.id === productId);
      if (foundIndex !== -1) {
        current_rank = foundIndex + 1;
        // If product already holds this rank and it's not #1 attempting to extend lead
        if (current_rank < target_rank) {
          throw new Error(
            `Product already holds rank #${current_rank}, which is better than requested rank #${target_rank}.`
          );
        }
      }
    }

    // Determine target product currently occupying target_rank
    let target_rank_holder_spend = 0;
    let target_rank_holder_name: string | null = null;

    if (target_rank <= activeProducts.length) {
      const targetProduct = activeProducts[target_rank - 1];
      target_rank_holder_spend = Number(targetProduct.verifiedSpend);
      target_rank_holder_name = targetProduct.name;
    } else {
      // If target rank is beyond existing products, baseline spend is 0
      target_rank_holder_spend = 0;
      target_rank_holder_name = null;
    }

    // Exact deterministic calculation:
    // required_payment_amount = target_rank_holder_spend + minimum_increment
    const required_payment_amount = target_rank_holder_spend + minimum_increment;
    const new_verified_spend = required_payment_amount;

    return {
      target_rank,
      current_rank,
      target_rank_holder_name,
      target_rank_holder_spend,
      minimum_increment,
      previous_verified_spend,
      required_payment_amount,
      new_verified_spend,
      // Aliases
      targetRank: target_rank,
      currentRank: current_rank,
      targetProductSpend: target_rank_holder_spend,
      minimumIncrement: minimum_increment,
      currentProductSpend: previous_verified_spend,
      requiredAmount: required_payment_amount,
      newTotalSpend: new_verified_spend,
      targetProductName: target_rank_holder_name,
    };
  }

  /**
   * 3. Process verified promotion inside an atomic PostgreSQL transaction with row-level locking.
   * 
   * Ensures:
   * - No race conditions if two payments complete concurrently (SELECT ... FOR UPDATE).
   * - Payment status is updated to 'captured' idempotently.
   * - Duplicate webhooks never increase verified_spend twice.
   * - Permanent, immutable ranking history audit record is created.
   */
  static async processVerifiedPromotion(
    paymentId: string,
    gatewayPaymentId: string,
    gatewaySignature: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Lock payment row exclusively (RowExclusiveLock) to prevent concurrent executions
      const payments = await tx.$queryRaw<Payment[]>`
        SELECT * FROM payments WHERE id = ${paymentId} FOR UPDATE;
      `;

      if (!payments || payments.length === 0) {
        throw new Error(`Payment record ${paymentId} not found.`);
      }

      const payment = payments[0] as any;
      const productId = payment.product_id || payment.productId;

      // Idempotency: If payment was already captured, exit without modifying spend
      if (payment.status === 'captured') {
        const existingProduct = await tx.product.findUnique({
          where: { id: productId },
        });
        return {
          payment,
          product: existingProduct,
          alreadyProcessed: true,
          achieved_rank: payment.target_rank || payment.targetRank,
        };
      }

      // 2. Lock product row exclusively (RowExclusiveLock) to prevent spend race conditions
      const products = await tx.$queryRaw<any[]>`
        SELECT * FROM products WHERE id = ${productId} FOR UPDATE;
      `;

      if (!products || products.length === 0) {
        throw new Error(`Product ${productId} not found.`);
      }

      const product = products[0];

      const previous_verified_spend = Number(product.verified_spend || product.verifiedSpend || 0);
      const required_payment_amount = Number(payment.amount);
      
      // The new verified spend becomes the exact required payment amount
      const new_verified_spend = required_payment_amount;
      const promotion_timestamp = new Date();

      // 3. Update Product verified_spend and timestamp
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          verifiedSpend: new_verified_spend,
          lastPromotedAt: promotion_timestamp,
          status: ProductStatus.ACTIVE,
        },
      });

      // 4. Update Payment to captured
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'captured',
          gatewayPaymentId,
          gatewaySignature,
          verifiedAt: promotion_timestamp,
          previousSpend: previous_verified_spend,
          newSpend: new_verified_spend,
        },
      });

      // 5. Recalculate rankings across all active products
      // Ordering: verified_spend DESC, then last_promoted_at ASC (tie-breaker)
      const activeProducts = await tx.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        orderBy: [
          { verifiedSpend: 'desc' },
          { lastPromotedAt: 'asc' },
          { createdAt: 'asc' },
        ],
        select: { id: true, verifiedSpend: true },
      });

      const achieved_rank = activeProducts.findIndex((p) => p.id === product.id) + 1;

      // 6. Record immutable milestone in ranking_history table
      await tx.rankingHistory.create({
        data: {
          productId: product.id,
          rank: achieved_rank,
          verifiedSpend: new_verified_spend,
          triggeredByPaymentId: payment.id,
          createdAt: promotion_timestamp,
        },
      });

      return {
        payment: updatedPayment,
        product: updatedProduct,
        achieved_rank,
        alreadyProcessed: false,
      };
    });
  }

  /**
   * 4. Get public leaderboard sorted deterministically by verified_spend descending.
   */
  static async getLeaderboard(params: {
    categorySlug?: string;
    search?: string;
    sort?: 'highest_spend' | 'trending' | 'newest' | 'most_viewed';
    page?: number;
    limit?: number;
  }) {
    const minimum_increment = await this.getMinIncrement();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };

    if (params.categorySlug && params.categorySlug !== 'all') {
      where.category = { slug: params.categorySlug };
    }

    if (params.search && params.search.trim() !== '') {
      const query = params.search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Default primary sort: verified_spend DESC, then last_promoted_at ASC (tie-breaker)
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { verifiedSpend: 'desc' },
      { lastPromotedAt: 'asc' },
      { createdAt: 'asc' },
    ];

    if (params.sort === 'trending') {
      orderBy = [
        { clicksCount: 'desc' },
        { viewsCount: 'desc' },
        { verifiedSpend: 'desc' },
      ];
    } else if (params.sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (params.sort === 'most_viewed') {
      orderBy = [{ viewsCount: 'desc' }, { verifiedSpend: 'desc' }];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true, verified: true },
          },
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      }),
    ]);

    // Compute rank and costToNextRank for each item
    const items = products.map((item, index) => {
      const rank = skip + index + 1;
      const current_spend = Number(item.verifiedSpend);
      let costToClaimRank = current_spend + minimum_increment;
      let costToNextRank = minimum_increment;

      if (index > 0) {
        const higher_product_spend = Number(products[index - 1].verifiedSpend);
        costToNextRank = higher_product_spend + minimum_increment;
      }

      return {
        ...item,
        verifiedSpend: current_spend,
        rank,
        costToClaimRank,
        costToNextRank,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      disclosure:
        'Rankings are based on verified promotional spend and do not represent product quality or editorial recommendations.',
      minimum_increment,
    };
  }
}
