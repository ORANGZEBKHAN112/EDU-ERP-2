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

-- 4. Seed Schools, Campuses, Classes, Students, and Fee Structures
IF NOT EXISTS (SELECT 1 FROM Schools WHERE SchoolName = 'Beaconhouse School System')
BEGIN
    DECLARE @SchoolCounter INT = 1;
    DECLARE @SchoolName NVARCHAR(255);
    DECLARE @SchoolId INT;

    WHILE @SchoolCounter <= 3
    BEGIN
        SET @SchoolName = CASE @SchoolCounter 
            WHEN 1 THEN 'Beaconhouse School System'
            WHEN 2 THEN 'The City School'
            WHEN 3 THEN 'Roots Millennium'
        END;

        INSERT INTO Schools (SchoolName, Country) VALUES (@SchoolName, 'Pakistan');
        SET @SchoolId = SCOPE_IDENTITY();

        DECLARE @CampusCounter INT = 1;
        WHILE @CampusCounter <= 5
        BEGIN
            DECLARE @CampusName NVARCHAR(255) = @SchoolName + ' - Campus ' + CAST(@CampusCounter AS NVARCHAR(10));
            INSERT INTO Campuses (SchoolId, CampusName, City, State) 
            VALUES (@SchoolId, @CampusName, 'Islamabad', 'ICT');
            DECLARE @CampusId INT = SCOPE_IDENTITY();

            DECLARE @ClassCounter INT = 1;
            WHILE @ClassCounter <= 10
            BEGIN
                DECLARE @ClassName NVARCHAR(100) = 'Grade ' + CAST(@ClassCounter AS NVARCHAR(10));
                INSERT INTO Classes (CampusId, ClassName) VALUES (@CampusId, @ClassName);
                DECLARE @ClassId INT = SCOPE_IDENTITY();

                -- Seed Fee Structure for each class
                INSERT INTO FeeStructure (CampusId, ClassId, MonthlyFee, TransportFee, ExamFee, EffectiveFromMonth)
                VALUES (@CampusId, @ClassId, 5000 + (@ClassCounter * 500), 2000, 1500, '2024-01');

                SET @ClassCounter = @ClassCounter + 1;
            END

            SET @CampusCounter = @CampusCounter + 1;
        END

        SET @SchoolCounter = @SchoolCounter + 1;
    END

    -- Seed 200 Students distributed across campuses and classes
    DECLARE @StudentCounter INT = 1;
    
    WHILE @StudentCounter <= 200
    BEGIN
        DECLARE @TargetCampusId INT;
        DECLARE @TargetClassId INT;
        
        -- Pick a random campus and class from the newly created ones
        SELECT TOP 1 @TargetCampusId = CampusId FROM Campuses WHERE SchoolId IN (SELECT SchoolId FROM Schools WHERE SchoolName IN ('Beaconhouse School System', 'The City School', 'Roots Millennium')) ORDER BY NEWID();
        SELECT TOP 1 @TargetClassId = ClassId FROM Classes WHERE CampusId = @TargetCampusId ORDER BY NEWID();

        INSERT INTO Students (CampusId, ClassId, AdmissionNo, FullName, FatherName, Phone)
        VALUES (
            @TargetCampusId, 
            @TargetClassId, 
            'ADM-' + CAST(1000 + @StudentCounter AS NVARCHAR(10)), 
            'Student ' + CAST(@StudentCounter AS NVARCHAR(10)), 
            'Father ' + CAST(@StudentCounter AS NVARCHAR(10)), 
            '0300' + CAST(1000000 + @StudentCounter AS NVARCHAR(10))
        );

        SET @StudentCounter = @StudentCounter + 1;
    END
END
