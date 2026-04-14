import { Response } from 'express';
import { IReconciliationService } from '../../interfaces/services/IReconciliationService';
import { RequestContext } from '../../dtos/fee.dto';

export class ReconciliationController {
  constructor(private reconciliationService: IReconciliationService) {}

  async runReconciliation(req: any, res: Response) {
    try {
      const ctx: RequestContext = {
        userId: req.user.id,
        campusIds: req.user.campusIds || [],
        schoolId: req.user.schoolId
      };

      await this.reconciliationService.runDailyReconciliation(ctx);
      res.json({ message: 'Reconciliation process completed successfully' });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getReports(req: any, res: Response) {
    try {
      const ctx: RequestContext = {
        userId: req.user.id,
        campusIds: req.user.campusIds || [],
        schoolId: req.user.schoolId
      };

      const reports = await this.reconciliationService.getReports(ctx);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}
