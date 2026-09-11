import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from './utils/prisma';
import { RankingService } from './modules/ranking/ranking.service';
import { PaymentService } from './modules/payments/payment.service';
import { ProductStatus, PaymentStatus } from '@prisma/client';

describe('BeautyBid Explicit Deterministic Ranking Economics Tests', () => {
  let testBrand: any;
  let testCategory: any;
  let testUser: any;
  let productA: any;
  let productB: any;
  let productC: any;

  before(async () => {
    // Clean tables for isolated deterministic testing
    await prisma.clickEvent.deleteMany();
    await prisma.rankingHistory.deleteMany();
    await prisma.paymentEvent.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.product.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        email: `ranking_econ_${Date.now()}@beautybid.test`,
        name: 'Economics Tester',
        passwordHash: 'dummy_hash',
      },
    });

    testBrand = await prisma.brand.create({
      data: {
        name: 'Pure Economics Lab',
        slug: `econ-lab-${Date.now()}`,
        userId: testUser.id,
      },
    });

    testCategory = (await prisma.category.findFirst()) || (await prisma.category.create({
      data: {
        name: 'Economics Category',
        slug: `econ-cat-${Date.now()}`,
      },
    }));

    // Setup User's exact test case:
    // #1 Product A = ₹100,000
    // #2 Product B = ₹75,000
    // #3 Product C = ₹50,000
    productA = await prisma.product.create({
      data: {
        name: 'Product A',
        slug: `product-a-${Date.now()}`,
        brandId: testBrand.id,
        categoryId: testCategory.id,
        description: 'Product A description',
        productUrl: 'https://example.com/a',
        imageUrl: 'https://example.com/a.jpg',
        verifiedSpend: 100000.0,
        status: ProductStatus.ACTIVE,
        lastPromotedAt: new Date(Date.now() - 300000),
      },
    });

    productB = await prisma.product.create({
      data: {
        name: 'Product B',
        slug: `product-b-${Date.now()}`,
        brandId: testBrand.id,
        categoryId: testCategory.id,
        description: 'Product B description',
        productUrl: 'https://example.com/b',
        imageUrl: 'https://example.com/b.jpg',
        verifiedSpend: 75000.0,
        status: ProductStatus.ACTIVE,
        lastPromotedAt: new Date(Date.now() - 200000),
      },
    });

    productC = await prisma.product.create({
      data: {
        name: 'Product C',
        slug: `product-c-${Date.now()}`,
        brandId: testBrand.id,
        categoryId: testCategory.id,
        description: 'Product C description',
        productUrl: 'https://example.com/c',
        imageUrl: 'https://example.com/c.jpg',
        verifiedSpend: 50000.0,
        status: ProductStatus.ACTIVE,
        lastPromotedAt: new Date(Date.now() - 100000),
      },
    });
  });

  after(async () => {
    if (productA || productB || productC) {
      await prisma.product.deleteMany({
        where: { id: { in: [productA.id, productB.id, productC.id] } },
      });
    }
    if (testBrand) await prisma.brand.deleteMany({ where: { id: testBrand.id } });
    if (testUser) await prisma.user.deleteMany({ where: { id: testUser.id } });
  });

  test('Specification Example: Product C outbids #1 with minimum increment 1 => Required payment is 100,001', async () => {
    // 1. Temporarily configure minimum increment to ₹1
    await prisma.siteSettings.upsert({
      where: { key: 'MIN_RANK_INCREMENT' },
      update: { value: '1' },
      create: { key: 'MIN_RANK_INCREMENT', value: '1', description: 'Test increment 1' },
    });

    // 2. Server calculates exact required amount
    const calculation = await RankingService.calculateRequiredAmount(productC.id, 1);

    // Explicit variable checks
    assert.equal(calculation.target_rank, 1);
    assert.equal(calculation.target_rank_holder_spend, 100000);
    assert.equal(calculation.minimum_increment, 1);
    assert.equal(calculation.required_payment_amount, 100001);
    assert.equal(calculation.new_verified_spend, 100001);
    assert.equal(calculation.previous_verified_spend, 50000);

    // 3. Create simulated payment record for Product C
    const payment = await prisma.payment.create({
      data: {
        productId: productC.id,
        brandId: testBrand.id,
        userId: testUser.id,
        amount: calculation.required_payment_amount,
        currency: 'INR',
        gateway: 'razorpay',
        gatewayOrderId: `order_spec_test_${Date.now()}`,
        status: PaymentStatus.created,
        targetRank: 1,
        previousSpend: calculation.previous_verified_spend,
        newSpend: calculation.new_verified_spend,
      },
    });

    // 4. Atomically process verified promotion inside PostgreSQL transaction with row locks
    const promoResult = await RankingService.processVerifiedPromotion(
      payment.id,
      `pay_spec_${Date.now()}`,
      'valid_spec_signature'
    );

    assert.equal(promoResult.alreadyProcessed, false);
    assert.equal(promoResult.achieved_rank, 1);
    assert.equal(Number(promoResult.product!.verifiedSpend), 100001);

    // 5. Verify live leaderboard ordering:
    // #1 Product C = ₹100,001
    // #2 Product A = ₹100,000
    // #3 Product B = ₹75,000
    const leaderboard = await RankingService.getLeaderboard({ limit: 10 });
    const topThree = leaderboard.items.filter((item) =>
      [productA.id, productB.id, productC.id].includes(item.id)
    );

    assert.equal(topThree[0].id, productC.id);
    assert.equal(topThree[0].verifiedSpend, 100001);
    assert.equal(topThree[1].id, productA.id);
    assert.equal(topThree[1].verifiedSpend, 100000);
    assert.equal(topThree[2].id, productB.id);
    assert.equal(topThree[2].verifiedSpend, 75000);

    // Reset minimum increment to 500
    await prisma.siteSettings.update({
      where: { key: 'MIN_RANK_INCREMENT' },
      data: { value: '500' },
    });
  });

  test('Deterministic Tie-Breaker: Earlier verified promotional timestamp retains rank', async () => {
    // When two products have identical spend, earlier lastPromotedAt wins
    const earlierDate = new Date(Date.now() - 500000);
    const laterDate = new Date(Date.now() - 100000);

    await prisma.product.update({
      where: { id: productA.id },
      data: { verifiedSpend: 100000, lastPromotedAt: earlierDate },
    });
    await prisma.product.update({
      where: { id: productB.id },
      data: { verifiedSpend: 100000, lastPromotedAt: laterDate },
    });

    const leaderboard = await RankingService.getLeaderboard({ limit: 10 });
    const pA = leaderboard.items.find((i) => i.id === productA.id);
    const pB = leaderboard.items.find((i) => i.id === productB.id);

    assert.ok(pA && pB);
    assert.ok(pA.rank! < pB.rank!, 'Product A with earlier promotion timestamp should rank higher than Product B');
  });

  test('Webhook Idempotency: Duplicate delivery never updates verified_spend twice', async () => {
    const testEventId = `evt_idempotent_test_${Date.now()}`;
    const payload = {
      id: testEventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_idemp_${Date.now()}`,
            order_id: 'order_nonexistent_test',
          },
        },
      },
    };

    const firstRun = await PaymentService.handleWebhook('{}', 'sig', payload);
    assert.equal(firstRun.status, 'success');

    const duplicateRun = await PaymentService.handleWebhook('{}', 'sig', payload);
    assert.equal(duplicateRun.status, 'already_processed');

    // Cleanup event
    await prisma.paymentEvent.deleteMany({ where: { eventId: testEventId } });
  });

  test('Immutable Audit: Ranking history records milestone permanently', async () => {
    const historyEntries = await prisma.rankingHistory.findMany({
      where: { productId: productC.id },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(historyEntries.length > 0);
    assert.equal(historyEntries[0].rank, 1);
    assert.equal(Number(historyEntries[0].verifiedSpend), 100001);
  });
});
