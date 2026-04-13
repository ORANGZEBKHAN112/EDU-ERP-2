import { BillingRepository, SubscriptionRepository, UsageRepository } from '../../repositories';
import { TransactionManager } from '../../repositories/transactionManager';

export class BillingService {
  private billingRepo = new BillingRepository();
  private subRepo = new SubscriptionRepository();
  private usageRepo = new UsageRepository();

  async generateMonthlyInvoice(schoolId: number) {
    const sub = await this.subRepo.getBySchoolId(schoolId);
    if (!sub) throw new Error('No active subscription found');

    const planPrices: Record<string, number> = {
      'Basic': 50,
      'Pro': 150,
      'Enterprise': 500
    };

    const amount = planPrices[sub.PlanType] || 0;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days grace period

    const invoice = {
      schoolId,
      subscriptionId: sub.SubscriptionId,
      amount,
      status: 'Pending',
      dueDate,
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };

    await this.billingRepo.createInvoice(invoice);
    return invoice;
  }

  async checkQuotas(schoolId: number, planType: string) {
    const limits: Record<string, any> = {
      'Basic': { maxStudents: 100, maxCampuses: 1 },
      'Pro': { maxStudents: 1000, maxCampuses: 5 },
      'Enterprise': { maxStudents: 10000, maxCampuses: 20 }
    };

    const planLimits = limits[planType];
    const currentStudents = await this.usageRepo.getMetric(schoolId, 'StudentsCount');
    const currentCampuses = await this.usageRepo.getMetric(schoolId, 'CampusesCount');

    if (currentStudents >= planLimits.maxStudents) {
      throw new Error(`Quota exceeded: Maximum students for ${planType} plan is ${planLimits.maxStudents}`);
    }

    if (currentCampuses >= planLimits.maxCampuses) {
      throw new Error(`Quota exceeded: Maximum campuses for ${planType} plan is ${planLimits.maxCampuses}`);
    }

    return true;
  }
}
