import { Router } from 'express';
import { 
  SchoolController, 
  CampusController, 
  StudentController, 
  FeeController, 
  PaymentController, 
  DashboardController,
  WorkflowController,
  ReconciliationController,
  FinancialEventController,
  TenantController,
  SystemController
} from '../controllers';
import { ReportController } from '../controllers/reportController';
import { AuthController } from '../controllers/authController';
import { authenticate, authorize, checkCampusAccess, checkSubscription, quotaCheck } from '../middleware';

const router = Router();

const authCtrl = new AuthController();
const schoolCtrl = new SchoolController();
const campusCtrl = new CampusController();
const studentCtrl = new StudentController();
const feeCtrl = new FeeController();
const paymentCtrl = new PaymentController();
const dashboardCtrl = new DashboardController();
const reportCtrl = new ReportController();
const workflowCtrl = new WorkflowController();
const reconciliationCtrl = new ReconciliationController();
const eventCtrl = new FinancialEventController();
const tenantCtrl = new TenantController();
const systemCtrl = new SystemController();

// Auth
router.post('/auth/login', authCtrl.login);

// System Health (Public or SaaS Admin)
router.get('/system/health', systemCtrl.getHealth);

// Tenants (SaaS Admin)
router.get('/tenants', authenticate, authorize(['SuperAdmin']), tenantCtrl.getTenants);
router.post('/tenants/create', authenticate, authorize(['SuperAdmin']), tenantCtrl.createTenant);
router.get('/tenants/:id/status', authenticate, authorize(['SuperAdmin']), tenantCtrl.getStatus);

// Apply subscription check to all subsequent routes
router.use(checkSubscription);
router.use(quotaCheck);

// Schools
router.get('/schools', authenticate, authorize(['SuperAdmin']), schoolCtrl.getSchools);
router.post('/schools', authenticate, authorize(['SuperAdmin']), schoolCtrl.createSchool);

// Campuses
router.get('/campuses', authenticate, campusCtrl.getCampuses);
router.get('/campuses/:schoolId', authenticate, campusCtrl.getBySchool);

// Students
router.get('/students', authenticate, checkCampusAccess, studentCtrl.getStudents);
router.post('/students', authenticate, authorize(['SuperAdmin', 'CampusAdmin']), studentCtrl.createStudent);

// Fees
router.post('/fees/generate-vouchers', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), checkCampusAccess, feeCtrl.generateVouchers);

// Payments
router.post('/payments/initiate', authenticate, paymentCtrl.initiate);

// Dashboard
router.get('/dashboard/superadmin', authenticate, authorize(['SuperAdmin']), dashboardCtrl.getSuperAdminStats);
router.get('/dashboard/campus/:campusId', authenticate, authorize(['SuperAdmin', 'CampusAdmin']), dashboardCtrl.getCampusDashboard);

// Reports
router.get('/reports/superadmin/overview', authenticate, authorize(['SuperAdmin']), reportCtrl.getSuperAdminOverview);
router.get('/reports/finance/campus-summary', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), reportCtrl.getCampusSummary);
router.get('/reports/students/defaulters', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), reportCtrl.getDefaulters);
router.get('/reports/payments', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), reportCtrl.getPayments);

// Workflow
router.post('/workflow/monthly-job', authenticate, authorize(['SuperAdmin']), workflowCtrl.runMonthlyJob);
router.post('/workflow/apply-fines', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), workflowCtrl.applyFines);

// Reconciliation
router.post('/reconciliation/run', authenticate, authorize(['SuperAdmin']), reconciliationCtrl.runGlobal);
router.get('/reconciliation/reports', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), reconciliationCtrl.getReports);

// Events
router.get('/events/dead-letter', authenticate, authorize(['SuperAdmin']), eventCtrl.getDeadLetter);
router.post('/events/retry', authenticate, authorize(['SuperAdmin']), eventCtrl.retry);

export default router;
