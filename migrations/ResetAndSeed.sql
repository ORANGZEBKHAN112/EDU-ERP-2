-- EduFlow ERP: Complete Database Reset and Fresh Seed
-- Purpose: Clear all data except SuperAdmin user/role, then seed fresh test data
-- Date: 2026-04-20
-- Note: Runs as a single batch - no GO statements required

-- ===== DISABLE FK CONSTRAINTS =====
ALTER TABLE FinancialEvents NOCHECK CONSTRAINT ALL;
ALTER TABLE FinancialTraces NOCHECK CONSTRAINT ALL;
ALTER TABLE FailedTransactionQueue NOCHECK CONSTRAINT ALL;
ALTER TABLE TenantFeatureFlags NOCHECK CONSTRAINT ALL;
ALTER TABLE Subscriptions NOCHECK CONSTRAINT ALL;
ALTER TABLE SystemMetrics NOCHECK CONSTRAINT ALL;
ALTER TABLE TenantUsageMetrics NOCHECK CONSTRAINT ALL;
ALTER TABLE TenantInvoices NOCHECK CONSTRAINT ALL;
ALTER TABLE CampusMonthlySummary NOCHECK CONSTRAINT ALL;
ALTER TABLE AuditLogs NOCHECK CONSTRAINT ALL;
ALTER TABLE Payments NOCHECK CONSTRAINT ALL;
ALTER TABLE FeeAdjustments NOCHECK CONSTRAINT ALL;
ALTER TABLE FeeVouchers NOCHECK CONSTRAINT ALL;
ALTER TABLE StudentFeeLedger NOCHECK CONSTRAINT ALL;
ALTER TABLE FeeStructure NOCHECK CONSTRAINT ALL;
ALTER TABLE Students NOCHECK CONSTRAINT ALL;
ALTER TABLE Sections NOCHECK CONSTRAINT ALL;
ALTER TABLE Classes NOCHECK CONSTRAINT ALL;
ALTER TABLE UserCampuses NOCHECK CONSTRAINT ALL;
ALTER TABLE Campuses NOCHECK CONSTRAINT ALL;
ALTER TABLE UserRoles NOCHECK CONSTRAINT ALL;
ALTER TABLE Schools NOCHECK CONSTRAINT ALL;

-- ===== DELETE DATA =====
DELETE FROM FinancialEvents;
DELETE FROM FinancialTraces;
DELETE FROM FailedTransactionQueue;
DELETE FROM TenantFeatureFlags;
DELETE FROM Subscriptions;
DELETE FROM SystemMetrics;
DELETE FROM TenantUsageMetrics;
DELETE FROM TenantInvoices;
DELETE FROM CampusMonthlySummary;
DELETE FROM AuditLogs;
DELETE FROM Payments;
DELETE FROM FeeAdjustments;
DELETE FROM FeeVouchers;
DELETE FROM StudentFeeLedger;
DELETE FROM FeeStructure;
DELETE FROM Students;
DELETE FROM Sections;
DELETE FROM Classes;
DELETE FROM UserCampuses;
DELETE FROM Campuses;

-- Delete all users and roles except SuperAdmin
DECLARE @SuperAdminUserId INT;
DECLARE @SuperAdminRoleId INT;

SELECT @SuperAdminUserId = UserId FROM Users WHERE Email = 'admin@eduflow.com';
SELECT @SuperAdminRoleId = RoleId FROM Roles WHERE RoleName = 'SuperAdmin';

DELETE FROM UserRoles WHERE UserRoleId NOT IN (SELECT UserRoleId FROM UserRoles WHERE UserId = @SuperAdminUserId AND RoleId = @SuperAdminRoleId);
DELETE FROM Users WHERE UserId != @SuperAdminUserId;
DELETE FROM Roles WHERE RoleId != @SuperAdminRoleId;

DELETE FROM Schools;

-- ===== RE-ENABLE FK CONSTRAINTS =====
ALTER TABLE FinancialEvents CHECK CONSTRAINT ALL;
ALTER TABLE FinancialTraces CHECK CONSTRAINT ALL;
ALTER TABLE FailedTransactionQueue CHECK CONSTRAINT ALL;
ALTER TABLE TenantFeatureFlags CHECK CONSTRAINT ALL;
ALTER TABLE Subscriptions CHECK CONSTRAINT ALL;
ALTER TABLE SystemMetrics CHECK CONSTRAINT ALL;
ALTER TABLE TenantUsageMetrics CHECK CONSTRAINT ALL;
ALTER TABLE TenantInvoices CHECK CONSTRAINT ALL;
ALTER TABLE CampusMonthlySummary CHECK CONSTRAINT ALL;
ALTER TABLE AuditLogs CHECK CONSTRAINT ALL;
ALTER TABLE Payments CHECK CONSTRAINT ALL;
ALTER TABLE FeeAdjustments CHECK CONSTRAINT ALL;
ALTER TABLE FeeVouchers CHECK CONSTRAINT ALL;
ALTER TABLE StudentFeeLedger CHECK CONSTRAINT ALL;
ALTER TABLE FeeStructure CHECK CONSTRAINT ALL;
ALTER TABLE Students CHECK CONSTRAINT ALL;
ALTER TABLE Sections CHECK CONSTRAINT ALL;
ALTER TABLE Classes CHECK CONSTRAINT ALL;
ALTER TABLE UserCampuses CHECK CONSTRAINT ALL;
ALTER TABLE Campuses CHECK CONSTRAINT ALL;
ALTER TABLE UserRoles CHECK CONSTRAINT ALL;
ALTER TABLE Schools CHECK CONSTRAINT ALL;

-- ===== RESET IDENTITY SEEDS =====
DBCC CHECKIDENT ('Schools', RESEED, 0);
DBCC CHECKIDENT ('Campuses', RESEED, 0);
DBCC CHECKIDENT ('Classes', RESEED, 0);
DBCC CHECKIDENT ('Sections', RESEED, 0);
DBCC CHECKIDENT ('Students', RESEED, 0);
DBCC CHECKIDENT ('FeeStructure', RESEED, 0);
DBCC CHECKIDENT ('StudentFeeLedger', RESEED, 0);
DBCC CHECKIDENT ('FeeVouchers', RESEED, 0);
DBCC CHECKIDENT ('Payments', RESEED, 0);
DBCC CHECKIDENT ('FeeAdjustments', RESEED, 0);
DBCC CHECKIDENT ('UserCampuses', RESEED, 0);

-- ===== SEED TEST DATA =====

-- Insert Test Schools
INSERT INTO Schools (SchoolName, Country, IsActive) VALUES
('Green Valley School', 'Pakistan', 1),
('Sunshine Academy', 'Pakistan', 1),
('Elite Institute', 'Pakistan', 1);

-- Insert Test Campuses
INSERT INTO Campuses (SchoolId, CampusName, State, City, Address, IsActive) VALUES
(1, 'Main Campus', 'Sindh', 'Karachi', '123 Main Street, Karachi', 1),
(1, 'North Branch', 'Sindh', 'Karachi', '456 North Road, Karachi', 1),
(2, 'Central Campus', 'Punjab', 'Lahore', 'Lahore Campus Address', 1),
(3, 'Metropolitan', 'Sindh', 'Karachi', 'City Center, Karachi', 1);

-- Insert Test Classes
INSERT INTO Classes (SchoolId, CampusId, ClassName) VALUES
(1, 1, 'Class 1A'),
(1, 1, 'Class 1B'),
(1, 1, 'Class 2A'),
(1, 2, 'Class 1A'),
(1, 2, 'Class 2A'),
(2, 3, 'Class 1'),
(2, 3, 'Class 2'),
(3, 4, 'Class 1A');

-- Insert Test Sections
INSERT INTO Sections (SchoolId, CampusId, ClassId, SectionName, IsActive) VALUES
(1, 1, 1, 'A', 1),
(1, 1, 1, 'B', 1),
(1, 1, 2, 'A', 1),
(1, 1, 3, 'A', 1),
(1, 1, 3, 'B', 1),
(1, 2, 4, 'A', 1),
(1, 2, 5, 'A', 1),
(1, 2, 5, 'B', 1),
(2, 3, 6, 'A', 1),
(2, 3, 7, 'A', 1),
(3, 4, 8, 'A', 1);

-- Insert Test Students
INSERT INTO Students (SchoolId, CampusId, ClassId, AdmissionNo, FullName, FatherName, Phone, IsActive) VALUES
(1, 1, 1, 'ADM001', 'Ahmad Ali', 'Mr. Ali Khan', '03001234567', 1),
(1, 1, 1, 'ADM002', 'Fatima Hassan', 'Mr. Hassan', '03001234568', 1),
(1, 1, 1, 'ADM003', 'Hassan Ahmed', 'Mr. Ahmed', '03001234569', 1),
(1, 1, 2, 'ADM004', 'Ayesha Khan', 'Mr. Khan', '03001234570', 1),
(1, 1, 3, 'ADM005', 'Ali Raza', 'Mr. Raza', '03001234571', 1),
(1, 1, 3, 'ADM006', 'Sara Malik', 'Mr. Malik', '03001234572', 1),
(1, 2, 4, 'ADM007', 'Omar Islam', 'Mr. Islam', '03001234573', 1),
(1, 2, 5, 'ADM008', 'Zainab Ahmed', 'Mr. Ahmed', '03001234574', 1),
(1, 2, 5, 'ADM009', 'Muhammad Hassan', 'Mr. Hassan', '03001234575', 1),
(2, 3, 6, 'ADM010', 'Hira Khan', 'Mr. Khan', '03001234576', 1),
(2, 3, 7, 'ADM011', 'Usman Ali', 'Mr. Ali', '03001234577', 1),
(3, 4, 8, 'ADM012', 'Nida Fatima', 'Mr. Fatima', '03001234578', 1);

-- Insert Fee Structure
INSERT INTO FeeStructure (SchoolId, CampusId, ClassId, MonthlyFee, TransportFee, ExamFee, EffectiveFromMonth) VALUES
(1, 1, 1, 5000.00, 1000.00, 500.00, '2026-04'),
(1, 1, 2, 5500.00, 1000.00, 500.00, '2026-04'),
(1, 1, 3, 6000.00, 1000.00, 600.00, '2026-04'),
(1, 2, 4, 5000.00, 1500.00, 500.00, '2026-04'),
(1, 2, 5, 5500.00, 1500.00, 500.00, '2026-04'),
(2, 3, 6, 4500.00, 800.00, 400.00, '2026-04'),
(2, 3, 7, 5000.00, 800.00, 450.00, '2026-04'),
(3, 4, 8, 6500.00, 2000.00, 700.00, '2026-04');

-- Insert Student Fee Ledger
INSERT INTO StudentFeeLedger (SchoolId, StudentId, CampusId, Month, OpeningBalance, MonthlyFee, Fine, Discount, PaidAmount, ClosingBalance, Status) VALUES
(1, 1, 1, '2026-04', 0, 6500.00, 0, 0, 0, 6500.00, 'Unpaid'),
(1, 2, 1, '2026-04', 0, 6500.00, 0, 0, 6500.00, 0, 'Paid'),
(1, 3, 1, '2026-04', 0, 6500.00, 0, 0, 3250.00, 3250.00, 'Partial'),
(1, 4, 1, '2026-04', 0, 6500.00, 0, 0, 0, 6500.00, 'Unpaid'),
(1, 5, 1, '2026-04', 0, 7000.00, 0, 500.00, 6500.00, 0, 'Paid'),
(1, 6, 1, '2026-04', 0, 7000.00, 0, 0, 0, 7000.00, 'Unpaid'),
(1, 7, 1, '2026-04', 0, 6500.00, 0, 0, 0, 6500.00, 'Unpaid'),
(1, 8, 1, '2026-04', 0, 6500.00, 500.00, 0, 6500.00, 500.00, 'Partial'),
(1, 9, 1, '2026-04', 0, 6500.00, 0, 0, 6500.00, 0, 'Paid'),
(2, 10, 3, '2026-04', 0, 5300.00, 0, 0, 0, 5300.00, 'Unpaid'),
(2, 11, 3, '2026-04', 0, 5300.00, 0, 0, 5300.00, 0, 'Paid'),
(3, 12, 4, '2026-04', 0, 9200.00, 0, 0, 0, 9200.00, 'Unpaid');

-- Insert Fee Vouchers
INSERT INTO FeeVouchers (SchoolId, StudentId, CampusId, Month, TotalAmount, DueDate, Status) VALUES
(1, 1, 1, '2026-04', 6500.00, '2026-04-15', 'Unpaid'),
(1, 2, 1, '2026-04', 6500.00, '2026-04-15', 'Paid'),
(1, 3, 1, '2026-04', 6500.00, '2026-04-15', 'Partial'),
(1, 4, 1, '2026-04', 6500.00, '2026-04-15', 'Unpaid'),
(1, 5, 1, '2026-04', 7000.00, '2026-04-15', 'Paid'),
(1, 6, 1, '2026-04', 7000.00, '2026-04-15', 'Unpaid'),
(1, 7, 1, '2026-04', 6500.00, '2026-04-15', 'Unpaid'),
(1, 8, 1, '2026-04', 6500.00, '2026-04-15', 'Partial'),
(1, 9, 1, '2026-04', 6500.00, '2026-04-15', 'Paid'),
(2, 10, 3, '2026-04', 5300.00, '2026-04-15', 'Unpaid'),
(2, 11, 3, '2026-04', 5300.00, '2026-04-15', 'Paid'),
(3, 12, 4, '2026-04', 9200.00, '2026-04-15', 'Unpaid');

-- Insert Sample Payments
INSERT INTO Payments (SchoolId, VoucherId, StudentId, AmountPaid, PaymentMethod, TransactionRef, PaymentStatus, PaidAt) VALUES
(1, 2, 2, 6500.00, 'Bank Transfer', 'TXN-2026-04-001', 'Completed', GETDATE()),
(1, 3, 3, 3250.00, 'Cash', 'TXN-2026-04-002', 'Completed', GETDATE()),
(1, 5, 5, 6500.00, 'Online', 'TXN-2026-04-003', 'Completed', GETDATE()),
(1, 9, 9, 6500.00, 'Bank Transfer', 'TXN-2026-04-004', 'Completed', GETDATE()),
(2, 11, 11, 5300.00, 'Cash', 'TXN-2026-04-005', 'Completed', GETDATE());

-- Insert Test Users
INSERT INTO Users (FullName, Email, PasswordHash, Phone, IsActive) VALUES
('Campus Admin User', 'campusadmin@eduflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '03009876543', 1),
('Principal User', 'principal@eduflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '03009876544', 1),
('Finance Admin', 'finance@eduflow.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm', '03009876545', 1);

-- Get User IDs
DECLARE @CampusAdminId INT;
DECLARE @PrincipalId INT;
DECLARE @FinanceAdminId INT;

SELECT @CampusAdminId = UserId FROM Users WHERE Email = 'campusadmin@eduflow.com';
SELECT @PrincipalId = UserId FROM Users WHERE Email = 'principal@eduflow.com';
SELECT @FinanceAdminId = UserId FROM Users WHERE Email = 'finance@eduflow.com';

-- Insert Roles
INSERT INTO Roles (RoleName) VALUES
('CampusAdmin'),
('Principal'),
('FinanceAdmin'),
('Student'),
('Parent');

-- Get Role IDs
DECLARE @CampusAdminRoleId INT;
DECLARE @PrincipalRoleId INT;
DECLARE @FinanceAdminRoleId INT;

SELECT @CampusAdminRoleId = RoleId FROM Roles WHERE RoleName = 'CampusAdmin';
SELECT @PrincipalRoleId = RoleId FROM Roles WHERE RoleName = 'Principal';
SELECT @FinanceAdminRoleId = RoleId FROM Roles WHERE RoleName = 'FinanceAdmin';

-- Assign User Roles
INSERT INTO UserRoles (UserId, RoleId) VALUES
(@CampusAdminId, @CampusAdminRoleId),
(@PrincipalId, @PrincipalRoleId),
(@FinanceAdminId, @FinanceAdminRoleId);

-- Assign Users to Campuses
INSERT INTO UserCampuses (UserId, CampusId) VALUES
(@CampusAdminId, 1),
(@CampusAdminId, 2),
(@PrincipalId, 1),
(@FinanceAdminId, 1),
(@FinanceAdminId, 2);

PRINT '';
PRINT '========================================';
PRINT 'Database Reset and Seed Completed Successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Summary:';
PRINT '  ✓ All data cleared (except SuperAdmin)';
PRINT '  ✓ 3 Test Schools created';
PRINT '  ✓ 4 Test Campuses created';
PRINT '  ✓ 8 Test Classes created';
PRINT '  ✓ 11 Test Sections created';
PRINT '  ✓ 12 Test Students created';
PRINT '  ✓ 12 Fee Vouchers and Ledger entries created';
PRINT '  ✓ 5 Sample Payments created';
PRINT '  ✓ 3 Test Users created (CampusAdmin, Principal, FinanceAdmin)';
PRINT '  ✓ 5 Roles created';
PRINT '';
PRINT 'Test User Credentials:';
PRINT '  SuperAdmin: admin@eduflow.com';
PRINT '  CampusAdmin: campusadmin@eduflow.com';
PRINT '  Principal: principal@eduflow.com';
PRINT '  Finance Admin: finance@eduflow.com';
PRINT '';
PRINT 'Password for all accounts: Test123!';
PRINT '========================================';
