-- Upgrade Fee Engine for Distributed Safety and Reconciliation

-- 1. Job Locks for Distributed Execution
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'JobLocks')
BEGIN
    CREATE TABLE JobLocks (
        JobName NVARCHAR(100) PRIMARY KEY,
        LockedBy NVARCHAR(100) NOT NULL,
        LockedAt DATETIME DEFAULT GETDATE(),
        ExpiresAt DATETIME NOT NULL
    );
END

-- 2. Job Execution Tracking
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'JobExecutions')
BEGIN
    CREATE TABLE JobExecutions (
        ExecutionId INT PRIMARY KEY IDENTITY(1,1),
        JobName NVARCHAR(100) NOT NULL,
        ExecutionDate NVARCHAR(10) NOT NULL, -- YYYY-MM-DD
        Status NVARCHAR(20) NOT NULL, -- Success, Failed, Running
        InstanceId NVARCHAR(100) NOT NULL,
        StartTime DATETIME DEFAULT GETDATE(),
        EndTime DATETIME,
        ErrorMessage NVARCHAR(MAX),
        CampusId INT -- Optional, if job is campus-specific
    );
    CREATE INDEX IX_JobExecutions_Name_Date ON JobExecutions(JobName, ExecutionDate);
END

-- 3. Reconciliation Reports
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ReconciliationReports')
BEGIN
    CREATE TABLE ReconciliationReports (
        ReportId INT PRIMARY KEY IDENTITY(1,1),
        CampusId INT NOT NULL,
        Month NVARCHAR(7) NOT NULL,
        TotalStudents INT,
        MismatchedCount INT,
        OrphanVouchers INT,
        OrphanPayments INT,
        Status NVARCHAR(20), -- Balanced, Mismatch
        Details NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId)
    );
END
