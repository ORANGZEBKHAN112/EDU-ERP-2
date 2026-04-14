import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../services/implementations/TenantService';

export class TenantController {
  constructor(private tenantService: TenantService) {}

  createTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.tenantService.onboardTenant(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getTenants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenants = await this.tenantService.getAllTenants();
      res.json(tenants);
    } catch (err) {
      next(err);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.tenantService.getTenantStatus(parseInt(req.params.id));
      res.json(status);
    } catch (err) {
      next(err);
    }
  };
}
