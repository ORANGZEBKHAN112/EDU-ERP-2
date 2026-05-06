import { Request, Response } from 'express';
import { ISystemHealthService } from '../../interfaces/services/ISystemHealthService';
import { AuditRepository } from '../../repositories';

export class SystemController {
  constructor(private healthService: ISystemHealthService) {}
  private auditRepo = new AuditRepository();

  getHealth = async (req: Request, res: Response) => {
    try {
      const health = await this.healthService.getHealth();
      res.json({
        status: 'success',
        timestamp: new Date(),
        data: health
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve system health',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit || 100);
      const logs = await this.auditRepo.getRecent(limit);
      res.json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve audit logs',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}
