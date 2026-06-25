using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IQuestionBankRepository
{
    Task<List<QuestionBank>> GetBanksAsync(string teacherId, bool includeAllTeachers, CancellationToken ct = default);
    Task<QuestionBank?> GetBankByIdAsync(int id, bool includeQuestions = false, CancellationToken ct = default);
    Task<List<BankQuestion>> GetQuestionsAsync(
        int bankId,
        string? keyword,
        DifficultyLevel? difficulty,
        QuestionType? questionType,
        QuestionStatus? status,
        string? chapter,
        CancellationToken ct = default);
    Task<BankQuestion?> GetQuestionByIdAsync(int id, CancellationToken ct = default);
    Task<List<BankQuestion>> GetQuestionsByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);
    Task<int> CountExamSnapshotsAsync(int bankQuestionId, CancellationToken ct = default);
    Task AddBankAsync(QuestionBank bank, CancellationToken ct = default);
    Task AddQuestionAsync(BankQuestion question, CancellationToken ct = default);
    Task AddQuestionsAsync(IEnumerable<BankQuestion> questions, CancellationToken ct = default);
    void UpdateBank(QuestionBank bank);
    void RemoveBank(QuestionBank bank);
    void UpdateQuestion(BankQuestion question);
    void RemoveAnswers(IEnumerable<BankAnswer> answers);
    Task SaveChangesAsync(CancellationToken ct = default);
}
