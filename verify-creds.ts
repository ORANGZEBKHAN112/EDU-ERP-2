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

async function verifyCredentials() {
  const pool = new sql.ConnectionPool(config);
  
  try {
    await pool.connect();
    console.log('✅ Connected to database\n');
    
    const result = await pool.request().query('SELECT UserId, FullName, Email, IsActive FROM Users');
    
    console.log('📊 USERS IN DATABASE:\n');
    result.recordset.forEach((row: any) => {
      console.log(`  ${row.UserId}. ${row.FullName} (${row.Email}) - ${row.IsActive ? 'Active' : 'Inactive'}`);
    });
    
    await pool.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

verifyCredentials();
