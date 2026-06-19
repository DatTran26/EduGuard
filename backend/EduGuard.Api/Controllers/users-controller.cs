using System.Security.Claims;
using EduGuard.Application.DTOs.Auth;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Users;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetAll(CancellationToken ct)
    {
        var data = await _userService.GetAllAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<UserDto>>.CreateSuccess(data));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken ct)
    {
        try
        {
            var data = await _userService.CreateAsync(request, ct);
            return Ok(ApiResponse<UserDto>.CreateSuccess(data, "Thêm người dùng thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<UserDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<UserDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(
        string id,
        [FromBody] UpdateUserRequest request,
        CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
            return Unauthorized(ApiResponse<UserDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _userService.UpdateAsync(id, request, currentUserId, ct);
            return Ok(ApiResponse<UserDto>.CreateSuccess(data, "Cập nhật người dùng thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<UserDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<UserDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<UserDto>.CreateFailure(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(string id, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _userService.DeleteAsync(id, currentUserId, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa người dùng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    private string? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(userId) ? null : userId;
    }
}
