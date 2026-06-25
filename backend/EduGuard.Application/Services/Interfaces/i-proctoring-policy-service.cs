using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Domain.Entities;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringPolicyService
{
    Task<ProctoringState> ApplyHeartbeatPolicyAsync(
        ExamAttempt attempt,
        ProctoringState state,
        ProctoringHeartbeatRequest request,
        CancellationToken ct = default);
}
