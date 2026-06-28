using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class BankAnswerConfiguration : IEntityTypeConfiguration<BankAnswer>
{
    public void Configure(EntityTypeBuilder<BankAnswer> builder)
    {
        builder.ToTable("BankAnswers");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Content).IsRequired().HasMaxLength(1000);

        builder.HasOne(x => x.BankQuestion)
            .WithMany(x => x.Answers)
            .HasForeignKey(x => x.BankQuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
