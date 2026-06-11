using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamAttemptService
{
    Task<StartExamResponse> StartAsync(int examId, int studentId, CancellationToken ct = default);
    Task<ExamAttemptDetailDto> GetAttemptAsync(int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task SaveAnswerAsync(int attemptId, SaveStudentAnswerRequest request, int studentId, CancellationToken ct = default);
    Task<ExamResultDto> SubmitAsync(int attemptId, int studentId, CancellationToken ct = default);
    Task<ExamResultDto> GetResultAsync(int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<IReadOnlyList<ExamAttemptDto>> GetAttemptsByExamAsync(int examId, int teacherId, CancellationToken ct = default);
}
