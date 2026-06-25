using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ExamSettingConfiguration : IEntityTypeConfiguration<ExamSetting>
{
    public void Configure(EntityTypeBuilder<ExamSetting> builder)
    {
        builder.ToTable("ExamSettings");
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.ExamId).IsUnique();

        builder.Property(x => x.AntiCheatMode).HasMaxLength(32).HasDefaultValue("BASIC");
        builder.Property(x => x.DefaultLiveQuality).HasMaxLength(16).HasDefaultValue("360p");
        builder.Property(x => x.FocusedLiveQuality).HasMaxLength(16).HasDefaultValue("720p");
        builder.Property(x => x.ViolationAction).HasMaxLength(32).HasDefaultValue("WARN_TEACHER");

        builder.HasOne(x => x.Exam)
            .WithOne(x => x.Setting)
            .HasForeignKey<ExamSetting>(x => x.ExamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
