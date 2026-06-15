namespace EduGuard.Domain.Entities;

public class ExamSetting
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleAnswers { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShowResultAfterSubmit { get; set; }
    public bool RequireFullscreen { get; set; }

    public Exam Exam { get; set; } = null!;
}
