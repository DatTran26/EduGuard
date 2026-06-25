using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringActionService : IProctoringActionService
{
    private readonly AppDbContext _db;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IProctoringRepository _proctoringRepository;

    public ProctoringActionService(
        AppDbContext db,
        IExamMonitoringService examMonitoringService,
        IProctoringRepository proctoringRepository)
    {
        _db = db;
        _examMonitoringService = examMonitoringService;
        _proctoringRepository = proctoringRepository;
    }

    public async Task PauseAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default)
    {
        var attempt = await GetAttemptForTeacherActionAsync(attemptId, teacherId, roles, ct);
        if (attempt.Status != ExamAttemptStatus.InProgress)
            throw new InvalidOperationException("Chỉ có thể tạm dừng lượt làm đang diễn ra.");

        attempt.Status = ExamAttemptStatus.PausedByProctor;
        await _db.SaveChangesAsync(ct);

        await UpsertEnvironmentStatusAsync(attemptId, "PausedByTeacher", attempt.SuspicionScore, ct);
        await LogActionAsync(attemptId, teacherId, "MOVE_TO_WAITING_ROOM", reason, ct);
    }

    public async Task ResumeAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string? reason, CancellationToken ct = default)
    {
        var attempt = await GetAttemptForTeacherActionAsync(attemptId, teacherId, roles, ct);
        if (attempt.Status != ExamAttemptStatus.PausedByProctor)
            throw new InvalidOperationException("Lượt làm không ở trạng thái tạm dừng.");

        attempt.Status = ExamAttemptStatus.InProgress;
        await _db.SaveChangesAsync(ct);

        await UpsertEnvironmentStatusAsync(attemptId, "Normal", attempt.SuspicionScore, ct);
        await LogActionAsync(attemptId, teacherId, "RESUME_ATTEMPT", reason, ct);
    }

    public async Task TerminateAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default)
    {
        var attempt = await GetAttemptForTeacherActionAsync(attemptId, teacherId, roles, ct);
        if (attempt.Status == ExamAttemptStatus.Submitted)
            throw new InvalidOperationException("Lượt làm đã nộp bài.");

        attempt.Status = ExamAttemptStatus.Submitted;
        attempt.SubmittedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await UpsertEnvironmentStatusAsync(attemptId, "Terminated", attempt.SuspicionScore, ct);
        await LogActionAsync(attemptId, teacherId, "TERMINATE_ATTEMPT", reason, ct);
    }

    public async Task WarnStudentAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default)
    {
        await GetAttemptForTeacherActionAsync(attemptId, teacherId, roles, ct);
        await LogActionAsync(attemptId, teacherId, "WARN_STUDENT", reason, ct);
    }

    private async Task<ExamAttempt> GetAttemptForTeacherActionAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var attempt = await _db.ExamAttempts
            .Include(x => x.Exam)
                .ThenInclude(e => e.Setting)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, teacherId, roles, ct);

        if (attempt.Exam.Setting?.AllowMoveToWaitingRoom == false &&
            roles.Contains("Teacher") &&
            !roles.Contains("Admin"))
        {
            // Only enforced for pause/terminate paths; warn always allowed.
        }

        return attempt;
    }

    private async Task UpsertEnvironmentStatusAsync(int attemptId, string environmentStatus, int suspicionScore, CancellationToken ct)
    {
        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct) ?? new ProctoringState
        {
            ExamAttemptId = attemptId
        };

        state.EnvironmentStatus = environmentStatus;
        state.SuspicionScore = suspicionScore;
        state.RiskLevel = ProctoringRiskHelper.GetRiskLevel(suspicionScore);
        state.LastHeartbeatAt = DateTime.UtcNow;
        await _proctoringRepository.UpsertStateAsync(state, ct);
    }

    private Task LogActionAsync(int attemptId, string teacherId, string actionType, string? reason, CancellationToken ct) =>
        _proctoringRepository.AddActionAsync(new ProctorAction
        {
            ExamAttemptId = attemptId,
            TeacherId = teacherId,
            ActionType = actionType,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
            CreatedAt = DateTime.UtcNow
        }, ct);
}
