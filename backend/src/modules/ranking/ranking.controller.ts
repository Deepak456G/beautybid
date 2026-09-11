import { Request, Response } from 'express';
import { RankingService } from './ranking.service';

export class RankingController {
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const { category, search, sort, page, limit } = req.query;

      const data = await RankingService.getLeaderboard({
        categorySlug: category as string,
        search: search as string,
        sort: sort as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to fetch leaderboard' });
    }
  }

  static async calculateRequiredAmount(req: Request, res: Response) {
    try {
      const { productId, targetRank } = req.body;

      if (!targetRank || typeof targetRank !== 'number' || targetRank < 1) {
        return res.status(400).json({ success: false, message: 'Valid targetRank is required (>= 1).' });
      }

      const calculation = await RankingService.calculateRequiredAmount(
        productId || null,
        targetRank
      );

      return res.json({ success: true, data: calculation });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Calculation error' });
    }
  }

  static async getMinIncrement(req: Request, res: Response) {
    try {
      const minIncrement = await RankingService.getMinIncrement();
      return res.json({ success: true, minIncrement });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
