using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamAttemptService
{
    Task<StartExamResponse> StartAsync(int examId, string studentId, CancellationToken ct = default);
    Task<ExamAttemptDetailDto> GetAttemptAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task SaveAnswerAsync(int attemptId, SaveStudentAnswerRequest request, string studentId, CancellationToken ct = default);
    Task<ExamResultDto> SubmitAsync(int attemptId, string studentId, CancellationToken ct = default);
    Task<ExamResultDto> GetResultAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<IReadOnlyList<ExamAttemptDto>> GetAttemptsByExamAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);
}
