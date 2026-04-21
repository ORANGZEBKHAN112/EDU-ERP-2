-- RBAC Validation Function
-- This procedure checks if a user has a specific permission within a given scope.

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CheckPermission]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[CheckPermission];
END
GO

CREATE PROCEDURE [dbo].[CheckPermission]
    @UserID INT,
    @PermissionName NVARCHAR(100),
    @SchoolID INT = NULL,
    @CampusID INT = NULL,
    @ClassID INT = NULL,
    @SectionID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Return 1 if at least one role gives the permission and the scope matches
    IF EXISTS (
        SELECT 1
        FROM UserRoles ur
        JOIN Roles r ON ur.RoleId = r.RoleId
        JOIN RolePermissions rp ON r.RoleId = rp.RoleId
        JOIN Permissions p ON rp.PermissionId = p.PermissionId
        WHERE ur.UserId = @UserID
          AND p.PermissionName = @PermissionName
          AND (
              -- Case 1: SuperAdmin has global access (SchoolId IS NULL effectively for global, but SuperAdmin should be checked by name or global flag)
              r.RoleName = 'SuperAdmin'
              OR 
              (
                  -- Case 2: Scope matched. A NULL in ur.Scope means "global within that role context"
                  (ur.SchoolID IS NULL OR ur.SchoolID = @SchoolID)
                  AND (ur.CampusID IS NULL OR ur.CampusID = @CampusID)
                  AND (ur.ClassID IS NULL OR ur.ClassID = @ClassID)
                  AND (ur.SectionID IS NULL OR ur.SectionID = @SectionID)
              )
          )
    )
    BEGIN
        SELECT 1 AS HasPermission;
    END
    ELSE
    BEGIN
        SELECT 0 AS HasPermission;
    END
END
GO

-- Helper view to debug RBAC
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_UserPermissionAudit')
    DROP VIEW vw_UserPermissionAudit;
GO

CREATE VIEW vw_UserPermissionAudit AS
SELECT 
    u.UserId,
    u.FullName,
    r.RoleName,
    p.PermissionName,
    ur.SchoolId,
    ur.CampusId,
    ur.ClassId,
    ur.SectionId
FROM Users u
JOIN UserRoles ur ON u.UserId = ur.UserId
JOIN Roles r ON ur.RoleId = r.RoleId
JOIN RolePermissions rp ON r.RoleId = rp.RoleId
JOIN Permissions p ON rp.PermissionId = p.PermissionId;
GO
