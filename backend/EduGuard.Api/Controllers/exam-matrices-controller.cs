using System.Security.Claims;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.ExamMatrices;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Tags("ExamMatrix")]
[Authorize(Roles = "Teacher,Admin")]
public class ExamMatricesController : ControllerBase
{
    private readonly IExamMatrixService _examMatrixService;

    public ExamMatricesController(IExamMatrixService examMatrixService) =>
        _examMatrixService = examMatrixService;

    [HttpGet("api/exam-matrices")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExamMatrixDto>>>> GetMatrices(CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ExamMatrixDto>>.CreateFailure("Token khong hop le."));

        var data = await _examMatrixService.GetMatricesAsync(user.Value.userId, user.Value.roles, ct);
        return Ok(ApiResponse<IReadOnlyList<ExamMatrixDto>>.CreateSuccess(data));
    }

    [HttpPost("api/exam-matrices")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamMatrixDto>>> Create([FromBody] CreateExamMatrixRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamMatrixDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.CreateAsync(request, userId, ct);
            return Ok(ApiResponse<ExamMatrixDto>.CreateSuccess(data, "Tao ma tran de thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/exam-matrices/{id:int}")]
    public async Task<ActionResult<ApiResponse<ExamMatrixDto>>> GetById(int id, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<ExamMatrixDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.GetByIdAsync(id, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<ExamMatrixDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
    }

    [HttpPut("api/exam-matrices/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamMatrixDto>>> Update(int id, [FromBody] UpdateExamMatrixRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamMatrixDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.UpdateAsync(id, request, userId, ct);
            return Ok(ApiResponse<ExamMatrixDto>.CreateSuccess(data, "Cap nhat ma tran de thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamMatrixDto>.CreateFailure(ex.Message)); }
    }

    [HttpDelete("api/exam-matrices/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token khong hop le."));

        try
        {
            await _examMatrixService.DeleteAsync(id, userId, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xoa ma tran de thanh cong."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/exam-matrices/{id:int}/validate")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamMatrixValidationResultDto>>> Validate(int id, [FromQuery] int questionBankId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamMatrixValidationResultDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.ValidateAsync(id, questionBankId, userId, ct);
            var response = ApiResponse<ExamMatrixValidationResultDto>.CreateSuccess(data);
            return Ok(response);
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamMatrixValidationResultDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamMatrixValidationResultDto>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/exam-matrices/{id:int}/generate-preview")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamMatrixPreviewDto>>> GeneratePreview(int id, [FromQuery] int questionBankId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamMatrixPreviewDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.GeneratePreviewAsync(id, questionBankId, userId, ct);
            var response = ApiResponse<ExamMatrixPreviewDto>.CreateSuccess(data);
            return Ok(response);
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamMatrixPreviewDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamMatrixPreviewDto>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/exam-matrices/{id:int}/create-exam")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> CreateExam(int id, [FromBody] CreateExamFromMatrixRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _examMatrixService.CreateExamAsync(id, request, userId, ct);
            var response = ApiResponse<ExamDto>.CreateSuccess(data);
            return Ok(response);
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
    }

    private string? GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return string.IsNullOrWhiteSpace(id) ? null : id;
    }

    private (string userId, List<string> roles)? GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return null;

        return (userId, User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList());
    }
}
