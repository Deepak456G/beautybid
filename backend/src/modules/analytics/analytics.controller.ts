import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ClickEventType } from '@prisma/client';

export class AnalyticsController {
  static async track(req: Request, res: Response) {
    try {
      const { productId, eventType } = req.body;
      if (!productId || !eventType || !Object.values(ClickEventType).includes(eventType)) {
        return res.status(400).json({ success: false, message: 'Invalid product or event type.' });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const referrer = req.headers.referer;
      const userAgent = req.headers['user-agent'];

      await AnalyticsService.trackEvent({
        productId,
        eventType,
        referrer,
        ip,
        userAgent,
      });

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async redirect(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const referrer = req.headers.referer;
      const userAgent = req.headers['user-agent'];

      const destination = await AnalyticsService.handleExternalRedirect(
        productId,
        ip,
        referrer,
        userAgent
      );

      return res.redirect(destination);
    } catch (error: any) {
      return res.status(404).send('Product link not found.');
    }
  }

  static async getBrandAnalytics(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const data = await AnalyticsService.getBrandAnalytics(req.user.id);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
