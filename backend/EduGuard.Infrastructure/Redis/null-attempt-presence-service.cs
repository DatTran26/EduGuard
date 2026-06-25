using EduGuard.Application.Services.Interfaces;

namespace EduGuard.Infrastructure.Redis;

public class NullAttemptPresenceService : IAttemptPresenceService
{
    public Task TouchAsync(int attemptId, string studentId, int examId, string? client = null, CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task RemoveAsync(int attemptId, int examId, CancellationToken ct = default) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<int>> GetOnlineAttemptIdsByExamAsync(int examId, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<int>>([]);
}
