using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ExamMatrixItemConfiguration : IEntityTypeConfiguration<ExamMatrixItem>
{
    public void Configure(EntityTypeBuilder<ExamMatrixItem> builder)
    {
        builder.ToTable("ExamMatrixItems");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Chapter).HasMaxLength(200);
        builder.Property(x => x.Lesson).HasMaxLength(200);
        builder.Property(x => x.LearningOutcome).HasMaxLength(300);
        builder.Property(x => x.ScorePerQuestion).HasPrecision(5, 2);

        builder.HasOne(x => x.ExamMatrix)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.ExamMatrixId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
