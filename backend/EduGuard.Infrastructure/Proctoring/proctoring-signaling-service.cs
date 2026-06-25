using EduGuard.Application.Services.Interfaces;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringSignalingService : IProctoringSignalingService
{
    private readonly AppDbContext _db;
    private readonly IExamMonitoringService _examMonitoringService;

    public ProctoringSignalingService(AppDbContext db, IExamMonitoringService examMonitoringService)
    {
        _db = db;
        _examMonitoringService = examMonitoringService;
    }

    public async Task EnsureStudentCanJoinAttemptStreamAsync(int attemptId, string studentId, CancellationToken ct = default)
    {
        var attempt = await _db.ExamAttempts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        if (attempt.StudentId != studentId)
            throw new UnauthorizedAccessException("Bạn không có quyền publish stream cho lượt làm này.");
    }

    public async Task EnsureTeacherCanWatchAttemptAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var examId = await GetExamIdByAttemptAsync(attemptId, ct);
        await _examMonitoringService.EnsureCanMonitorExamAsync(examId, teacherId, roles, ct);
    }

    public async Task<int> GetExamIdByAttemptAsync(int attemptId, CancellationToken ct = default)
    {
        var examId = await _db.ExamAttempts.AsNoTracking()
            .Where(x => x.Id == attemptId)
            .Select(x => x.ExamId)
            .FirstOrDefaultAsync(ct);

        if (examId <= 0)
            throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        return examId;
    }
}
