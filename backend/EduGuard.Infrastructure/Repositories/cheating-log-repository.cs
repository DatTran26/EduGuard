using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class CheatingLogRepository : ICheatingLogRepository
{
    private readonly AppDbContext _db;

    public CheatingLogRepository(AppDbContext db) => _db = db;

    public Task<CheatingLog?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.CheatingLogs.FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<List<CheatingLog>> GetByAttemptIdAsync(int attemptId, CancellationToken ct = default) =>
        _db.CheatingLogs
            .Where(x => x.ExamAttemptId == attemptId)
            .OrderByDescending(x => x.OccurredAt)
            .ToListAsync(ct);

    public Task<int> CountByAttemptIdAsync(int attemptId, CancellationToken ct = default) =>
        _db.CheatingLogs.CountAsync(x => x.ExamAttemptId == attemptId, ct);

    public Task<List<CheatingLog>> GetByExamIdAsync(int examId, CancellationToken ct = default) =>
        _db.CheatingLogs
            .Include(x => x.ExamAttempt)
            .Where(x => x.ExamAttempt.ExamId == examId)
            .OrderByDescending(x => x.OccurredAt)
            .ToListAsync(ct);

    public async Task AddAsync(CheatingLog log, CancellationToken ct = default) =>
        await _db.CheatingLogs.AddAsync(log, ct);

    public void UpdateAttempt(ExamAttempt attempt) => _db.ExamAttempts.Update(attempt);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
