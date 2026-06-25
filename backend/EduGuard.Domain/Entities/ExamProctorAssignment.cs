namespace EduGuard.Domain.Entities;

public class ExamProctorAssignment
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string InvitedByTeacherId { get; set; } = string.Empty;
    public string Role { get; set; } = "CoProctor";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Exam Exam { get; set; } = null!;
}
