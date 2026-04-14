// Repositories
import { SchoolRepository } from './repositories/implementations/SchoolRepository';
import { CampusRepository } from './repositories/implementations/CampusRepository';
import { StudentRepository } from './repositories/implementations/StudentRepository';
import { UserRepository } from './repositories/implementations/UserRepository';
import { FeeRepository } from './repositories/implementations/FeeRepository';
import { LedgerRepository } from './repositories/implementations/LedgerRepository';
import { SummaryRepository } from './repositories/implementations/SummaryRepository';
import { SubscriptionRepository } from './repositories/implementations/SubscriptionRepository';
import { FeatureFlagRepository } from './repositories/implementations/FeatureFlagRepository';
import { RoleRepository } from './repositories/implementations/RoleRepository';
import { ReconciliationRepository } from './repositories/implementations/ReconciliationRepository';
import { FinancialTraceRepository } from './repositories/implementations/FinancialTraceRepository';
import { FailedTransactionRepository } from './repositories/implementations/FailedTransactionRepository';
import { SystemRepository } from './repositories/implementations/SystemRepository';
import { UsageRepository } from './repositories';

// Services
import { AuthService } from './services/implementations/AuthService';
import { SchoolService } from './services/implementations/SchoolService';
import { StudentService } from './services/implementations/StudentService';
import { FeeService } from './services/implementations/FeeService';
import { FineEngineService } from './services/feeEngine/FineEngineService';
import { JobRepository } from './repositories';
import { ReconciliationService } from './services/reconciliation/ReconciliationService';
import { FinancialTraceService } from './services/implementations/FinancialTraceService';
import { SystemHealthService } from './services/system/SystemHealthService';
import { RecoveryService } from './services/implementations/RecoveryService';
import { DashboardService } from './services/implementations/DashboardService';
import { TenantService } from './services/implementations/TenantService';

// Controllers
import { AuthController } from './controllers/implementations/AuthController';
import { SchoolController } from './controllers/implementations/SchoolController';
import { CampusController } from './controllers/implementations/CampusController';
import { StudentController } from './controllers/implementations/StudentController';
import { FeeController } from './controllers/implementations/FeeController';
import { PaymentController } from './controllers/implementations/PaymentController';
import { DashboardController } from './controllers/implementations/DashboardController';
import { TenantController } from './controllers/implementations/TenantController';
import { ReconciliationController } from './controllers/implementations/ReconciliationController';
import { FinancialEventController } from './controllers/implementations/FinancialEventController';
import { SystemController } from './controllers/implementations/SystemController';

export class DependencyContainer {
  // Repositories
  public schoolRepo = new SchoolRepository();
  public campusRepo = new CampusRepository();
  public studentRepo = new StudentRepository();
  public userRepo = new UserRepository();
  public feeRepo = new FeeRepository();
  public ledgerRepo = new LedgerRepository();
  public summaryRepo = new SummaryRepository();
  public featureRepo = new FeatureFlagRepository();
  public roleRepo = new RoleRepository();
  public reconciliationRepo = new ReconciliationRepository();
  public traceRepo = new FinancialTraceRepository();
  public failedTxRepo = new FailedTransactionRepository();
  public systemRepo = new SystemRepository();
  public jobRepo = new JobRepository();
  public usageRepo = new UsageRepository();
  public subRepo = new SubscriptionRepository();

  // Services
  public authService = new AuthService(this.userRepo);
  public traceService = new FinancialTraceService(this.traceRepo);
  public healthService = new SystemHealthService(this.systemRepo);
  public recoveryService = new RecoveryService(this.failedTxRepo, this.feeRepo, this.ledgerRepo);
  public schoolService = new SchoolService(this.schoolRepo, this.campusRepo);
  public studentService = new StudentService(this.studentRepo);
  public feeService = new FeeService(this.feeRepo, this.ledgerRepo, this.studentRepo, this.traceService);
  public fineEngineService = new FineEngineService(this.feeRepo, this.ledgerRepo, this.traceService);
  public reconciliationService = new ReconciliationService(this.reconciliationRepo, this.studentRepo);
  public dashboardService = new DashboardService(this.summaryRepo);
  public tenantService = new TenantService(
    this.schoolRepo, 
    this.campusRepo, 
    this.userRepo, 
    this.roleRepo, 
    this.subRepo, 
    this.featureRepo
  );

  // Controllers
  public authController = new AuthController(this.authService);
  public schoolController = new SchoolController(this.schoolService);
  public campusController = new CampusController(this.schoolService);
  public studentController = new StudentController(this.studentService);
  public feeController = new FeeController(this.feeService);
  public paymentController = new PaymentController(this.feeService);
  public dashboardController = new DashboardController(this.dashboardService);
  public tenantController = new TenantController(this.tenantService);
  public reconciliationController = new ReconciliationController(this.reconciliationService);
  public financialEventController = new FinancialEventController();
  public systemController = new SystemController(this.healthService);
}

export const container = new DependencyContainer();
