import cron from 'node-cron';
import { VoucherGeneratorService } from './VoucherGeneratorService';
import { FineEngineService } from './FineEngineService';
import { ReconciliationService } from '../reconciliation/ReconciliationService';
import { AuditService, AuditAction } from '../auditService';
import { JobRepository } from '../../repositories';
import { poolPromise } from '../../config/db';
import os from 'os';

export class FeeSchedulerService {
  private voucherGenerator = new VoucherGeneratorService();
  private fineEngine = new FineEngineService();
  private reconciliation = new ReconciliationService();
  private jobRepo = new JobRepository();
  private instanceId = `${os.hostname()}-${process.pid}`;

  init() {
    // 1. Monthly Voucher Generation: Runs at 00:00 on the 1st of every month
    cron.schedule('0 0 1 * *', async () => {
      await this.runDistributedJob('MonthlyVoucherGeneration', async () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const systemUserId = 0;
        const pool = await poolPromise;
        const campuses = await pool.request().query('SELECT CampusId FROM Campuses WHERE IsActive = 1');
        
        for (const campus of campuses.recordset) {
          console.log(`[Scheduler] Generating vouchers for Campus ID: ${campus.CampusId}`);
          await this.voucherGenerator.generateForCampus(campus.CampusId, currentMonth, systemUserId);
        }
      });
    });

    // 2. Daily Overdue Fine Processing: Runs at 01:00 every day
    cron.schedule('0 1 * * *', async () => {
      await this.runDistributedJob('DailyFineProcessing', async () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const systemUserId = 0;
        await this.fineEngine.processOverdueFines(currentMonth, systemUserId);
      });
    });

    // 3. Daily Data Integrity & Reconciliation: Runs at 02:00 every day
    cron.schedule('0 2 * * *', async () => {
      await this.runDistributedJob('DailyReconciliation', async () => {
        const systemUserId = 0;
        await this.reconciliation.runGlobalReconciliation(systemUserId);
      });
    });

    console.log(`[Scheduler] Fee Engine Scheduler initialized. Instance: ${this.instanceId}`);
  }

  private async runDistributedJob(jobName: string, jobFn: () => Promise<void>) {
    const executionDate = new Date().toISOString().slice(0, 10);
    
    // 1. Check if already executed for today
    const alreadyDone = await this.jobRepo.isAlreadyExecuted(jobName, executionDate);
    if (alreadyDone) {
      console.log(`[Scheduler] Job ${jobName} already executed for ${executionDate}. Skipping.`);
      return;
    }

    // 2. Acquire Distributed Lock (lock for 1 hour)
    const lockAcquired = await this.jobRepo.acquireLock(jobName, this.instanceId, 3600);
    if (!lockAcquired) {
      console.log(`[Scheduler] Could not acquire lock for ${jobName}. Another instance might be running it.`);
      return;
    }

    console.log(`[Scheduler] Starting job: ${jobName} on instance ${this.instanceId}`);
    const executionId = await this.jobRepo.startExecution(jobName, this.instanceId, executionDate);
    await AuditService.log(0, AuditAction.JOB_START, null, { jobName, instanceId: this.instanceId, executionDate }, 0);

    try {
      await jobFn();
      await this.jobRepo.endExecution(executionId, 'Success');
      await AuditService.log(0, AuditAction.JOB_END, { jobName, status: 'Running' }, { jobName, status: 'Success' }, 0);
      console.log(`[Scheduler] Job ${jobName} completed successfully.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.jobRepo.endExecution(executionId, 'Failed', msg);
      await AuditService.log(0, AuditAction.JOB_END, { jobName, status: 'Running' }, { jobName, status: 'Failed', error: msg }, 0);
      console.error(`[Scheduler] Job ${jobName} failed:`, error);
    } finally {
      await this.jobRepo.releaseLock(jobName, this.instanceId);
    }
  }
}

