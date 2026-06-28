namespace EduGuard.Application.DTOs.QuestionBanks;

public class CreateQuestionBankRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Subject { get; set; }
    public string? GradeLevel { get; set; }
}
