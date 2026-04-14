import { container } from '../container';
import { poolPromise } from '../config/db';
import { RequestContext } from '../dtos/fee.dto';

export class WorkflowService {
  private feeService = container.feeService;
  private fineEngine = container.fineEngineService;

  async runMonthlyVoucherGeneration(month: string, userId: number) {
    const pool = await poolPromise;
    const campuses = await pool.request().query('SELECT CampusId, SchoolId FROM Campuses WHERE IsActive = 1');
    
    const results = [];
    for (const campus of campuses.recordset) {
      try {
        const ctx: RequestContext = {
          schoolId: campus.SchoolId,
          campusIds: [campus.CampusId],
          userId: userId
        };
        const generated = await this.feeService.generateVouchers(ctx, { campusId: campus.CampusId, month });
        results.push({ campusId: campus.CampusId, status: 'Success', count: generated.length });
      } catch (err) {
        results.push({ campusId: campus.CampusId, status: 'Failed', error: err instanceof Error ? err.message : String(err) });
      }
    }
    return results;
  }

  async applyOverdueFines(month: string, userId: number) {
    return this.fineEngine.processOverdueFines(month, userId);
  }
}

