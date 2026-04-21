/**
 * EduFlow ERP: Database Reset & Seed Script
 * Purpose: Clean all test data and seed fresh data while preserving SuperAdmin
 * Usage: npx ts-node database-reset.ts
 */

import sql from 'mssql';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DbConfig {
  user: string;
  password: string;
  server: string;
  database: string;
  port: number;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

const config: DbConfig = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function resetAndSeedDatabase() {
  const pool = new sql.ConnectionPool(config);

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  EduFlow ERP - Database Reset & Seed Script                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Database Configuration:');
    console.log(`  Server: ${config.server}:${config.port}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  User: ${config.user}`);
    console.log('');

    // Connect to database
    console.log('🔗 Connecting to database...');
    await pool.connect();
    console.log('✅ Connected successfully!');
    console.log('');

    // Read SQL script
    const sqlScriptPath = path.resolve(process.cwd(), 'migrations', 'ResetAndSeed.sql');
    console.log(`📄 Reading SQL script: ${sqlScriptPath}`);
    
    if (!fs.existsSync(sqlScriptPath)) {
      throw new Error(`SQL script not found: ${sqlScriptPath}`);
    }

    const sqlContent = fs.readFileSync(sqlScriptPath, 'utf-8');
    console.log('✅ SQL script loaded');
    console.log('');

    // Split SQL script by GO keyword (T-SQL batch separator)
    // Each GO statement marks the end of a batch
    let commands: string[] = [];
    const batchSeparator = /\nGO\n/gi;
    
    // Split into batches using GO as separator
    const batches = sqlContent.split(batchSeparator);
    
    for (const batch of batches) {
      const trimmedBatch = batch.trim();
      if (trimmedBatch.length > 0) {
        commands.push(trimmedBatch);
      }
    }

    console.log(`📋 Found ${commands.length} SQL batches to execute`);
    console.log('');

    // Execute each command
    let successCount = 0;
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        const result = await pool.request().query(command);
        successCount++;
        
        // Show progress
        if ((i + 1) % 5 === 0) {
          console.log(`  ✓ Completed ${i + 1}/${commands.length} batches`);
        }
      } catch (error: any) {
        console.error(`❌ Error executing batch ${i + 1}:`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('');
    console.log('🎉 Database reset and seed completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  ✓ All data cleared (except SuperAdmin)');
    console.log('  ✓ 3 Test Schools created');
    console.log('  ✓ 4 Test Campuses created');
    console.log('  ✓ 8 Test Classes created');
    console.log('  ✓ 11 Test Sections created');
    console.log('  ✓ 12 Test Students created');
    console.log('  ✓ 12 Fee Vouchers and Ledger entries created');
    console.log('  ✓ 5 Sample Payments created');
    console.log('  ✓ 3 Test Users created');
    console.log('  ✓ Foreign key constraints maintained');
    console.log('');
    console.log('Test User Credentials:');
    console.log('  SuperAdmin: admin@eduflow.com');
    console.log('  CampusAdmin: campusadmin@eduflow.com');
    console.log('  Principal: principal@eduflow.com');
    console.log('  Finance Admin: finance@eduflow.com');
    console.log('');
    console.log('Password for all accounts: Test123!');
    console.log('');
    console.log('✅ Database is ready for testing!');

    await pool.close();
  } catch (error: any) {
    console.error('❌ Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
resetAndSeedDatabase().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
