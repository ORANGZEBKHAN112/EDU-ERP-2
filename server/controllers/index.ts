import { Request, Response, NextFunction } from 'express';
import { poolPromise } from '../config/db';
import { SchoolService, StudentService, DashboardService } from '../services';
import { FeeService } from '../services/feeService';
import { EventRepository } from '../repositories';
import { TenantService } from '../services/tenant/TenantService';
import { ObservabilityService } from '../services/ObservabilityService';
import { generateVouchersSchema, initiatePaymentSchema, createStudentSchema } from '../utils/validation';

const schoolService = new SchoolService();
const studentService = new StudentService();
const feeService = new FeeService();
const dashboardService = new DashboardService();
const eventRepo = new EventRepository();
const tenantService = new TenantService();
const obsService = new ObservabilityService();

export class SchoolController {
  async getSchools(req: Request, res: Response) {
    const schools = await schoolService.getAllSchools();
    res.json(schools);
  }
  async createSchool(req: Request, res: Response) {
    const school = await schoolService.createSchool(req.body);
    res.status(201).json(school);
  }
}

export class CampusController {
  async getCampuses(req: Request, res: Response) {
    const campuses = await schoolService.getAllCampuses();
    res.json(campuses);
  }
  async getBySchool(req: Request, res: Response) {
    const campuses = await schoolService.getCampusesBySchool(parseInt(req.params.schoolId));
    res.json(campuses);
  }
}

export class StudentController {
  async getStudents(req: any, res: Response) {
    const campusIds = req.user.campusIds;
    const schoolId = req.user.schoolId;
    const students = await studentService.getAllStudents(campusIds, schoolId);
    res.json(students);
  }
  async createStudent(req: any, res: Response, next: NextFunction) {
    try {
      const validated = createStudentSchema.parse(req.body);
      const student = await studentService.createStudent({ ...validated, schoolId: req.user.schoolId });
      res.status(201).json(student);
    } catch (err: any) {
      next(err);
    }
  }
}

export class FeeController {
  async generateVouchers(req: any, res: Response, next: NextFunction) {
    try {
      const validated = generateVouchersSchema.parse(req.body);
      const vouchers = await feeService.generateVouchers(
        validated.campusId, 
        validated.month, 
        req.user.id,
        req.user.campusIds
      );
      res.json({ message: `Generated ${vouchers.length} vouchers`, vouchers });
    } catch (err: any) {
      next(err);
    }
  }
}

export class PaymentController {
  async initiate(req: any, res: Response, next: NextFunction) {
    try {
      const validated = initiatePaymentSchema.parse(req.body);
      const payment = await feeService.initiatePayment(
        validated.voucherId, 
        validated.amountPaid, 
        validated.paymentMethod, 
        req.user.id,
        validated.transactionRef || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        req.user.campusIds
      );
      res.json(payment);
    } catch (err: any) {
      next(err);
    }
  }
}

import { WorkflowService } from '../services/workflowService';
const workflowService = new WorkflowService();

export class WorkflowController {
  async runMonthlyJob(req: any, res: Response, next: NextFunction) {
    try {
      const { month } = req.body;
      const results = await workflowService.runMonthlyVoucherGeneration(month, req.user.id);
      res.json({ message: 'Monthly job completed', results });
    } catch (err) {
      next(err);
    }
  }

  async applyFines(req: any, res: Response, next: NextFunction) {
    try {
      const { month } = req.body;
      const results = await workflowService.applyOverdueFines(month, req.user.id);
      res.json({ message: `Applied fines to ${results.length} students`, results });
    } catch (err) {
      next(err);
    }
  }
}

import { ReconciliationService } from '../services/reconciliation/ReconciliationService';
const reconciliationService = new ReconciliationService();

export class ReconciliationController {
  async runGlobal(req: any, res: Response, next: NextFunction) {
    try {
      const results = await reconciliationService.runGlobalReconciliation(req.user.id);
      res.json({ message: 'Global reconciliation completed', results });
    } catch (err) {
      next(err);
    }
  }

  async getReports(req: any, res: Response, next: NextFunction) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT TOP 50 * FROM ReconciliationReports ORDER BY CreatedAt DESC');
      res.json(result.recordset);
    } catch (err) {
      next(err);
    }
  }
}


export class DashboardController {
  async getSuperAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getSuperAdminStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async getCampusDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const campusId = parseInt(req.params.campusId);
      const stats = await dashboardService.getCampusDashboard(campusId);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}

export class FinancialEventController {
  async getDeadLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventRepo.getDeadLetterEvents();
      res.json(events);
    } catch (err) {
      next(err);
    }
  }

  async retry(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.body;
      if (!eventId) throw new Error('EventId is required');
      await eventRepo.retryEvent(eventId);
      res.json({ message: `Event ${eventId} queued for retry` });
    } catch (err) {
      next(err);
    }
  }
}

export class TenantController {
  async createTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tenantService.onboardTenant(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getTenants(req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await tenantService.getAllTenants();
      res.json(tenants);
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await tenantService.getTenantStatus(parseInt(req.params.id));
      res.json(status);
    } catch (err) {
      next(err);
    }
  }
}

export class SystemController {
  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await obsService.getSystemHealth();
      res.json(health);
    } catch (err) {
      next(err);
    }
  }
}
