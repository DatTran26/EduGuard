namespace EduGuard.Application.DTOs.Exams;

public class ExamResultDto
{
    public ExamAttemptDto Attempt { get; set; } = new();
    public List<QuestionResultDto> Questions { get; set; } = [];
}

public class QuestionResultDto
{
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal EarnedScore { get; set; }
    public bool IsCorrect { get; set; }
    public List<int> SelectedAnswerIds { get; set; } = [];
    public string? TextAnswer { get; set; }
}
