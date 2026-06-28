using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class EmailSettingsConfiguration : IEntityTypeConfiguration<EmailSettings>
{
    public void Configure(EntityTypeBuilder<EmailSettings> builder)
    {
        builder.ToTable("EmailSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Host).HasMaxLength(200);
        builder.Property(x => x.Username).HasMaxLength(256);
        builder.Property(x => x.Password).HasMaxLength(500);
        builder.Property(x => x.FromAddress).HasMaxLength(256);
        builder.Property(x => x.FromName).HasMaxLength(120);

        builder.HasData(new EmailSettings
        {
            Id = 1,
            Enabled = false,
            Host = "smtp.gmail.com",
            Port = 587,
            UseSsl = true,
            Username = string.Empty,
            Password = string.Empty,
            FromAddress = "noreply@eduguard.local",
            FromName = "EduGuard",
            RequireOnRegister = true,
            OtpLength = 6,
            OtpExpiryMinutes = 10,
            ResendCooldownSeconds = 60,
            UpdatedAt = new DateTime(2026, 6, 27, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
