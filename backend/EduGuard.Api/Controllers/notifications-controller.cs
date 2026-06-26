using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Notifications;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace EduGuard.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("classroom")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> CreateClassroomNotification(
        [FromBody] CreateNotificationRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(ApiResponse<object>.CreateFailure("Tiêu đề và nội dung thông báo không được để trống."));
        }

        try
        {
            await _notificationService.CreateClassroomNotificationAsync(userId, request, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Gửi thông báo thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<NotificationDto>>>> GetMyNotifications(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<NotificationDto>>.CreateFailure("Token không hợp lệ."));

        var data = await _notificationService.GetMyNotificationsAsync(userId, ct);
        return Ok(ApiResponse<IReadOnlyList<NotificationDto>>.CreateSuccess(data));
    }

    [HttpGet("classroom/{classroomId:int}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassroomNotificationDto>>>> GetClassroomNotifications(int classroomId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ClassroomNotificationDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _notificationService.GetClassroomNotificationsAsync(classroomId, userId, ct);
            return Ok(ApiResponse<IReadOnlyList<ClassroomNotificationDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<IReadOnlyList<ClassroomNotificationDto>>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<ClassroomNotificationDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("me/unread-count")]
    public async Task<ActionResult<ApiResponse<UnreadCountDto>>> GetUnreadCount(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<UnreadCountDto>.CreateFailure("Token không hợp lệ."));

        var data = await _notificationService.GetUnreadCountAsync(userId, ct);
        return Ok(ApiResponse<UnreadCountDto>.CreateSuccess(data));
    }

    [HttpPut("{userNotificationId:int}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int userNotificationId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _notificationService.MarkAsReadAsync(userId, userNotificationId, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Đã đánh dấu thông báo là đã đọc."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    [HttpPut("me/read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        await _notificationService.MarkAllAsReadAsync(userId, ct);
        return Ok(ApiResponse<object>.CreateSuccess(new { }, "Đã đánh dấu tất cả thông báo là đã đọc."));
    }

    private string? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(id) ? null : id;
    }
}
