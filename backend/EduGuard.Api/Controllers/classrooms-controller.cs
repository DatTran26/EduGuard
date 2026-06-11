using System.Security.Claims;
using EduGuard.Application.DTOs.Classrooms;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Route("api/classrooms")]
[Authorize]
public class ClassroomsController : ControllerBase
{
    private readonly IClassroomService _classroomService;

    public ClassroomsController(IClassroomService classroomService)
    {
        _classroomService = classroomService;
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> Create(
        [FromBody] CreateClassroomRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ClassroomDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _classroomService.CreateAsync(request, userId.Value, ct);
            return Ok(ApiResponse<ClassroomDto>.CreateSuccess(data, "Tạo lớp học thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> GetById(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ClassroomDto>.CreateFailure("Token không hợp lệ."));

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        try
        {
            var data = await _classroomService.GetByIdAsync(id, userId.Value, roles, ct);
            return Ok(ApiResponse<ClassroomDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassroomDto>>>> GetAll(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ClassroomDto>>.CreateFailure("Token không hợp lệ."));

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        var data = await _classroomService.GetMyClassroomsAsync(userId.Value, roles, ct);
        return Ok(ApiResponse<IReadOnlyList<ClassroomDto>>.CreateSuccess(data));
    }

    [HttpPost("join")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> Join(
        [FromBody] JoinClassroomRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ClassroomDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _classroomService.JoinAsync(request, userId.Value, ct);
            return Ok(ApiResponse<ClassroomDto>.CreateSuccess(data, "Tham gia lớp thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> Update(
        int id,
        [FromBody] UpdateClassroomRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ClassroomDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _classroomService.UpdateAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<ClassroomDto>.CreateSuccess(data, "Cập nhật lớp học thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ClassroomDto>>> Patch(
        int id,
        [FromBody] PatchClassroomRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ClassroomDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _classroomService.PatchAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<ClassroomDto>.CreateSuccess(data, "Cập nhật lớp học thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<ClassroomDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ClassroomDto>.CreateFailure(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _classroomService.DeleteAsync(id, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa lớp học thành công."));
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

    [HttpGet("{id:int}/members")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassroomMemberDto>>>> GetMembers(
        int id,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ClassroomMemberDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _classroomService.GetMembersAsync(id, userId.Value, ct);
            return Ok(ApiResponse<IReadOnlyList<ClassroomMemberDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<IReadOnlyList<ClassroomMemberDto>>.CreateFailure(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<IReadOnlyList<ClassroomMemberDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpDelete("{id:int}/members/{studentId:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> RemoveMember(
        int id,
        int studentId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _classroomService.RemoveMemberAsync(id, studentId, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa học sinh khỏi lớp thành công."));
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

    private int? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }
}
