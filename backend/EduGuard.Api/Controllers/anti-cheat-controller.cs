using System.Security.Claims;
using EduGuard.Application.DTOs.AntiCheat;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize]
public class AntiCheatController : ControllerBase
{
    private readonly IAntiCheatService _antiCheatService;

    public AntiCheatController(IAntiCheatService antiCheatService) => _antiCheatService = antiCheatService;

    [HttpPost("api/anti-cheat/logs")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<CheatingLogDto>>> CreateLog(
        [FromBody] CreateCheatingLogRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<CheatingLogDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _antiCheatService.LogAsync(request, userId.Value, ct);
            return Ok(ApiResponse<CheatingLogDto>.CreateSuccess(data, "Ghi log anti-cheat thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<CheatingLogDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<CheatingLogDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<CheatingLogDto>.CreateFailure(ex.Message));
        }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<CheatingLogDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<CheatingLogDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/anti-cheat/attempts/{attemptId:int}/logs")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CheatingLogDto>>>> GetLogsByAttempt(
        int attemptId,
        CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<CheatingLogDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _antiCheatService.GetLogsByAttemptAsync(attemptId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<IReadOnlyList<CheatingLogDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<CheatingLogDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<CheatingLogDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("api/anti-cheat/attempts/{attemptId:int}/score")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<SuspicionScoreDto>>> GetSuspicionScore(
        int attemptId,
        CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<SuspicionScoreDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _antiCheatService.GetSuspicionScoreAsync(attemptId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<SuspicionScoreDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<SuspicionScoreDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<SuspicionScoreDto>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("api/anti-cheat/exams/{examId:int}/summary")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamAntiCheatSummaryDto>>> GetExamSummary(
        int examId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamAntiCheatSummaryDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _antiCheatService.GetExamSummaryAsync(examId, userId.Value, ct);
            return Ok(ApiResponse<ExamAntiCheatSummaryDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamAntiCheatSummaryDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamAntiCheatSummaryDto>.CreateFailure(ex.Message));
        }
    }

    private int? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }

    private (int userId, List<string> roles)? GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return null;

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        return (userId.Value, roles);
    }
}
