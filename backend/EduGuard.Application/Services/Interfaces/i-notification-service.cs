using EduGuard.Application.DTOs.Notifications;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace EduGuard.Application.Services.Interfaces;

public interface INotificationService
{
    Task CreateClassroomNotificationAsync(string senderId, CreateNotificationRequest request, CancellationToken ct = default);
    Task CreateProctorInviteNotificationAsync(
        string senderId,
        string invitedTeacherId,
        int examId,
        int classroomId,
        string examTitle,
        CancellationToken ct = default);
    Task CreateAntiCheatAlertNotificationAsync(
        ExamAttempt attempt,
        CheatingType cheatingType,
        string description,
        int suspicionScore,
        CancellationToken ct = default);
    Task CreateLateJoinNotificationAsync(ExamAttempt attempt, CancellationToken ct = default);
    Task CreateExamPublishedNotificationAsync(int examId, string teacherId, CancellationToken ct = default);
    Task CreateAssignmentCreatedNotificationAsync(int assignmentId, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomNotificationDto>> GetClassroomNotificationsAsync(int classroomId, string userId, CancellationToken ct = default);
    Task<UnreadCountDto> GetUnreadCountAsync(string userId, CancellationToken ct = default);
    Task MarkAsReadAsync(string userId, int userNotificationId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(string userId, CancellationToken ct = default);
}
