using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class ExamMatrixRepository : IExamMatrixRepository
{
    private readonly AppDbContext _db;

    public ExamMatrixRepository(AppDbContext db) => _db = db;

    public Task<List<ExamMatrix>> GetAllAsync(CancellationToken ct = default) =>
        _db.ExamMatrices
            .Include(x => x.Items)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<List<ExamMatrix>> GetByTeacherAsync(string teacherId, CancellationToken ct = default) =>
        _db.ExamMatrices
            .Include(x => x.Items)
            .Where(x => x.TeacherId == teacherId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<ExamMatrix?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.ExamMatrices
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task AddAsync(ExamMatrix matrix, CancellationToken ct = default) =>
        await _db.ExamMatrices.AddAsync(matrix, ct);

    public void Update(ExamMatrix matrix) => _db.ExamMatrices.Update(matrix);

    public void Remove(ExamMatrix matrix) => _db.ExamMatrices.Remove(matrix);

    public void RemoveItems(IEnumerable<ExamMatrixItem> items) => _db.ExamMatrixItems.RemoveRange(items);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
