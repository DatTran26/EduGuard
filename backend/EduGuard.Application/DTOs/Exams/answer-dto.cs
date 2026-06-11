namespace EduGuard.Application.DTOs.Exams;

public class AnswerDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
