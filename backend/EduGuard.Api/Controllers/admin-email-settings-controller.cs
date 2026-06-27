using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Settings;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/email-settings")]
public class AdminEmailSettingsController : ControllerBase
{
    private readonly IEmailSettingsService _emailSettingsService;

    public AdminEmailSettingsController(IEmailSettingsService emailSettingsService)
    {
        _emailSettingsService = emailSettingsService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<EmailSettingsDto>>> Get(CancellationToken ct)
    {
        var data = await _emailSettingsService.GetAdminSettingsAsync(ct);
        return Ok(ApiResponse<EmailSettingsDto>.CreateSuccess(data));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<EmailSettingsDto>>> Update(
        [FromBody] UpdateEmailSettingsRequest request,
        CancellationToken ct)
    {
        try
        {
            var data = await _emailSettingsService.UpdateAdminSettingsAsync(request, ct);
            return Ok(ApiResponse<EmailSettingsDto>.CreateSuccess(data, "Cập nhật cấu hình email thành công."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<EmailSettingsDto>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<EmailSettingsDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("test")]
    public async Task<ActionResult<ApiResponse<object>>> SendTest(
        [FromBody] SendTestEmailRequest request,
        CancellationToken ct)
    {
        try
        {
            await _emailSettingsService.SendTestEmailAsync(request, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Đã gửi email thử nghiệm."));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.CreateFailure(ex.Errors.First().ErrorMessage));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.CreateFailure(ex.Message));
        }
    }
}
