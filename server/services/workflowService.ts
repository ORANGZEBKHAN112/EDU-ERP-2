import { FeeRepository, StudentRepository } from '../repositories';
import { VoucherGeneratorService, FineEngineService } from './feeEngine';
import { poolPromise } from '../config/db';

export class WorkflowService {
  private voucherGenerator = new VoucherGeneratorService();
  private fineEngine = new FineEngineService();

  async runMonthlyVoucherGeneration(month: string, userId: number) {
    const pool = await poolPromise;
    const campuses = await pool.request().query('SELECT CampusId FROM Campuses WHERE IsActive = 1');
    
    const results = [];
    for (const campus of campuses.recordset) {
      try {
        const generated = await this.voucherGenerator.generateForCampus(campus.CampusId, month, userId);
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

