export * from './implementations/AuthController';
export * from './implementations/SchoolController';
export * from './implementations/CampusController';
export * from './implementations/StudentController';
export * from './implementations/FeeController';
export * from './implementations/PaymentController';
export * from './implementations/DashboardController';
export * from './implementations/TenantController';
export * from './implementations/ReconciliationController';
export * from './implementations/FinancialEventController';
export * from './implementations/SystemController';

import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../services/workflowService';
const workflowService = new WorkflowService();

export class WorkflowController {
  async runMonthlyJob(req: any, res: Response, next: NextFunction) {
    try {
      const { month } = req.body;
      const results = await workflowService.runMonthlyVoucherGeneration(month, req.user.id);
      res.json({ message: 'Monthly job completed', results });
    } catch (err) {
      next(err);
    }
  }

  async applyFines(req: any, res: Response, next: NextFunction) {
    try {
      const { month } = req.body;
      const results = await workflowService.applyOverdueFines(month, req.user.id);
      res.json({ message: `Applied fines to ${results.length} students`, results });
    } catch (err) {
      next(err);
    }
  }
}
