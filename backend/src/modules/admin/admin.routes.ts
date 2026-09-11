import { Router } from 'express';
import { AdminController } from './admin.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth';

const router = Router();

// Protect all admin routes with authentication and ADMIN role
router.use(requireAuth, requireAdmin);

router.get('/metrics', AdminController.getOverviewMetrics);
router.get('/payments', AdminController.getPayments);
router.patch('/payments/:id/status', AdminController.updatePaymentStatus);
router.get('/products', AdminController.getProducts);
router.patch('/products/:id/status', AdminController.updateProductStatus);
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSetting);
router.get('/ranking-history', AdminController.getRankingHistory);

export default router;
