import { poolPromise, sql } from '../config/db';

export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  transaction: sql.Transaction;
}

export class TransactionManager {
  static async startTransaction(): Promise<ITransaction> {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    return {
      transaction,
      commit: async () => {
        await transaction.commit();
      },
      rollback: async () => {
        await transaction.rollback();
      }
    };
  }
}
