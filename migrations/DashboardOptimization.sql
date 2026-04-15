-- Migration: Dashboard Optimization and Summary Tables
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CampusMonthlySummary')
BEGIN
    CREATE TABLE CampusMonthlySummary (
        SummaryId INT IDENTITY(1,1) PRIMARY KEY,
        CampusId INT NOT NULL,
        Month NVARCHAR(7) NOT NULL, -- YYYY-MM
        TotalRevenue DECIMAL(18, 2) DEFAULT 0,
        TotalPending DECIMAL(18, 2) DEFAULT 0,
        TotalStudents INT DEFAULT 0,
        PaidStudents INT DEFAULT 0,
        UnpaidStudents INT DEFAULT 0,
        LastUpdated DATETIME DEFAULT GETDATE(),
        UNIQUE(CampusId, Month)
    );
    CREATE INDEX IX_CampusMonthlySummary_Month ON CampusMonthlySummary(Month);
END

-- Additional indexes for reporting performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StudentFeeLedger_Month_Status' AND object_id = OBJECT_ID('StudentFeeLedger'))
BEGIN
    CREATE INDEX IX_StudentFeeLedger_Month_Status ON StudentFeeLedger(Month, Status);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Payments_PaidAt' AND object_id = OBJECT_ID('Payments'))
BEGIN
    CREATE INDEX IX_Payments_PaidAt ON Payments(PaidAt);
END
