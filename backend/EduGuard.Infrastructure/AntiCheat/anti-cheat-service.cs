using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using FluentValidation;

namespace EduGuard.Infrastructure.AntiCheat;

public class AntiCheatService : IAntiCheatService
{
    private const int FlaggedSuspicionThreshold = 10;

    private readonly ICheatingLogRepository _cheatingLogRepository;
    private readonly IExamRepository _examRepository;
    private readonly IValidator<CreateCheatingLogRequest> _createLogValidator;

    public AntiCheatService(
        ICheatingLogRepository cheatingLogRepository,
        IExamRepository examRepository,
        IValidator<CreateCheatingLogRequest> createLogValidator)
    {
        _cheatingLogRepository = cheatingLogRepository;
        _examRepository = examRepository;
        _createLogValidator = createLogValidator;
    }

    public async Task<CheatingLogDto> LogAsync(
        CreateCheatingLogRequest request, int studentId, CancellationToken ct = default)
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

        return AntiCheatMapper.MapLog(log);
    }

    public async Task<IReadOnlyList<CheatingLogDto>> GetLogsByAttemptAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await EnsureTeacherCanViewAttemptAsync(attemptId, userId, roles, ct);

        var logs = await _cheatingLogRepository.GetByAttemptIdAsync(attemptId, ct);
        return logs.Select(AntiCheatMapper.MapLog).ToList();
    }

    public async Task<SuspicionScoreDto> GetSuspicionScoreAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
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
        int examId, int teacherId, CancellationToken ct = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được xem tổng hợp anti-cheat.");

        var attempts = await _examRepository.GetAttemptsByExamIdAsync(examId, ct);
        var logs = await _cheatingLogRepository.GetByExamIdAsync(examId, ct);
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

    private static void EnsureStudentCanLog(ExamAttempt attempt, int studentId)
    {
        if (attempt.StudentId != studentId)
            throw new UnauthorizedAccessException("Bạn không có quyền ghi log cho lượt thi này.");

        if (attempt.Status != ExamAttemptStatus.InProgress)
            throw new InvalidOperationException("Chỉ ghi log khi lượt thi đang diễn ra.");

        if (!attempt.Exam.EnableAntiCheat)
            throw new InvalidOperationException("Đề thi này chưa bật anti-cheat.");
    }

    private async Task<ExamAttempt> EnsureTeacherCanViewAttemptAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var attempt = await _examRepository.GetAttemptByIdAsync(attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        if (roles.Contains("Admin") || attempt.Exam.TeacherId == userId)
            return attempt;

        throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được xem log anti-cheat.");
    }
}
