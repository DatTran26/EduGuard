using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Options;
using EduGuard.Application.Redis;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Infrastructure.Exams;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Proctoring;

internal sealed class ExamLobbyCache
{
    public Dictionary<string, ExamLobbyStudentEntry> Students { get; set; } = new(StringComparer.Ordinal);
}

internal sealed class ExamLobbyStudentEntry
{
    public bool CameraReady { get; set; }
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
}

public class ExamLobbyService : IExamLobbyService
{
    private static readonly TimeSpan LobbyTtl = TimeSpan.FromHours(6);

    private readonly IExamRepository _examRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly ICacheService _cacheService;
    private readonly RedisOptions _redisOptions;

    public ExamLobbyService(
        IExamRepository examRepository,
        IClassroomRepository classroomRepository,
        ICacheService cacheService,
        IOptions<RedisOptions> redisOptions)
    {
        _examRepository = examRepository;
        _classroomRepository = classroomRepository;
        _cacheService = cacheService;
        _redisOptions = redisOptions.Value;
    }

    public async Task<ExamLobbyStatusDto> GetLobbyStatusAsync(int examId, string? studentId, CancellationToken ct = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        var now = DateTime.UtcNow;
        var isOpen = IsExamOpen(exam.StartTime, exam.EndTime, now);
        var secondsUntilOpen = 0;
        if (!isOpen && exam.StartTime.HasValue && exam.StartTime.Value > now)
            secondsUntilOpen = Math.Max(0, (int)Math.Ceiling((exam.StartTime.Value - now).TotalSeconds));

        var cache = await GetLobbyCacheAsync(examId, ct);
        PruneStaleStudents(cache);

        return new ExamLobbyStatusDto
        {
            ExamId = exam.Id,
            ExamTitle = exam.Title,
            StartTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.StartTime),
            EndTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.EndTime),
            IsOpen = isOpen,
            RequireCamera = ProctoringSettingsHelper.IsCameraMonitoringEnabled(exam.Setting),
            RequireFullscreen = exam.Setting?.RequireFullscreen ?? false,
            SecondsUntilOpen = secondsUntilOpen,
            WaitingStudentCount = cache.Students.Count
        };
    }

    public async Task JoinLobbyAsync(int examId, string studentId, bool cameraReady, CancellationToken ct = default)
    {
        await EnsureStudentInExamClassroomAsync(examId, studentId, ct);
        var cache = await GetLobbyCacheAsync(examId, ct);
        cache.Students[studentId] = new ExamLobbyStudentEntry
        {
            CameraReady = cameraReady,
            LastSeenAt = DateTime.UtcNow
        };
        await SaveLobbyCacheAsync(examId, cache, ct);
    }

    public async Task LeaveLobbyAsync(int examId, string studentId, CancellationToken ct = default)
    {
        var cache = await GetLobbyCacheAsync(examId, ct);
        cache.Students.Remove(studentId);
        await SaveLobbyCacheAsync(examId, cache, ct);
    }

    public async Task HeartbeatLobbyAsync(int examId, string studentId, bool cameraReady, CancellationToken ct = default)
    {
        await EnsureStudentInExamClassroomAsync(examId, studentId, ct);
        var cache = await GetLobbyCacheAsync(examId, ct);
        cache.Students[studentId] = new ExamLobbyStudentEntry
        {
            CameraReady = cameraReady,
            LastSeenAt = DateTime.UtcNow
        };
        await SaveLobbyCacheAsync(examId, cache, ct);
    }

    private async Task EnsureStudentInExamClassroomAsync(int examId, string studentId, CancellationToken ct)
    {
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (!exam.IsPublished)
            throw new InvalidOperationException("Đề thi chưa được công bố.");

        var membership = await _classroomRepository.GetMemberAsync(exam.ClassroomId, studentId, ct);
        if (membership is null)
            throw new UnauthorizedAccessException("Bạn không thuộc lớp của đề thi này.");
    }

    private static bool IsExamOpen(DateTime? startTime, DateTime? endTime, DateTime nowUtc)
    {
        if (startTime.HasValue && startTime.Value > nowUtc)
            return false;

        if (endTime.HasValue && endTime.Value <= nowUtc)
            return false;

        return true;
    }

    private string GetLobbyCacheKey(int examId) =>
        RedisKeyNames.ExamLobbyIndex(_redisOptions.InstanceName, examId);

    private async Task<ExamLobbyCache> GetLobbyCacheAsync(int examId, CancellationToken ct) =>
        await _cacheService.GetAsync<ExamLobbyCache>(GetLobbyCacheKey(examId), ct) ?? new ExamLobbyCache();

    private Task SaveLobbyCacheAsync(int examId, ExamLobbyCache cache, CancellationToken ct) =>
        _cacheService.SetAsync(GetLobbyCacheKey(examId), cache, LobbyTtl, ct);

    private static void PruneStaleStudents(ExamLobbyCache cache)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-2);
        foreach (var key in cache.Students.Keys.ToList())
        {
            if (cache.Students[key].LastSeenAt < cutoff)
                cache.Students.Remove(key);
        }
    }
}
