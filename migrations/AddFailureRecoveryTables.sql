-- Failure Recovery System Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FailedTransactionQueue]') AND type in (N'U'))
BEGIN
    CREATE TABLE FailedTransactionQueue (
        QueueId INT PRIMARY KEY IDENTITY(1,1),
        CorrelationId NVARCHAR(100) NOT NULL,
        Payload NVARCHAR(MAX) NOT NULL, -- JSON
        Status NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, RETRYING, RESOLVED, FAILED
        RetryCount INT DEFAULT 0,
        ErrorMessage NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX IX_FailedTransactionQueue_CorrelationId ON FailedTransactionQueue(CorrelationId);
    CREATE INDEX IX_FailedTransactionQueue_Status ON FailedTransactionQueue(Status);
END
GO
