using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ProctoringEvidenceConfiguration : IEntityTypeConfiguration<ProctoringEvidence>
{
    public void Configure(EntityTypeBuilder<ProctoringEvidence> builder)
    {
        builder.ToTable("ProctoringEvidences");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EvidenceType).HasMaxLength(64);
        builder.Property(x => x.FileUrl).HasMaxLength(1000);
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(1000);
        builder.Property(x => x.CaptureSource).HasMaxLength(32);
        builder.Property(x => x.TriggerEventType).HasMaxLength(64);
        builder.Property(x => x.TriggeredByUserId).HasMaxLength(450);
        builder.Property(x => x.Confidence).HasPrecision(5, 4);
        builder.HasIndex(x => x.ExamAttemptId);

        builder.HasOne(x => x.ExamAttempt).WithMany().HasForeignKey(x => x.ExamAttemptId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.CheatingLog).WithMany().HasForeignKey(x => x.CheatingLogId).OnDelete(DeleteBehavior.SetNull);
    }
}
