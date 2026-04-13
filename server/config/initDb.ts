import fs from 'fs';
import path from 'path';
import { poolPromise, sql } from './db';

export async function initializeDatabase() {
  const pool = await poolPromise;
  
  console.log('Checking database initialization...');
  try {
    const seedScriptPath = path.join(process.cwd(), 'migrations', 'SeedData.sql');
    const seedScript = fs.readFileSync(seedScriptPath, 'utf8');
    
    // Execute as a single batch. Seed script handles its own existence checks.
    await pool.request().batch(seedScript);
    
    const upgradeScriptPath = path.join(process.cwd(), 'migrations', 'UpgradeFeeEngine.sql');
    if (fs.existsSync(upgradeScriptPath)) {
      const upgradeScript = fs.readFileSync(upgradeScriptPath, 'utf8');
      await pool.request().batch(upgradeScript);
    }

    const bankingUpgradePath = path.join(process.cwd(), 'migrations', 'BankingGradeUpgrade.sql');
    if (fs.existsSync(bankingUpgradePath)) {
      const bankingUpgrade = fs.readFileSync(bankingUpgradePath, 'utf8');
      await pool.request().batch(bankingUpgrade);
    }

    const durableEventsPath = path.join(process.cwd(), 'migrations', 'DurableEvents.sql');
    if (fs.existsSync(durableEventsPath)) {
      const durableEvents = fs.readFileSync(durableEventsPath, 'utf8');
      await pool.request().batch(durableEvents);
    }

    const hardenEventsPath = path.join(process.cwd(), 'migrations', 'HardenEvents.sql');
    if (fs.existsSync(hardenEventsPath)) {
      const hardenEvents = fs.readFileSync(hardenEventsPath, 'utf8');
      await pool.request().batch(hardenEvents);
    }

    const dashboardOptPath = path.join(process.cwd(), 'migrations', 'DashboardOptimization.sql');
    if (fs.existsSync(dashboardOptPath)) {
      const dashboardOpt = fs.readFileSync(dashboardOptPath, 'utf8');
      await pool.request().batch(dashboardOpt);
    }

    const saasLayerPath = path.join(process.cwd(), 'migrations', 'SaaSLayer.sql');
    if (fs.existsSync(saasLayerPath)) {
      const saasLayer = fs.readFileSync(saasLayerPath, 'utf8');
      await pool.request().batch(saasLayer);
    }

    const saasProdLayerPath = path.join(process.cwd(), 'migrations', 'SaaSProductionLayer.sql');
    if (fs.existsSync(saasProdLayerPath)) {
      const saasProdLayer = fs.readFileSync(saasProdLayerPath, 'utf8');
      await pool.request().batch(saasProdLayer);
    }
    
    console.log('Database initialization/seed check completed.');
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
}
