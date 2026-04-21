-- Hierarchy: Schools -> Campuses -> Classes -> Sections
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sections')
BEGIN
    CREATE TABLE Sections (
        SectionId INT PRIMARY KEY IDENTITY(1,1),
        ClassId INT NOT NULL,
        SectionName NVARCHAR(50) NOT NULL,
        FOREIGN KEY (ClassId) REFERENCES Classes(ClassId)
    );
END
GO

-- Permissions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    CREATE TABLE Permissions (
        PermissionId INT PRIMARY KEY IDENTITY(1,1),
        PermissionName NVARCHAR(100) NOT NULL UNIQUE
    );
END
GO

-- RolePermissions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE RolePermissions (
        RoleId INT NOT NULL,
        PermissionId INT NOT NULL,
        PRIMARY KEY (RoleId, PermissionId),
        FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
        FOREIGN KEY (PermissionId) REFERENCES Permissions(PermissionId)
    );
END
GO

-- Refactor UserRoles to support Scoping
-- Note: UserRoles usually links User to a Role, but we'll add the optional scope columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRoles') AND name = 'SchoolId')
BEGIN
    ALTER TABLE UserRoles ADD SchoolId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRoles') AND name = 'CampusId')
BEGIN
    ALTER TABLE UserRoles ADD CampusId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRoles') AND name = 'ClassId')
BEGIN
    ALTER TABLE UserRoles ADD ClassId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('UserRoles') AND name = 'SectionId')
BEGIN
    ALTER TABLE UserRoles ADD SectionId INT NULL;
END
GO

-- Adding indexes for UserRoles search performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserRoles_User_Role' AND object_id = OBJECT_ID('UserRoles'))
BEGIN
    CREATE INDEX IX_UserRoles_User_Role ON UserRoles(UserId, RoleId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserRoles_Scope' AND object_id = OBJECT_ID('UserRoles'))
BEGIN
    CREATE INDEX IX_UserRoles_Scope ON UserRoles(SchoolId, CampusId, ClassId, SectionId);
END
GO

-- Seed Required Permissions
INSERT INTO Permissions (PermissionName)
SELECT T.PermissionName
FROM (
    Values 
    ('CREATE_SCHOOL'), ('MANAGE_SCHOOL'), ('MANAGE_CAMPUS'), ('CREATE_CLASS'), 
    ('ASSIGN_TEACHER'), ('VIEW_STUDENT'), ('MANAGE_STUDENT'), ('MARK_ATTENDANCE'), 
    ('GENERATE_FEE'), ('VIEW_FINANCIALS'), ('PAY_FEE'), ('VIEW_REPORTS')
) AS T(PermissionName)
LEFT JOIN Permissions P ON T.PermissionName = P.PermissionName
WHERE P.PermissionName IS NULL;
GO

-- Seed Missing Roles
INSERT INTO Roles (RoleName)
SELECT T.RoleName
FROM (
    Values 
    ('SchoolAdmin'), ('Accountant'), ('Teacher'), ('Parent'), ('SupportStaff')
) AS T(RoleName)
LEFT JOIN Roles R ON T.RoleName = R.RoleName
WHERE R.RoleName IS NULL;
GO

-- Map Roles to Permissions
-- SuperAdmin gets everything
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'SuperAdmin'
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- SchoolAdmin Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'SchoolAdmin'
AND P.PermissionName IN ('MANAGE_SCHOOL', 'MANAGE_CAMPUS', 'CREATE_CLASS', 'VIEW_STUDENT', 'MANAGE_STUDENT', 'VIEW_FINANCIALS', 'VIEW_REPORTS')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- CampusAdmin Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'CampusAdmin'
AND P.PermissionName IN ('MANAGE_CAMPUS', 'CREATE_CLASS', 'VIEW_STUDENT', 'MANAGE_STUDENT', 'VIEW_REPORTS')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- Teacher Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'Teacher'
AND P.PermissionName IN ('VIEW_STUDENT', 'MARK_ATTENDANCE')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- Accountant Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName IN ('Accountant', 'FinanceAdmin')
AND P.PermissionName IN ('VIEW_STUDENT', 'GENERATE_FEE', 'VIEW_FINANCIALS', 'PAY_FEE', 'VIEW_REPORTS')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- Student Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'Student'
AND P.PermissionName IN ('VIEW_STUDENT', 'PAY_FEE')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- Parent Mapping
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT R.RoleId, P.PermissionId
FROM Roles R, Permissions P
WHERE R.RoleName = 'Parent'
AND P.PermissionName IN ('VIEW_STUDENT', 'PAY_FEE')
AND NOT EXISTS (SELECT 1 FROM RolePermissions RP WHERE RP.RoleId = R.RoleId AND RP.PermissionId = P.PermissionId);
GO

-- Complete the Student linkage to Section
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'SectionId')
BEGIN
    ALTER TABLE Students ADD SectionId INT NULL;
    -- Note: We make it nullable for backward compatibility
END
GO
