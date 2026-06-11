namespace EduGuard.Application.DTOs.Assignments;

public class AssignmentDto
{
    public int Id { get; set; }
    public int ClassroomId { get; set; }
    public int TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SubmissionCount { get; set; }
}
