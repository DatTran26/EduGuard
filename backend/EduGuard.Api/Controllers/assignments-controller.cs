using System.Security.Claims;
using EduGuard.Application.DTOs.Assignments;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService) =>
        _assignmentService = assignmentService;

    [HttpGet("api/classrooms/{classroomId:int}/assignments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssignmentDto>>>> GetByClassroom(
        int classroomId,
        CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<AssignmentDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.GetByClassroomAsync(classroomId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<IReadOnlyList<AssignmentDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<AssignmentDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<AssignmentDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/classrooms/{classroomId:int}/assignments")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AssignmentDto>>> Create(
        int classroomId,
        [FromBody] CreateAssignmentRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AssignmentDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.CreateAsync(classroomId, request, userId.Value, ct);
            return Ok(ApiResponse<AssignmentDto>.CreateSuccess(data, "Tạo bài tập thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AssignmentDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AssignmentDto>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("api/assignments/{id:int}")]
    public async Task<ActionResult<ApiResponse<AssignmentDto>>> GetById(int id, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<AssignmentDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.GetByIdAsync(id, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<AssignmentDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AssignmentDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPut("api/assignments/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AssignmentDto>>> Update(
        int id,
        [FromBody] UpdateAssignmentRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AssignmentDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.UpdateAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<AssignmentDto>.CreateSuccess(data, "Cập nhật bài tập thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AssignmentDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AssignmentDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
    }

    [HttpPatch("api/assignments/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AssignmentDto>>> Patch(
        int id,
        [FromBody] PatchAssignmentRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AssignmentDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.PatchAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<AssignmentDto>.CreateSuccess(data, "Cập nhật bài tập thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AssignmentDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AssignmentDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<AssignmentDto>.CreateFailure(ex.Message)); }
    }

    [HttpDelete("api/assignments/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _assignmentService.DeleteAsync(id, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa bài tập thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/assignments/{id:int}/submit")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<SubmissionDto>>> Submit(
        int id,
        [FromBody] SubmitAssignmentRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<SubmissionDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.SubmitAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<SubmissionDto>.CreateSuccess(data, "Nộp bài thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<SubmissionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<SubmissionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<SubmissionDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<SubmissionDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/assignments/{id:int}/submissions")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SubmissionDto>>>> GetSubmissions(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<SubmissionDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.GetSubmissionsAsync(id, userId.Value, ct);
            return Ok(ApiResponse<IReadOnlyList<SubmissionDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<SubmissionDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<SubmissionDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/submissions/{id:int}/grade")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<SubmissionDto>>> Grade(
        int id,
        [FromBody] GradeSubmissionRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<SubmissionDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _assignmentService.GradeAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<SubmissionDto>.CreateSuccess(data, "Chấm điểm thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<SubmissionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<SubmissionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<SubmissionDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<SubmissionDto>.CreateFailure(ex.Message)); }
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
