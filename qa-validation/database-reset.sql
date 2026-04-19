-- QA Database Reset Script
-- Purpose: Clean all test data while keeping SuperAdmin user
-- Foreign Key Safe Deletion Order (reverse dependency order)

-- Disable foreign key constraints temporarily
EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'

-- Delete data in correct dependency order (from leaf tables upward)
DELETE FROM AuditLogs;
DELETE FROM FeeAdjustments;
DELETE FROM Payments;
DELETE FROM FeeVouchers;
DELETE FROM StudentFeeLedger;
DELETE FROM FeeStructure;
DELETE FROM Sections;
DELETE FROM Students;
DELETE FROM Classes;
DELETE FROM UserCampuses;
DELETE FROM UserRoles;
DELETE FROM Campuses;
DELETE FROM Schools;

-- Keep SuperAdmin user and configuration
-- Users and Roles tables should be cleared and reset only if needed
-- DELETE FROM UserRoles; (optional - remove if you want to keep SuperAdmin roles)
-- DELETE FROM Roles; (optional - remove if you want to keep role definitions)
-- DELETE FROM Users WHERE UserId <> 1; (keep SuperAdmin)

-- Re-enable foreign key constraints
EXEC sp_MSForEachTable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'

-- Reset identity seeds for clean IDs
DBCC CHECKIDENT ('Schools', RESEED, 0);
DBCC CHECKIDENT ('Campuses', RESEED, 0);
DBCC CHECKIDENT ('Classes', RESEED, 0);
DBCC CHECKIDENT ('Sections', RESEED, 0);
DBCC CHECKIDENT ('Students', RESEED, 0);
DBCC CHECKIDENT ('FeeVouchers', RESEED, 0);
DBCC CHECKIDENT ('Payments', RESEED, 0);
DBCC CHECKIDENT ('StudentFeeLedger', RESEED, 0);
DBCC CHECKIDENT ('FeeStructure', RESEED, 0);
DBCC CHECKIDENT ('FeeAdjustments', RESEED, 0);
DBCC CHECKIDENT ('AuditLogs', RESEED, 0);

-- Verification
SELECT 'SuperAdmin User' AS Entity, COUNT(*) AS RecordCount FROM Users;
SELECT 'Schools' AS Entity, COUNT(*) AS RecordCount FROM Schools;
SELECT 'Campuses' AS Entity, COUNT(*) AS RecordCount FROM Campuses;
SELECT 'Classes' AS Entity, COUNT(*) AS RecordCount FROM Classes;
SELECT 'Sections' AS Entity, COUNT(*) AS RecordCount FROM Sections;
SELECT 'Students' AS Entity, COUNT(*) AS RecordCount FROM Students;
SELECT 'FeeVouchers' AS Entity, COUNT(*) AS RecordCount FROM FeeVouchers;
SELECT 'Payments' AS Entity, COUNT(*) AS RecordCount FROM Payments;

PRINT 'Database reset complete. SuperAdmin user retained.';
