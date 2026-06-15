using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.AntiCheat;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class CheatingLogConfiguration : IEntityTypeConfiguration<CheatingLog>
{
    public void Configure(EntityTypeBuilder<CheatingLog> builder)
    {
        builder.ToTable("CheatingLogs");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type)
            .HasConversion(
                value => CheatingTypeHelper.ToApiType(value),
                value => CheatingTypeHelper.ParseType(value))
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(x => x.Description).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Metadata).HasMaxLength(2000);

        builder.HasIndex(x => x.ExamAttemptId);
        builder.HasIndex(x => x.OccurredAt);

        builder.HasOne(x => x.ExamAttempt)
            .WithMany(x => x.CheatingLogs)
            .HasForeignKey(x => x.ExamAttemptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
