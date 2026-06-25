using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringPolicyService : IProctoringPolicyService
{
    public Task<ProctoringState> ApplyHeartbeatPolicyAsync(
        ExamAttempt attempt,
        ProctoringState state,
        ProctoringHeartbeatRequest request,
        CancellationToken ct = default)
    {
        var score = attempt.SuspicionScore;

        if (string.Equals(request.CameraStatus, "Off", StringComparison.OrdinalIgnoreCase))
        {
            score += 15;
            state.LatestDetectionType = "CameraOff";
        }

        if (string.Equals(request.FullscreenStatus, "Exited", StringComparison.OrdinalIgnoreCase))
        {
            score += 10;
            state.LatestDetectionType = "FullscreenExit";
        }

        if (string.Equals(request.ConnectionStatus, "Unstable", StringComparison.OrdinalIgnoreCase))
        {
            score += 5;
        }

        if (attempt.Status == ExamAttemptStatus.PausedByProctor)
        {
            state.EnvironmentStatus = "PausedByTeacher";
        }

        state.SuspicionScore = Math.Min(score, 100);
        state.RiskLevel = ProctoringRiskHelper.GetRiskLevel(state.SuspicionScore);
        state.LastHeartbeatAt = DateTime.UtcNow;

        return Task.FromResult(state);
    }
}
