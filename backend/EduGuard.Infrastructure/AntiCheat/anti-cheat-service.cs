using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.Options;
using EduGuard.Application.Redis;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.AntiCheat;

public class AntiCheatService : IAntiCheatService
{
    private const int FlaggedSuspicionThreshold = 10;

    private readonly ICheatingLogRepository _cheatingLogRepository;
    private readonly IExamMonitoringNotifier _examMonitoringNotifier;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly IExamRepository _examRepository;
    private readonly INotificationService _notificationService;
    private readonly IValidator<CreateCheatingLogRequest> _createLogValidator;
    private readonly ILogger<AntiCheatService> _logger;
    private readonly ICacheService _cacheService;
    private readonly IExamCacheInvalidator _cacheInvalidator;
    private readonly RedisOptions _redisOptions;

    public AntiCheatService(
        ICheatingLogRepository cheatingLogRepository,
        IExamMonitoringNotifier examMonitoringNotifier,
        IExamMonitoringService examMonitoringService,
        IExamRepository examRepository,
        INotificationService notificationService,
        IValidator<CreateCheatingLogRequest> createLogValidator,
        ILogger<AntiCheatService> logger,
        ICacheService cacheService,
        IExamCacheInvalidator cacheInvalidator,
        IOptions<RedisOptions> redisOptions)
    {
        _cheatingLogRepository = cheatingLogRepository;
        _examMonitoringNotifier = examMonitoringNotifier;
        _examMonitoringService = examMonitoringService;
        _examRepository = examRepository;
        _notificationService = notificationService;
        _createLogValidator = createLogValidator;
        _logger = logger;
        _cacheService = cacheService;
        _cacheInvalidator = cacheInvalidator;
        _redisOptions = redisOptions.Value;
    }

    public async Task<CheatingLogDto> LogAsync(
        CreateCheatingLogRequest request, string studentId, CancellationToken ct = default)
    {
        await _createLogValidator.ValidateAndThrowAsync(request, ct);

        var attempt = await _examRepository.GetAttemptWithAnswersAsync(request.ExamAttemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        EnsureStudentCanLog(attempt, studentId);

        var cheatingType = CheatingTypeHelper.ParseType(request.Type);
        var suspicionPoint = CheatingTypeHelper.GetSuspicionPoint(cheatingType);

        var log = new CheatingLog
        {
            ExamAttemptId = attempt.Id,
            Type = cheatingType,
            Description = request.Description.Trim(),
            SuspicionPoint = suspicionPoint,
            Metadata = string.IsNullOrWhiteSpace(request.Metadata) ? null : request.Metadata.Trim(),
            OccurredAt = DateTime.UtcNow
        };

        attempt.SuspicionScore += suspicionPoint;

        await _cheatingLogRepository.AddAsync(log, ct);
        _cheatingLogRepository.UpdateAttempt(attempt);
        await _cheatingLogRepository.SaveChangesAsync(ct);

        var logDto = AntiCheatMapper.MapLog(log);
        var logCount = await _cheatingLogRepository.CountByAttemptIdAsync(attempt.Id, ct);
        await SendAntiCheatWarningAsync(attempt, logDto, logCount, ct);
        await PersistAntiCheatNotificationAsync(attempt, cheatingType, log.Description, attempt.SuspicionScore, ct);
        await _cacheInvalidator.InvalidateExamAntiCheatSummaryAsync(attempt.ExamId, ct);

        return logDto;
    }

    public async Task<IReadOnlyList<CheatingLogDto>> GetLogsByAttemptAsync(
        int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await EnsureTeacherCanViewAttemptAsync(attemptId, userId, roles, ct);

        var logs = await _cheatingLogRepository.GetByAttemptIdAsync(attemptId, ct);
        return logs.Select(AntiCheatMapper.MapLog).ToList();
    }

    public async Task<SuspicionScoreDto> GetSuspicionScoreAsync(
        int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await EnsureTeacherCanViewAttemptAsync(attemptId, userId, roles, ct);
        var logCount = await _cheatingLogRepository.CountByAttemptIdAsync(attemptId, ct);

        return new SuspicionScoreDto
        {
            ExamAttemptId = attempt.Id,
            SuspicionScore = attempt.SuspicionScore,
            LogCount = logCount
        };
    }

    public async Task<ExamAntiCheatSummaryDto> GetExamSummaryAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (!roles.Contains("Admin") && exam.TeacherId != userId)
        {
            if (!roles.Contains("Teacher"))
                throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được xem tổng hợp anti-cheat.");

            await _examMonitoringService.EnsureCanMonitorExamAsync(examId, userId, roles, ct);
        }

        var cacheKey = RedisKeyNames.ExamAntiCheatSummary(_redisOptions.InstanceName, examId);
        var cached = await _cacheService.GetAsync<ExamAntiCheatSummaryDto>(cacheKey, ct);
        if (cached is not null)
            return cached;

        var summary = await BuildExamSummaryAsync(exam, ct);
        await _cacheService.SetAsync(
            cacheKey,
            summary,
            TimeSpan.FromSeconds(_redisOptions.AntiCheatSummarySeconds),
            ct);

        return summary;
    }

    private async Task<ExamAntiCheatSummaryDto> BuildExamSummaryAsync(Exam exam, CancellationToken ct)
    {
        var attempts = await _examRepository.GetAttemptsByExamIdAsync(exam.Id, ct);
        var logs = await _cheatingLogRepository.GetByExamIdAsync(exam.Id, ct);
        var logCountByAttempt = logs
            .GroupBy(x => x.ExamAttemptId)
            .ToDictionary(x => x.Key, x => x.Count());

        var attemptSummaries = attempts
            .Select(attempt => new AttemptSuspicionSummaryDto
            {
                AttemptId = attempt.Id,
                StudentId = attempt.StudentId,
                StudentName = attempt.Student?.FullName ?? string.Empty,
                SuspicionScore = attempt.SuspicionScore,
                LogCount = logCountByAttempt.GetValueOrDefault(attempt.Id),
                Status = attempt.Status.ToString()
            })
            .OrderByDescending(x => x.SuspicionScore)
            .ToList();

        return new ExamAntiCheatSummaryDto
        {
            ExamId = exam.Id,
            ExamTitle = exam.Title,
            TotalAttempts = attempts.Count,
            FlaggedAttempts = attempts.Count(x => x.SuspicionScore >= FlaggedSuspicionThreshold),
            TotalLogs = logs.Count,
            Attempts = attemptSummaries
        };
    }

    private static void EnsureStudentCanLog(ExamAttempt attempt, string studentId)
    {
        if (attempt.StudentId != studentId)
            throw new UnauthorizedAccessException("Bạn không có quyền ghi log cho lượt thi này.");

        if (attempt.Status != ExamAttemptStatus.InProgress)
            throw new InvalidOperationException("Chỉ ghi log khi lượt thi đang diễn ra.");

        if (!attempt.Exam.EnableAntiCheat)
            throw new InvalidOperationException("Đề thi này chưa bật anti-cheat.");
    }

    private async Task SendAntiCheatWarningAsync(
        ExamAttempt attempt,
        CheatingLogDto log,
        int logCount,
        CancellationToken ct)
    {
        try
        {
            await _examMonitoringNotifier.SendAntiCheatWarningAsync(new AntiCheatWarningDto
            {
                LogId = log.Id,
                ExamId = attempt.ExamId,
                ExamAttemptId = attempt.Id,
                StudentId = attempt.StudentId,
                StudentName = attempt.Student?.FullName ?? string.Empty,
                Type = log.Type,
                Description = log.Description,
                SuspicionPoint = log.SuspicionPoint,
                SuspicionScore = attempt.SuspicionScore,
                LogCount = logCount,
                Metadata = log.Metadata,
                OccurredAt = log.OccurredAt
            }, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Không thể gửi cảnh báo anti-cheat realtime cho đề thi {ExamId}, lượt làm {AttemptId}.",
                attempt.ExamId,
                attempt.Id);
        }
    }

    private async Task PersistAntiCheatNotificationAsync(
        ExamAttempt attempt,
        CheatingType cheatingType,
        string description,
        int suspicionScore,
        CancellationToken ct)
    {
        try
        {
            await _notificationService.CreateAntiCheatAlertNotificationAsync(
                attempt,
                cheatingType,
                description,
                suspicionScore,
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Không thể lưu thông báo anti-cheat cho đề thi {ExamId}, lượt làm {AttemptId}.",
                attempt.ExamId,
                attempt.Id);
        }
    }

    private async Task<ExamAttempt> EnsureTeacherCanViewAttemptAsync(
        int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var attempt = await _examRepository.GetAttemptByIdAsync(attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        if (roles.Contains("Admin") || attempt.Exam.TeacherId == userId)
            return attempt;

        if (roles.Contains("Teacher"))
        {
            await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, userId, roles, ct);
            return attempt;
        }

        throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được xem log anti-cheat.");
    }
}
