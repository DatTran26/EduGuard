using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ProctoringStateConfiguration : IEntityTypeConfiguration<ProctoringState>
{
    public void Configure(EntityTypeBuilder<ProctoringState> builder)
    {
        builder.ToTable("ProctoringStates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CameraStatus).HasMaxLength(32);
        builder.Property(x => x.LiveStatus).HasMaxLength(32);
        builder.Property(x => x.FullscreenStatus).HasMaxLength(32);
        builder.Property(x => x.ConnectionStatus).HasMaxLength(32);
        builder.Property(x => x.EnvironmentStatus).HasMaxLength(32);
        builder.Property(x => x.LatestDetectionType).HasMaxLength(64);
        builder.Property(x => x.RiskLevel).HasMaxLength(32);
        builder.HasIndex(x => x.ExamAttemptId).IsUnique();

        builder.HasOne(x => x.ExamAttempt).WithOne().HasForeignKey<ProctoringState>(x => x.ExamAttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
