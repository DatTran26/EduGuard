using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class StudentAnswerConfiguration : IEntityTypeConfiguration<StudentAnswer>
{
    public void Configure(EntityTypeBuilder<StudentAnswer> builder)
    {
        builder.ToTable("StudentAnswers");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TextAnswer).HasMaxLength(2000);

        builder.HasOne(x => x.ExamAttempt)
            .WithMany(x => x.StudentAnswers)
            .HasForeignKey(x => x.ExamAttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Question)
            .WithMany()
            .HasForeignKey(x => x.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Answer)
            .WithMany()
            .HasForeignKey(x => x.AnswerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
