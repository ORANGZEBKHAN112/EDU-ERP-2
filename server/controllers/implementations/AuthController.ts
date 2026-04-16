import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../interfaces/services/IAuthService';
import { AuditService, AuditAction } from '../../services/auditService';

export class AuthController {
  constructor(private authService: IAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      // Log successful login
      await AuditService.log(
        result.user.id,
        AuditAction.LOGIN,
        null,
        { email, ip: req.ip },
        result.user.campusIds?.[0] || 0
      );

      res.json(result);
    } catch (err: any) {
      // Log failed attempt
      console.warn(`[AUTH] Failed login attempt for ${req.body.email}`);
      next(err);
    }
  };
}
