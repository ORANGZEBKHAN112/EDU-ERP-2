-- EduFlow ERP Seed Data Script

-- 1. Seed Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'SuperAdmin')
    INSERT INTO Roles (RoleName) VALUES ('SuperAdmin');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'FinanceAdmin')
    INSERT INTO Roles (RoleName) VALUES ('FinanceAdmin');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'CampusAdmin')
    INSERT INTO Roles (RoleName) VALUES ('CampusAdmin');

IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Student')
    INSERT INTO Roles (RoleName) VALUES ('Student');

-- 2. Seed Super Admin User
-- Password 'admin123' hashed with bcrypt (cost 10)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@eduflow.com')
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, IsActive, CreatedAt)
    VALUES ('Super Admin', 'admin@eduflow.com', '$2b$10$DfzKqAqQPcUBLczkdAEKAuUdANvcobTYbCkVHiHQpVolnNm8ROju6', '123456789', 1, GETDATE());

    DECLARE @AdminId INT = SCOPE_IDENTITY();
    DECLARE @RoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'SuperAdmin');
    
    INSERT INTO UserRoles (UserId, RoleId) VALUES (@AdminId, @RoleId);
END
ELSE
BEGIN
    -- Ensure the password is correct if it was seeded with a bad hash previously
    UPDATE Users 
    SET PasswordHash = '$2b$10$DfzKqAqQPcUBLczkdAEKAuUdANvcobTYbCkVHiHQpVolnNm8ROju6',
        IsActive = 1
    WHERE Email = 'admin@eduflow.com' AND (LEN(PasswordHash) < 50 OR PasswordHash LIKE '$2a$10$X7%');
END

-- 3. Seed Finance Admin User
-- Password 'finance123' hashed with bcrypt
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'finance@eduflow.com')
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, Phone, IsActive, CreatedAt)
    VALUES ('Finance Admin', 'finance@eduflow.com', '$2b$10$TzYMqKqidEkJU2ZQMF90Xu/zaXYeV0wQhjKu8j2D/0fmaGyh2300S', '987654321', 1, GETDATE());

    DECLARE @FinanceId INT = SCOPE_IDENTITY();
    DECLARE @FinanceRoleId INT = (SELECT RoleId FROM Roles WHERE RoleName = 'FinanceAdmin');
    
    INSERT INTO UserRoles (UserId, RoleId) VALUES (@FinanceId, @FinanceRoleId);
END
ELSE
BEGIN
    UPDATE Users 
    SET PasswordHash = '$2b$10$TzYMqKqidEkJU2ZQMF90Xu/zaXYeV0wQhjKu8j2D/0fmaGyh2300S',
        IsActive = 1
    WHERE Email = 'finance@eduflow.com' AND (LEN(PasswordHash) < 50 OR PasswordHash LIKE '$2a$10$X7%');
END
