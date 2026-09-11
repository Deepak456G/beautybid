import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../../utils/prisma';
import { config } from '../../config';
import { RankingService } from '../ranking/ranking.service';
import { PaymentStatus, ProductStatus } from '@prisma/client';

export class PaymentService {
  private static razorpayInstance: Razorpay | null = null;

  private static getRazorpay(): Razorpay {
    if (!this.razorpayInstance) {
      this.razorpayInstance = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    }
    return this.razorpayInstance;
  }

  /**
   * Create Razorpay Order server-side with strictly calculated amount
   */
  static async createOrder(params: {
    userId: string;
    productId?: string;
    newProductData?: {
      name: string;
      brandId?: string;
      brandName?: string;
      categoryId: string;
      description: string;
      productUrl: string;
      imageUrl: string;
    };
    targetRank: number;
  }) {
    let product = null;
    let brandId = '';

    if (params.productId) {
      product = await prisma.product.findUnique({
        where: { id: params.productId },
        include: { brand: true },
      });
      if (!product) {
        throw new Error('Product not found.');
      }
      brandId = product.brandId;
    } else if (params.newProductData) {
      // Find or create brand for new product
      if (params.newProductData.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: params.newProductData.brandId },
        });
        if (!brand) throw new Error('Selected brand not found.');
        brandId = brand.id;
      } else if (params.newProductData.brandName) {
        const slug = params.newProductData.brandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        const brand = await prisma.brand.create({
          data: {
            name: params.newProductData.brandName.trim(),
            slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: params.userId,
          },
        });
        brandId = brand.id;
      } else {
        throw new Error('Brand information is required for new product.');
      }

      // Create draft/pending product
      const productSlug = params.newProductData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      product = await prisma.product.create({
        data: {
          name: params.newProductData.name.trim(),
          slug: `${productSlug}-${Math.floor(1000 + Math.random() * 9000)}`,
          brandId,
          categoryId: params.newProductData.categoryId,
          description: params.newProductData.description.trim(),
          productUrl: params.newProductData.productUrl.trim(),
          imageUrl: params.newProductData.imageUrl.trim(),
          status: ProductStatus.PENDING,
          verifiedSpend: 0,
        },
      });
    } else {
      throw new Error('Either productId or newProductData must be provided.');
    }

    // 1. Calculate amount required server-side
    const calculation = await RankingService.calculateRequiredAmount(
      params.productId || null,
      params.targetRank
    );

    const requiredAmount = calculation.requiredAmount;
    const amountInPaise = Math.round(requiredAmount * 100);

    // 2. Generate Razorpay order
    let razorpayOrderId = '';
    const isMock = config.razorpay.keyId.startsWith('rzp_test_beautybid');

    if (!isMock) {
      try {
        const rzp = this.getRazorpay();
        const rzpOrder = await rzp.orders.create({
          amount: amountInPaise,
          currency: config.currency,
          receipt: `rcpt_${Date.now().toString(36)}`,
          notes: {
            productId: product.id,
            productName: product.name,
            targetRank: params.targetRank.toString(),
            userId: params.userId,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        console.warn('Razorpay live order creation failed, switching to sandbox simulation:', err.message);
        razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      }
    } else {
      // Test sandbox simulation order
      razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }

    // 3. Persist payment record
    const payment = await prisma.payment.create({
      data: {
        productId: product.id,
        brandId,
        userId: params.userId,
        amount: requiredAmount,
        currency: config.currency,
        gateway: 'razorpay',
        gatewayOrderId: razorpayOrderId,
        status: PaymentStatus.created,
        targetRank: params.targetRank,
        previousSpend: calculation.currentProductSpend,
        newSpend: calculation.newTotalSpend,
        metadata: {
          calculation: calculation as any,
          targetProductName: calculation.targetProductName,
        },
      },
    });

    return {
      paymentId: payment.id,
      orderId: razorpayOrderId,
      amount: requiredAmount,
      amountInPaise,
      currency: config.currency,
      keyId: config.razorpay.keyId,
      product: {
        id: product.id,
        name: product.name,
      },
      targetRank: params.targetRank,
      calculation,
      isSandbox: isMock,
    };
  }

  /**
   * Constant-time string comparison to prevent cryptographic timing attacks
   */
  private static timingSafeCompare(a: string, b: string): boolean {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    const isMock = config.razorpay.keyId.startsWith('rzp_test_beautybid');
    if (isMock && signature.startsWith('mock_sig_')) {
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return this.timingSafeCompare(expectedSignature, signature);
  }

  /**
   * Verify and process client-submitted payment
   */
  static async verifyPayment(params: {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment) {
      throw new Error('Payment record not found.');
    }

    if (payment.gatewayOrderId !== params.razorpayOrderId) {
      throw new Error('Order ID mismatch.');
    }

    const isValid = this.verifySignature(
      params.razorpayOrderId,
      params.razorpayPaymentId,
      params.razorpaySignature
    );

    if (!isValid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.failed },
      });
      throw new Error('Payment signature verification failed.');
    }

    // Process promotion atomically
    return await RankingService.processVerifiedPromotion(
      payment.id,
      params.razorpayPaymentId,
      params.razorpaySignature
    );
  }

  /**
   * Process Razorpay Webhooks idempotently
   */
  static async handleWebhook(rawBody: string, signature: string, payload: any) {
    const isMock = config.razorpay.keyId.startsWith('rzp_test_beautybid');

    if (!isMock) {
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (!this.timingSafeCompare(expectedSignature, signature)) {
        throw new Error('Invalid webhook signature.');
      }
    }

    const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;
    const eventType = payload.event;

    // 1. Idempotency Check
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return { status: 'already_processed', eventId };
    }

    let paymentId: string | null = null;
    let paymentRecord = null;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const orderId = entity?.order_id || entity?.id;
      const gatewayPaymentId = entity?.id || `pay_${Date.now()}`;

      if (orderId) {
        paymentRecord = await prisma.payment.findUnique({
          where: { gatewayOrderId: orderId },
        });

        if (paymentRecord) {
          paymentId = paymentRecord.id;
          if (paymentRecord.status !== PaymentStatus.captured) {
            await RankingService.processVerifiedPromotion(
              paymentRecord.id,
              gatewayPaymentId,
              signature || 'webhook_verified'
            );
          }
        }
      }
    } else if (eventType === 'payment.failed') {
      const entity = payload.payload?.payment?.entity;
      const orderId = entity?.order_id;
      if (orderId) {
        paymentRecord = await prisma.payment.findUnique({
          where: { gatewayOrderId: orderId },
        });
        if (paymentRecord) {
          paymentId = paymentRecord.id;
          await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: PaymentStatus.failed },
          });
        }
      }
    }

    // 2. Persist event for permanent idempotency & audit
    await prisma.paymentEvent.create({
      data: {
        paymentId,
        eventId,
        eventType,
        payload: payload,
      },
    });

    return { status: 'success', eventId };
  }

  /**
   * Safe public payment history for a product.
   * Excludes all sensitive PII, emails, gateway secrets, etc.
   */
  static async getPublicProductHistory(productId: string) {
    const history = await prisma.payment.findMany({
      where: {
        productId,
        status: PaymentStatus.captured,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        targetRank: true,
        newSpend: true,
        createdAt: true,
        verifiedAt: true,
      },
    });

    return history.map((h) => ({
      id: h.id,
      amount: Number(h.amount),
      currency: h.currency,
      rankAchieved: h.targetRank,
      totalSpendAchieved: Number(h.newSpend),
      date: h.verifiedAt || h.createdAt,
    }));
  }
}
