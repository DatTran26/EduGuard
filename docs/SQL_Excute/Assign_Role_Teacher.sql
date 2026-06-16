DECLARE @Email NVARCHAR(256) = N'tintinnt05@gmail.com';
DECLARE @RoleName NVARCHAR(100) = N'Teacher';

-- Note: this database uses GUID identifiers (UNIQUEIDENTIFIER).
DECLARE @UserId UNIQUEIDENTIFIER =
(
    SELECT TOP 1 TRY_CONVERT(UNIQUEIDENTIFIER, Id)
    FROM Users
    WHERE Email = @Email
);

DECLARE @RoleId UNIQUEIDENTIFIER =
(
    SELECT TOP 1 TRY_CONVERT(UNIQUEIDENTIFIER, Id)
    FROM Roles
    WHERE Name = @RoleName
);

IF @UserId IS NULL
BEGIN
    THROW 50000, 'User not found by email (or Id is not a GUID).', 1;
END;

IF @RoleId IS NULL
BEGIN
    THROW 50000, 'Role not found by name (or Id is not a GUID).', 1;
END;

IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserId = @UserId AND RoleId = @RoleId)
BEGIN
    INSERT INTO UserRoles (UserId, RoleId)
    VALUES (@UserId, @RoleId);
END;

SELECT @UserId AS UserId, @RoleId AS RoleId;