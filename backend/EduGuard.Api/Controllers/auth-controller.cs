using System.Security.Claims;
using EduGuard.Application.DTOs.Auth;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<UserDto>>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        try
        {
            var user = await _authService.RegisterAsync(request, ct);
            return Ok(ApiResponse<UserDto>.CreateSuccess(user, "Đăng ký thành công."));
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

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        try
        {
            var data = await _authService.LoginAsync(request, ct);
            return Ok(ApiResponse<LoginResponse>.CreateSuccess(data, "Đăng nhập thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<LoginResponse>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<LoginResponse>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        try
        {
            var data = await _authService.RefreshAsync(request.RefreshToken, ct);
            return Ok(ApiResponse<LoginResponse>.CreateSuccess(data, "Làm mới token thành công."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<LoginResponse>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        await _authService.LogoutAsync(request.RefreshToken, ct);
        return Ok(ApiResponse<object>.CreateSuccess(new { }, "Đăng xuất thành công."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> Me(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(ApiResponse<UserDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _authService.GetMeAsync(int.Parse(userId), ct);
            return Ok(ApiResponse<UserDto>.CreateSuccess(data));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<UserDto>.CreateFailure(ex.Message));
        }
    }
}
