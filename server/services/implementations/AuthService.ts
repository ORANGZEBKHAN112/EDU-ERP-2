import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { IAuthService } from '../../interfaces/services/IAuthService';
import { AuthError } from '../../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.getByEmail(normalizedEmail);
    
    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthError('Invalid credentials');
    }

    const roles = await this.userRepo.getUserRoles(user.id);
    const campuses = await this.userRepo.getUserCampuses(user.id);

    const token = jwt.sign(
      { 
        id: user.id, 
        schoolId: user.schoolId,
        email: user.email, 
        roles: roles.map(r => r.name),
        campusIds: campuses.map(c => c.id)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { 
      token, 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        email: user.email, 
        roles: roles.map(r => r.name),
        schoolId: user.schoolId,
        campusIds: campuses.map(c => c.id)
      } 
    };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return null;
    }
  }
}
