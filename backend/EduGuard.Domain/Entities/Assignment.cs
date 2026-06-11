namespace EduGuard.Domain.Entities;

public class Assignment
{
    public int Id { get; set; }
    public int ClassroomId { get; set; }
    public int TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Classroom Classroom { get; set; } = null!;
    public ApplicationUser Teacher { get; set; } = null!;
    public ICollection<Submission> Submissions { get; set; } = [];
}
