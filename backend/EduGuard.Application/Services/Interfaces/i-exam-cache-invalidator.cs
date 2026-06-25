namespace EduGuard.Application.Services.Interfaces;

public interface IExamCacheInvalidator
{
    Task InvalidateExamQuestionsAsync(int examId, CancellationToken ct = default);
    Task InvalidateExamAntiCheatSummaryAsync(int examId, CancellationToken ct = default);
    Task InvalidateExamAsync(int examId, CancellationToken ct = default);
}
