import { Request, Response, NextFunction } from 'express';
import { IDashboardService } from '../../interfaces/services/IDashboardService';

export class DashboardController {
  constructor(private dashboardService: IDashboardService) {}

  getSuperAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.dashboardService.getSuperAdminStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  };

  getCampusDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campusId = parseInt(req.params.campusId);
      const stats = await this.dashboardService.getCampusDashboard(campusId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  };
}
