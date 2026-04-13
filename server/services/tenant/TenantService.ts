import { 
  SchoolRepository, 
  CampusRepository, 
  UserRepository, 
  RoleRepository, 
  SubscriptionRepository, 
  FeatureFlagRepository 
} from '../../repositories';
import { TransactionManager } from '../../repositories/transactionManager';
import bcrypt from 'bcryptjs';

export class TenantService {
  private schoolRepo = new SchoolRepository();
  private campusRepo = new CampusRepository();
  private userRepo = new UserRepository();
  private roleRepo = new RoleRepository();
  private subRepo = new SubscriptionRepository();
  private featureRepo = new FeatureFlagRepository();

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
      // 1. Create School
      const school = await this.schoolRepo.create({
        name: data.schoolName,
        country: data.country
      });

      // 2. Create Default Campus
      const campus = await this.campusRepo.create({
        schoolId: school.id,
        name: 'Main Campus',
        state: 'Default',
        city: 'Default',
        address: 'Default'
      });

      // 3. Create Admin User
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      const user = await this.userRepo.create({
        schoolId: school.id,
        fullName: data.adminName,
        email: data.adminEmail,
        passwordHash,
        phone: data.adminPhone
      }, txManager.transaction);

      // 4. Assign Roles
      const adminRole = await this.roleRepo.getByName('SuperAdmin');
      if (adminRole) {
        await this.userRepo.addUserRole(user.id, adminRole.RoleId, txManager.transaction);
      }

      // 5. Assign Campus
      await this.userRepo.addUserCampus(user.id, campus.id, txManager.transaction);

      // 6. Initialize Subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1); // 1 year default

      await this.subRepo.create({
        schoolId: school.id,
        planType: data.planType,
        startDate,
        endDate,
        status: 'Active'
      }, txManager.transaction);

      // 7. Initialize Default Feature Flags
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
