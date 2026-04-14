-- Migration: SaaS Multi-Tenant and Subscription Layer
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Subscriptions')
BEGIN
    CREATE TABLE Subscriptions (
        SubscriptionId INT IDENTITY(1,1) PRIMARY KEY,
        SchoolId INT NOT NULL,
        PlanType NVARCHAR(50) NOT NULL, -- Basic, Pro, Enterprise
        StartDate DATETIME NOT NULL,
        EndDate DATETIME NOT NULL,
        Status NVARCHAR(20) NOT NULL, -- Active, Expired, Suspended
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_Subscriptions_SchoolId ON Subscriptions(SchoolId);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TenantFeatureFlags')
BEGIN
    CREATE TABLE TenantFeatureFlags (
        FeatureFlagId INT IDENTITY(1,1) PRIMARY KEY,
        SchoolId INT NOT NULL,
        FeatureName NVARCHAR(100) NOT NULL,
        IsEnabled BIT DEFAULT 1,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UNIQUE(SchoolId, FeatureName)
    );
    CREATE INDEX IX_TenantFeatureFlags_SchoolId ON TenantFeatureFlags(SchoolId);
END

-- Ensure SchoolId exists on all major entities if not already there
-- (Assuming Schools table is the root tenant)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'SchoolId')
BEGIN
    ALTER TABLE Users ADD SchoolId INT NULL;
END

-- Adding indexes for tenant isolation performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Campuses_SchoolId' AND object_id = OBJECT_ID('Campuses'))
BEGIN
    CREATE INDEX IX_Campuses_SchoolId ON Campuses(SchoolId);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_SchoolId' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE INDEX IX_Users_SchoolId ON Users(SchoolId);
END
