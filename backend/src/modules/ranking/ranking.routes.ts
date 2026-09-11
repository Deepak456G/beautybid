import { Router } from 'express';
import { RankingController } from './ranking.controller';

const router = Router();

router.get('/leaderboard', RankingController.getLeaderboard);
router.post('/calculate', RankingController.calculateRequiredAmount);
router.get('/min-increment', RankingController.getMinIncrement);

export default router;
