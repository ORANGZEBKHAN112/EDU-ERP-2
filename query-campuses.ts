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
  const res = await pool.request().query('SELECT CampusId, SchoolId, CampusName, City FROM Campuses');
  console.log('rows:', res.recordset.length);
  console.log(res.recordset);
  await pool.close();
}

run().catch(e=>{console.error(e);process.exit(1)});
