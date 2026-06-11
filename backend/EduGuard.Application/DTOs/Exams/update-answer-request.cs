namespace EduGuard.Application.DTOs.Exams;

public class UpdateAnswerRequest
{
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
