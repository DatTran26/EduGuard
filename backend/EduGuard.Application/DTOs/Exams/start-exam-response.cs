namespace EduGuard.Application.DTOs.Exams;

public class StartExamResponse
{
    public ExamAttemptDto Attempt { get; set; } = new();
    public List<QuestionDto> Questions { get; set; } = [];
    public int DurationMinutes { get; set; }
}
