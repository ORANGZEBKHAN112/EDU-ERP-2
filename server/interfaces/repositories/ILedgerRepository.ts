import { StudentFeeLedger } from '../../models';
import * as sql from 'mssql';

export interface ILedgerRepository {
  getLatestByStudent(studentId: number, month: string, transaction?: sql.Transaction): Promise<StudentFeeLedger | null>;
  getAllByStudent(studentId: number): Promise<StudentFeeLedger[]>;
  create(ledger: any, transaction?: sql.Transaction): Promise<StudentFeeLedger>;
  getOpeningBalance(studentId: number, month: string): Promise<number>;
  getByCorrelationId(correlationId: string): Promise<StudentFeeLedger | null>;
  createBulk(ledgers: any[], transaction?: sql.Transaction): Promise<StudentFeeLedger[]>;
  getOpeningBalancesBulk(studentIds: number[], month: string): Promise<any[]>;
}
