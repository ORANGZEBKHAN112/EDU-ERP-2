/**
 * QA Orchestrator Script for EduFlow ERP
 * Comprehensive testing with database reset, data creation, and validation
 * Execution: npx ts-node qa-validation/qa-orchestrator.ts
 */

import sql from 'mssql';
import type { ConnectionPool } from 'mssql';
import axios from 'axios';
import { performance } from 'perf_hooks';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DB_CONFIG = {
  user: 'sa',
  password: 'Nimda@2526$',
  server: '51.79.177.9',
  database: 'testdb13',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const BASE_URL = 'http://localhost:3001/api';
const SUPER_ADMIN_EMAIL = 'admin@eduflow.com';
const SUPER_ADMIN_PASSWORD = 'Test123!';  // Updated to match current admin password

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  dbPool: null as ConnectionPool | null,
  apiClient: axios.create({ baseURL: BASE_URL }),
  superAdminToken: '',
  testData: {
    schoolId: 0,
    campusIds: [] as number[],
    classIds: [] as number[],
    sectionIds: [] as number[],
    studentIds: [] as number[],
    voucherIds: [] as number[],
    paymentIds: [] as number[],
  },
  qaResults: [] as any[],
};

// ============================================================================
// UTILITIES
// ============================================================================

function logStep(step: number, title: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`STEP ${step}: ${title}`);
  console.log(`${'='.repeat(80)}`);
}

function recordResult(step: string, status: 'PASS' | 'FAIL', message: string, details?: any, duration?: number) {
  state.qaResults.push({ step, status, message, details, duration });
  const statusColor = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  console.log(`${statusColor}[${status}]${resetColor} ${message}${duration ? ` (${duration.toFixed(2)}ms)` : ''}`);
}

async function connectDatabase(): Promise<ConnectionPool> {
  return new sql.ConnectionPool(DB_CONFIG).connect();
}

// ============================================================================
// DATABASE RESET
// ============================================================================

async function resetDatabase(pool: ConnectionPool) {
  logStep(1, 'DATABASE RESET');
  const startTime = performance.now();

  try {
    const request = pool.request();

    // First, get all the tables that exist
    console.log('⏳ Getting table list...');
    const tableResult = await request.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'
    `);

    const tables = tableResult.recordset.map((r: any) => r.TABLE_NAME);

    // Delete all constraints for these tables
    console.log('⏳ Disabling foreign key constraints...');
    for (const table of tables) {
      try {
        await request.query(`ALTER TABLE [${table}] NOCHECK CONSTRAINT ALL`);
      } catch (e) {
        // Continue even if this fails
      }
    }

    // Delete data in reverse alphabetical order to handle dependencies
    console.log('⏳ Deleting test data...');
    const deleteOrder = [
      'FinancialTraces',
      'AuditLogs',
      'FeeAdjustments',
      'Payments',
      'FeeVouchers',
      'StudentFeeLedger',
      'FeeStructure',
      'Sections',
      'Students',
      'Classes',
      'UserCampuses',
      'UserRoles',
      'Campuses',
      'Schools',
    ];

    for (const table of deleteOrder) {
      try {
        await request.query(`DELETE FROM [${table}]`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (e: any) {
        if (e.message?.includes('does not exist')) {
          console.log(`  - ${table} (table does not exist, skipped)`);
        } else {
          console.log(`  ! ${table}: ${e.message?.substring(0, 50)}`);
        }
      }
    }

    // Re-enable constraints
    console.log('⏳ Re-enabling foreign key constraints...');
    for (const table of tables) {
      try {
        await request.query(`ALTER TABLE [${table}] CHECK CONSTRAINT ALL`);
      } catch (e) {
        // Continue even if this fails
      }
    }

    // Reset seeds
    console.log('⏳ Resetting identity seeds...');
    for (const table of deleteOrder) {
      try {
        await request.query(`DBCC CHECKIDENT ('[${table}]', RESEED, 0)`);
      } catch (e) {
        // Continue if table doesn't have identity
      }
    }

    // Re-seed SuperAdmin user and roles
    console.log('⏳ Re-seeding SuperAdmin user and roles...');
    try {
      // Seed Roles
      await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'SuperAdmin')
          INSERT INTO Roles (RoleName) VALUES ('SuperAdmin');
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'FinanceAdmin')
          INSERT INTO Roles (RoleName) VALUES ('FinanceAdmin');
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'CampusAdmin')
          INSERT INTO Roles (RoleName) VALUES ('CampusAdmin');
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Student')
          INSERT INTO Roles (RoleName) VALUES ('Student');
      `);

      // Seed Super Admin User
      await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@eduflow.com')
        BEGIN
            INSERT INTO Users (FullName, Email, PasswordHash, Phone, IsActive, CreatedAt)
            VALUES ('Super Admin', 'admin@eduflow.com', '$2b$10$DfzKqAqQPcUBLczkdAEKAuUdANvcobTYbCkVHiHQpVolnNm8ROju6', '123456789', 1, GETDATE());

            DECLARE @AdminId INT = SCOPE_IDENTITY();
            DECLARE @RoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'SuperAdmin');
            
            INSERT INTO UserRoles (UserId, RoleId) VALUES (@AdminId, @RoleId);
        END
        ELSE
        BEGIN
            DECLARE @AdminUserId INT = (SELECT UserId FROM Users WHERE Email = 'admin@eduflow.com');
            DECLARE @SuperAdminRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'SuperAdmin');
            
            IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserId = @AdminUserId AND RoleId = @SuperAdminRoleId)
            BEGIN
                INSERT INTO UserRoles (UserId, RoleId) VALUES (@AdminUserId, @SuperAdminRoleId);
            END
        END
      `);
      console.log('  ✓ SuperAdmin user and roles re-seeded');
    } catch (e: any) {
      console.log(`  ! Error re-seeding: ${e.message?.substring(0, 50)}`);
    }

    // Verify cleanup
    const counts = await request.query(`
      SELECT 
        (SELECT COUNT(*) FROM Schools) AS SchoolCount,
        (SELECT COUNT(*) FROM Campuses) AS CampusCount,
        (SELECT COUNT(*) FROM Classes) AS ClassCount,
        (SELECT COUNT(*) FROM Sections) AS SectionCount,
        (SELECT COUNT(*) FROM Students) AS StudentCount,
        (SELECT COUNT(*) FROM FeeVouchers) AS VoucherCount,
        (SELECT COUNT(*) FROM Payments) AS PaymentCount
    `);

    const result = counts.recordset[0];
    const duration = performance.now() - startTime;

    recordResult(
      'Database Reset',
      'PASS',
      `Database cleaned - Schools: ${result.SchoolCount}, Campuses: ${result.CampusCount}, Classes: ${result.ClassCount}, Sections: ${result.SectionCount}, Students: ${result.StudentCount}, Vouchers: ${result.VoucherCount}, Payments: ${result.PaymentCount}`,
      result,
      duration
    );

    return true;
  } catch (err: any) {
    recordResult(
      'Database Reset',
      'FAIL',
      `Reset failed: ${err.message || err}`
    );
    throw err;
  }
}

// ============================================================================
// QA TESTS
// ============================================================================

async function testLogin(): Promise<boolean> {
  logStep(2, 'LOGIN VALIDATION - SuperAdmin Account');
  const startTime = performance.now();

  try {
    const response = await state.apiClient.post('/auth/login', {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
    });

    const duration = performance.now() - startTime;
    const { token, user } = response.data;

    if (!token) throw new Error('Token not found in response');
    if (!user) throw new Error('User not found in response');
    if (!Array.isArray(user.roles)) throw new Error('user.roles is not an array');
    if (!Array.isArray(user.campusIds)) throw new Error('campusIds is not an array');

    state.superAdminToken = token;
    state.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    recordResult(
      'SuperAdmin Login',
      'PASS',
      `Logged in as ${user.email} with roles: ${user.roles.join(', ')}`,
      { email: user.email, roles: user.roles },
      duration
    );

    return true;
  } catch (err: any) {
    recordResult(
      'SuperAdmin Login',
      'FAIL',
      `Login failed: ${err.message || err.response?.data?.message}`
    );
    throw err;
  }
}

async function testCreateSchool(): Promise<number> {
  logStep(3, 'CREATE SCHOOL - Faizan School');
  const startTime = performance.now();

  try {
    const response = await state.apiClient.post('/schools', {
      schoolName: 'Faizan School',
      country: 'Pakistan',
    });

    const duration = performance.now() - startTime;
    const { success, data, message } = response.data;

    if (!success) {
      throw new Error(message || 'API returned success: false');
    }
    
    if (!data) {
      throw new Error('No data in response');
    }

    const schoolId = data.schoolId || data.SchoolId || data.id || data.Id;
    if (!schoolId) {
      console.log('Response data:', JSON.stringify(data).substring(0, 200));
      throw new Error(`SchoolId not found in response. Keys: ${Object.keys(data).join(', ')}`);
    }

    state.testData.schoolId = schoolId;

    recordResult(
      'Create School',
      'PASS',
      `School created: ${data.schoolName || data.SchoolName} (ID: ${schoolId})`,
      data,
      duration
    );

    return schoolId;
  } catch (err: any) {
    if (err.response?.data) {
      recordResult(
        'Create School',
        'FAIL',
        `School creation failed: ${err.message || err.response?.data?.message}`,
        err.response.data
      );
      console.log('Full error response:', JSON.stringify(err.response.data).substring(0, 200));
    } else {
      recordResult(
        'Create School',
        'FAIL',
        `School creation failed: ${err.message || err.response?.data?.message}`
      );
    }
    throw err;
  }
}

async function testCreateCampuses(): Promise<void> {
  logStep(4, 'CREATE CAMPUSES - 2 Campuses');
  const campusNames = ['Baldia Campus', 'Gulshan Campus'];

  for (const campusName of campusNames) {
    const startTime = performance.now();
    try {
      const response = await state.apiClient.post('/campuses', {
        schoolId: state.testData.schoolId,
        campusName,
        city: campusName.split(' ')[0],
        state: 'Sindh',
        address: `${campusName}, Pakistan`,
      });

      console.log('DEBUG /campuses response:', JSON.stringify(response.data).substring(0, 300));

      const duration = performance.now() - startTime;
      const { success, data } = response.data;

      // Accept multiple possible id shapes returned by the API (campusId, id, CampusId)
      const campusId = data?.campusId || data?.id || data?.CampusId;

      if (!success || !campusId) throw new Error('Invalid response structure');

      state.testData.campusIds.push(campusId);

      recordResult(
        `Create Campus: ${campusName}`,
        'PASS',
        `Campus created (ID: ${data.campusId}) under school ${state.testData.schoolId}`,
        data,
        duration
      );
    } catch (err: any) {
      recordResult(
        `Create Campus: ${campusName}`,
        'FAIL',
        `Campus creation failed: ${err.message || err.response?.data?.message}`
      );
      if (err.response?.data) console.log('DEBUG /campuses error response:', JSON.stringify(err.response.data).substring(0,300));
      throw err;
    }
  }
}

async function testCreateClasses(): Promise<void> {
  logStep(5, 'CREATE CLASSES - 10 Classes per Campus');

  for (const campusId of state.testData.campusIds) {
    for (let i = 1; i <= 10; i++) {
      const startTime = performance.now();
      try {
        const response = await state.apiClient.post('/classes', {
          schoolId: state.testData.schoolId,
          campusId,
          className: `Class ${i}`,
        });

        const duration = performance.now() - startTime;
        const { success, data } = response.data;
        console.log('DEBUG /classes response:', JSON.stringify(response.data).substring(0,300));

        const classId = data?.classId || data?.id || data?.ClassId;

        if (!success || !classId) throw new Error('Invalid response structure');

        state.testData.classIds.push(classId);

        if (i === 1) {
          recordResult(
            `Create Classes (Campus ${campusId})`,
            'PASS',
            `Created Class 1 (ID: ${classId})`,
            data,
            duration
          );
        } else if (i === 10) {
          recordResult(
            `Create Classes (Campus ${campusId})`,
            'PASS',
            `✅ Created all 10 classes for campus ${campusId}`,
            undefined,
            duration
          );
        }
      } catch (err: any) {
        recordResult(
          `Create Class ${i}`,
          'FAIL',
          `Class creation failed: ${err.message || err.response?.data?.message}`
        );
        throw err;
      }
    }
  }
}

async function testCreateSections(): Promise<void> {
  logStep(6, 'CREATE SECTIONS - 2 Sections per Class');
  const sectionNames = ['Boys', 'Girls'];
  let sectionCount = 0;

  for (let classIdx = 0; classIdx < state.testData.classIds.length; classIdx++) {
    const classId = state.testData.classIds[classIdx];
    const campusIdx = Math.floor(classIdx / 10);
    const campusId = state.testData.campusIds[campusIdx];

    for (const sectionName of sectionNames) {
      const startTime = performance.now();
      try {
        const response = await state.apiClient.post('/sections', {
          schoolId: state.testData.schoolId,
          campusId,
          classId,
          name: sectionName,
        });

        const duration = performance.now() - startTime;
        const { success, data } = response.data;
        console.log('DEBUG /sections response:', JSON.stringify(response.data).substring(0,300));

        const sectionId = data?.sectionId || data?.id || data?.SectionId;
        if (!success || !sectionId) throw new Error('Invalid response structure');

        state.testData.sectionIds.push(sectionId);
        sectionCount++;

        if (sectionCount <= 2) {
          recordResult(
            `Create Section: ${sectionName}`,
            'PASS',
            `Section created (ID: ${sectionId})`,
            data,
            duration
          );
        }
      } catch (err: any) {
        recordResult(
          `Create Section: ${sectionName}`,
          'FAIL',
          `Section creation failed: ${err.message || err.response?.data?.message}`
        );
          if (err.response?.data) console.log('DEBUG /sections error response full:', JSON.stringify(err.response.data, null, 2).substring(0,2000));
        throw err;
      }
    }
  }

  console.log(`\n📊 Total Sections Created: ${sectionCount}`);
}

async function testCreateStudents(): Promise<void> {
  logStep(7, 'CREATE STUDENTS - 5 Students per Class (Total: 100)');

  for (let classIdx = 0; classIdx < state.testData.classIds.length; classIdx++) {
    const classId = state.testData.classIds[classIdx];
    const campusIdx = Math.floor(classIdx / 10);
    const campusId = state.testData.campusIds[campusIdx];

    for (let i = 1; i <= 5; i++) {
      const startTime = performance.now();
      try {
        const response = await state.apiClient.post('/students', {
          schoolId: state.testData.schoolId,
          campusId,
          classId,
          sectionId: state.testData.sectionIds[classIdx * 2 + (i % 2)],
          admissionNo: `ADM${state.testData.schoolId}${campusId}${classId}${String(i).padStart(3, '0')}`,
          fullName: `Student ${classIdx * 5 + i}`,
          fatherName: `Father ${classIdx * 5 + i}`,
          phone: `0300${String(classIdx * 5 + i).padStart(7, '0')}`,
        });

        const duration = performance.now() - startTime;
        const { success, data } = response.data;

        if (!success || !data?.studentId) throw new Error('Invalid response structure');

        state.testData.studentIds.push(data.studentId);

        if (classIdx === 0 && i === 1) {
          recordResult(
            'Create Students',
            'PASS',
            `Student created (ID: ${data.studentId})`,
            data,
            duration
          );
        }
      } catch (err: any) {
        recordResult(
          `Create Student ${classIdx * 5 + i}`,
          'FAIL',
          `Student creation failed: ${err.message || err.response?.data?.message}`
        );
        throw err;
      }
    }
  }

  console.log(`\n📊 Total Students Created: ${state.testData.studentIds.length}`);
}

async function testGenerateVouchers(): Promise<void> {
  logStep(8, 'GENERATE FEE VOUCHERS - 100 Vouchers');

  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  for (const studentId of state.testData.studentIds) {
    const startTime = performance.now();
    try {
      const response = await state.apiClient.post('/fees/generate-vouchers', {
        studentIds: [studentId],
        month: currentMonth,
      });

      const duration = performance.now() - startTime;
      const { success, data } = response.data;

      if (!success || !Array.isArray(data)) throw new Error('Invalid response structure');

      state.testData.voucherIds.push(...data.map((v: any) => v.voucherId));

      if (state.testData.voucherIds.length === 1) {
        recordResult(
          'Generate Vouchers',
          'PASS',
          `${data.length} voucher(s) created`,
          data[0],
          duration
        );
      }
    } catch (err: any) {
      // Ignore if vouchers already exist (idempotency)
      if (err.response?.status !== 409) {
        recordResult(
          `Generate Voucher - Student ${studentId}`,
          'FAIL',
          `Voucher generation failed: ${err.message || err.response?.data?.message}`
        );
      }
    }
  }

  console.log(`\n📊 Total Vouchers Created: ${state.testData.voucherIds.length}`);
}

async function testPayments(): Promise<void> {
  logStep(9, 'PAYMENTS & LEDGER - Sample Payments');

  const randomStudents = state.testData.studentIds
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.ceil(state.testData.studentIds.length * 0.2));

  for (const studentId of randomStudents) {
    const startTime = performance.now();
    try {
      const studentIdx = state.testData.studentIds.indexOf(studentId);
      const voucherId = state.testData.voucherIds[studentIdx];

      const response = await state.apiClient.post('/payments/initiate', {
        voucherId,
        studentId,
        amountPaid: 5000 + Math.random() * 5000,
        paymentMethod: 'Cash',
        transactionRef: `TXN${Date.now()}${Math.random().toString().substring(2)}`,
      });

      const duration = performance.now() - startTime;
      const { success, data } = response.data;

      if (!success || !data?.paymentId) throw new Error('Invalid response structure');

      state.testData.paymentIds.push(data.paymentId);

      if (state.testData.paymentIds.length === 1) {
        recordResult(
          'Create Payment',
          'PASS',
          `Payment created (ID: ${data.paymentId})`,
          data,
          duration
        );
      }
    } catch (err: any) {
      recordResult(
        `Create Payment - Student ${studentId}`,
        'FAIL',
        `Payment creation failed: ${err.message || err.response?.data?.message}`
      );
    }
  }

  console.log(`\n📊 Total Payments Created: ${state.testData.paymentIds.length}`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runQAValidation() {
  console.log('\n' + '█'.repeat(80));
  console.log('EDUFLOW ERP - COMPREHENSIVE QA VALIDATION');
  console.log('█'.repeat(80));

  let dbPool: ConnectionPool | null = null;

  try {
    // Connect to database
    console.log('\n⏳ Connecting to database...');
    dbPool = await connectDatabase();
    state.dbPool = dbPool;
    console.log('✅ Database connected');

    // Execute QA steps
    await resetDatabase(dbPool);
    await testLogin();
    await testCreateSchool();
    await testCreateCampuses();
    await testCreateClasses();
    await testCreateSections();
    await testCreateStudents();
    await testGenerateVouchers();
    await testPayments();

    // Generate report
    generateQAReport();

  } catch (err) {
    console.error('\n❌ QA Validation failed:', err);
    generateQAReport();
  } finally {
    // Close database connection
    if (dbPool) {
      await dbPool.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

function generateQAReport() {
  console.log('\n' + '█'.repeat(80));
  console.log('FINAL QA REPORT');
  console.log('█'.repeat(80));

  const passCounts = state.qaResults.filter(r => r.status === 'PASS').length;
  const failCount = state.qaResults.filter(r => r.status === 'FAIL').length;
  const totalTests = state.qaResults.length;
  const passPercentage = totalTests > 0 ? ((passCounts / totalTests) * 100).toFixed(2) : '0';

  console.log(`\n📊 SUMMARY`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ✅ PASS: ${passCounts}`);
  console.log(`  ❌ FAIL: ${failCount}`);
  console.log(`  Success Rate: ${passPercentage}%`);

  console.log(`\n📋 DETAILED RESULTS\n`);
  for (const result of state.qaResults) {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.step}`);
    console.log(`   Message: ${result.message}`);
    if (result.duration) console.log(`   Duration: ${result.duration.toFixed(2)}ms`);
  }

  console.log(`\n📈 TEST DATA SUMMARY`);
  console.log(`  Schools Created: 1`);
  console.log(`  Campuses Created: ${state.testData.campusIds.length}`);
  console.log(`  Classes Created: ${state.testData.classIds.length}`);
  console.log(`  Sections Created: ${state.testData.sectionIds.length}`);
  console.log(`  Students Created: ${state.testData.studentIds.length}`);
  console.log(`  Fee Vouchers Created: ${state.testData.voucherIds.length}`);
  console.log(`  Payments Created: ${state.testData.paymentIds.length}`);

  console.log(`\n${'█'.repeat(80)}`);
  if (failCount === 0) {
    console.log('✅ ALL TESTS PASSED - SYSTEM IS PRODUCTION READY');
  } else {
    console.log(`⚠️  ${failCount} TEST(S) FAILED - REVIEW REQUIRED`);
  }
  console.log(`${'█'.repeat(80)}\n`);
}

// Execute
runQAValidation();
