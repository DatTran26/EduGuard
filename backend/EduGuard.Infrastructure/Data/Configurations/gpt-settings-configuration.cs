using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class GptSettingsConfiguration : IEntityTypeConfiguration<GptSettings>
{
    public void Configure(EntityTypeBuilder<GptSettings> builder)
    {
        builder.ToTable("GptSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ApiKey).HasMaxLength(500);
        builder.Property(x => x.Model).HasMaxLength(120);
        builder.Property(x => x.BaseUrl).HasMaxLength(500);

        builder.HasData(new GptSettings
        {
            Id = 1,
            ApiKey = string.Empty,
            Model = "gpt-5.4",
            BaseUrl = "https://api.openai.com/v1",
            UpdatedAt = new DateTime(2026, 6, 27, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
