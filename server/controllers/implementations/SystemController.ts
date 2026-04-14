import { Request, Response } from 'express';
import { ISystemHealthService } from '../../interfaces/services/ISystemHealthService';

export class SystemController {
  constructor(private healthService: ISystemHealthService) {}

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
}
