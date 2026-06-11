using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Exams;

public class PatchExamSettingDto
{
    public Optional<bool> ShuffleQuestions { get; set; }
    public Optional<bool> ShuffleAnswers { get; set; }
    public Optional<int> MaxAttempts { get; set; }
    public Optional<bool> ShowResultAfterSubmit { get; set; }
    public Optional<bool> RequireFullscreen { get; set; }
}
