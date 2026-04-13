-- Migration: SaaS Production Layer (Billing, Quotas, Observability)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantInvoices')
BEGIN
    CREATE TABLE TenantInvoices (
        InvoiceId INT IDENTITY(1,1) PRIMARY KEY,
        SchoolId INT NOT NULL,
        SubscriptionId INT NOT NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        Status NVARCHAR(20) NOT NULL, -- Pending, Paid, Overdue
        DueDate DATETIME NOT NULL,
        BillingPeriodStart DATETIME NOT NULL,
        BillingPeriodEnd DATETIME NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        PaidAt DATETIME NULL
    );
    CREATE INDEX IX_TenantInvoices_SchoolId ON TenantInvoices(SchoolId);
    CREATE INDEX IX_TenantInvoices_Status ON TenantInvoices(Status);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantUsageMetrics')
BEGIN
    CREATE TABLE TenantUsageMetrics (
        MetricId INT IDENTITY(1,1) PRIMARY KEY,
        SchoolId INT NOT NULL,
        MetricName NVARCHAR(50) NOT NULL, -- ApiCalls, StudentsCount, CampusesCount
        MetricValue BIGINT DEFAULT 0,
        LastUpdated DATETIME DEFAULT GETDATE(),
        UNIQUE(SchoolId, MetricName)
    );
    CREATE INDEX IX_TenantUsageMetrics_SchoolId ON TenantUsageMetrics(SchoolId);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemMetrics')
BEGIN
    CREATE TABLE SystemMetrics (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        MetricType NVARCHAR(50) NOT NULL, -- ResponseTime, JobFailure, EventDelay
        Value DECIMAL(18, 4) NOT NULL,
        Context NVARCHAR(MAX) NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_SystemMetrics_Type_Date ON SystemMetrics(MetricType, CreatedAt);
END
