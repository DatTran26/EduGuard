namespace EduGuard.Application.DTOs.Exams;

public class ExamSettingDto
{
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleAnswers { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShowResultAfterSubmit { get; set; }
    public bool RequireFullscreen { get; set; }
}
