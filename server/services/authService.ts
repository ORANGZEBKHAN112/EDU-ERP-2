import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories';
import { User } from '../models';
import { AuthError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthService {
  private userRepo = new UserRepository();

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[AUTH] Login attempt for: ${normalizedEmail}`);

    const user = await this.userRepo.getByEmail(normalizedEmail);
    if (!user) {
      console.log(`[AUTH] User not found: ${normalizedEmail}`);
      throw new AuthError('Invalid credentials');
    }

    console.log(`[AUTH] User found. Hash length: ${user.passwordHash.length}`);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for: ${normalizedEmail}`);
      throw new AuthError('Invalid credentials');
    }

    console.log(`[AUTH] Login successful for: ${normalizedEmail}`);

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

    return { token, user: { id: user.id, fullName: user.fullName, email: user.email, roles: roles.map(r => r.name) } };
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
      return null;
    }
  }
}
