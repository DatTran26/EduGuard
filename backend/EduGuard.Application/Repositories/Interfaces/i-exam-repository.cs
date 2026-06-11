using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Exam?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default);
    Task<List<Exam>> GetByClassroomIdAsync(int classroomId, CancellationToken ct = default);
    Task<Question?> GetQuestionByIdAsync(int questionId, CancellationToken ct = default);
    Task<Answer?> GetAnswerByIdAsync(int answerId, CancellationToken ct = default);
    Task<ExamAttempt?> GetAttemptByIdAsync(int attemptId, CancellationToken ct = default);
    Task<ExamAttempt?> GetAttemptWithAnswersAsync(int attemptId, CancellationToken ct = default);
    Task<int> CountAttemptsAsync(int examId, int studentId, CancellationToken ct = default);
    Task<ExamAttempt?> GetInProgressAttemptAsync(int examId, int studentId, CancellationToken ct = default);
    Task<List<ExamAttempt>> GetAttemptsByExamIdAsync(int examId, CancellationToken ct = default);
    Task AddAsync(Exam exam, CancellationToken ct = default);
    Task AddQuestionAsync(Question question, CancellationToken ct = default);
    Task AddAnswerAsync(Answer answer, CancellationToken ct = default);
    Task AddAttemptAsync(ExamAttempt attempt, CancellationToken ct = default);
    Task AddStudentAnswersAsync(IEnumerable<StudentAnswer> answers, CancellationToken ct = default);
    void Update(Exam exam);
    void Remove(Exam exam);
    void UpdateQuestion(Question question);
    void RemoveQuestion(Question question);
    void RemoveAnswers(IEnumerable<Answer> answers);
    void UpdateAnswer(Answer answer);
    void RemoveAnswer(Answer answer);
    void UpdateAttempt(ExamAttempt attempt);
    void RemoveStudentAnswers(IEnumerable<StudentAnswer> answers);
    Task SaveChangesAsync(CancellationToken ct = default);
}
