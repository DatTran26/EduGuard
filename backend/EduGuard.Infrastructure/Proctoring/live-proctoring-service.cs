using EduGuard.Application.Options;
using EduGuard.Application.Redis;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Proctoring;

internal sealed class ProctoringWatchLockValue
{
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public DateTime LockedAt { get; set; } = DateTime.UtcNow;
}

public class LiveProctoringService : ILiveProctoringService
{
    private static readonly TimeSpan WatchLockTtl = TimeSpan.FromMinutes(30);
    private static readonly string[] ActiveStatuses = ["Requested", "Connecting", "Connected"];

    private readonly AppDbContext _db;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IProctoringRepository _proctoringRepository;
    private readonly ICacheService _cacheService;
    private readonly RedisOptions _redisOptions;

    public LiveProctoringService(
        AppDbContext db,
        IExamMonitoringService examMonitoringService,
        IProctoringRepository proctoringRepository,
        ICacheService cacheService,
        IOptions<RedisOptions> redisOptions)
    {
        _db = db;
        _examMonitoringService = examMonitoringService;
        _proctoringRepository = proctoringRepository;
        _cacheService = cacheService;
        _redisOptions = redisOptions.Value;
    }

    public async Task RequestWatchAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await _db.ExamAttempts
            .Include(x => x.Exam)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, teacherId, roles, ct);

        var lockKey = RedisKeyNames.ProctoringWatchLock(_redisOptions.InstanceName, attemptId);
        var existingLock = await _cacheService.GetAsync<ProctoringWatchLockValue>(lockKey, ct);
        if (existingLock is not null && existingLock.TeacherId != teacherId)
            throw new InvalidOperationException("Sinh viên này đang được giáo viên khác theo dõi live.");

        var activeSession = await _proctoringRepository.GetActiveWatchSessionAsync(attemptId, ct);
        if (activeSession is not null && activeSession.TeacherId != teacherId)
            throw new InvalidOperationException("Sinh viên này đang được giáo viên khác theo dõi live.");

        var teacher = await _db.Users.FirstOrDefaultAsync(x => x.Id == teacherId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy giáo viên.");

        var session = await _proctoringRepository.GetActiveWatchSessionByTeacherAsync(attemptId, teacherId, ct);
        if (session is null)
        {
            session = new LiveProctoringSession
            {
                ExamId = attempt.ExamId,
                ExamAttemptId = attemptId,
                TeacherId = teacherId,
                StudentId = attempt.StudentId,
                Status = "Requested",
                RequestedAt = DateTime.UtcNow
            };
            await _proctoringRepository.AddLiveSessionAsync(session, ct);
        }

        await _cacheService.SetAsync(lockKey, new ProctoringWatchLockValue
        {
            TeacherId = teacherId,
            TeacherName = teacher.FullName,
            LockedAt = DateTime.UtcNow
        }, WatchLockTtl, ct);

        await _proctoringRepository.AddActionAsync(new ProctorAction
        {
            ExamAttemptId = attemptId,
            TeacherId = teacherId,
            ActionType = "START_LIVE_WATCH",
            CreatedAt = DateTime.UtcNow
        }, ct);
    }

    public async Task StopWatchAsync(int attemptId, string teacherId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await _db.ExamAttempts.FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, teacherId, roles, ct);

        var session = await _proctoringRepository.GetActiveWatchSessionByTeacherAsync(attemptId, teacherId, ct);
        if (session is not null)
        {
            session.Status = "Ended";
            session.EndedAt = DateTime.UtcNow;
            session.EndReason = "TeacherStoppedWatch";
            await _proctoringRepository.UpdateLiveSessionAsync(session, ct);
        }

        var lockKey = RedisKeyNames.ProctoringWatchLock(_redisOptions.InstanceName, attemptId);
        var existingLock = await _cacheService.GetAsync<ProctoringWatchLockValue>(lockKey, ct);
        if (existingLock?.TeacherId == teacherId)
            await _cacheService.RemoveAsync(lockKey, ct);

        await _proctoringRepository.AddActionAsync(new ProctorAction
        {
            ExamAttemptId = attemptId,
            TeacherId = teacherId,
            ActionType = "STOP_LIVE_WATCH",
            CreatedAt = DateTime.UtcNow
        }, ct);
    }
}
