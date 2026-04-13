import { FeeRepository } from '../../repositories';

export class LedgerService {
  private feeRepo = new FeeRepository();

  async getOpeningBalance(studentId: number, currentMonth: string): Promise<number> {
    const prevMonthDate = new Date(currentMonth + "-01");
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthStr = prevMonthDate.toISOString().slice(0, 7);
    
    const prevLedger = await this.feeRepo.getLatestLedger(studentId, prevMonthStr);
    return prevLedger ? prevLedger.closingBalance : 0;
  }
}
