-- EduFlow ERP MSSQL Schema

-- 1. Schools
CREATE TABLE Schools (
    SchoolId INT PRIMARY KEY IDENTITY(1,1),
    SchoolName NVARCHAR(255) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 2. Campuses
CREATE TABLE Campuses (
    CampusId INT PRIMARY KEY IDENTITY(1,1),
    SchoolId INT NOT NULL,
    CampusName NVARCHAR(255) NOT NULL,
    State NVARCHAR(100),
    City NVARCHAR(100),
    Address NVARCHAR(MAX),
    FinanceAdminUserId INT, -- FK to Users
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (SchoolId) REFERENCES Schools(SchoolId)
);

-- 3. Users
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. Roles
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- 5. UserRoles
CREATE TABLE UserRoles (
    UserRoleId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
);

-- 6. UserCampuses
CREATE TABLE UserCampuses (
    UserCampusId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    CampusId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId)
);

-- 7. Classes
CREATE TABLE Classes (
    ClassId INT PRIMARY KEY IDENTITY(1,1),
    CampusId INT NOT NULL,
    ClassName NVARCHAR(100) NOT NULL,
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId)
);

-- 8. Students
CREATE TABLE Students (
    StudentId INT PRIMARY KEY IDENTITY(1,1),
    CampusId INT NOT NULL,
    ClassId INT NOT NULL,
    AdmissionNo NVARCHAR(50) UNIQUE NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    FatherName NVARCHAR(255),
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId),
    FOREIGN KEY (ClassId) REFERENCES Classes(ClassId)
);

-- 9. FeeStructure
CREATE TABLE FeeStructure (
    FeeStructureId INT PRIMARY KEY IDENTITY(1,1),
    CampusId INT NOT NULL,
    ClassId INT NOT NULL,
    MonthlyFee DECIMAL(18, 2) DEFAULT 0,
    TransportFee DECIMAL(18, 2) DEFAULT 0,
    ExamFee DECIMAL(18, 2) DEFAULT 0,
    EffectiveFromMonth NVARCHAR(7) NOT NULL, -- YYYY-MM
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId),
    FOREIGN KEY (ClassId) REFERENCES Classes(ClassId)
);

-- 10. StudentFeeLedger
CREATE TABLE StudentFeeLedger (
    LedgerId INT PRIMARY KEY IDENTITY(1,1),
    StudentId INT NOT NULL,
    CampusId INT NOT NULL,
    Month NVARCHAR(7) NOT NULL, -- YYYY-MM
    OpeningBalance DECIMAL(18, 2) DEFAULT 0,
    MonthlyFee DECIMAL(18, 2) DEFAULT 0,
    Fine DECIMAL(18, 2) DEFAULT 0,
    Discount DECIMAL(18, 2) DEFAULT 0,
    PaidAmount DECIMAL(18, 2) DEFAULT 0,
    ClosingBalance DECIMAL(18, 2) DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'Unpaid', -- Paid, Partial, Unpaid
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId),
    CONSTRAINT UQ_Student_Month UNIQUE (StudentId, Month)
);

-- 11. FeeVouchers
CREATE TABLE FeeVouchers (
    VoucherId INT PRIMARY KEY IDENTITY(1,1),
    StudentId INT NOT NULL,
    CampusId INT NOT NULL,
    Month NVARCHAR(7) NOT NULL,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    DueDate DATETIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Unpaid',
    GeneratedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId),
    CONSTRAINT UQ_Voucher_Student_Month UNIQUE (StudentId, Month)
);

-- 12. Payments
CREATE TABLE Payments (
    PaymentId INT PRIMARY KEY IDENTITY(1,1),
    VoucherId INT NOT NULL,
    StudentId INT NOT NULL,
    AmountPaid DECIMAL(18, 2) NOT NULL,
    PaymentMethod NVARCHAR(50),
    TransactionRef NVARCHAR(100) UNIQUE,
    PaymentStatus NVARCHAR(20),
    PaidAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (VoucherId) REFERENCES FeeVouchers(VoucherId),
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId)
);

-- 13. FeeAdjustments
CREATE TABLE FeeAdjustments (
    AdjustmentId INT PRIMARY KEY IDENTITY(1,1),
    StudentId INT NOT NULL,
    CampusId INT NOT NULL,
    Month NVARCHAR(7) NOT NULL,
    Type NVARCHAR(20) NOT NULL, -- Fine, Discount, Manual
    Amount DECIMAL(18, 2) NOT NULL,
    Reason NVARCHAR(MAX),
    CreatedBy INT, -- UserId
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    FOREIGN KEY (CampusId) REFERENCES Campuses(CampusId)
);

-- 14. AuditLogs
CREATE TABLE AuditLogs (
    LogId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT,
    Action NVARCHAR(50) NOT NULL,
    BeforeState NVARCHAR(MAX),
    AfterState NVARCHAR(MAX),
    Timestamp DATETIME DEFAULT GETDATE(),
    CampusId INT
);

-- Indexes for performance
CREATE INDEX IX_Students_Campus ON Students(CampusId);
CREATE INDEX IX_Vouchers_Student ON FeeVouchers(StudentId);
CREATE INDEX IX_Ledger_Student_Month ON StudentFeeLedger(StudentId, Month);
