-- Migration: Production Hardening (Data Integrity, Financial Safety, Performance)

-- 1. ADD SchoolId TO Student-Related Tables for Multi-Tenant Enforcement
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'SchoolId')
BEGIN
    ALTER TABLE Students ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Classes') AND name = 'SchoolId')
BEGIN
    ALTER TABLE Classes ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FeeStructure') AND name = 'SchoolId')
BEGIN
    ALTER TABLE FeeStructure ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('StudentFeeLedger') AND name = 'SchoolId')
BEGIN
    ALTER TABLE StudentFeeLedger ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FeeVouchers') AND name = 'SchoolId')
BEGIN
    ALTER TABLE FeeVouchers ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SchoolId')
BEGIN
    ALTER TABLE Payments ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'CampusId')
BEGIN
    ALTER TABLE Payments ADD CampusId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FeeAdjustments') AND name = 'SchoolId')
BEGIN
    ALTER TABLE FeeAdjustments ADD SchoolId INT NULL;
END
GO

-- 2. ADD FOREIGN KEYS (Hardening Relationship Integrity)
-- Students -> Class is already there
-- Class -> Campus is already there

-- Campus -> School
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Campuses_Schools')
BEGIN
    ALTER TABLE Campuses ADD CONSTRAINT FK_Campuses_Schools FOREIGN KEY (SchoolId) REFERENCES Schools(SchoolId);
END
GO

-- 3. IDEMPOTENCY & UNIQUE CONSTRAINTS
-- Prevent duplicate payments (voucherId + TransactionRef/referenceId)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_TransactionRef' AND object_id = OBJECT_ID('Payments'))
BEGIN
    ALTER TABLE Payments DROP CONSTRAINT UQ_TransactionRef;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Payment_Voucher_Ref' AND object_id = OBJECT_ID('Payments'))
BEGIN
    ALTER TABLE Payments ADD CONSTRAINT UQ_Payment_Voucher_Ref UNIQUE (VoucherId, TransactionRef);
END
GO

-- 4. PERFORMANCE OPTIMIZATION (INDEXES)
-- studentId indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_StudentId' AND object_id = OBJECT_ID('Payments'))
BEGIN
    CREATE INDEX IX_Payments_StudentId ON Payments(StudentId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeAdjustments_StudentId' AND object_id = OBJECT_ID('FeeAdjustments'))
BEGIN
    CREATE INDEX IX_FeeAdjustments_StudentId ON FeeAdjustments(StudentId);
END
GO

-- voucherId indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_VoucherId' AND object_id = OBJECT_ID('Payments'))
BEGIN
    CREATE INDEX IX_Payments_VoucherId ON Payments(VoucherId);
END
GO

-- schoolId indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_SchoolId' AND object_id = OBJECT_ID('Students'))
BEGIN
    CREATE INDEX IX_Students_SchoolId ON Students(SchoolId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Classes_SchoolId' AND object_id = OBJECT_ID('Classes'))
BEGIN
    CREATE INDEX IX_Classes_SchoolId ON Classes(SchoolId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeVouchers_SchoolId' AND object_id = OBJECT_ID('FeeVouchers'))
BEGIN
    CREATE INDEX IX_FeeVouchers_SchoolId ON FeeVouchers(SchoolId);
END
GO

-- campusId indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Classes_CampusId' AND object_id = OBJECT_ID('Classes'))
BEGIN
    CREATE INDEX IX_Classes_CampusId ON Classes(CampusId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeStructure_CampusId' AND object_id = OBJECT_ID('FeeStructure'))
BEGIN
    CREATE INDEX IX_FeeStructure_CampusId ON FeeStructure(CampusId);
END
GO
