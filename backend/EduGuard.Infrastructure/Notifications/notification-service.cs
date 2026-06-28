using EduGuard.Application.DTOs.Notifications;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.AntiCheat;
using EduGuard.Infrastructure.Data;
using EduGuard.Infrastructure.Exams;
using EduGuard.Infrastructure.Proctoring;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace EduGuard.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private static readonly TimeSpan AntiCheatDedupeWindow = TimeSpan.FromSeconds(90);

    private readonly AppDbContext _context;
    private readonly INotificationNotifier _notifier;

    public NotificationService(AppDbContext context, INotificationNotifier notifier)
    {
        _context = context;
        _notifier = notifier;
    }


    public async Task CreateClassroomNotificationAsync(
        string senderId,
        CreateNotificationRequest request,
        CancellationToken ct = default)
    {
        // 1. Kiểm tra Classroom tồn tại
        var classroom = await _context.Classrooms
            .FirstOrDefaultAsync(c => c.Id == request.ClassroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        // 2. Kiểm tra quyền sở hữu lớp học của giáo viên
        if (classroom.TeacherId != senderId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền gửi thông báo cho lớp học này.");
        }

        // 3. Lấy danh sách học sinh đang active trong lớp học
        var activeStudentIds = await _context.ClassroomMembers
            .Where(cm => cm.ClassroomId == request.ClassroomId && cm.Status == ClassroomMemberStatus.Active)
            .Select(cm => cm.StudentId)
            .ToListAsync(ct);

        var studentIds = activeStudentIds;
        if (request.RecipientIds is { Count: > 0 })
        {
            var requestedRecipientIds = request.RecipientIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.Ordinal)
                .ToList();

            studentIds = activeStudentIds
                .Where(id => requestedRecipientIds.Contains(id))
                .ToList();

            if (studentIds.Count == 0)
            {
                throw new ArgumentException("Không có học sinh hợp lệ trong danh sách người nhận.");
            }
        }

        // 4. Tạo Notification gốc
        var notification = new Notification
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            Type = request.Type.Trim(),
            SenderId = senderId,
            ClassroomId = request.ClassroomId,
            CreatedAt = DateTime.UtcNow
        };

        // 5. Tạo UserNotification cho từng học sinh
        foreach (var studentId in studentIds)
        {
            notification.UserNotifications.Add(new UserNotification
            {
                UserId = studentId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        // 6. Gửi thông báo SignalR realtime tới từng học sinh
        var classroomName = classroom.Name;
        var realtimeDto = new RealtimeNotificationDto
        {
            Title = request.Title.Trim(),
            Message = $"Lớp {classroomName}: {request.Content.Trim()}",
            Tone = ResolveClassroomNotificationTone(request.Type),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var studentId in studentIds)
        {
            try
            {
                await _notifier.SendToUserAsync(studentId, realtimeDto, ct);
            }
            catch
            {
                // Bỏ qua lỗi gửi realtime để tránh làm gián đoạn luồng chính
            }
        }
    }

    private static string ResolveClassroomNotificationTone(string type) =>
        type.Trim() switch
        {
            "Emergency" or "Success" => "danger",
            "Warning" => "warning",
            _ => "info",
        };

    public async Task CreateProctorInviteNotificationAsync(
        string senderId,
        string invitedTeacherId,
        int examId,
        int classroomId,
        string examTitle,
        CancellationToken ct = default)
    {
        var inviter = await _context.Users.FirstOrDefaultAsync(u => u.Id == senderId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy người gửi.");

        var safeTitle = examTitle.Trim();
        var notification = new Notification
        {
            Title = "Lời mời giám sát bài thi",
            Content = $"{inviter.FullName} đã mời bạn vào phòng giám sát đề «{safeTitle}».",
            Type = "ProctorInvite",
            SenderId = senderId,
            ClassroomId = classroomId,
            RelatedExamId = examId,
            ActionUrl = $"/teacher/exams/{examId}/proctoring",
            CreatedAt = DateTime.UtcNow
        };

        notification.UserNotifications.Add(new UserNotification
        {
            UserId = invitedTeacherId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var realtimeDto = new RealtimeNotificationDto
        {
            Title = notification.Title,
            Message = notification.Content,
            Tone = "info",
            Url = $"/teacher/exams/{examId}/proctoring",
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _notifier.SendToUserAsync(invitedTeacherId, realtimeDto, ct);
        }
        catch
        {
            // Bỏ qua lỗi gửi realtime để tránh làm gián đoạn luồng chính
        }
    }

    public async Task CreateAntiCheatAlertNotificationAsync(
        ExamAttempt attempt,
        CheatingType cheatingType,
        string description,
        int suspicionScore,
        CancellationToken ct = default)
    {
        var exam = attempt.Exam;
        if (exam is null || !exam.EnableAntiCheat)
            return;

        var typeLabel = CheatingTypeHelper.GetDisplayName(cheatingType);
        var typeCode = CheatingTypeHelper.ToApiType(cheatingType);
        var sourceKey = $"anti-cheat:{attempt.Id}:{typeCode}";
        var dedupeCutoff = DateTime.UtcNow.Subtract(AntiCheatDedupeWindow);
        var isDuplicate = await _context.Notifications.AnyAsync(
            n => n.SourceKey == sourceKey && n.CreatedAt >= dedupeCutoff,
            ct);

        if (isDuplicate)
            return;

        var studentName = attempt.Student?.FullName ?? "Học sinh";
        var examTitle = exam.Title.Trim();
        var safeDescription = string.IsNullOrWhiteSpace(description)
            ? typeLabel
            : description.Trim();
        var content =
            $"{studentName} · {examTitle}: {safeDescription}. Điểm nghi ngờ hiện tại: {suspicionScore}.";

        var recipientIds = await GetExamMonitorTeacherIdsAsync(exam.Id, exam.TeacherId, ct);
        if (recipientIds.Count == 0)
            return;

        var notification = new Notification
        {
            Title = $"Cảnh báo gian lận · {typeLabel}",
            Content = content,
            Type = "AntiCheat",
            SenderId = attempt.StudentId,
            ClassroomId = exam.ClassroomId,
            RelatedExamId = exam.Id,
            RelatedExamAttemptId = attempt.Id,
            ActionUrl = $"/teacher/monitoring?examId={exam.Id}&view=logs",
            SourceKey = sourceKey,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            notification.UserNotifications.Add(new UserNotification
            {
                UserId = teacherId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var tone = CheatingTypeHelper.IsHighSeverity(cheatingType) || suspicionScore >= 51
            ? "danger"
            : "warning";
        var realtimeDto = new RealtimeNotificationDto
        {
            Title = notification.Title,
            Message = content,
            Tone = tone,
            Url = notification.ActionUrl,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            try
            {
                await _notifier.SendToUserAsync(teacherId, realtimeDto, ct);
            }
            catch
            {
                // Bỏ qua lỗi gửi realtime để tránh làm gián đoạn luồng chính
            }
        }

        if (suspicionScore >= 51)
        {
            await TryCreateHighRiskNotificationAsync(
                attempt,
                exam,
                studentName,
                examTitle,
                suspicionScore,
                recipientIds,
                ct);
        }
    }

    public async Task CreateLateJoinNotificationAsync(ExamAttempt attempt, CancellationToken ct = default)
    {
        var exam = attempt.Exam;
        if (exam is null)
            return;

        var sourceKey = $"late-join:{attempt.Id}";
        var alreadySent = await _context.Notifications.AnyAsync(n => n.SourceKey == sourceKey, ct);
        if (alreadySent)
            return;

        var studentName = attempt.Student?.FullName ?? "Học sinh";
        var examTitle = exam.Title.Trim();
        var lateByMinutes = ExamJoinHelper.GetLateByMinutes(exam, attempt.StartedAt);
        var content =
            $"{studentName} vào đề «{examTitle}» trễ {lateByMinutes} phút so với giờ mở đề.";

        var recipientIds = await GetExamMonitorTeacherIdsAsync(exam.Id, exam.TeacherId, ct);
        if (recipientIds.Count == 0)
            return;

        var actionUrl = ProctoringSettingsHelper.IsCameraMonitoringEnabled(exam.Setting)
            ? $"/teacher/exams/{exam.Id}/proctoring"
            : $"/teacher/monitoring?examId={exam.Id}";

        var notification = new Notification
        {
            Title = "Sinh viên vào thi trễ",
            Content = content,
            Type = "LateJoin",
            SenderId = attempt.StudentId,
            ClassroomId = exam.ClassroomId,
            RelatedExamId = exam.Id,
            RelatedExamAttemptId = attempt.Id,
            ActionUrl = actionUrl,
            SourceKey = sourceKey,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            notification.UserNotifications.Add(new UserNotification
            {
                UserId = teacherId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var realtimeDto = new RealtimeNotificationDto
        {
            Title = notification.Title,
            Message = content,
            Tone = "warning",
            Url = actionUrl,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            try
            {
                await _notifier.SendToUserAsync(teacherId, realtimeDto, ct);
            }
            catch
            {
                // Bỏ qua lỗi gửi realtime
            }
        }
    }

    private async Task TryCreateHighRiskNotificationAsync(
        ExamAttempt attempt,
        Exam exam,
        string studentName,
        string examTitle,
        int suspicionScore,
        IReadOnlyList<string> recipientIds,
        CancellationToken ct)
    {
        var sourceKey = $"high-risk:{attempt.Id}";
        var alreadySent = await _context.Notifications.AnyAsync(n => n.SourceKey == sourceKey, ct);
        if (alreadySent)
            return;

        var notification = new Notification
        {
            Title = "Rủi ro gian lận cao",
            Content =
                $"{studentName} · {examTitle} đạt {suspicionScore} điểm nghi ngờ. Cần xem xét ngay trong phòng giám sát.",
            Type = "AntiCheatHighRisk",
            SenderId = attempt.StudentId,
            ClassroomId = exam.ClassroomId,
            RelatedExamId = exam.Id,
            RelatedExamAttemptId = attempt.Id,
            ActionUrl = $"/teacher/exams/{exam.Id}/proctoring",
            SourceKey = sourceKey,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            notification.UserNotifications.Add(new UserNotification
            {
                UserId = teacherId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var realtimeDto = new RealtimeNotificationDto
        {
            Title = notification.Title,
            Message = notification.Content,
            Tone = "danger",
            Url = notification.ActionUrl,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var teacherId in recipientIds)
        {
            try
            {
                await _notifier.SendToUserAsync(teacherId, realtimeDto, ct);
            }
            catch
            {
                // Bỏ qua lỗi gửi realtime
            }
        }
    }

    public async Task CreateExamPublishedNotificationAsync(
        int examId,
        string teacherId,
        CancellationToken ct = default)
    {
        var sourceKey = $"exam-published:{examId}";
        if (await _context.Notifications.AnyAsync(n => n.SourceKey == sourceKey, ct))
            return;

        var exam = await _context.Exams
            .Include(e => e.Classroom)
            .FirstOrDefaultAsync(e => e.Id == examId, ct);
        if (exam is null)
            return;

        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == teacherId, ct);
        var teacherName = teacher?.FullName ?? "Giảng viên";
        var classroomName = exam.Classroom?.Name ?? "lớp học";
        var examTitle = exam.Title.Trim();
        var actionUrl = $"/student/exams/{exam.Id}";
        var content = $"{teacherName} đã xuất bản đề thi «{examTitle}» trong lớp {classroomName}.";

        var studentIds = await GetActiveClassroomStudentIdsAsync(exam.ClassroomId, ct);
        if (studentIds.Count == 0)
            return;

        var notification = new Notification
        {
            Title = "Đề thi mới",
            Content = content,
            Type = "ExamPublished",
            SenderId = teacherId,
            ClassroomId = exam.ClassroomId,
            RelatedExamId = examId,
            ActionUrl = actionUrl,
            SourceKey = sourceKey,
            CreatedAt = DateTime.UtcNow
        };

        await DeliverClassroomStudentNotificationAsync(
            notification,
            studentIds,
            $"Lớp {classroomName}: {content}",
            "success",
            actionUrl,
            ct);
    }

    public async Task CreateAssignmentCreatedNotificationAsync(
        int assignmentId,
        string teacherId,
        CancellationToken ct = default)
    {
        var sourceKey = $"assignment-created:{assignmentId}";
        if (await _context.Notifications.AnyAsync(n => n.SourceKey == sourceKey, ct))
            return;

        var assignment = await _context.Assignments
            .Include(a => a.Classroom)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, ct);
        if (assignment is null)
            return;

        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == teacherId, ct);
        var teacherName = teacher?.FullName ?? "Giảng viên";
        var classroomName = assignment.Classroom?.Name ?? "lớp học";
        var assignmentTitle = assignment.Title.Trim();
        var deadlineLabel = FormatNotificationDeadline(assignment.Deadline);
        var actionUrl = $"/student/classrooms/{assignment.ClassroomId}?assignmentId={assignment.Id}";
        var content =
            $"{teacherName} đã giao bài tập «{assignmentTitle}» — hạn nộp {deadlineLabel}.";

        var studentIds = await GetActiveClassroomStudentIdsAsync(assignment.ClassroomId, ct);
        if (studentIds.Count == 0)
            return;

        var notification = new Notification
        {
            Title = "Bài tập mới",
            Content = content,
            Type = "AssignmentNew",
            SenderId = teacherId,
            ClassroomId = assignment.ClassroomId,
            ActionUrl = actionUrl,
            SourceKey = sourceKey,
            CreatedAt = DateTime.UtcNow
        };

        await DeliverClassroomStudentNotificationAsync(
            notification,
            studentIds,
            $"Lớp {classroomName}: {content}",
            "info",
            actionUrl,
            ct);
    }

    private async Task<List<string>> GetActiveClassroomStudentIdsAsync(int classroomId, CancellationToken ct) =>
        await _context.ClassroomMembers
            .Where(cm => cm.ClassroomId == classroomId && cm.Status == ClassroomMemberStatus.Active)
            .Select(cm => cm.StudentId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToListAsync(ct);

    private async Task DeliverClassroomStudentNotificationAsync(
        Notification notification,
        IReadOnlyList<string> studentIds,
        string realtimeMessage,
        string tone,
        string? actionUrl,
        CancellationToken ct)
    {
        foreach (var studentId in studentIds)
        {
            notification.UserNotifications.Add(new UserNotification
            {
                UserId = studentId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var realtimeDto = new RealtimeNotificationDto
        {
            Title = notification.Title,
            Message = realtimeMessage,
            Tone = tone,
            Url = actionUrl,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var studentId in studentIds)
        {
            try
            {
                await _notifier.SendToUserAsync(studentId, realtimeDto, ct);
            }
            catch
            {
                // Bỏ qua lỗi gửi realtime để tránh làm gián đoạn luồng chính
            }
        }
    }

    private static string FormatNotificationDeadline(DateTime deadlineUtc) =>
        deadlineUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");

    private async Task<List<string>> GetExamMonitorTeacherIdsAsync(
        int examId,
        string ownerTeacherId,
        CancellationToken ct)
    {
        var coProctorIds = await _context.ExamProctorAssignments
            .Where(x => x.ExamId == examId)
            .Select(x => x.TeacherId)
            .ToListAsync(ct);

        return coProctorIds
            .Append(ownerTeacherId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    public async Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(
        string userId,
        CancellationToken ct = default)
    {
        return await _context.UserNotifications
            .Include(un => un.Notification)
                .ThenInclude(n => n.Sender)
            .Include(un => un.Notification)
                .ThenInclude(n => n.Classroom)
            .Where(un => un.UserId == userId)
            .OrderByDescending(un => un.CreatedAt)
            .Select(un => new NotificationDto
            {
                UserNotificationId = un.Id,
                NotificationId = un.NotificationId,
                Title = un.Notification.Title,
                Content = un.Notification.Content,
                Type = un.Notification.Type,
                SenderName = un.Notification.Sender.FullName,
                ClassroomName = un.Notification.Classroom.Name,
                RelatedExamId = un.Notification.RelatedExamId,
                RelatedExamAttemptId = un.Notification.RelatedExamAttemptId,
                ActionUrl = un.Notification.ActionUrl,
                IsRead = un.IsRead,
                CreatedAt = un.CreatedAt,
                ReadAt = un.ReadAt
            })
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClassroomNotificationDto>> GetClassroomNotificationsAsync(
        int classroomId,
        string userId,
        CancellationToken ct = default)
    {
        var classroom = await _context.Classrooms
            .FirstOrDefaultAsync(c => c.Id == classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        if (classroom.TeacherId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông báo của lớp học này.");
        }

        return await _context.Notifications
            .Include(n => n.Sender)
            .Where(n => n.ClassroomId == classroomId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new ClassroomNotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Content = n.Content,
                Type = n.Type,
                SenderName = n.Sender.FullName,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(ct);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(
        string userId,
        CancellationToken ct = default)
    {
        var count = await _context.UserNotifications
            .CountAsync(un => un.UserId == userId && !un.IsRead, ct);

        return new UnreadCountDto { Count = count };
    }

    public async Task MarkAsReadAsync(
        string userId,
        int userNotificationId,
        CancellationToken ct = default)
    {
        var userNotification = await _context.UserNotifications
            .FirstOrDefaultAsync(un => un.Id == userNotificationId && un.UserId == userId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thông báo hoặc bạn không có quyền xem thông báo này.");

        if (!userNotification.IsRead)
        {
            userNotification.IsRead = true;
            userNotification.ReadAt = DateTime.UtcNow;
            userNotification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllAsReadAsync(
        string userId,
        CancellationToken ct = default)
    {
        var unreadNotifications = await _context.UserNotifications
            .Where(un => un.UserId == userId && !un.IsRead)
            .ToListAsync(ct);

        if (unreadNotifications.Count > 0)
        {
            foreach (var un in unreadNotifications)
            {
                un.IsRead = true;
                un.ReadAt = DateTime.UtcNow;
                un.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);
        }
    }
}
