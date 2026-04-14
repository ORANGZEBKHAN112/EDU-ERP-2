import { User, Role, Campus } from '../../models';
import * as sql from 'mssql';

export interface IUserRepository {
  getByEmail(email: string): Promise<User | undefined>;
  getById(id: number): Promise<User | undefined>;
  create(item: any, transaction?: sql.Transaction): Promise<User>;
  addUserRole(userId: number, roleId: number, transaction?: sql.Transaction): Promise<void>;
  addUserCampus(userId: number, campusId: number, transaction?: sql.Transaction): Promise<void>;
  getUserRoles(userId: number): Promise<Role[]>;
  getUserCampuses(userId: number): Promise<Campus[]>;
}
