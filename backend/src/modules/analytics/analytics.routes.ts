import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.post('/track', AnalyticsController.track);
router.get('/redirect/:productId', AnalyticsController.redirect);
router.get('/brand-summary', requireAuth, AnalyticsController.getBrandAnalytics);

export default router;
