using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class QuestionBankRepository : IQuestionBankRepository
{
    private readonly AppDbContext _db;

    public QuestionBankRepository(AppDbContext db) => _db = db;

    public Task<List<QuestionBank>> GetBanksAsync(string teacherId, bool includeAllTeachers, CancellationToken ct = default)
    {
        var query = _db.QuestionBanks
            .Include(x => x.Questions)
            .AsQueryable();

        if (!includeAllTeachers)
            query = query.Where(x => x.TeacherId == teacherId);

        return query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
    }

    public Task<QuestionBank?> GetBankByIdAsync(int id, bool includeQuestions = false, CancellationToken ct = default)
    {
        var query = _db.QuestionBanks.AsQueryable();

        if (includeQuestions)
        {
            query = query
                .Include(x => x.Questions)
                    .ThenInclude(q => q.Answers);
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public Task<List<BankQuestion>> GetQuestionsAsync(
        int bankId,
        string? keyword,
        DifficultyLevel? difficulty,
        QuestionType? questionType,
        QuestionStatus? status,
        string? chapter,
        CancellationToken ct = default)
    {
        var query = _db.BankQuestions
            .Include(x => x.Answers)
            .Where(x => x.QuestionBankId == bankId);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalizedKeyword = keyword.Trim();
            query = query.Where(x => x.Content.Contains(normalizedKeyword));
        }

        if (difficulty.HasValue)
            query = query.Where(x => x.Difficulty == difficulty.Value);

        if (questionType.HasValue)
            query = query.Where(x => x.QuestionType == questionType.Value);

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(chapter))
        {
            var normalizedChapter = chapter.Trim();
            query = query.Where(x => x.Chapter == normalizedChapter);
        }

        return query
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync(ct);
    }

    public Task<BankQuestion?> GetQuestionByIdAsync(int id, CancellationToken ct = default) =>
        _db.BankQuestions
            .Include(x => x.QuestionBank)
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<List<BankQuestion>> GetQuestionsByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
    {
        var idList = ids.Distinct().ToList();
        return _db.BankQuestions
            .Include(x => x.QuestionBank)
            .Include(x => x.Answers)
            .Where(x => idList.Contains(x.Id))
            .ToListAsync(ct);
    }

    public Task<int> CountExamSnapshotsAsync(int bankQuestionId, CancellationToken ct = default) =>
        _db.Questions.CountAsync(x => x.BankQuestionId == bankQuestionId, ct);

    public async Task AddBankAsync(QuestionBank bank, CancellationToken ct = default) =>
        await _db.QuestionBanks.AddAsync(bank, ct);

    public async Task AddQuestionAsync(BankQuestion question, CancellationToken ct = default) =>
        await _db.BankQuestions.AddAsync(question, ct);

    public async Task AddQuestionsAsync(IEnumerable<BankQuestion> questions, CancellationToken ct = default) =>
        await _db.BankQuestions.AddRangeAsync(questions, ct);

    public void UpdateBank(QuestionBank bank) => _db.QuestionBanks.Update(bank);

    public void RemoveBank(QuestionBank bank) => _db.QuestionBanks.Remove(bank);

    public void UpdateQuestion(BankQuestion question) => _db.BankQuestions.Update(question);

    public void RemoveAnswers(IEnumerable<BankAnswer> answers) => _db.BankAnswers.RemoveRange(answers);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
