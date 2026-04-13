import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService';

export class ReportController {
  private reportService = new ReportService();

  getSuperAdminOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.reportService.getSuperAdminOverview();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  getCampusSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campusIds = (req as any).user.campusIds;
      const data = await this.reportService.getCampusSummary(campusIds);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  getDefaulters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campusIds = (req as any).user.campusIds;
      const data = await this.reportService.getDefaulters(campusIds);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.reportService.getPaymentInsights();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}
