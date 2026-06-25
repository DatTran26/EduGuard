using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ProctorActionConfiguration : IEntityTypeConfiguration<ProctorAction>
{
    public void Configure(EntityTypeBuilder<ProctorAction> builder)
    {
        builder.ToTable("ProctorActions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TeacherId).HasMaxLength(450);
        builder.Property(x => x.ActionType).HasMaxLength(64);
        builder.Property(x => x.Reason).HasMaxLength(1000);
        builder.HasIndex(x => x.ExamAttemptId);

        builder.HasOne(x => x.ExamAttempt).WithMany().HasForeignKey(x => x.ExamAttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
