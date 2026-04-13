-- Migration: Durable Events Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FinancialEvents')
BEGIN
    CREATE TABLE FinancialEvents (
        EventId INT IDENTITY(1,1) PRIMARY KEY,
        EventType NVARCHAR(100) NOT NULL,
        Payload NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Processed, Failed
        CorrelationId NVARCHAR(100),
        UserId INT,
        CampusId INT,
        CreatedAt DATETIME DEFAULT GETDATE(),
        ProcessedAt DATETIME NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        RetryCount INT DEFAULT 0
    );
    CREATE INDEX IX_FinancialEvents_Status ON FinancialEvents(Status);
    CREATE INDEX IX_FinancialEvents_CorrelationId ON FinancialEvents(CorrelationId);
END

-- Remove trigger-based immutability as requested in the broader goal
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_ProtectLedgerImmutability')
BEGIN
    DROP TRIGGER trg_ProtectLedgerImmutability;
END
