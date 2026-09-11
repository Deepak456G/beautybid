import crypto from 'crypto';
import { ClickEventType } from '@prisma/client';
import { prisma } from '../../utils/prisma';

export class AnalyticsService {
  private static hashIp(ip?: string): string {
    if (!ip) return 'anonymous';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
  }

  static async trackEvent(params: {
    productId: string;
    eventType: ClickEventType;
    referrer?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const ipHash = this.hashIp(params.ip);

    await prisma.clickEvent.create({
      data: {
        productId: params.productId,
        eventType: params.eventType,
        referrer: params.referrer?.substring(0, 255),
        ipHash,
        userAgent: params.userAgent?.substring(0, 255),
      },
    });

    if (params.eventType === ClickEventType.view) {
      await prisma.product.update({
        where: { id: params.productId },
        data: { viewsCount: { increment: 1 } },
      });
    } else if (
      params.eventType === ClickEventType.card_click ||
      params.eventType === ClickEventType.external_click
    ) {
      await prisma.product.update({
        where: { id: params.productId },
        data: { clicksCount: { increment: 1 } },
      });
    }

    return { tracked: true };
  }

  static async handleExternalRedirect(productId: string, ip?: string, referrer?: string, userAgent?: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, productUrl: true },
    });

    if (!product) {
      throw new Error('Product not found.');
    }

    await this.trackEvent({
      productId: product.id,
      eventType: ClickEventType.external_click,
      ip,
      referrer,
      userAgent,
    });

    return product.productUrl;
  }

  static async getBrandAnalytics(userId: string) {
    const brands = await prisma.brand.findMany({
      where: { userId },
      select: { id: true },
    });
    const brandIds = brands.map((b) => b.id);

    const products = await prisma.product.findMany({
      where: { brandId: { in: brandIds } },
      select: {
        id: true,
        name: true,
        viewsCount: true,
        clicksCount: true,
        verifiedSpend: true,
      },
    });

    const totalViews = products.reduce((acc, p) => acc + p.viewsCount, 0);
    const totalClicks = products.reduce((acc, p) => acc + p.clicksCount, 0);
    const totalSpend = products.reduce((acc, p) => acc + Number(p.verifiedSpend), 0);
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

    return {
      totalViews,
      totalClicks,
      totalSpend,
      ctr: `${ctr}%`,
      productBreakdown: products,
    };
  }
}
