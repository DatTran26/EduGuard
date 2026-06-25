using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ProctoringAiSettingsConfiguration : IEntityTypeConfiguration<ProctoringAiSettings>
{
    public void Configure(EntityTypeBuilder<ProctoringAiSettings> builder)
    {
        builder.ToTable("ProctoringAiSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AiServiceBaseUrl).HasMaxLength(500);
        builder.Property(x => x.PhoneVisibleMinConfidence).HasPrecision(5, 4);
        builder.Property(x => x.BookVisibleMinConfidence).HasPrecision(5, 4);
        builder.Property(x => x.SecondPersonMinConfidence).HasPrecision(5, 4);

        builder.HasData(new ProctoringAiSettings
        {
            Id = 1,
            EnableYoloDetection = true,
            AiServiceBaseUrl = "http://127.0.0.1:8800",
            PhoneVisibleMinConfidence = 0.65m,
            BookVisibleMinConfidence = 0.60m,
            SecondPersonMinConfidence = 0.65m,
            DetectionIntervalSeconds = 4,
            UpdatedAt = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
