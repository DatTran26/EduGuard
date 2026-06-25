using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringDetectionService
{
    Task<ProctoringDetectionResultDto> DetectAsync(
        int attemptId,
        string userId,
        IReadOnlyList<string> roles,
        Stream fileStream,
        string fileName,
        string contentType,
        CancellationToken ct = default);
}
