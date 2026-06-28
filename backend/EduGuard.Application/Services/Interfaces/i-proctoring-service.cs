using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.DTOs.Proctoring;

namespace EduGuard.Application.Services.Interfaces;

public interface IProctoringService
{
    Task<ProctoringRoomDto> GetRoomAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<IReadOnlyList<ProctoringStateSummaryDto>> GetStatesAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ProctoringAttemptDetailDto> GetAttemptDetailAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ProctoringStateDto> GetAttemptStateAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);

    Task<IReadOnlyList<ExamProctorAssignmentDto>> GetProctorsAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<IReadOnlyList<ProctorCandidateDto>> GetProctorCandidatesAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamProctorAssignmentDto> AddProctorAsync(int examId, AddExamProctorRequest request, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task RemoveProctorAsync(int examId, string teacherId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<IReadOnlyList<AssignedProctorExamDto>> GetAssignedExamsAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ProctoringEvidenceListResultDto> GetEvidenceListAsync(
        ProctoringEvidenceListQuery query,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);

    Task<ProctoringAiSettingsDto> GetAiSettingsAsync(CancellationToken ct = default);
    Task<ProctoringAiSettingsDto> UpdateAiSettingsAsync(UpdateProctoringAiSettingsRequest request, CancellationToken ct = default);
}

public interface IExamLobbyService
{
    Task<ExamLobbyStatusDto> GetLobbyStatusAsync(int examId, string? studentId, CancellationToken ct = default);
    Task JoinLobbyAsync(int examId, string studentId, bool cameraReady, CancellationToken ct = default);
    Task LeaveLobbyAsync(int examId, string studentId, CancellationToken ct = default);
    Task HeartbeatLobbyAsync(int examId, string studentId, bool cameraReady, CancellationToken ct = default);
}

public interface IStudentProctoringService
{
    Task StartProctoringAsync(int attemptId, string studentId, CancellationToken ct = default);
    Task<ProctoringStateDto> HeartbeatAsync(int attemptId, string studentId, ProctoringHeartbeatRequest request, CancellationToken ct = default);
    Task StopProctoringAsync(int attemptId, string studentId, CancellationToken ct = default);
}

public interface ILiveProctoringService
{
    Task RequestWatchAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task StopWatchAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default);
}

public interface IProctoringActionService
{
    Task PauseAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default);
    Task ResumeAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string? reason, CancellationToken ct = default);
    Task TerminateAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default);
    Task WarnStudentAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, string reason, CancellationToken ct = default);
}
