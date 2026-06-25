using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringSignalingService
{
    Task EnsureStudentCanJoinAttemptStreamAsync(int attemptId, string studentId, CancellationToken ct = default);
    Task EnsureTeacherCanWatchAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<int> GetExamIdByAttemptAsync(int attemptId, CancellationToken ct = default);
}

public interface IWebRtcConfigService
{
    IReadOnlyList<object> GetIceServers();
}
