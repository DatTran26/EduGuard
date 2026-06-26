using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface ILiveKitTokenService
{
    SfuConfigDto GetConfig();
    Task<SfuTokenDto> CreateTeacherTokenAsync(int examId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<SfuTokenDto> CreateStudentTokenAsync(int attemptId, string studentId, CancellationToken ct = default);
}
