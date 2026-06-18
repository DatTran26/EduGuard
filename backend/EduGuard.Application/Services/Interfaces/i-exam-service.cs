using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamService
{
    Task<ExamDto> CreateAsync(int classroomId, CreateExamRequest request, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetByClassroomAsync(int classroomId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamDto> GetByIdAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamDto> UpdateAsync(int examId, UpdateExamRequest request, string teacherId, CancellationToken ct = default);
    Task<ExamDto> PatchAsync(int examId, PatchExamRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteAsync(int examId, string teacherId, CancellationToken ct = default);
    Task<ExamDto> PublishAsync(int examId, string teacherId, CancellationToken ct = default);
    Task<QuestionImportResultDto> ImportQuestionsAsync(
        int examId,
        Stream fileStream,
        string fileName,
        string contentType,
        long fileLength,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default);
    Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<QuestionDto> AddQuestionAsync(int examId, CreateQuestionRequest request, string teacherId, CancellationToken ct = default);
    Task<QuestionDto> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request, string teacherId, CancellationToken ct = default);
    Task<QuestionDto> PatchQuestionAsync(int questionId, PatchQuestionRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteQuestionAsync(int questionId, string teacherId, CancellationToken ct = default);
    Task<AnswerDto> AddAnswerAsync(int questionId, CreateAnswerRequest request, string teacherId, CancellationToken ct = default);
    Task<AnswerDto> UpdateAnswerAsync(int answerId, UpdateAnswerRequest request, string teacherId, CancellationToken ct = default);
    Task<AnswerDto> PatchAnswerAsync(int answerId, PatchAnswerRequest request, string teacherId, CancellationToken ct = default);
}
