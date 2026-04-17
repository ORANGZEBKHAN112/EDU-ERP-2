-- Performance Optimization Migration
-- Adds indexes and optimizations for bulk voucher generation

-- Index for bulk voucher queries (StudentId + Month)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeVouchers_StudentId_Month' AND object_id = OBJECT_ID('FeeVouchers'))
    CREATE INDEX IX_FeeVouchers_StudentId_Month ON FeeVouchers(StudentId, Month);

-- Index for bulk structure queries (CampusId + ClassId)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeStructure_CampusId_ClassId' AND object_id = OBJECT_ID('FeeStructure'))
    CREATE INDEX IX_FeeStructure_CampusId_ClassId ON FeeStructure(CampusId, ClassId);

-- Index for bulk adjustments queries (StudentId + Month)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeAdjustments_StudentId_Month' AND object_id = OBJECT_ID('FeeAdjustments'))
    CREATE INDEX IX_FeeAdjustments_StudentId_Month ON FeeAdjustments(StudentId, Month);

-- Index for bulk ledger opening balance queries (StudentId + Month)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StudentFeeLedger_StudentId_Month_Desc' AND object_id = OBJECT_ID('StudentFeeLedger'))
    CREATE INDEX IX_StudentFeeLedger_StudentId_Month_Desc ON StudentFeeLedger(StudentId, Month DESC, CreatedAt DESC);

-- Composite index for student queries (CampusId + ClassId) for better filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_CampusId_ClassId' AND object_id = OBJECT_ID('Students'))
    CREATE INDEX IX_Students_CampusId_ClassId ON Students(CampusId, ClassId);

-- Index for correlation ID lookups (used in bulk operations)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeeVouchers_CorrelationId' AND object_id = OBJECT_ID('FeeVouchers'))
    CREATE INDEX IX_FeeVouchers_CorrelationId ON FeeVouchers(CorrelationId);

-- Index for ledger correlation ID lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StudentFeeLedger_CorrelationId' AND object_id = OBJECT_ID('StudentFeeLedger'))
    CREATE INDEX IX_StudentFeeLedger_CorrelationId ON StudentFeeLedger(CorrelationId);