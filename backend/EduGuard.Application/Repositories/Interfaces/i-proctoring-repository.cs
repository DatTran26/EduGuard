using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IProctoringRepository
{
    Task<bool> IsAssignedProctorAsync(int examId, string teacherId, CancellationToken ct = default);
    Task<List<ExamProctorAssignment>> GetProctorAssignmentsAsync(int examId, CancellationToken ct = default);
    Task<ExamProctorAssignment?> GetProctorAssignmentAsync(int examId, string teacherId, CancellationToken ct = default);
    Task AddProctorAssignmentAsync(ExamProctorAssignment assignment, CancellationToken ct = default);
    Task RemoveProctorAssignmentAsync(ExamProctorAssignment assignment, CancellationToken ct = default);

    Task<ProctoringState?> GetStateByAttemptIdAsync(int attemptId, CancellationToken ct = default);
    Task<List<ProctoringState>> GetStatesByExamIdAsync(int examId, CancellationToken ct = default);
    Task<ProctoringState> UpsertStateAsync(ProctoringState state, CancellationToken ct = default);

    Task<LiveProctoringSession?> GetActiveWatchSessionAsync(int attemptId, CancellationToken ct = default);
    Task<LiveProctoringSession?> GetActiveWatchSessionByTeacherAsync(int attemptId, string teacherId, CancellationToken ct = default);
    Task AddLiveSessionAsync(LiveProctoringSession session, CancellationToken ct = default);
    Task UpdateLiveSessionAsync(LiveProctoringSession session, CancellationToken ct = default);

    Task<List<ProctorAction>> GetActionsByAttemptIdAsync(int attemptId, int take, CancellationToken ct = default);
    Task AddActionAsync(ProctorAction action, CancellationToken ct = default);

    Task<List<ProctoringEvidence>> GetEvidenceByAttemptIdAsync(int attemptId, CancellationToken ct = default);
    Task AddEvidenceAsync(ProctoringEvidence evidence, CancellationToken ct = default);

    Task<ProctoringAiSettings> GetAiSettingsAsync(CancellationToken ct = default);
    Task UpdateAiSettingsAsync(ProctoringAiSettings settings, CancellationToken ct = default);
}
