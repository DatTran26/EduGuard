using EduGuard.Domain.Constants;
using EduGuard.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Classroom> Classrooms => Set<Classroom>();
    public DbSet<ClassroomMember> ClassroomMembers => Set<ClassroomMember>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamSetting> ExamSettings => Set<ExamSetting>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<QuestionBank> QuestionBanks => Set<QuestionBank>();
    public DbSet<BankQuestion> BankQuestions => Set<BankQuestion>();
    public DbSet<BankAnswer> BankAnswers => Set<BankAnswer>();
    public DbSet<ExamMatrix> ExamMatrices => Set<ExamMatrix>();
    public DbSet<ExamMatrixItem> ExamMatrixItems => Set<ExamMatrixItem>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();
    public DbSet<CheatingLog> CheatingLogs => Set<CheatingLog>();
    public DbSet<LiveProctoringSession> LiveProctoringSessions => Set<LiveProctoringSession>();
    public DbSet<ProctoringEvidence> ProctoringEvidences => Set<ProctoringEvidence>();
    public DbSet<ProctoringState> ProctoringStates => Set<ProctoringState>();
    public DbSet<ProctorAction> ProctorActions => Set<ProctorAction>();
    public DbSet<ExamProctorAssignment> ExamProctorAssignments => Set<ExamProctorAssignment>();
    public DbSet<ProctoringAiSettings> ProctoringAiSettings => Set<ProctoringAiSettings>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<IdentityRole>().ToTable("Roles");
        builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        SeedRoles(builder);
    }

    private static void SeedRoles(ModelBuilder builder)
    {
        builder.Entity<IdentityRole>().HasData(
            new IdentityRole { Id = RoleIds.Admin, Name = "Admin", NormalizedName = "ADMIN", ConcurrencyStamp = "role-admin-v1" },
            new IdentityRole { Id = RoleIds.Teacher, Name = "Teacher", NormalizedName = "TEACHER", ConcurrencyStamp = "role-teacher-v1" },
            new IdentityRole { Id = RoleIds.Student, Name = "Student", NormalizedName = "STUDENT", ConcurrencyStamp = "role-student-v1" }
        );
    }
}
