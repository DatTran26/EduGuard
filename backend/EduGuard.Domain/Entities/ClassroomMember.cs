using EduGuard.Domain.Enums;

namespace EduGuard.Domain.Entities;

public class ClassroomMember
{
    public int Id { get; set; }
    public int ClassroomId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = ClassroomMemberStatus.Active;

    public Classroom Classroom { get; set; } = null!;
    public ApplicationUser Student { get; set; } = null!;
}
