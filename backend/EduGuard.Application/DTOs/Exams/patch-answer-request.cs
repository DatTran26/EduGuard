using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Exams;

public class PatchAnswerRequest
{
    public Optional<string> Content { get; set; }
    public Optional<bool> IsCorrect { get; set; }
    public Optional<int> OrderIndex { get; set; }
}
