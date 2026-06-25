using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringEvidenceService
{
    Task<ProctoringEvidenceDto> SaveEvidenceAsync(
        int attemptId,
        string userId,
        IReadOnlyList<string> roles,
        Stream fileStream,
        string fileName,
        string contentType,
        string evidenceType,
        string captureSource,
        string? triggerEventType,
        CancellationToken ct = default);
}
