import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { ProductStatus, PaymentStatus } from '@prisma/client';

export class AdminController {
  static async getOverviewMetrics(req: Request, res: Response) {
    try {
      const data = await AdminService.getOverviewMetrics();
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await AdminService.getPaymentsList(page, limit);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const data = await AdminService.getProductsList(page, limit);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateProductStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, isFeatured } = req.body;
      const updated = await AdminService.updateProductStatus(id, status as ProductStatus, isFeatured);
      return res.json({ success: true, product: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await AdminService.updatePaymentStatus(id, status as PaymentStatus);
      return res.json({ success: true, payment: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await AdminService.getSettings();
      return res.json({ success: true, settings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateSetting(req: Request, res: Response) {
    try {
      const { key, value, description } = req.body;
      const setting = await AdminService.updateSetting(key, value, description);
      return res.json({ success: true, setting });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getRankingHistory(req: Request, res: Response) {
    try {
      const { productId } = req.query;
      const history = await AdminService.getRankingHistory(productId as string);
      return res.json({ success: true, history });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
