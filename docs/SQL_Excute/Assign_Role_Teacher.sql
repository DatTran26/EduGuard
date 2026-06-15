SELECT Id, Email FROM Users WHERE Email = 'tintinnt05@gmail.com';
SELECT Id, Name FROM Roles WHERE Name = 'Teacher';

-- Gán role Teacher 
INSERT INTO UserRoles (UserId, RoleId) VALUES (2, 2);