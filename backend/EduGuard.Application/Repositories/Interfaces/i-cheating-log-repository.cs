using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface ICheatingLogRepository
{
    Task<CheatingLog?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<CheatingLog>> GetByAttemptIdAsync(int attemptId, CancellationToken ct = default);
    Task<int> CountByAttemptIdAsync(int attemptId, CancellationToken ct = default);
    Task<List<CheatingLog>> GetByExamIdAsync(int examId, CancellationToken ct = default);
    Task AddAsync(CheatingLog log, CancellationToken ct = default);
    void UpdateAttempt(ExamAttempt attempt);
    Task SaveChangesAsync(CancellationToken ct = default);
}
