using EduGuard.Application.DTOs.AntiCheat;

namespace EduGuard.Application.Services.Interfaces;

public interface IAntiCheatService
{
    Task<CheatingLogDto> LogAsync(CreateCheatingLogRequest request, int studentId, CancellationToken ct = default);
    Task<IReadOnlyList<CheatingLogDto>> GetLogsByAttemptAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<SuspicionScoreDto> GetSuspicionScoreAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamAntiCheatSummaryDto> GetExamSummaryAsync(int examId, int teacherId, CancellationToken ct = default);
}
