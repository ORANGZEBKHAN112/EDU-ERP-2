import sql from 'mssql';
import * as dotenv from 'dotenv';

dotenv.config();

const config: any = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: { encrypt: true, trustServerCertificate: true }
};

async function run() {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    const daily = await pool.request().query(`SELECT CAST(PaidAt AS DATE) as date, SUM(AmountPaid) as amount FROM Payments GROUP BY CAST(PaidAt AS DATE) ORDER BY date ASC`);
    const methods = await pool.request().query(`SELECT PaymentMethod as method, SUM(AmountPaid) as amount FROM Payments GROUP BY PaymentMethod`);
    console.log('daily:', daily.recordset);
    console.log('methods:', methods.recordset);
  } catch (err:any) {
    console.error('error running payments insights query:', err.message || err);
  } finally {
    await pool.close();
  }
}

run().catch(e=>console.error(e));
