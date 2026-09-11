import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';

export const createOrderSchema = z.object({
  productId: z.string().uuid().optional(),
  targetRank: z.number().int().min(1, 'Target rank must be at least 1'),
  newProductData: z
    .object({
      name: z.string().min(2, 'Product name is required'),
      brandId: z.string().uuid().optional(),
      brandName: z.string().min(2).optional(),
      categoryId: z.string().uuid('Category is required'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      productUrl: z.string().url('Valid product URL is required'),
      imageUrl: z.string().url('Valid image URL is required'),
    })
    .optional(),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export class PaymentController {
  static async createOrder(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const orderData = await PaymentService.createOrder({
        userId: req.user.id,
        productId: req.body.productId,
        newProductData: req.body.newProductData,
        targetRank: req.body.targetRank,
      });

      return res.status(201).json({ success: true, data: orderData });
    } catch (error: any) {
      console.error('Order creation error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create order' });
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const result = await PaymentService.verifyPayment(req.body);
      return res.json({
        success: true,
        message: 'Payment verified and promotion applied successfully!',
        data: result,
      });
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Verification failed' });
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await PaymentService.handleWebhook(rawBody, signature, req.body);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Webhook error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Webhook failed' });
    }
  }

  static async getProductHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const history = await PaymentService.getPublicProductHistory(productId);
      return res.json({ success: true, history });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMyPayments(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const payments = await prisma.payment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
          brand: { select: { id: true, name: true } },
        },
      });

      return res.json({ success: true, payments });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Test endpoint to simulate instant sandbox payment completion
   */
  static async simulateSandboxPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.body;
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const mockPaymentId = `pay_sim_${Date.now()}`;
      const mockSignature = `mock_sig_${Date.now()}`;

      const result = await PaymentService.verifyPayment({
        paymentId: payment.id,
        razorpayOrderId: payment.gatewayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
      });

      return res.json({
        success: true,
        message: 'Sandbox payment simulated and rank updated!',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
