using System.Security.Claims;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize]
public class ExamsController : ControllerBase
{
    private static readonly IReadOnlyList<QuestionImportTemplateKind> QuestionImportTemplateKinds =
    [
        new("01", "single_choice", "Trac nghiem mot dap an", "Trac_Nghiem_Mot_Dap_An"),
        new("02", "multiple_choice", "Trac nghiem nhieu dap an", "Trac_Nghiem_Nhieu_Dap_An"),
        new("03", "true_false", "Dung/Sai", "Dung_Sai"),
        new("04", "short_answer", "Tra loi ngan", "Tra_Loi_Ngan")
    ];

    private static readonly IReadOnlyList<QuestionImportTemplateFormat> QuestionImportTemplateFormats =
    [
        new("CSV", "csv", "text/csv"),
        new("XLSX", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        new("TXT", "txt", "text/plain"),
        new("DOCX", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        new("PDF", "pdf", "application/pdf")
    ];

    private static readonly IReadOnlyList<QuestionImportTemplateMetadata> QuestionImportTemplateDefinitions =
        BuildQuestionImportTemplateDefinitions();

    private static readonly IReadOnlyDictionary<string, QuestionImportTemplateMetadata> QuestionImportTemplateLookup =
        QuestionImportTemplateDefinitions.ToDictionary(x => x.FileName, StringComparer.OrdinalIgnoreCase);

    private readonly IExamService _examService;
    private readonly IWebHostEnvironment _environment;

    public ExamsController(IExamService examService, IWebHostEnvironment environment)
    {
        _examService = examService;
        _environment = environment;
    }

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
            var data = await _examService.CreateAsync(classroomId, request, userId, ct);
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
            var data = await _examService.UpdateAsync(id, request, userId, ct);
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
            var data = await _examService.PatchAsync(id, request, userId, ct);
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
            await _examService.DeleteAsync(id, userId, ct);
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
            var data = await _examService.PublishAsync(id, userId, ct);
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
            var data = await _examService.AddQuestionAsync(id, request, userId, ct);
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

    [HttpGet("api/exams/question-import/templates")]
    [Authorize(Roles = "Teacher,Admin")]
    public ActionResult<ApiResponse<IReadOnlyList<QuestionImportTemplateDto>>> GetQuestionImportTemplates()
    {
        var data = BuildQuestionImportTemplateDtos();
        return Ok(ApiResponse<IReadOnlyList<QuestionImportTemplateDto>>.CreateSuccess(
            data,
            "Lay danh sach file mau import thanh cong."));
    }

    [HttpGet("api/exams/question-import/templates/{fileName}")]
    [Authorize(Roles = "Teacher,Admin")]
    public ActionResult DownloadQuestionImportTemplate(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
            return BadRequest(ApiResponse<object>.CreateFailure("Ten file mau khong hop le."));

        if (!QuestionImportTemplateLookup.TryGetValue(fileName, out var metadata))
            return NotFound(ApiResponse<object>.CreateFailure("Khong tim thay file mau import."));

        var templateDirectory = Path.GetFullPath(GetQuestionImportTemplateDirectory());
        var filePath = Path.GetFullPath(Path.Combine(templateDirectory, metadata.FileName));
        if (!filePath.StartsWith(templateDirectory + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<object>.CreateFailure("Ten file mau khong hop le."));

        if (!System.IO.File.Exists(filePath))
            return NotFound(ApiResponse<object>.CreateFailure("File mau import chua duoc cai dat tren backend."));

        return PhysicalFile(filePath, metadata.ContentType, metadata.FileName, enableRangeProcessing: true);
    }

    [HttpPost("api/exams/{id:int}/questions/import")]
    [Authorize(Roles = "Teacher,Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<QuestionImportResultDto>>> ImportQuestions(
        int id,
        [FromForm] QuestionImportUploadForm request,
        CancellationToken ct)
    {
        var user = GetCurrentUser();
        if (user is null)
            return Unauthorized(ApiResponse<QuestionImportResultDto>.CreateFailure("Token khong hop le."));

        var file = request.File;
        if (file is null)
            return BadRequest(ApiResponse<QuestionImportResultDto>.CreateFailure("Vui long chon file import."));

        try
        {
            await using var stream = file.OpenReadStream();
            var data = await _examService.ImportQuestionsAsync(
                id,
                stream,
                file.FileName,
                file.ContentType,
                file.Length,
                user.Value.userId,
                user.Value.roles,
                ct);

            if (data.Errors.Count > 0)
            {
                return BadRequest(new ApiResponse<QuestionImportResultDto>
                {
                    Success = false,
                    Message = "File import co loi. Khong co cau hoi nao duoc luu.",
                    Data = data
                });
            }

            return Ok(ApiResponse<QuestionImportResultDto>.CreateSuccess(data, "Import cau hoi thanh cong."));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<QuestionImportResultDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<QuestionImportResultDto>.CreateFailure(ex.Message));
        }
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
            var data = await _examService.UpdateQuestionAsync(id, request, userId, ct);
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
            var data = await _examService.PatchQuestionAsync(id, request, userId, ct);
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
            await _examService.DeleteQuestionAsync(id, userId, ct);
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
            var data = await _examService.AddAnswerAsync(id, request, userId, ct);
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
            var data = await _examService.UpdateAnswerAsync(id, request, userId, ct);
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
            var data = await _examService.PatchAnswerAsync(id, request, userId, ct);
            return Ok(ApiResponse<AnswerDto>.CreateSuccess(data, "Cập nhật đáp án thành công."));
        }
        catch (ValidationException ex) { return BadRequest(ApiResponse<AnswerDto>.CreateFailure(ex.Errors.First().ErrorMessage)); }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<AnswerDto>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<AnswerDto>.CreateFailure(ex.Message));
        }
    }

    private static IReadOnlyList<QuestionImportTemplateMetadata> BuildQuestionImportTemplateDefinitions() =>
        QuestionImportTemplateFormats
            .SelectMany(format => QuestionImportTemplateKinds.Select(kind => new QuestionImportTemplateMetadata(
                FileName: $"Mau_De_Thi_{kind.FileNameSegment}.{format.Extension}",
                QuestionType: kind.QuestionType,
                Format: format.Extension,
                DisplayName: $"Mau de thi {kind.Code} - {kind.DisplayName} ({format.Extension.ToUpperInvariant()})",
                ContentType: format.ContentType)))
            .ToList();

    private IReadOnlyList<QuestionImportTemplateDto> BuildQuestionImportTemplateDtos()
    {
        var templateDirectory = GetQuestionImportTemplateDirectory();
        var data = new List<QuestionImportTemplateDto>();

        foreach (var metadata in QuestionImportTemplateDefinitions)
        {
            var filePath = Path.Combine(templateDirectory, metadata.FileName);
            if (!System.IO.File.Exists(filePath))
                continue;

            var fileInfo = new FileInfo(filePath);
            data.Add(new QuestionImportTemplateDto
            {
                FileName = metadata.FileName,
                QuestionType = metadata.QuestionType,
                Format = metadata.Format,
                DisplayName = metadata.DisplayName,
                ContentType = metadata.ContentType,
                DownloadUrl = $"/api/exams/question-import/templates/{Uri.EscapeDataString(metadata.FileName)}",
                FileSizeBytes = fileInfo.Length
            });
        }

        return data;
    }

    private string GetQuestionImportTemplateDirectory() =>
        Path.Combine(_environment.ContentRootPath, "Resources", "QuestionImportTemplates");

    private sealed record QuestionImportTemplateKind(
        string Code,
        string QuestionType,
        string DisplayName,
        string FileNameSegment);

    private sealed record QuestionImportTemplateFormat(string Prefix, string Extension, string ContentType);

    private sealed record QuestionImportTemplateMetadata(
        string FileName,
        string QuestionType,
        string Format,
        string DisplayName,
        string ContentType);

    public sealed class QuestionImportUploadForm
    {
        public IFormFile? File { get; set; }
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

        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        return (userId, roles);
    }
}
