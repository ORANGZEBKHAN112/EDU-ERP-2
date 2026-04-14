-- Financial Observability Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FinancialTraces]') AND type in (N'U'))
BEGIN
    CREATE TABLE FinancialTraces (
        TraceId INT PRIMARY KEY IDENTITY(1,1),
        CorrelationId NVARCHAR(100) NOT NULL,
        StudentId INT NOT NULL,
        ActionType NVARCHAR(50) NOT NULL, -- PAYMENT, VOUCHER, FINE
        Amount DECIMAL(18, 2) NOT NULL,
        Timestamp DATETIME DEFAULT GETDATE(),
        RequestContext NVARCHAR(MAX) NOT NULL, -- JSON
        
        CONSTRAINT FK_FinancialTraces_Student FOREIGN KEY (StudentId) REFERENCES Students(StudentId)
    );

    CREATE INDEX IX_FinancialTraces_CorrelationId ON FinancialTraces(CorrelationId);
    CREATE INDEX IX_FinancialTraces_StudentId ON FinancialTraces(StudentId);
END
GO
