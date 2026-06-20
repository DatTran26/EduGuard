namespace EduGuard.Application.DTOs.Assignments;

public class AssignmentDto
{
    public int Id { get; set; }
    public int ClassroomId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SubmissionCount { get; set; }
    public SubmissionDto? MySubmission { get; set; }
}
