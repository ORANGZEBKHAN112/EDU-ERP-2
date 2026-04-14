import { ISchoolRepository } from '../../interfaces/repositories/ISchoolRepository';
import { ICampusRepository } from '../../interfaces/repositories/ICampusRepository';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';
import { ISubscriptionRepository } from '../../interfaces/repositories/ISubscriptionRepository';
import { IFeatureFlagRepository } from '../../interfaces/repositories/IFeatureFlagRepository';
import { IRoleRepository } from '../../interfaces/repositories/IRoleRepository';
import { TransactionManager } from '../../repositories/transactionManager';
import bcrypt from 'bcryptjs';

export class TenantService {
  constructor(
    private schoolRepo: ISchoolRepository,
    private campusRepo: ICampusRepository,
    private userRepo: IUserRepository,
    private roleRepo: IRoleRepository,
    private subRepo: ISubscriptionRepository,
    private featureRepo: IFeatureFlagRepository
  ) {}

  async onboardTenant(data: {
    schoolName: string;
    country: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    planType: 'Basic' | 'Pro' | 'Enterprise';
  }) {
    const txManager = await TransactionManager.startTransaction();
    try {
      // Check if email already exists
      const existingUser = await this.userRepo.getByEmail(data.adminEmail);
      if (existingUser) {
        throw new Error('Admin email already exists in the system');
      }

      const school = await this.schoolRepo.create({
        name: data.schoolName,
        country: data.country
      }, txManager.transaction);

      const campus = await this.campusRepo.create({
        schoolId: school.id,
        name: 'Main Campus',
        state: 'Default',
        city: 'Default',
        address: 'Default'
      }, txManager.transaction);

      const passwordHash = await bcrypt.hash('Admin@123', 10);
      const user = await this.userRepo.create({
        schoolId: school.id,
        fullName: data.adminName,
        email: data.adminEmail,
        passwordHash,
        phone: data.adminPhone
      }, txManager.transaction);

      const adminRole = await this.roleRepo.getByName('SuperAdmin');
      if (adminRole) {
        await this.userRepo.addUserRole(user.id, adminRole.id, txManager.transaction);
      }

      await this.userRepo.addUserCampus(user.id, campus.id, txManager.transaction);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      await this.subRepo.create({
        schoolId: school.id,
        planType: data.planType,
        startDate,
        endDate,
        status: 'Active'
      }, txManager.transaction);

      const features = ['FeeAutomation', 'Reports', 'PaymentIntegration'];
      for (const feature of features) {
        await this.featureRepo.create({
          schoolId: school.id,
          featureName: feature,
          isEnabled: true
        }, txManager.transaction);
      }

      await txManager.commit();
      return { school, admin: user };
    } catch (error) {
      console.error('Onboarding failed:', error);
      await txManager.rollback();
      throw error;
    }
  }

  async getAllTenants() {
    return this.schoolRepo.getAll();
  }

  async getTenantStatus(schoolId: number) {
    const school = await this.schoolRepo.getById(schoolId);
    const subscription = await this.subRepo.getBySchoolId(schoolId);
    const features = await this.featureRepo.getBySchoolId(schoolId);

    return {
      school,
      subscription,
      features
    };
  }
}
