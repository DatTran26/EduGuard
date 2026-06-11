namespace EduGuard.Application.DTOs.Exams;

public class StudentAnswerDto
{
    public int QuestionId { get; set; }
    public List<int> AnswerIds { get; set; } = [];
    public string? TextAnswer { get; set; }
}
