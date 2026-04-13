-- Banking-Grade Financial System Upgrade

-- 1. Audit Logs Upgrade
ALTER TABLE AuditLogs ADD EventType NVARCHAR(100);
ALTER TABLE AuditLogs ADD TransactionId NVARCHAR(100);
ALTER TABLE AuditLogs ADD CorrelationId NVARCHAR(100);

-- 2. Correlation IDs for Financial Entities
ALTER TABLE Payments ADD CorrelationId NVARCHAR(100);
ALTER TABLE FeeVouchers ADD CorrelationId NVARCHAR(100);
ALTER TABLE FeeAdjustments ADD CorrelationId NVARCHAR(100);

-- 3. Immutable Ledger Transformation
-- Remove the unique constraint to allow multiple entries (audit trail) per month
IF EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_Student_Month' AND parent_object_id = OBJECT_ID('StudentFeeLedger'))
BEGIN
    ALTER TABLE StudentFeeLedger DROP CONSTRAINT UQ_Student_Month;
END

ALTER TABLE StudentFeeLedger ADD CorrelationId NVARCHAR(100);
ALTER TABLE StudentFeeLedger ADD TransactionId NVARCHAR(100);
ALTER TABLE StudentFeeLedger ADD CreatedAt DATETIME DEFAULT GETDATE();
ALTER TABLE StudentFeeLedger ADD EntryType NVARCHAR(50); -- Initialization, Payment, Fine, Adjustment

-- 4. Database Level Protection (Triggers for Immutability)
-- Note: In a real banking system, we'd use strict permissions, but triggers enforce it at the engine level.
GO
CREATE TRIGGER trg_ProtectLedgerImmutability
ON StudentFeeLedger
FOR UPDATE, DELETE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM deleted)
    BEGIN
        RAISERROR ('StudentFeeLedger is immutable. Updates and Deletes are forbidden.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO
