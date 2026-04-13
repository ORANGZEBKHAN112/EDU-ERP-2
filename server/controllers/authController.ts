import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema } from '../utils/validation';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated.email, validated.password);
      res.json(result);
    } catch (err: any) {
      if (err.name === 'ZodError') throw err;
      res.status(401).json({ message: err.message });
    }
  }
}
