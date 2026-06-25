using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ExamMatrixConfiguration : IEntityTypeConfiguration<ExamMatrix>
{
    public void Configure(EntityTypeBuilder<ExamMatrix> builder)
    {
        builder.ToTable("ExamMatrices");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TeacherId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Subject).HasMaxLength(150);
        builder.Property(x => x.GradeLevel).HasMaxLength(50);
        builder.Property(x => x.TotalScore).HasPrecision(5, 2);

        builder.HasIndex(x => new { x.TeacherId, x.Name });

        builder.HasOne(x => x.Teacher)
            .WithMany()
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
