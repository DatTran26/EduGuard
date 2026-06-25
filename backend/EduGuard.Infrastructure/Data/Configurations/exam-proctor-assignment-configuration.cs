using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ExamProctorAssignmentConfiguration : IEntityTypeConfiguration<ExamProctorAssignment>
{
    public void Configure(EntityTypeBuilder<ExamProctorAssignment> builder)
    {
        builder.ToTable("ExamProctorAssignments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TeacherId).HasMaxLength(450);
        builder.Property(x => x.InvitedByTeacherId).HasMaxLength(450);
        builder.Property(x => x.Role).HasMaxLength(32);
        builder.HasIndex(x => new { x.ExamId, x.TeacherId }).IsUnique();

        builder.HasOne(x => x.Exam).WithMany().HasForeignKey(x => x.ExamId).OnDelete(DeleteBehavior.Cascade);
    }
}
