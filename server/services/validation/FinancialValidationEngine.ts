import { BusinessRuleError } from '../../utils/errors';
import { poolPromise, sql } from '../../config/db';

export class FinancialValidationEngine {
  /**
   * Validates ledger consistency before a write operation.
   * Rule: ClosingBalance = (OpeningBalance + MonthlyFee + Fine - Discount) - PaidAmount
   */
  static validateLedgerConsistency(ledger: any) {
    const expectedClosing = (ledger.openingBalance + ledger.monthlyFee + ledger.fine - ledger.discount) - ledger.paidAmount;
    if (Math.abs(ledger.closingBalance - expectedClosing) > 0.01) {
      throw new BusinessRuleError(`Ledger inconsistency detected. Expected: ${expectedClosing}, Actual: ${ledger.closingBalance}`);
    }
  }

  /**
   * Ensures no duplicate financial entries for the same correlation ID.
   */
  static async preventDuplicate(correlationId: string, table: string, transaction?: sql.Transaction) {
    const pool = await poolPromise;
    const request = transaction ? new sql.Request(transaction) : pool.request();
    
    const result = await request
      .input('correlationId', sql.NVarChar, correlationId)
      .query(`SELECT 1 as Exists FROM ${table} WHERE CorrelationId = @correlationId`);
    
    if (result.recordset.length > 0) {
      throw new BusinessRuleError(`Duplicate financial operation detected for CorrelationId: ${correlationId}`);
    }
  }

  /**
   * Validates campus isolation.
   */
  static validateCampusIsolation(entityCampusId: number, userCampusId: number) {
    if (userCampusId !== 0 && entityCampusId !== userCampusId) {
      throw new BusinessRuleError('Campus isolation violation: Access denied to this financial record.');
    }
  }

  /**
   * Validates that the balance is not negative (if business rules forbid it).
   */
  static validatePositiveBalance(balance: number) {
    if (balance < 0) {
      // In some ERPs, negative balance means credit, but here we might want to flag it.
      // For now, we allow it but log a warning if needed.
    }
  }
}
