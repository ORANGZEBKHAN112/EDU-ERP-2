import sql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config();

const config: any = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function checkDatabase() {
  const pool = new sql.ConnectionPool(config);
  
  try {
    await pool.connect();
    console.log('✅ Connected to database\n');
    
    const tables = [
      'Schools',
      'Campuses',
      'Classes',
      'Sections',
      'Students',
      'FeeVouchers',
      'Payments',
      'Users',
      'Roles',
      'UserRoles'
    ];
    
    console.log('📊 DATABASE DATA COUNT:\n');
    
    for (const table of tables) {
      const result = await pool.request().query(`SELECT COUNT(*) as cnt FROM ${table}`);
      const count = result.recordset[0].cnt;
      const status = count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${table.padEnd(20)} : ${count} records`);
    }
    
    await pool.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
