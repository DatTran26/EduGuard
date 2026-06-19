using EduGuard.Application.DTOs.AntiCheat;

namespace EduGuard.Application.Services.Interfaces;

public interface IAntiCheatService
{
    Task<CheatingLogDto> LogAsync(CreateCheatingLogRequest request, string studentId, CancellationToken ct = default);
    Task<IReadOnlyList<CheatingLogDto>> GetLogsByAttemptAsync(
        int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<SuspicionScoreDto> GetSuspicionScoreAsync(
        int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamAntiCheatSummaryDto> GetExamSummaryAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);
}
