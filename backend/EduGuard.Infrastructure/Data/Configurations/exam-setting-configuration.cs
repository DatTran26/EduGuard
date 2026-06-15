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

        builder.HasOne(x => x.Exam)
            .WithOne(x => x.Setting)
            .HasForeignKey<ExamSetting>(x => x.ExamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
