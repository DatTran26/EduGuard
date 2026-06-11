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
public class ExamsController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamsController(IExamService examService) => _examService = examService;

    [HttpGet("api/classrooms/{classroomId:int}/exams")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExamDto>>>> GetByClassroom(int classroomId, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<ExamDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.GetByClassroomAsync(classroomId, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<IReadOnlyList<ExamDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<ExamDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<ExamDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/classrooms/{classroomId:int}/exams")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> Create(
        int classroomId, [FromBody] CreateExamRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.CreateAsync(classroomId, request, userId.Value, ct);
            return Ok(ApiResponse<ExamDto>.CreateSuccess(data, "Tạo đề thi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message));
        }
    }

    [HttpGet("api/exams/{id:int}")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> GetById(int id, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.GetByIdAsync(id, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<ExamDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPut("api/exams/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> Update(int id, [FromBody] UpdateExamRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.UpdateAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<ExamDto>.CreateSuccess(data, "Cập nhật đề thi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPatch("api/exams/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> Patch(
        int id, [FromBody] PatchExamRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.PatchAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<ExamDto>.CreateSuccess(data, "Cập nhật đề thi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
    }

    [HttpDelete("api/exams/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _examService.DeleteAsync(id, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa đề thi thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/exams/{id:int}/publish")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> Publish(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<ExamDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.PublishAsync(id, userId.Value, ct);
            return Ok(ApiResponse<ExamDto>.CreateSuccess(data, "Publish đề thi thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<ExamDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<ExamDto>.CreateFailure(ex.Message)); }
    }

    [HttpGet("api/exams/{id:int}/questions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QuestionDto>>>> GetQuestions(int id, CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.GetQuestionsAsync(id, user.Value.userId, user.Value.roles, ct);
            return Ok(ApiResponse<IReadOnlyList<QuestionDto>>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<IReadOnlyList<QuestionDto>>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/exams/{id:int}/questions")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<QuestionDto>>> AddQuestion(
        int id, [FromBody] CreateQuestionRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<QuestionDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.AddQuestionAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<QuestionDto>.CreateSuccess(data, "Thêm câu hỏi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
    }

    [HttpPut("api/questions/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<QuestionDto>>> UpdateQuestion(
        int id, [FromBody] UpdateQuestionRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<QuestionDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.UpdateQuestionAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<QuestionDto>.CreateSuccess(data, "Cập nhật câu hỏi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
    }

    [HttpPatch("api/questions/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<QuestionDto>>> PatchQuestion(
        int id, [FromBody] PatchQuestionRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<QuestionDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.PatchQuestionAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<QuestionDto>.CreateSuccess(data, "Cập nhật câu hỏi thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<QuestionDto>.CreateFailure(ex.Message)); }
    }

    [HttpDelete("api/questions/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteQuestion(int id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            await _examService.DeleteQuestionAsync(id, userId.Value, ct);
            return Ok(ApiResponse<object>.CreateSuccess(new { }, "Xóa câu hỏi thành công."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message));
        }
    }

    [HttpPost("api/questions/{id:int}/answers")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AnswerDto>>> AddAnswer(
        int id, [FromBody] CreateAnswerRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AnswerDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.AddAnswerAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<AnswerDto>.CreateSuccess(data, "Thêm đáp án thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AnswerDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AnswerDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AnswerDto>.CreateFailure(ex.Message));
        }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<AnswerDto>.CreateFailure(ex.Message)); }
    }

    [HttpPut("api/answers/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AnswerDto>>> UpdateAnswer(
        int id, [FromBody] UpdateAnswerRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AnswerDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.UpdateAnswerAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<AnswerDto>.CreateSuccess(data, "Cập nhật đáp án thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AnswerDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AnswerDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AnswerDto>.CreateFailure(ex.Message));
        }
    }

    [HttpPatch("api/answers/{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<AnswerDto>>> PatchAnswer(
        int id, [FromBody] PatchAnswerRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized(ApiResponse<AnswerDto>.CreateFailure("Token không hợp lệ."));

        try
        {
            var data = await _examService.PatchAnswerAsync(id, request, userId.Value, ct);
            return Ok(ApiResponse<AnswerDto>.CreateSuccess(data, "Cập nhật đáp án thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AnswerDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AnswerDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AnswerDto>.CreateFailure(ex.Message));
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
