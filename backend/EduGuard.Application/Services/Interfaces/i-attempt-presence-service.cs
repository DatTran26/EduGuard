namespace EduGuard.Application.Services.Interfaces;

public interface IAttemptPresenceService
{
    Task TouchAsync(int attemptId, string studentId, int examId, string? client = null, CancellationToken ct = default);
    Task RemoveAsync(int attemptId, int examId, CancellationToken ct = default);
    Task<IReadOnlyList<int>> GetOnlineAttemptIdsByExamAsync(int examId, CancellationToken ct = default);
}
