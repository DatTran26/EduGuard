using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IExamMatrixRepository
{
    Task<List<ExamMatrix>> GetAllAsync(CancellationToken ct = default);
    Task<List<ExamMatrix>> GetByTeacherAsync(string teacherId, CancellationToken ct = default);
    Task<ExamMatrix?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(ExamMatrix matrix, CancellationToken ct = default);
    void Update(ExamMatrix matrix);
    void Remove(ExamMatrix matrix);
    void RemoveItems(IEnumerable<ExamMatrixItem> items);
    Task SaveChangesAsync(CancellationToken ct = default);
}
