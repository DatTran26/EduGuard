namespace EduGuard.Domain.Entities;

public class Classroom
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ApplicationUser Teacher { get; set; } = null!;
    public ICollection<ClassroomMember> Members { get; set; } = [];
}
