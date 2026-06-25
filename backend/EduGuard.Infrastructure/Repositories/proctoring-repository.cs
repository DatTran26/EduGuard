using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class ProctoringRepository : IProctoringRepository
{
    private readonly AppDbContext _db;

    public ProctoringRepository(AppDbContext db) => _db = db;

    public Task<bool> IsAssignedProctorAsync(int examId, string teacherId, CancellationToken ct = default) =>
        _db.ExamProctorAssignments.AnyAsync(x => x.ExamId == examId && x.TeacherId == teacherId, ct);

    public Task<List<ExamProctorAssignment>> GetProctorAssignmentsAsync(int examId, CancellationToken ct = default) =>
        _db.ExamProctorAssignments
            .Where(x => x.ExamId == examId)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<ExamProctorAssignment?> GetProctorAssignmentAsync(int examId, string teacherId, CancellationToken ct = default) =>
        _db.ExamProctorAssignments.FirstOrDefaultAsync(x => x.ExamId == examId && x.TeacherId == teacherId, ct);

    public async Task AddProctorAssignmentAsync(ExamProctorAssignment assignment, CancellationToken ct = default)
    {
        _db.ExamProctorAssignments.Add(assignment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task RemoveProctorAssignmentAsync(ExamProctorAssignment assignment, CancellationToken ct = default)
    {
        _db.ExamProctorAssignments.Remove(assignment);
        await _db.SaveChangesAsync(ct);
    }

    public Task<ProctoringState?> GetStateByAttemptIdAsync(int attemptId, CancellationToken ct = default) =>
        _db.ProctoringStates.FirstOrDefaultAsync(x => x.ExamAttemptId == attemptId, ct);

    public Task<List<ProctoringState>> GetStatesByExamIdAsync(int examId, CancellationToken ct = default) =>
        _db.ProctoringStates
            .Include(x => x.ExamAttempt)
                .ThenInclude(a => a.Student)
            .Where(x => x.ExamAttempt.ExamId == examId)
            .ToListAsync(ct);

    public async Task<ProctoringState> UpsertStateAsync(ProctoringState state, CancellationToken ct = default)
    {
        var existing = await _db.ProctoringStates.FirstOrDefaultAsync(x => x.ExamAttemptId == state.ExamAttemptId, ct);
        if (existing is null)
        {
            _db.ProctoringStates.Add(state);
            await _db.SaveChangesAsync(ct);
            return state;
        }

        existing.CameraStatus = state.CameraStatus;
        existing.LiveStatus = state.LiveStatus;
        existing.FullscreenStatus = state.FullscreenStatus;
        existing.ConnectionStatus = state.ConnectionStatus;
        existing.EnvironmentStatus = state.EnvironmentStatus;
        existing.LatestDetectionType = state.LatestDetectionType;
        existing.WarningCount = state.WarningCount;
        existing.EvidenceCount = state.EvidenceCount;
        existing.SuspicionScore = state.SuspicionScore;
        existing.RiskLevel = state.RiskLevel;
        existing.LastHeartbeatAt = state.LastHeartbeatAt;
        existing.LatestWarningAt = state.LatestWarningAt;
        await _db.SaveChangesAsync(ct);
        return existing;
    }

    public Task<LiveProctoringSession?> GetActiveWatchSessionAsync(int attemptId, CancellationToken ct = default) =>
        _db.LiveProctoringSessions
            .Where(x => x.ExamAttemptId == attemptId && x.Status == "Connected")
            .OrderByDescending(x => x.RequestedAt)
            .FirstOrDefaultAsync(ct);

    public Task<LiveProctoringSession?> GetActiveWatchSessionByTeacherAsync(int attemptId, string teacherId, CancellationToken ct = default) =>
        _db.LiveProctoringSessions
            .Where(x => x.ExamAttemptId == attemptId && x.TeacherId == teacherId && (x.Status == "Requested" || x.Status == "Connecting" || x.Status == "Connected"))
            .OrderByDescending(x => x.RequestedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddLiveSessionAsync(LiveProctoringSession session, CancellationToken ct = default)
    {
        _db.LiveProctoringSessions.Add(session);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateLiveSessionAsync(LiveProctoringSession session, CancellationToken ct = default)
    {
        _db.LiveProctoringSessions.Update(session);
        await _db.SaveChangesAsync(ct);
    }

    public Task<List<ProctorAction>> GetActionsByAttemptIdAsync(int attemptId, int take, CancellationToken ct = default) =>
        _db.ProctorActions
            .Where(x => x.ExamAttemptId == attemptId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .ToListAsync(ct);

    public async Task AddActionAsync(ProctorAction action, CancellationToken ct = default)
    {
        _db.ProctorActions.Add(action);
        await _db.SaveChangesAsync(ct);
    }

    public Task<List<ProctoringEvidence>> GetEvidenceByAttemptIdAsync(int attemptId, CancellationToken ct = default) =>
        _db.ProctoringEvidences
            .Where(x => x.ExamAttemptId == attemptId)
            .OrderByDescending(x => x.CapturedAt)
            .ToListAsync(ct);

    public async Task AddEvidenceAsync(ProctoringEvidence evidence, CancellationToken ct = default)
    {
        _db.ProctoringEvidences.Add(evidence);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ProctoringAiSettings> GetAiSettingsAsync(CancellationToken ct = default)
    {
        var settings = await _db.ProctoringAiSettings.FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (settings is not null)
            return settings;

        settings = new ProctoringAiSettings();
        _db.ProctoringAiSettings.Add(settings);
        await _db.SaveChangesAsync(ct);
        return settings;
    }

    public async Task UpdateAiSettingsAsync(ProctoringAiSettings settings, CancellationToken ct = default)
    {
        settings.UpdatedAt = DateTime.UtcNow;
        _db.ProctoringAiSettings.Update(settings);
        await _db.SaveChangesAsync(ct);
    }
}
