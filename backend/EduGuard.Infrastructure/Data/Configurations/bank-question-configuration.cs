using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class BankQuestionConfiguration : IEntityTypeConfiguration<BankQuestion>
{
    public void Configure(EntityTypeBuilder<BankQuestion> builder)
    {
        builder.ToTable("BankQuestions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TeacherId).IsRequired().HasMaxLength(450);
        builder.Property(x => x.Content).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.DefaultScore).HasPrecision(5, 2);
        builder.Property(x => x.Subject).HasMaxLength(150);
        builder.Property(x => x.Chapter).HasMaxLength(200);
        builder.Property(x => x.Lesson).HasMaxLength(200);
        builder.Property(x => x.LearningOutcome).HasMaxLength(300);

        builder.HasIndex(x => new { x.QuestionBankId, x.Status, x.Difficulty });
        builder.HasIndex(x => new { x.TeacherId, x.QuestionType });

        builder.HasOne(x => x.QuestionBank)
            .WithMany(x => x.Questions)
            .HasForeignKey(x => x.QuestionBankId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Teacher)
            .WithMany()
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ParentQuestion)
            .WithMany(x => x.Versions)
            .HasForeignKey(x => x.ParentQuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
