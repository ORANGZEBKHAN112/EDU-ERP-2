import { IReconciliationRepository } from '../../interfaces/repositories/IReconciliationRepository';
import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import { IReconciliationService } from '../../interfaces/services/IReconciliationService';
import { RequestContext } from '../../dtos/fee.dto';
import { AuditService, AuditAction } from '../auditService';

export class ReconciliationService implements IReconciliationService {
  constructor(
    private reconciliationRepo: IReconciliationRepository,
    private studentRepo: IStudentRepository
  ) {}

  async runDailyReconciliation(ctx: RequestContext): Promise<void> {
    const students = await this.studentRepo.getAll(ctx.campusIds);
    
    for (const student of students) {
      const expectedBalance = await this.reconciliationRepo.calculateExpectedBalance(student.id);
      const actualBalance = await this.reconciliationRepo.getLatestStoredBalance(student.id);
      
      const diff = Math.abs(expectedBalance - actualBalance);
      let status: 'OK' | 'MISMATCH' | 'CRITICAL' = 'OK';
      
      if (diff > 0.01 && diff < 1.00) {
        status = 'MISMATCH';
      } else if (diff >= 1.00) {
        status = 'CRITICAL';
      }

      if (status !== 'OK') {
        const report = {
          studentId: student.id,
          expectedBalance,
          actualBalance,
          status,
          details: JSON.stringify({
            diff,
            studentName: student.fullName,
            admissionNo: student.admissionNo
          })
        };

        await this.reconciliationRepo.saveReport(report);
        
        if (status === 'CRITICAL') {
          await AuditService.log(
            ctx.userId,
            AuditAction.ADJUSTMENT,
            { studentId: student.id, actualBalance },
            { expectedBalance, status },
            student.campusId,
            undefined,
            { 
              eventType: 'RECONCILIATION_CRITICAL',
              correlationId: `RECON-${student.id}-${Date.now()}`
            }
          );
        }
      }
    }
  }

  async getReports(ctx: RequestContext): Promise<any[]> {
    return this.reconciliationRepo.getReports();
  }
}
