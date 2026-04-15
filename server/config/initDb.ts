import fs from 'fs';
import path from 'path';
import { poolPromise, sql } from './db';

export async function initializeDatabase() {
  const pool = await poolPromise;
  
  console.log('Checking database initialization...');
  
  const migrations = [
    'CreateTables.sql',
    'SeedData.sql',
    'SaaSLayer.sql',
    'BankingGradeUpgrade.sql',
    'AddFinancialTraceTable.sql',
    'AddFailureRecoveryTables.sql',
    'DurableEvents.sql',
    'HardenEvents.sql',
    'SaaSProductionLayer.sql',
    'UpgradeFeeEngine.sql',
    'DashboardOptimization.sql'
  ];

  for (const file of migrations) {
    try {
      const filePath = path.join(process.cwd(), 'migrations', file);
      if (!fs.existsSync(filePath)) continue;
      
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const batches = sqlContent.split(/^\s*GO\s*$/im);
      
      for (const batch of batches) {
        const trimmedBatch = batch.trim();
        if (trimmedBatch) {
          await pool.request().batch(trimmedBatch);
        }
      }
    } catch (err: any) {
      // Ignore "already exists" errors during auto-init
      if (!err.message.includes('already an object named') && 
          !err.message.includes('already exists') &&
          !err.message.includes('Column names in each table must be unique') &&
          !err.message.includes('There is already an index')) {
        console.error(`Error during migration ${file}:`, err.message);
      }
    }
  }
  
  console.log('Database initialization/seed check completed.');
}
