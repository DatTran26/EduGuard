using System.Security.Claims;
using EduGuard.Api.Contracts.QuestionBanks;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.DTOs.QuestionBanks;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Enums;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Tags("QuestionBank")]
[Authorize(Roles = "Teacher,Admin")]
public class QuestionBanksController : ControllerBase
{
    private readonly IQuestionBankService _questionBankService;

    public QuestionBanksController(IQuestionBankService questionBankService) =>
        _questionBankService = questionBankService;

    [HttpGet("api/question-banks")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuestionBankDto>>>> GetBanks(CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<QuestionBankDto>>.CreateFailure("Token khong hop le."));

        var data = await _questionBankService.GetBanksAsync(user.Value.userId, user.Value.roles, ct);
        return Ok(ApiResponse<IReadOnlyList<QuestionBankDto>>.CreateSuccess(data));
    }

    [HttpPost("api/question-banks")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<QuestionBankDto>>> CreateBank([FromBody] CreateQuestionBankRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<QuestionBankDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.CreateBankAsync(request, userId, ct);
            return Ok(ApiResponse<QuestionBankDto>.CreateSuccess(data, "Tao ngan hang cau hoi thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<QuestionBankDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
    }

    [HttpGet("api/question-banks/{id:int}")]
    public async Task<ActionResult<ApiResponse<QuestionBankDto>>> GetBank(int id, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<QuestionBankDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.GetBankByIdAsync(id, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<QuestionBankDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionBankDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionBankDto>.CreateFailure(ex.Message)); }
    }

    [HttpPut("api/question-banks/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<QuestionBankDto>>> UpdateBank(int id, [FromBody] UpdateQuestionBankRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<QuestionBankDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.UpdateBankAsync(id, request, userId, ct);
            return Ok(ApiResponse<QuestionBankDto>.CreateSuccess(data, "Cap nhat ngan hang cau hoi thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<QuestionBankDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionBankDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionBankDto>.CreateFailure(ex.Message)); }
    }

    [HttpDelete("api/question-banks/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteBank(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token khong hop le."));

        try
        {
            await _questionBankService.DeleteBankAsync(id, userId, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xoa ngan hang cau hoi thanh cong."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/question-banks/{bankId:int}/questions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BankQuestionDto>>>> GetQuestions(
        int bankId,
        [FromQuery] string? keyword,
        [FromQuery] DifficultyLevel? difficulty,
        [FromQuery] QuestionType? questionType,
        [FromQuery] QuestionStatus? status,
        [FromQuery] string? chapter,
        CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<BankQuestionDto>>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.GetQuestionsAsync(bankId, user.Value.userId, user.Value.roles, keyword, difficulty, questionType, status, chapter, ct);
            return Ok(ApiResponse<IReadOnlyList<BankQuestionDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<BankQuestionDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<BankQuestionDto>>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/question-banks/{bankId:int}/questions")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<BankQuestionDto>>> CreateQuestion(int bankId, [FromBody] CreateBankQuestionRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<BankQuestionDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.CreateQuestionAsync(bankId, request, userId, ct);
            return Ok(ApiResponse<BankQuestionDto>.CreateSuccess(data, "Tao cau hoi ngan hang thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<BankQuestionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
    }

    [HttpPut("api/bank-questions/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<BankQuestionDto>>> UpdateQuestion(int id, [FromBody] UpdateBankQuestionRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<BankQuestionDto>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.UpdateQuestionAsync(id, request, userId, ct);
            return Ok(ApiResponse<BankQuestionDto>.CreateSuccess(data, "Cap nhat cau hoi ngan hang thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<BankQuestionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<BankQuestionDto>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/bank-questions/{id:int}/archive")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> ArchiveQuestion(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token khong hop le."));

        try
        {
            await _questionBankService.ArchiveQuestionAsync(id, userId, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Archive cau hoi thanh cong."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/question-banks/{bankId:int}/questions/import")]
    [Authorize(Roles = "Teacher")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<BankQuestionImportResultDto>>> ImportQuestions(int bankId, [FromForm] ImportBankQuestionsFormRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<BankQuestionImportResultDto>.CreateFailure("Token khong hop le."));

        if (request.File is null)
            return BadRequest(ApiResponse<BankQuestionImportResultDto>.CreateFailure("Vui long chon file import."));

        try
        {
            await using var stream = request.File.OpenReadStream();
            var data = await _questionBankService.ImportQuestionsAsync(bankId, stream, request.File.FileName, request.File.ContentType, request.File.Length, request.ToRequest(), userId, ct);
            if (data.Errors.Count > 0)
                return BadRequest(new ApiResponse<BankQuestionImportResultDto> { Success = false, Message = "File import co loi. Khong co cau hoi nao duoc luu.", Data = data });

            return Ok(ApiResponse<BankQuestionImportResultDto>.CreateSuccess(data, "Import cau hoi vao ngan hang thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<BankQuestionImportResultDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<BankQuestionImportResultDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<BankQuestionImportResultDto>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<BankQuestionImportResultDto>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/exams/{examId:int}/bank-questions")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuestionDto>>>> SnapshotToExam(int examId, [FromBody] SnapshotBankQuestionsRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure("Token khong hop le."));

        try
        {
            var data = await _questionBankService.SnapshotQuestionsToExamAsync(examId, request, userId, ct);
            return Ok(ApiResponse<IReadOnlyList<QuestionDto>>.CreateSuccess(data, "Them cau hoi tu ngan hang vao de thanh cong."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Message)); }
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
