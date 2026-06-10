using EduGuard.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduGuard.Infrastructure.Data.Configurations;

public class ClassroomMemberConfiguration : IEntityTypeConfiguration<ClassroomMember>
{
    public void Configure(EntityTypeBuilder<ClassroomMember> builder)
    {
        builder.ToTable("ClassroomMembers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(x => new { x.ClassroomId, x.StudentId })
            .IsUnique();

        builder.HasOne(x => x.Classroom)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.ClassroomId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Student)
            .WithMany(x => x.ClassroomMemberships)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
