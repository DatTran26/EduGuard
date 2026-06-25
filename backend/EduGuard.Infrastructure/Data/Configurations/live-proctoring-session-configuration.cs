using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class LiveProctoringSessionConfiguration : IEntityTypeConfiguration<LiveProctoringSession>
{
    public void Configure(EntityTypeBuilder<LiveProctoringSession> builder)
    {
        builder.ToTable("LiveProctoringSessions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TeacherId).HasMaxLength(450);
        builder.Property(x => x.StudentId).HasMaxLength(450);
        builder.Property(x => x.Status).HasMaxLength(32);
        builder.Property(x => x.EndReason).HasMaxLength(500);
        builder.HasIndex(x => new { x.ExamAttemptId, x.Status });
        builder.HasIndex(x => x.TeacherId);

        builder.HasOne(x => x.Exam).WithMany().HasForeignKey(x => x.ExamId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ExamAttempt).WithMany().HasForeignKey(x => x.ExamAttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
