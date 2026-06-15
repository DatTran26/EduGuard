namespace EduGuard.Application.DTOs.Assignments;

public class UpdateAssignmentRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
}
