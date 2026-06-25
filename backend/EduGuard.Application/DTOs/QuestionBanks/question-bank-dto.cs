namespace EduGuard.Application.DTOs.QuestionBanks;

public class QuestionBankDto
{
    public int Id { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
    public int QuestionCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
