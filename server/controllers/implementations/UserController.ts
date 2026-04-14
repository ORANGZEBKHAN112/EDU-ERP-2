import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { IRoleRepository } from '../../interfaces/repositories/IRoleRepository';
import bcrypt from 'bcryptjs';

export class UserController {
  constructor(
    private userRepo: IUserRepository,
    private roleRepo: IRoleRepository
  ) {}

  getUsers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user.schoolId;
      console.log('Fetching users for schoolId:', schoolId);
      const users = await this.userRepo.getUsersBySchool(schoolId);
      
      const usersWithDetails = await Promise.all(users.map(async (u) => {
        try {
          const roles = await this.userRepo.getUserRoles(u.id);
          const campuses = await this.userRepo.getUserCampuses(u.id);
          return {
            ...u,
            roles: roles.map(r => r.name),
            campusIds: campuses.map(c => c.id)
          };
        } catch (err) {
          console.error(`Failed to fetch details for user ${u.id}:`, err);
          return {
            ...u,
            roles: [],
            campusIds: []
          };
        }
      }));

      res.json(usersWithDetails);
    } catch (err) {
      console.error('getUsers failed:', err);
      next(err);
    }
  };

  createUser = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { fullName, email, password, phone, roleNames, campusIds } = req.body;
      const schoolId = req.user.schoolId;

      const passwordHash = await bcrypt.hash(password || 'EduFlow@123', 10);
      
      const user = await this.userRepo.create({
        schoolId,
        fullName,
        email,
        passwordHash,
        phone
      });

      if (roleNames && Array.isArray(roleNames)) {
        for (const roleName of roleNames) {
          const role = await this.roleRepo.getByName(roleName);
          if (role) {
            await this.userRepo.addUserRole(user.id, role.RoleId || role.id);
          }
        }
      }

      if (campusIds && Array.isArray(campusIds)) {
        for (const campusId of campusIds) {
          await this.userRepo.addUserCampus(user.id, campusId);
        }
      }

      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For now just return the standard roles
      const roles = ['SuperAdmin', 'FinanceAdmin', 'CampusAdmin', 'Student', 'Parent'];
      res.json(roles);
    } catch (err) {
      next(err);
    }
  };
}
