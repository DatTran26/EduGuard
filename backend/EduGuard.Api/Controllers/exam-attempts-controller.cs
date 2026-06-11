using System.Security.Claims;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize]
public class ExamAttemptsController : ControllerBase
{
    private readonly IExamAttemptService _attemptService;

    public ExamAttemptsController(IExamAttemptService attemptService) => _attemptService = attemptService;

    [HttpPost("api/exams/{examId:int}/start")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<StartExamResponse>>> Start(int examId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<StartExamResponse>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _attemptService.StartAsync(examId, userId.Value, ct);
            return Ok(ApiResponse<StartExamResponse>.CreateSuccess(data, "Bắt đầu làm bài thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<StartExamResponse>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<StartExamResponse>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<StartExamResponse>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/attempts/{attemptId:int}")]
    public async Task<ActionResult<ApiResponse<ExamAttemptDetailDto>>> GetAttempt(int attemptId, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<ExamAttemptDetailDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _attemptService.GetAttemptAsync(attemptId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<ExamAttemptDetailDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamAttemptDetailDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamAttemptDetailDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/attempts/{attemptId:int}/answers")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> SaveAnswer(
        int attemptId, [FromBody] SaveStudentAnswerRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _attemptService.SaveAnswerAsync(attemptId, request, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Lưu đáp án thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<object>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<object>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/attempts/{attemptId:int}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<ExamResultDto>>> Submit(int attemptId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamResultDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _attemptService.SubmitAsync(attemptId, userId.Value, ct);
            return Ok(ApiResponse<ExamResultDto>.CreateSuccess(data, "Nộp bài thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamResultDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamResultDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamResultDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/attempts/{attemptId:int}/result")]
    public async Task<ActionResult<ApiResponse<ExamResultDto>>> GetResult(int attemptId, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<ExamResultDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _attemptService.GetResultAsync(attemptId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<ExamResultDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamResultDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamResultDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamResultDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/exams/{examId:int}/attempts")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExamAttemptDto>>>> GetAttemptsByExam(int examId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ExamAttemptDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _attemptService.GetAttemptsByExamAsync(examId, userId.Value, ct);
            return Ok(ApiResponse<IReadOnlyList<ExamAttemptDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<ExamAttemptDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<ExamAttemptDto>>.CreateFailure(ex.Message));
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
