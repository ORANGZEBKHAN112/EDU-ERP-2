import { Router } from 'express';
import { 
  WorkflowController, 
  ReconciliationController, 
  FinancialEventController, 
  SystemController 
} from '../controllers';
import { ReportController } from '../controllers/reportController';
import { authenticate, authorize, checkCampusAccess, checkSubscription, quotaCheck } from '../middleware';
import { container } from '../container';

const router = Router();

// Controllers from Container
const authCtrl = container.authController;
const schoolCtrl = container.schoolController;
const campusCtrl = container.campusController;
const studentCtrl = container.studentController;
const feeCtrl = container.feeController;
const paymentCtrl = container.paymentController;
const dashboardCtrl = container.dashboardController;
const tenantCtrl = container.tenantController;
const reconciliationCtrl = container.reconciliationController;
const eventCtrl = container.financialEventController;
const systemCtrl = container.systemController;

// Controllers not yet refactored to Container (using legacy instantiation for now)
const reportCtrl = new ReportController();
const workflowCtrl = new WorkflowController();

// Auth
router.post('/auth/login', authCtrl.login);

// System Health
router.get('/system/health', systemCtrl.getHealth);

// Tenants
router.get('/tenants', authenticate, authorize(['SuperAdmin']), tenantCtrl.getTenants);
router.post('/tenants/create', authenticate, authorize(['SuperAdmin']), tenantCtrl.createTenant);
router.get('/tenants/:id/status', authenticate, authorize(['SuperAdmin']), tenantCtrl.getStatus);

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
router.get('/students/:id', authenticate, checkCampusAccess, studentCtrl.getStudentById);
router.post('/students', authenticate, authorize(['SuperAdmin', 'CampusAdmin']), studentCtrl.createStudent);
router.put('/students/:id', authenticate, authorize(['SuperAdmin', 'CampusAdmin']), studentCtrl.updateStudent);
router.delete('/students/:id', authenticate, authorize(['SuperAdmin', 'CampusAdmin']), studentCtrl.deleteStudent);

// Fees
router.post('/fees/generate-vouchers', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), checkCampusAccess, feeCtrl.generateVouchers);
router.get('/fees/ledger/:studentId', authenticate, checkCampusAccess, feeCtrl.getLedger);

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
router.post('/reconciliation/run', authenticate, authorize(['SuperAdmin']), reconciliationCtrl.runReconciliation);
router.get('/reconciliation/reports', authenticate, authorize(['SuperAdmin', 'FinanceAdmin']), reconciliationCtrl.getReports);

// Events
router.get('/events/dead-letter', authenticate, authorize(['SuperAdmin']), eventCtrl.getDeadLetter);
router.post('/events/retry', authenticate, authorize(['SuperAdmin']), eventCtrl.retry);

export default router;
