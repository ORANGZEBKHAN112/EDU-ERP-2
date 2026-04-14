import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../interfaces/services/IAuthService';

export class AuthController {
  constructor(private authService: IAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
