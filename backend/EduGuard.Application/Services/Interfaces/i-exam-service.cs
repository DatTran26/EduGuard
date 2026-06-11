using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamService
{
    Task<ExamDto> CreateAsync(int classroomId, CreateExamRequest request, int teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<ExamDto>> GetByClassroomAsync(int classroomId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamDto> GetByIdAsync(int examId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamDto> UpdateAsync(int examId, UpdateExamRequest request, int teacherId, CancellationToken ct = default);
    Task<ExamDto> PatchAsync(int examId, PatchExamRequest request, int teacherId, CancellationToken ct = default);
    Task DeleteAsync(int examId, int teacherId, CancellationToken ct = default);
    Task<ExamDto> PublishAsync(int examId, int teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(int examId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<QuestionDto> AddQuestionAsync(int examId, CreateQuestionRequest request, int teacherId, CancellationToken ct = default);
    Task<QuestionDto> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request, int teacherId, CancellationToken ct = default);
    Task<QuestionDto> PatchQuestionAsync(int questionId, PatchQuestionRequest request, int teacherId, CancellationToken ct = default);
    Task DeleteQuestionAsync(int questionId, int teacherId, CancellationToken ct = default);
    Task<AnswerDto> AddAnswerAsync(int questionId, CreateAnswerRequest request, int teacherId, CancellationToken ct = default);
    Task<AnswerDto> UpdateAnswerAsync(int answerId, UpdateAnswerRequest request, int teacherId, CancellationToken ct = default);
    Task<AnswerDto> PatchAnswerAsync(int answerId, PatchAnswerRequest request, int teacherId, CancellationToken ct = default);
}
