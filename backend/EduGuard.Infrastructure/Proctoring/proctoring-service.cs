using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using EduGuard.Infrastructure.Exams;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Proctoring;

public class ProctoringService : IProctoringService
{
    private readonly AppDbContext _db;
    private readonly IExamRepository _examRepository;
    private readonly IExamMonitoringService _examMonitoringService;
    private readonly INotificationService _notificationService;
    private readonly IProctoringRepository _proctoringRepository;

    public ProctoringService(
        AppDbContext db,
        IExamRepository examRepository,
        IExamMonitoringService examMonitoringService,
        INotificationService notificationService,
        IProctoringRepository proctoringRepository)
    {
        _db = db;
        _examRepository = examRepository;
        _examMonitoringService = examMonitoringService;
        _notificationService = notificationService;
        _proctoringRepository = proctoringRepository;
    }

    public async Task<ProctoringRoomDto> GetRoomAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await _examMonitoringService.EnsureCanMonitorExamAsync(examId, userId, roles, ct);
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        var states = await BuildStateSummariesAsync(examId, ct);
        var attempts = exam.Attempts ?? [];
        var activeSessions = await _db.LiveProctoringSessions.CountAsync(
            x => x.ExamId == examId && x.Status == "Connected", ct);

        return new ProctoringRoomDto
        {
            ExamId = exam.Id,
            ExamTitle = exam.Title,
            ClassroomId = exam.ClassroomId,
            StartTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.StartTime),
            EndTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.EndTime),
            EnableLiveProctoring = exam.Setting?.EnableLiveProctoring ?? false,
            CameraMonitoringEnabled = ProctoringSettingsHelper.IsCameraMonitoringEnabled(exam.Setting),
            MaxActiveLiveTiles = exam.Setting?.MaxActiveLiveTiles ?? 9,
            InProgressCount = attempts.Count(x => x.Status == ExamAttemptStatus.InProgress),
            SubmittedCount = attempts.Count(x => x.Status == ExamAttemptStatus.Submitted),
            PausedCount = attempts.Count(x => x.Status == ExamAttemptStatus.PausedByProctor),
            LiveSessionCount = activeSessions,
            Students = states
        };
    }

    public async Task<IReadOnlyList<ProctoringStateSummaryDto>> GetStatesAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await _examMonitoringService.EnsureCanMonitorExamAsync(examId, userId, roles, ct);
        return await BuildStateSummariesAsync(examId, ct);
    }

    public async Task<ProctoringAttemptDetailDto> GetAttemptDetailAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await GetAttemptWithAccessAsync(attemptId, userId, roles, ct);
        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
        var actions = await _proctoringRepository.GetActionsByAttemptIdAsync(attemptId, 50, ct);
        var evidence = await _proctoringRepository.GetEvidenceByAttemptIdAsync(attemptId, ct);

        return new ProctoringAttemptDetailDto
        {
            AttemptId = attempt.Id,
            ExamId = attempt.ExamId,
            StudentId = attempt.StudentId,
            StudentName = attempt.Student?.FullName ?? string.Empty,
            AttemptStatus = attempt.Status.ToString(),
            State = MapState(state, attempt.SuspicionScore),
            RecentActions = actions.Select(MapAction).ToList(),
            Evidence = evidence.Select(MapEvidence).ToList()
        };
    }

    public async Task<ProctoringStateDto> GetAttemptStateAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await GetAttemptWithAccessAsync(attemptId, userId, roles, ct);
        var state = await _proctoringRepository.GetStateByAttemptIdAsync(attemptId, ct);
        return MapState(state, attempt.SuspicionScore);
    }

    public async Task<IReadOnlyList<ExamProctorAssignmentDto>> GetProctorsAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await _examMonitoringService.EnsureCanMonitorExamAsync(examId, userId, roles, ct);
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        var assignments = await _proctoringRepository.GetProctorAssignmentsAsync(examId, ct);
        var teacherIds = assignments.Select(x => x.TeacherId).Append(exam.TeacherId).Distinct().ToList();
        var teachers = await _db.Users.Where(x => teacherIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        var result = new List<ExamProctorAssignmentDto>
        {
            new()
            {
                Id = 0,
                ExamId = examId,
                TeacherId = exam.TeacherId,
                TeacherName = teachers.GetValueOrDefault(exam.TeacherId) ?? string.Empty,
                Role = "Owner",
                CreatedAt = exam.CreatedAt
            }
        };

        result.AddRange(assignments.Select(x => new ExamProctorAssignmentDto
        {
            Id = x.Id,
            ExamId = x.ExamId,
            TeacherId = x.TeacherId,
            TeacherName = teachers.GetValueOrDefault(x.TeacherId) ?? string.Empty,
            Role = x.Role,
            CreatedAt = x.CreatedAt
        }));

        return result;
    }

    public async Task<IReadOnlyList<ProctorCandidateDto>> GetProctorCandidatesAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        await EnsureExamOwnerAsync(examId, userId, roles, ct);
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        var assignments = await _proctoringRepository.GetProctorAssignmentsAsync(examId, ct);
        var excludedTeacherIds = assignments
            .Select(x => x.TeacherId)
            .Append(exam.TeacherId)
            .ToHashSet(StringComparer.Ordinal);

        var teacherRoleId = await _db.Set<IdentityRole>()
            .Where(role => role.Name == "Teacher")
            .Select(role => role.Id)
            .FirstOrDefaultAsync(ct);

        if (teacherRoleId is null)
            return [];

        var candidates = await (
            from user in _db.Users
            join userRole in _db.Set<IdentityUserRole<string>>() on user.Id equals userRole.UserId
            where userRole.RoleId == teacherRoleId
                  && user.IsActive
                  && !excludedTeacherIds.Contains(user.Id)
            orderby user.FullName
            select new ProctorCandidateDto
            {
                TeacherId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
            })
            .ToListAsync(ct);

        return candidates;
    }

    public async Task<ExamProctorAssignmentDto> AddProctorAsync(int examId, AddExamProctorRequest request, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await EnsureExamOwnerAsync(examId, userId, roles, ct);
        if (string.IsNullOrWhiteSpace(request.TeacherId))
            throw new ArgumentException("Giáo viên cần mời không hợp lệ.");

        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (exam.TeacherId == request.TeacherId)
            throw new InvalidOperationException("Giáo viên tạo đề đã là owner phòng giám sát.");

        var teacher = await _db.Users.FirstOrDefaultAsync(x => x.Id == request.TeacherId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy giáo viên.");

        var existing = await _proctoringRepository.GetProctorAssignmentAsync(examId, request.TeacherId, ct);
        if (existing is not null)
            throw new InvalidOperationException("Giáo viên đã được mời vào phòng giám sát.");

        var assignment = new ExamProctorAssignment
        {
            ExamId = examId,
            TeacherId = request.TeacherId,
            InvitedByTeacherId = userId,
            Role = "CoProctor",
            CreatedAt = DateTime.UtcNow
        };
        await _proctoringRepository.AddProctorAssignmentAsync(assignment, ct);

        await _notificationService.CreateProctorInviteNotificationAsync(
            userId,
            request.TeacherId,
            examId,
            exam.ClassroomId,
            exam.Title,
            ct);

        return new ExamProctorAssignmentDto
        {
            Id = assignment.Id,
            ExamId = assignment.ExamId,
            TeacherId = assignment.TeacherId,
            TeacherName = teacher.FullName,
            Role = assignment.Role,
            CreatedAt = assignment.CreatedAt
        };
    }

    public async Task RemoveProctorAsync(int examId, string teacherId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        await EnsureExamOwnerAsync(examId, userId, roles, ct);
        var assignment = await _proctoringRepository.GetProctorAssignmentAsync(examId, teacherId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy giáo viên trong phòng giám sát.");
        await _proctoringRepository.RemoveProctorAssignmentAsync(assignment, ct);
    }

    public async Task<IReadOnlyList<AssignedProctorExamDto>> GetAssignedExamsAsync(
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        if (!roles.Contains("Teacher"))
            return [];

        var assignedExamIds = await _db.ExamProctorAssignments
            .Where(x => x.TeacherId == userId)
            .Select(x => x.ExamId)
            .Distinct()
            .ToListAsync(ct);

        if (assignedExamIds.Count == 0)
            return [];

        var exams = await _db.Exams
            .Include(x => x.Setting)
            .Include(x => x.Questions)
            .Include(x => x.Attempts)
            .Where(x => assignedExamIds.Contains(x.Id))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var classroomIds = exams.Select(x => x.ClassroomId).Distinct().ToList();
        var teacherIds = exams.Select(x => x.TeacherId).Distinct().ToList();

        var classrooms = await _db.Classrooms
            .Where(x => classroomIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name, ct);

        var teachers = await _db.Users
            .Where(x => teacherIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        return exams
            .Select(exam =>
            {
                var mapped = ExamMapper.MapExam(exam);
                return new AssignedProctorExamDto
                {
                    Id = mapped.Id,
                    ClassroomId = mapped.ClassroomId,
                    TeacherId = mapped.TeacherId,
                    Title = mapped.Title,
                    Description = mapped.Description,
                    DurationMinutes = mapped.DurationMinutes,
                    StartTime = mapped.StartTime,
                    EndTime = mapped.EndTime,
                    IsPublished = mapped.IsPublished,
                    EnableAntiCheat = mapped.EnableAntiCheat,
                    CreatedAt = mapped.CreatedAt,
                    QuestionCount = mapped.QuestionCount,
                    AttemptCount = mapped.AttemptCount,
                    Settings = mapped.Settings,
                    ClassroomName = classrooms.GetValueOrDefault(exam.ClassroomId) ?? string.Empty,
                    OwnerTeacherName = teachers.GetValueOrDefault(exam.TeacherId) ?? string.Empty,
                };
            })
            .ToList();
    }

    public async Task<ProctoringEvidenceListResultDto> GetEvidenceListAsync(
        ProctoringEvidenceListQuery query,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        if (query.ExamId.HasValue)
            await _examMonitoringService.EnsureCanMonitorExamAsync(query.ExamId.Value, userId, roles, ct);

        var evidenceQuery = _db.ProctoringEvidences
            .AsNoTracking()
            .Include(x => x.ExamAttempt)
                .ThenInclude(a => a.Student)
            .Include(x => x.ExamAttempt)
                .ThenInclude(a => a.Exam)
            .AsQueryable();

        if (!roles.Contains("Admin"))
        {
            var accessibleExamIds = await GetAccessibleExamIdsAsync(userId, ct);
            evidenceQuery = evidenceQuery.Where(x => accessibleExamIds.Contains(x.ExamAttempt.ExamId));
        }

        if (query.ExamId.HasValue)
            evidenceQuery = evidenceQuery.Where(x => x.ExamAttempt.ExamId == query.ExamId.Value);

        if (query.AttemptId.HasValue)
            evidenceQuery = evidenceQuery.Where(x => x.ExamAttemptId == query.AttemptId.Value);

        if (!string.IsNullOrWhiteSpace(query.EvidenceType))
            evidenceQuery = evidenceQuery.Where(x => x.EvidenceType == query.EvidenceType.Trim());

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            evidenceQuery = evidenceQuery.Where(x =>
                (x.ExamAttempt.Student != null && x.ExamAttempt.Student.FullName.Contains(term)) ||
                (x.ExamAttempt.Exam != null && x.ExamAttempt.Exam.Title.Contains(term)));
        }

        var totalCount = await evidenceQuery.CountAsync(ct);
        var snapshotCount = await evidenceQuery.CountAsync(x => x.EvidenceType == "Snapshot", ct);
        var clipCount = await evidenceQuery.CountAsync(x => x.EvidenceType == "Clip", ct);
        var autoCount = await evidenceQuery.CountAsync(
            x => x.EvidenceType == "AutoSnapshot" || x.EvidenceType == "AutoDetect",
            ct);

        var rows = await evidenceQuery
            .OrderByDescending(x => x.CapturedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new ProctoringEvidenceListResultDto
        {
            Items = rows.Select(MapEvidenceListItem).ToList(),
            TotalCount = totalCount,
            SnapshotCount = snapshotCount,
            ClipCount = clipCount,
            AutoCount = autoCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProctoringAiSettingsDto> GetAiSettingsAsync(CancellationToken ct = default)
    {
        var settings = await _proctoringRepository.GetAiSettingsAsync(ct);
        return MapAiSettings(settings);
    }

    public async Task<ProctoringAiSettingsDto> UpdateAiSettingsAsync(UpdateProctoringAiSettingsRequest request, CancellationToken ct = default)
    {
        var settings = await _proctoringRepository.GetAiSettingsAsync(ct);
        settings.EnableYoloDetection = request.EnableYoloDetection;
        settings.AiServiceBaseUrl = request.AiServiceBaseUrl.Trim();
        settings.PhoneVisibleMinConfidence = request.PhoneVisibleMinConfidence;
        settings.BookVisibleMinConfidence = request.BookVisibleMinConfidence;
        settings.SecondPersonMinConfidence = request.SecondPersonMinConfidence;
        settings.DetectionIntervalSeconds = request.DetectionIntervalSeconds;
        await _proctoringRepository.UpdateAiSettingsAsync(settings, ct);
        return MapAiSettings(settings);
    }

    private async Task<List<ProctoringStateSummaryDto>> BuildStateSummariesAsync(int examId, CancellationToken ct)
    {
        var attempts = await _db.ExamAttempts
            .Include(x => x.Student)
            .Include(x => x.Exam)
            .Where(x => x.ExamId == examId)
            .ToListAsync(ct);

        var states = await _proctoringRepository.GetStatesByExamIdAsync(examId, ct);
        var stateMap = states.ToDictionary(x => x.ExamAttemptId);
        var watchSessions = await _db.LiveProctoringSessions
            .Where(x => x.ExamId == examId && x.Status == "Connected")
            .ToListAsync(ct);
        var watchMap = watchSessions.GroupBy(x => x.ExamAttemptId).ToDictionary(g => g.Key, g => g.First());
        var teacherNames = await _db.Users
            .Where(x => watchSessions.Select(s => s.TeacherId).Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.FullName, ct);

        return attempts
            .Select(attempt =>
            {
                stateMap.TryGetValue(attempt.Id, out var state);
                watchMap.TryGetValue(attempt.Id, out var watch);
                return new ProctoringStateSummaryDto
                {
                    AttemptId = attempt.Id,
                    StudentId = attempt.StudentId,
                    StudentName = attempt.Student?.FullName ?? string.Empty,
                    AttemptStatus = attempt.Status.ToString(),
                    CameraStatus = state?.CameraStatus ?? "Unknown",
                    LiveStatus = state?.LiveStatus ?? "Inactive",
                    ConnectionStatus = state?.ConnectionStatus ?? "Unknown",
                    EnvironmentStatus = state?.EnvironmentStatus ?? "Normal",
                    SuspicionScore = state?.SuspicionScore ?? attempt.SuspicionScore,
                    RiskLevel = state?.RiskLevel ?? ProctoringRiskHelper.GetRiskLevel(attempt.SuspicionScore),
                    WarningCount = state?.WarningCount ?? 0,
                    EvidenceCount = state?.EvidenceCount ?? 0,
                    WatchedByTeacherId = watch?.TeacherId,
                    WatchedByTeacherName = watch is null ? null : teacherNames.GetValueOrDefault(watch.TeacherId),
                    LatestWarningAt = state?.LatestWarningAt,
                    IsLateJoin = ExamJoinHelper.IsLateJoin(attempt.Exam, attempt.StartedAt),
                    LateByMinutes = ExamJoinHelper.GetLateByMinutes(attempt.Exam, attempt.StartedAt),
                    LatestDetectionType = state?.LatestDetectionType
                };
            })
            .OrderByDescending(x => x.SuspicionScore)
            .ThenByDescending(x => x.LatestWarningAt)
            .ToList();
    }

    private async Task<ExamAttempt> GetAttemptWithAccessAsync(int attemptId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var attempt = await _db.ExamAttempts
            .Include(x => x.Student)
            .Include(x => x.Exam)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt làm bài.");

        if (roles.Contains("Student"))
        {
            if (attempt.StudentId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xem lượt làm bài này.");
            return attempt;
        }

        await _examMonitoringService.EnsureCanMonitorExamAsync(attempt.ExamId, userId, roles, ct);
        return attempt;
    }

    private async Task EnsureExamOwnerAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        if (roles.Contains("Admin"))
            return;

        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (exam.TeacherId != userId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được quản lý co-proctor.");
    }

    private static ProctoringStateDto MapState(ProctoringState? state, int fallbackScore) => new()
    {
        CameraStatus = state?.CameraStatus ?? "Unknown",
        LiveStatus = state?.LiveStatus ?? "Inactive",
        FullscreenStatus = state?.FullscreenStatus ?? "Unknown",
        ConnectionStatus = state?.ConnectionStatus ?? "Unknown",
        EnvironmentStatus = state?.EnvironmentStatus ?? "Normal",
        LatestDetectionType = state?.LatestDetectionType,
        WarningCount = state?.WarningCount ?? 0,
        EvidenceCount = state?.EvidenceCount ?? 0,
        SuspicionScore = state?.SuspicionScore ?? fallbackScore,
        RiskLevel = state?.RiskLevel ?? ProctoringRiskHelper.GetRiskLevel(fallbackScore),
        LastHeartbeatAt = state?.LastHeartbeatAt ?? DateTime.UtcNow,
        LatestWarningAt = state?.LatestWarningAt
    };

    private static ProctorActionDto MapAction(ProctorAction action) => new()
    {
        Id = action.Id,
        ActionType = action.ActionType,
        Reason = action.Reason,
        TeacherId = action.TeacherId,
        CreatedAt = action.CreatedAt
    };

    private static ProctoringEvidenceDto MapEvidence(ProctoringEvidence evidence) => new()
    {
        Id = evidence.Id,
        EvidenceType = evidence.EvidenceType,
        FileUrl = ProctoringEvidenceUrlHelper.ToDownloadApiPath(evidence.ExamAttemptId, evidence.Id),
        ThumbnailUrl = evidence.ThumbnailUrl,
        CaptureSource = evidence.CaptureSource,
        TriggerEventType = evidence.TriggerEventType,
        Confidence = evidence.Confidence,
        CapturedAt = evidence.CapturedAt
    };

    private static ProctoringEvidenceListItemDto MapEvidenceListItem(ProctoringEvidence evidence) => new()
    {
        Id = evidence.Id,
        AttemptId = evidence.ExamAttemptId,
        ExamId = evidence.ExamAttempt.ExamId,
        ExamTitle = evidence.ExamAttempt.Exam?.Title ?? string.Empty,
        StudentId = evidence.ExamAttempt.StudentId,
        StudentName = evidence.ExamAttempt.Student?.FullName ?? string.Empty,
        EvidenceType = evidence.EvidenceType,
        FileUrl = ProctoringEvidenceUrlHelper.ToDownloadApiPath(evidence.ExamAttemptId, evidence.Id),
        CaptureSource = evidence.CaptureSource,
        TriggerEventType = evidence.TriggerEventType,
        Confidence = evidence.Confidence,
        CapturedAt = evidence.CapturedAt
    };

    private async Task<List<int>> GetAccessibleExamIdsAsync(string userId, CancellationToken ct)
    {
        var ownedExamIds = await _db.Exams
            .Where(x => x.TeacherId == userId)
            .Select(x => x.Id)
            .ToListAsync(ct);

        var assignedExamIds = await _db.ExamProctorAssignments
            .Where(x => x.TeacherId == userId)
            .Select(x => x.ExamId)
            .ToListAsync(ct);

        return ownedExamIds.Concat(assignedExamIds).Distinct().ToList();
    }

    private static ProctoringAiSettingsDto MapAiSettings(ProctoringAiSettings settings) => new()
    {
        EnableYoloDetection = settings.EnableYoloDetection,
        AiServiceBaseUrl = settings.AiServiceBaseUrl,
        PhoneVisibleMinConfidence = settings.PhoneVisibleMinConfidence,
        BookVisibleMinConfidence = settings.BookVisibleMinConfidence,
        SecondPersonMinConfidence = settings.SecondPersonMinConfidence,
        DetectionIntervalSeconds = settings.DetectionIntervalSeconds
    };
}
