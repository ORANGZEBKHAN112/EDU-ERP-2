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

async function updatePassword() {
  const pool = new sql.ConnectionPool(config);
  try {
    await pool.connect();
    console.log('✅ Connected to database');
    const hash = '$2b$10$AU8yHas7ilMnjI9zCigyuu5REe/BDW2bbaCH50W3y22V7MmYNnnLG';
    const res = await pool.request()
      .input('hash', sql.NVarChar, hash)
      .query("UPDATE Users SET PasswordHash = @hash WHERE Email = 'admin@eduflow.com'");
    console.log('✅ Updated admin password hash');
    await pool.close();
  } catch (err: any) {
    console.error('❌ Error updating password:', err.message || err);
  }
}

updatePassword();
