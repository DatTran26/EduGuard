using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduGuard.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ConvertIdentityKeysToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [CheatingLogs];
                DELETE FROM [StudentAnswers];
                DELETE FROM [Answers];
                DELETE FROM [Questions];
                DELETE FROM [ExamAttempts];
                DELETE FROM [Submissions];
                DELETE FROM [Assignments];
                DELETE FROM [Exams];
                DELETE FROM [ClassroomMembers];
                DELETE FROM [Classrooms];
                DELETE FROM [UserRoles];
                DELETE FROM [RoleClaims];
                DELETE FROM [UserClaims];
                DELETE FROM [UserLogins];
                DELETE FROM [UserTokens];
                DELETE FROM [RefreshTokens];
                DELETE FROM [Users];
                DELETE FROM [Roles];

                ALTER TABLE [Classrooms] DROP CONSTRAINT [FK_Classrooms_Users_TeacherId];
                ALTER TABLE [ClassroomMembers] DROP CONSTRAINT [FK_ClassroomMembers_Users_StudentId];
                ALTER TABLE [RefreshTokens] DROP CONSTRAINT [FK_RefreshTokens_Users_UserId];
                ALTER TABLE [UserClaims] DROP CONSTRAINT [FK_UserClaims_Users_UserId];
                ALTER TABLE [UserLogins] DROP CONSTRAINT [FK_UserLogins_Users_UserId];
                ALTER TABLE [UserRoles] DROP CONSTRAINT [FK_UserRoles_Users_UserId];
                ALTER TABLE [UserRoles] DROP CONSTRAINT [FK_UserRoles_Roles_RoleId];
                ALTER TABLE [UserTokens] DROP CONSTRAINT [FK_UserTokens_Users_UserId];
                ALTER TABLE [RoleClaims] DROP CONSTRAINT [FK_RoleClaims_Roles_RoleId];
                ALTER TABLE [Assignments] DROP CONSTRAINT [FK_Assignments_Users_TeacherId];
                ALTER TABLE [Exams] DROP CONSTRAINT [FK_Exams_Users_TeacherId];
                ALTER TABLE [ExamAttempts] DROP CONSTRAINT [FK_ExamAttempts_Users_StudentId];
                ALTER TABLE [Submissions] DROP CONSTRAINT [FK_Submissions_Users_StudentId];

                ALTER TABLE [UserRoles] DROP CONSTRAINT [PK_UserRoles];
                ALTER TABLE [UserTokens] DROP CONSTRAINT [PK_UserTokens];

                DROP INDEX [IX_UserRoles_RoleId] ON [UserRoles];
                DROP INDEX [IX_RoleClaims_RoleId] ON [RoleClaims];
                DROP INDEX [IX_UserClaims_UserId] ON [UserClaims];
                DROP INDEX [IX_UserLogins_UserId] ON [UserLogins];
                DROP INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens];
                DROP INDEX [IX_Classrooms_TeacherId] ON [Classrooms];
                DROP INDEX [IX_ClassroomMembers_StudentId] ON [ClassroomMembers];
                DROP INDEX [IX_ClassroomMembers_ClassroomId_StudentId] ON [ClassroomMembers];
                DROP INDEX [IX_Assignments_TeacherId] ON [Assignments];
                DROP INDEX [IX_Exams_TeacherId] ON [Exams];
                DROP INDEX [IX_ExamAttempts_StudentId] ON [ExamAttempts];
                DROP INDEX [IX_Submissions_StudentId] ON [Submissions];
                DROP INDEX [IX_Submissions_AssignmentId_StudentId] ON [Submissions];

                ALTER TABLE [Users] DROP CONSTRAINT [PK_Users];
                ALTER TABLE [Users] DROP COLUMN [Id];
                ALTER TABLE [Users] ADD [Id] nvarchar(450) NOT NULL;
                ALTER TABLE [Users] ADD CONSTRAINT [PK_Users] PRIMARY KEY ([Id]);

                ALTER TABLE [Roles] DROP CONSTRAINT [PK_Roles];
                ALTER TABLE [Roles] DROP COLUMN [Id];
                ALTER TABLE [Roles] ADD [Id] nvarchar(450) NOT NULL;
                ALTER TABLE [Roles] ADD CONSTRAINT [PK_Roles] PRIMARY KEY ([Id]);

                ALTER TABLE [UserRoles] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
                ALTER TABLE [UserRoles] ALTER COLUMN [RoleId] nvarchar(450) NOT NULL;
                ALTER TABLE [UserClaims] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
                ALTER TABLE [UserLogins] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
                ALTER TABLE [UserTokens] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
                ALTER TABLE [RoleClaims] ALTER COLUMN [RoleId] nvarchar(450) NOT NULL;
                ALTER TABLE [RefreshTokens] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
                ALTER TABLE [Classrooms] ALTER COLUMN [TeacherId] nvarchar(450) NOT NULL;
                ALTER TABLE [ClassroomMembers] ALTER COLUMN [StudentId] nvarchar(450) NOT NULL;
                ALTER TABLE [Assignments] ALTER COLUMN [TeacherId] nvarchar(450) NOT NULL;
                ALTER TABLE [Exams] ALTER COLUMN [TeacherId] nvarchar(450) NOT NULL;
                ALTER TABLE [ExamAttempts] ALTER COLUMN [StudentId] nvarchar(450) NOT NULL;
                ALTER TABLE [Submissions] ALTER COLUMN [StudentId] nvarchar(450) NOT NULL;

                ALTER TABLE [UserRoles] ADD CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]);
                ALTER TABLE [UserTokens] ADD CONSTRAINT [PK_UserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]);

                CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
                CREATE INDEX [IX_RoleClaims_RoleId] ON [RoleClaims] ([RoleId]);
                CREATE INDEX [IX_UserClaims_UserId] ON [UserClaims] ([UserId]);
                CREATE INDEX [IX_UserLogins_UserId] ON [UserLogins] ([UserId]);
                CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
                CREATE INDEX [IX_Classrooms_TeacherId] ON [Classrooms] ([TeacherId]);
                CREATE INDEX [IX_ClassroomMembers_StudentId] ON [ClassroomMembers] ([StudentId]);
                CREATE UNIQUE INDEX [IX_ClassroomMembers_ClassroomId_StudentId] ON [ClassroomMembers] ([ClassroomId], [StudentId]);
                CREATE INDEX [IX_Assignments_TeacherId] ON [Assignments] ([TeacherId]);
                CREATE INDEX [IX_Exams_TeacherId] ON [Exams] ([TeacherId]);
                CREATE INDEX [IX_ExamAttempts_StudentId] ON [ExamAttempts] ([StudentId]);
                CREATE INDEX [IX_Submissions_StudentId] ON [Submissions] ([StudentId]);
                CREATE UNIQUE INDEX [IX_Submissions_AssignmentId_StudentId] ON [Submissions] ([AssignmentId], [StudentId]);

                ALTER TABLE [Classrooms] ADD CONSTRAINT [FK_Classrooms_Users_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
                ALTER TABLE [ClassroomMembers] ADD CONSTRAINT [FK_ClassroomMembers_Users_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
                ALTER TABLE [RefreshTokens] ADD CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [UserClaims] ADD CONSTRAINT [FK_UserClaims_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [UserLogins] ADD CONSTRAINT [FK_UserLogins_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [UserRoles] ADD CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [UserTokens] ADD CONSTRAINT [FK_UserTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [RoleClaims] ADD CONSTRAINT [FK_RoleClaims_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE;
                ALTER TABLE [Assignments] ADD CONSTRAINT [FK_Assignments_Users_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
                ALTER TABLE [Exams] ADD CONSTRAINT [FK_Exams_Users_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
                ALTER TABLE [ExamAttempts] ADD CONSTRAINT [FK_ExamAttempts_Users_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
                ALTER TABLE [Submissions] ADD CONSTRAINT [FK_Submissions_Users_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

                INSERT INTO [Roles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                VALUES
                    (N'a0000000-0000-0000-0000-000000000001', N'role-admin-v1', N'Admin', N'ADMIN'),
                    (N'a0000000-0000-0000-0000-000000000002', N'role-teacher-v1', N'Teacher', N'TEACHER'),
                    (N'a0000000-0000-0000-0000-000000000003', N'role-student-v1', N'Student', N'STUDENT');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("Reverting string Identity keys to int is not supported.");
        }
    }
}
