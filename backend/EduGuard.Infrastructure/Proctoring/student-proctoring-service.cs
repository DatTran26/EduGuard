using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Proctoring;

public class StudentProctoringService : IStudentProctoringService
{
    private readonly AppDbContext _db;
    private readonly IProctoringPolicyService _proctoringPolicyService;
    private readonly IProctoringRepository _proctoringRepository;

    public StudentProctoringService(
        AppDbContext db,
        IProctoringPolicyService proctoringPolicyService,
        IProctoringRepository proctoringRepository)
    {
        _db = db;
        _proctoringPolicyService = proctoringPolicyService;
        _proctoringRepository = proctoringRepository;
    }

    public async Task StartProctoringAsync(int attemptId, string studentId, CancellationToken ct = default)
    {
        var attempt = await GetOwnedAttemptAsync(attemptId, studentId, ct);
        EnsureProctoringEnabled(attempt.Exam);

        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct) ?? new ProctoringState
        {
            ExamAttemptId = attemptId,
            CameraStatus = "On",
            LiveStatus = "Inactive",
            ConnectionStatus = "Online",
            EnvironmentStatus = attempt.Status == ExamAttemptStatus.PausedByProctor ? "PausedByTeacher" : "Normal",
            SuspicionScore = attempt.SuspicionScore,
            RiskLevel = ProctoringRiskHelper.GetRiskLevel(attempt.SuspicionScore),
            LastHeartbeatAt = DateTime.UtcNow
        };

        state.CameraStatus = "On";
        state.ConnectionStatus = "Online";
        state.LastHeartbeatAt = DateTime.UtcNow;
        await _proctoringRepository.UpsertStateAsync(state, ct);
    }

    public async Task<ProctoringStateDto> HeartbeatAsync(int attemptId, string studentId, ProctoringHeartbeatRequest request, CancellationToken ct = default)
    {
        var attempt = await GetOwnedAttemptAsync(attemptId, studentId, ct);
        EnsureProctoringEnabled(attempt.Exam);

        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct) ?? new ProctoringState
        {
            ExamAttemptId = attemptId
        };

        state.CameraStatus = string.IsNullOrWhiteSpace(request.CameraStatus) ? "On" : request.CameraStatus.Trim();
        state.FullscreenStatus = string.IsNullOrWhiteSpace(request.FullscreenStatus) ? state.FullscreenStatus : request.FullscreenStatus.Trim();
        state.ConnectionStatus = string.IsNullOrWhiteSpace(request.ConnectionStatus) ? "Online" : request.ConnectionStatus.Trim();
        state.EnvironmentStatus = attempt.Status == ExamAttemptStatus.PausedByProctor ? "PausedByTeacher" : "Normal";

        state = await _proctoringPolicyService.ApplyHeartbeatPolicyAsync(attempt, state, request, ct);
        attempt.SuspicionScore = state.SuspicionScore;
        await _db.SaveChangesAsync(ct);

        var saved = await _proctoringRepository.UpsertStateAsync(state, ct);
        var requiresAutoSnapshot = await ShouldRequestAutoSnapshotAsync(attempt.Exam, saved, ct);

        return new ProctoringStateDto
        {
            CameraStatus = saved.CameraStatus,
            LiveStatus = saved.LiveStatus,
            FullscreenStatus = saved.FullscreenStatus,
            ConnectionStatus = saved.ConnectionStatus,
            EnvironmentStatus = saved.EnvironmentStatus,
            LatestDetectionType = saved.LatestDetectionType,
            WarningCount = saved.WarningCount,
            EvidenceCount = saved.EvidenceCount,
            SuspicionScore = saved.SuspicionScore,
            RiskLevel = saved.RiskLevel,
            RequiresAutoSnapshot = requiresAutoSnapshot,
            LastHeartbeatAt = saved.LastHeartbeatAt,
            LatestWarningAt = saved.LatestWarningAt
        };
    }

    private async Task<bool> ShouldRequestAutoSnapshotAsync(Exam exam, ProctoringState state, CancellationToken ct)
    {
        var setting = exam.Setting;
        if (setting?.CaptureSnapshotOnViolation != true)
            return false;

        if (state.EvidenceCount >= setting.MaxSnapshotsPerAttempt)
            return false;

        if (state.RiskLevel is not ("Warning" or "Critical"))
            return false;

        var evidence = await _proctoringRepository.GetEvidenceByAttemptIdAsync(state.ExamAttemptId, ct);
        var latest = evidence.OrderByDescending(x => x.CapturedAt).FirstOrDefault();
        if (latest is not null &&
            (DateTime.UtcNow - latest.CapturedAt).TotalSeconds < setting.SnapshotCooldownSeconds)
        {
            return false;
        }

        return true;
    }

    public async Task StopProctoringAsync(int attemptId, string studentId, CancellationToken ct = default)
    {
        var attempt = await GetOwnedAttemptAsync(attemptId, studentId, ct);
        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
        if (state is null)
            return;

        state.LiveStatus = "Inactive";
        state.ConnectionStatus = "Offline";
        state.LastHeartbeatAt = DateTime.UtcNow;
        await _proctoringRepository.UpsertStateAsync(state, ct);
    }

    private async Task<ExamAttempt> GetOwnedAttemptAsync(int attemptId, string studentId, CancellationToken ct)
    {
        var attempt = await _db.ExamAttempts
            .Include(x => x.Exam)
                .ThenInclude(e => e.Setting)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        if (attempt.StudentId != studentId)
            throw new UnauthorizedAccessException("Bạn không có quyền thao tác lượt làm bài này.");

        return attempt;
    }

    private static void EnsureProctoringEnabled(Exam exam)
    {
        if (exam.Setting?.EnableLiveProctoring != true && exam.Setting?.RequireCamera != true)
            throw new InvalidOperationException("Đề thi này không bật giám sát camera.");
    }
}
