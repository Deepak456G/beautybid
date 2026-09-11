import { Router } from 'express';
import {
  PaymentController,
  createOrderSchema,
  verifyPaymentSchema,
} from './payment.controller';
import { requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { paymentLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/create-order',
  requireAuth,
  paymentLimiter,
  validateRequest(createOrderSchema),
  PaymentController.createOrder
);

router.post(
  '/verify',
  paymentLimiter,
  validateRequest(verifyPaymentSchema),
  PaymentController.verifyPayment
);

router.post('/webhook', PaymentController.handleWebhook);
router.get('/history/product/:productId', PaymentController.getProductHistory);
router.get('/my-payments', requireAuth, PaymentController.getMyPayments);
router.post('/simulate-sandbox-pay', PaymentController.simulateSandboxPayment);

export default router;
