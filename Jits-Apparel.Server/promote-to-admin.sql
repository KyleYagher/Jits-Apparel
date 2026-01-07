-- Script to promote a user to Admin role
-- Replace 'your-email@example.com' with the actual email address

-- First, find the user ID
-- SELECT "Id", "Email", "FirstName", "LastName" FROM "AspNetUsers" WHERE "Email" = 'your-email@example.com';

-- Then find the Admin role ID
-- SELECT "Id", "Name" FROM "AspNetRoles" WHERE "Name" = 'Admin';

-- Add the user to Admin role (replace the user ID and role ID with actual values from above queries)
-- Example: If User ID = 1 and Admin Role ID = 1
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
VALUES (
    (SELECT "Id" FROM "AspNetUsers" WHERE "Email" = 'your-email@example.com' LIMIT 1),
    (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Admin' LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Verify the role was added
SELECT u."Email", r."Name" as "Role"
FROM "AspNetUsers" u
JOIN "AspNetUserRoles" ur ON u."Id" = ur."UserId"
JOIN "AspNetRoles" r ON ur."RoleId" = r."Id"
WHERE u."Email" = 'your-email@example.com';
