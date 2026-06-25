using EduGuard.Application.DTOs.Notifications;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace EduGuard.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
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
        var studentIds = await _context.ClassroomMembers
            .Where(cm => cm.ClassroomId == request.ClassroomId && cm.Status == ClassroomMemberStatus.Active)
            .Select(cm => cm.StudentId)
            .ToListAsync(ct);

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
            Tone = "info",
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

        var isTeacher = classroom.TeacherId == userId;
        var isStudent = await _context.ClassroomMembers
            .AnyAsync(cm => cm.ClassroomId == classroomId && cm.StudentId == userId && cm.Status == ClassroomMemberStatus.Active, ct);

        if (!isTeacher && !isStudent)
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
