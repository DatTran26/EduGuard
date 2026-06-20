using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Common;
using FluentValidation;

namespace EduGuard.Infrastructure.Exams;

public class ExamService : IExamService
{
    private const long MaxQuestionImportFileBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> SupportedQuestionImportExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".csv",
        ".xlsx",
        ".txt",
        ".docx",
        ".pdf"
    };

    private static readonly Dictionary<string, HashSet<string>> AllowedQuestionImportContentTypesByExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".csv"] = new(StringComparer.OrdinalIgnoreCase)
        {
            "text/csv",
            "application/csv",
            "application/vnd.ms-excel",
            "application/octet-stream"
        },
        [".xlsx"] = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/octet-stream",
            "application/zip"
        },
        [".txt"] = new(StringComparer.OrdinalIgnoreCase)
        {
            "text/plain",
            "application/octet-stream"
        },
        [".docx"] = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream",
            "application/zip"
        },
        [".pdf"] = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "application/octet-stream"
        }
    };

    private readonly IExamRepository _examRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IValidator<CreateExamRequest> _createValidator;
    private readonly IValidator<UpdateExamRequest> _updateValidator;
    private readonly IValidator<PatchExamRequest> _patchValidator;
    private readonly IValidator<CreateQuestionRequest> _createQuestionValidator;
    private readonly IValidator<UpdateQuestionRequest> _updateQuestionValidator;
    private readonly IValidator<PatchQuestionRequest> _patchQuestionValidator;
    private readonly IValidator<CreateAnswerRequest> _createAnswerValidator;
    private readonly IValidator<UpdateAnswerRequest> _updateAnswerValidator;
    private readonly IValidator<PatchAnswerRequest> _patchAnswerValidator;

    public ExamService(
        IExamRepository examRepository,
        IClassroomRepository classroomRepository,
        IValidator<CreateExamRequest> createValidator,
        IValidator<UpdateExamRequest> updateValidator,
        IValidator<PatchExamRequest> patchValidator,
        IValidator<CreateQuestionRequest> createQuestionValidator,
        IValidator<UpdateQuestionRequest> updateQuestionValidator,
        IValidator<PatchQuestionRequest> patchQuestionValidator,
        IValidator<CreateAnswerRequest> createAnswerValidator,
        IValidator<UpdateAnswerRequest> updateAnswerValidator,
        IValidator<PatchAnswerRequest> patchAnswerValidator)
    {
        _examRepository = examRepository;
        _classroomRepository = classroomRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _patchValidator = patchValidator;
        _createQuestionValidator = createQuestionValidator;
        _updateQuestionValidator = updateQuestionValidator;
        _patchQuestionValidator = patchQuestionValidator;
        _createAnswerValidator = createAnswerValidator;
        _updateAnswerValidator = updateAnswerValidator;
        _patchAnswerValidator = patchAnswerValidator;
    }

    public async Task<ExamDto> CreateAsync(int classroomId, CreateExamRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, ct);
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, classroomId, ct);
        ClassroomAccessHelper.EnsureTeacherOwnsClassroom(classroom, teacherId);

        var questions = request.Questions ?? [];
        var preparedQuestions = new List<Question>();

        for (var index = 0; index < questions.Count; index++)
            preparedQuestions.Add(await BuildQuestionEntityFromRequestAsync(questions[index], index, "Câu hỏi nháp", ct));

        ExamQuestionOrderHelper.Renumber(preparedQuestions);

        var exam = new Exam
        {
            ClassroomId = classroomId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            StartTime = ExamDateTimeHelper.NormalizeNullableUtc(request.StartTime),
            EndTime = ExamDateTimeHelper.NormalizeNullableUtc(request.EndTime),
            EnableAntiCheat = request.EnableAntiCheat,
            CreatedAt = DateTime.UtcNow,
            Setting = BuildSetting(request.Settings),
            Questions = preparedQuestions
        };

        await _examRepository.AddAsync(exam, ct);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<IReadOnlyList<ExamDto>> GetByClassroomAsync(
        int classroomId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, classroomId, ct);
        await ClassroomAccessHelper.EnsureCanAccessClassroomAsync(_classroomRepository, classroom, userId, roles, ct);

        var exams = await _examRepository.GetByClassroomIdAsync(classroomId, ct);
        var isTeacher = classroom.TeacherId == userId || roles.Contains("Admin");

        return exams
            .Where(exam => isTeacher || exam.IsPublished)
            .Select(exam => ExamMapper.MapExam(exam))
            .ToList();
    }

    public async Task<ExamDto> GetByIdAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var exam = await RequireAccessibleExamAsync(examId, userId, roles, ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<ExamDto> UpdateAsync(int examId, UpdateExamRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);
        ApplyExamFields(exam, request);
        exam.UpdatedAt = DateTime.UtcNow;
        UpsertSetting(exam, request.Settings);
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<ExamDto> PatchAsync(int examId, PatchExamRequest request, string teacherId, CancellationToken ct = default)
    {
        await _patchValidator.ValidateAndThrowAsync(request, ct);
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);

        if (request.Title.IsSpecified)
            exam.Title = request.Title.Value!.Trim();

        if (request.Description.IsSpecified)
        {
            exam.Description = string.IsNullOrWhiteSpace(request.Description.Value)
                ? null
                : request.Description.Value.Trim();
        }

        if (request.DurationMinutes.IsSpecified)
            exam.DurationMinutes = request.DurationMinutes.Value;

        if (request.StartTime.IsSpecified)
            exam.StartTime = ExamDateTimeHelper.NormalizeNullableUtc(request.StartTime.Value);

        if (request.EndTime.IsSpecified)
            exam.EndTime = ExamDateTimeHelper.NormalizeNullableUtc(request.EndTime.Value);

        if (request.EnableAntiCheat.IsSpecified)
            exam.EnableAntiCheat = request.EnableAntiCheat.Value;

        EnsureExamWindowValid(exam.StartTime, exam.EndTime);

        if (request.Settings.IsSpecified && request.Settings.Value is not null)
            PatchExamSetting(exam, request.Settings.Value);

        exam.UpdatedAt = DateTime.UtcNow;
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task DeleteAsync(int examId, string teacherId, CancellationToken ct = default)
    {
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);
        _examRepository.Remove(exam);
        await _examRepository.SaveChangesAsync(ct);
    }

    public async Task<ExamDto> PublishAsync(int examId, string teacherId, CancellationToken ct = default)
    {
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);
        EnsureCanPublishExam(exam);

        exam.IsPublished = true;
        exam.UpdatedAt = DateTime.UtcNow;
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<QuestionImportResultDto> PreviewQuestionImportAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileLength,
        CancellationToken ct = default) =>
        await ReviewQuestionImportAsync(fileStream, fileName, contentType, fileLength, ct);

    public async Task<QuestionImportResultDto> ImportQuestionsAsync(
        int examId,
        Stream fileStream,
        string fileName,
        string contentType,
        long fileLength,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var exam = await RequireQuestionImportExamAsync(examId, userId, roles, ct);
        var result = await ReviewQuestionImportAsync(fileStream, fileName, contentType, fileLength, ct);
        if (result.Errors.Count > 0)
            return result;

        var nextOrderIndex = exam.Questions.Count == 0
            ? 1
            : exam.Questions.Max(x => x.OrderIndex) + 1;
        var importedQuestions = result.Questions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .Select(questionDto => new Question
            {
                ExamId = exam.Id,
                Content = questionDto.Content.Trim(),
                QuestionType = questionDto.QuestionType,
                Score = questionDto.Score,
                OrderIndex = nextOrderIndex++,
                CreatedAt = DateTime.UtcNow,
                Answers = questionDto.Answers.Select((answer, index) => new Answer
                {
                    Content = answer.Content,
                    IsCorrect = answer.IsCorrect,
                    OrderIndex = index + 1
                }).ToList()
            })
            .ToList();

        foreach (var question in importedQuestions)
            await _examRepository.AddQuestionAsync(question, ct);

        exam.UpdatedAt = DateTime.UtcNow;
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);

        result.ImportedCount = importedQuestions.Count;
        result.Questions = importedQuestions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .Select(x => ExamMapper.MapQuestion(x))
            .ToList();

        return result;
    }

    public async Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(
        int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var exam = await RequireAccessibleExamAsync(examId, userId, roles, ct);
        EnsureQuestionBankAccess(exam, userId, roles);
        return exam.Questions.OrderBy(x => x.OrderIndex).ThenBy(x => x.Id).Select(x => ExamMapper.MapQuestion(x)).ToList();
    }

    public async Task<QuestionDto> AddQuestionAsync(int examId, CreateQuestionRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createQuestionValidator.ValidateAndThrowAsync(request, ct);
        var exam = await RequireTeacherOwnedExamWithQuestionsAsync(examId, teacherId, ct);
        var normalizedAnswers = ExamQuestionValidator.NormalizeAnswers(request.QuestionType, request.Answers);
        ExamQuestionValidator.ValidateQuestionInput(request.QuestionType, normalizedAnswers);

        var question = new Question
        {
            ExamId = exam.Id,
            Content = request.Content.Trim(),
            QuestionType = request.QuestionType,
            Score = request.Score,
            OrderIndex = exam.Questions.Count + 1,
            CreatedAt = DateTime.UtcNow,
            Answers = normalizedAnswers.Select((answer, index) => new Answer
            {
                Content = answer.Content,
                IsCorrect = answer.IsCorrect,
                OrderIndex = index + 1
            }).ToList()
        };

        await _examRepository.AddQuestionAsync(question, ct);
        await _examRepository.SaveChangesAsync(ct);

        var examWithQuestions = await _examRepository.GetByIdWithDetailsAsync(exam.Id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
        ExamQuestionOrderHelper.Resequence(examWithQuestions.Questions.ToList(), question.Id, request.OrderIndex);
        await _examRepository.SaveChangesAsync(ct);

        var saved = await _examRepository.GetQuestionByIdAsync(question.Id, ct) ?? question;
        return ExamMapper.MapQuestion(saved);
    }

    public async Task<QuestionDto> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateQuestionValidator.ValidateAndThrowAsync(request, ct);
        var question = await RequireTeacherOwnedQuestionAsync(questionId, teacherId, ct);
        var normalizedAnswers = ExamQuestionValidator.NormalizeAnswers(request.QuestionType, request.Answers);
        ExamQuestionValidator.ValidateQuestionInput(request.QuestionType, normalizedAnswers);

        question.Content = request.Content.Trim();
        question.QuestionType = request.QuestionType;
        question.Score = request.Score;
        _examRepository.RemoveAnswers(question.Answers);
        question.Answers = normalizedAnswers.Select((answer, index) => new Answer
        {
            QuestionId = question.Id,
            Content = answer.Content,
            IsCorrect = answer.IsCorrect,
            OrderIndex = index + 1
        }).ToList();

        _examRepository.UpdateQuestion(question);
        await _examRepository.SaveChangesAsync(ct);

        var exam = await _examRepository.GetByIdWithDetailsAsync(question.ExamId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
        ExamQuestionOrderHelper.Resequence(exam.Questions.ToList(), question.Id, request.OrderIndex);
        await _examRepository.SaveChangesAsync(ct);

        var saved = await _examRepository.GetQuestionByIdAsync(question.Id, ct) ?? question;
        return ExamMapper.MapQuestion(saved);
    }

    public async Task<QuestionDto> PatchQuestionAsync(
        int questionId, PatchQuestionRequest request, string teacherId, CancellationToken ct = default)
    {
        await _patchQuestionValidator.ValidateAndThrowAsync(request, ct);
        var question = await RequireTeacherOwnedQuestionAsync(questionId, teacherId, ct);

        if (request.Content.IsSpecified)
            question.Content = request.Content.Value!.Trim();

        if (request.QuestionType.IsSpecified)
            question.QuestionType = request.QuestionType.Value;

        if (request.Score.IsSpecified)
            question.Score = request.Score.Value;

        _examRepository.UpdateQuestion(question);
        await _examRepository.SaveChangesAsync(ct);

        if (request.OrderIndex.IsSpecified)
        {
            var exam = await _examRepository.GetByIdWithDetailsAsync(question.ExamId, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
            ExamQuestionOrderHelper.Resequence(exam.Questions.ToList(), question.Id, request.OrderIndex.Value);
            await _examRepository.SaveChangesAsync(ct);
        }

        var saved = await _examRepository.GetQuestionByIdAsync(question.Id, ct) ?? question;
        return ExamMapper.MapQuestion(saved);
    }

    public async Task DeleteQuestionAsync(int questionId, string teacherId, CancellationToken ct = default)
    {
        var question = await RequireTeacherOwnedQuestionAsync(questionId, teacherId, ct);
        var exam = await _examRepository.GetByIdWithDetailsAsync(question.ExamId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        _examRepository.RemoveAnswers(question.Answers);
        _examRepository.RemoveQuestion(question);
        ExamQuestionOrderHelper.Renumber(exam.Questions.Where(x => x.Id != question.Id).ToList());
        await _examRepository.SaveChangesAsync(ct);
    }

    public async Task<AnswerDto> AddAnswerAsync(int questionId, CreateAnswerRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createAnswerValidator.ValidateAndThrowAsync(request, ct);
        var question = await RequireTeacherOwnedQuestionAsync(questionId, teacherId, ct);
        if (question.QuestionType is Domain.Enums.QuestionType.TrueFalse)
            throw new InvalidOperationException("Câu đúng/sai không thể thêm đáp án riêng lẻ.");

        var answer = new Answer
        {
            QuestionId = question.Id,
            Content = request.Content.Trim(),
            IsCorrect = request.IsCorrect,
            OrderIndex = request.OrderIndex > 0 ? request.OrderIndex : question.Answers.Count + 1
        };

        await _examRepository.AddAnswerAsync(answer, ct);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapAnswer(answer);
    }

    public async Task<AnswerDto> UpdateAnswerAsync(int answerId, UpdateAnswerRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateAnswerValidator.ValidateAndThrowAsync(request, ct);
        var answer = await _examRepository.GetAnswerByIdAsync(answerId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đáp án.");

        if (answer.Question.Exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được sửa đáp án.");

        answer.Content = request.Content.Trim();
        answer.IsCorrect = request.IsCorrect;
        answer.OrderIndex = request.OrderIndex;
        _examRepository.UpdateAnswer(answer);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapAnswer(answer);
    }

    public async Task<AnswerDto> PatchAnswerAsync(
        int answerId, PatchAnswerRequest request, string teacherId, CancellationToken ct = default)
    {
        await _patchAnswerValidator.ValidateAndThrowAsync(request, ct);
        var answer = await _examRepository.GetAnswerByIdAsync(answerId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đáp án.");

        if (answer.Question.Exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được sửa đáp án.");

        if (request.Content.IsSpecified)
            answer.Content = request.Content.Value!.Trim();

        if (request.IsCorrect.IsSpecified)
            answer.IsCorrect = request.IsCorrect.Value;

        if (request.OrderIndex.IsSpecified)
            answer.OrderIndex = request.OrderIndex.Value;

        _examRepository.UpdateAnswer(answer);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapAnswer(answer);
    }

    private async Task<QuestionImportResultDto> ReviewQuestionImportAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        long fileLength,
        CancellationToken ct)
    {
        var result = new QuestionImportResultDto
        {
            FileName = Path.GetFileName(fileName)
        };

        AddQuestionImportFileErrors(result, fileName, contentType, fileLength);
        if (result.Errors.Count > 0)
        {
            result.FailedCount = CountFailedRows(result.Errors);
            return result;
        }

        if (fileStream.CanSeek)
            fileStream.Position = 0;

        var parsed = await QuestionImportParser.ParseAsync(fileStream, fileName, ct);
        result.TotalRows = parsed.TotalRows;

        if (parsed.Errors.Count > 0)
        {
            result.Errors.AddRange(parsed.Errors);
            result.FailedCount = CountFailedRows(result.Errors);
            return result;
        }

        if (parsed.Questions.Count == 0)
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 1,
                FieldName = "file",
                ErrorMessage = "Import file does not contain valid questions."
            });
            result.FailedCount = CountFailedRows(result.Errors);
            return result;
        }

        var previewQuestions = new List<Question>();

        for (var index = 0; index < parsed.Questions.Count; index++)
            previewQuestions.Add(await BuildQuestionEntityFromRequestAsync(parsed.Questions[index], index, "Câu import", ct));

        ExamQuestionOrderHelper.Renumber(previewQuestions);
        result.Questions = previewQuestions.Select(x => ExamMapper.MapQuestion(x)).ToList();
        result.ImportedCount = result.Questions.Count;
        result.FailedCount = 0;
        return result;
    }

    private async Task<Question> BuildQuestionEntityFromRequestAsync(
        CreateQuestionRequest request,
        int requestIndex,
        string sourceLabel,
        CancellationToken ct)
    {
        var validationResult = await _createQuestionValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            throw new InvalidOperationException($"{sourceLabel} {requestIndex + 1} chưa hợp lệ: {validationResult.Errors.First().ErrorMessage}");

        var normalizedAnswers = ExamQuestionValidator.NormalizeAnswers(request.QuestionType, request.Answers);

        try
        {
            ExamQuestionValidator.ValidateQuestionInput(request.QuestionType, normalizedAnswers);
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException($"{sourceLabel} {requestIndex + 1} chưa hợp lệ: {ex.Message}");
        }

        return new Question
        {
            Content = request.Content.Trim(),
            QuestionType = request.QuestionType,
            Score = request.Score,
            OrderIndex = request.OrderIndex,
            CreatedAt = DateTime.UtcNow,
            Answers = normalizedAnswers.Select((answer, answerIndex) => new Answer
            {
                Content = answer.Content,
                IsCorrect = answer.IsCorrect,
                OrderIndex = answerIndex + 1
            }).ToList()
        };
    }

    private static void AddQuestionImportFileErrors(
        QuestionImportResultDto result,
        string fileName,
        string contentType,
        long fileLength)
    {
        var safeFileName = Path.GetFileName(fileName);
        var extension = Path.GetExtension(safeFileName);
        var normalizedContentType = contentType.Split(';', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim()
            ?? string.Empty;

        if (fileLength <= 0)
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = "Import file is empty."
            });
        }

        if (fileLength > MaxQuestionImportFileBytes)
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = "Import file must not exceed 5 MB."
            });
        }

        if (string.Equals(extension, ".doc", StringComparison.OrdinalIgnoreCase))
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = "Legacy .doc files are not supported. Please convert the file to .docx and use the standard question template."
            });
        }
        else if (string.Equals(extension, ".xls", StringComparison.OrdinalIgnoreCase))
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = "Legacy .xls files are not supported. Please convert the file to .xlsx and use the standard question template."
            });
        }
        else if (string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase))
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = ".zip media imports are not supported until image/file attachments are implemented."
            });
        }
        else if (!SupportedQuestionImportExtensions.Contains(extension))
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "file",
                ErrorMessage = "Question import supports .csv, .xlsx, .txt, .docx, and text-based .pdf files."
            });
        }

        if (!string.IsNullOrWhiteSpace(normalizedContentType)
            && SupportedQuestionImportExtensions.Contains(extension)
            && !IsAllowedQuestionImportContentType(extension, normalizedContentType))
        {
            result.Errors.Add(new QuestionImportErrorDto
            {
                RowNumber = 0,
                FieldName = "contentType",
                ErrorMessage = "Invalid content type for the selected question import file."
            });
        }
    }

    private static bool IsAllowedQuestionImportContentType(string extension, string contentType) =>
        AllowedQuestionImportContentTypesByExtension.TryGetValue(extension, out var allowedContentTypes)
        && allowedContentTypes.Contains(contentType);

    private static int CountFailedRows(IEnumerable<QuestionImportErrorDto> errors) =>
        errors.Select(x => x.RowNumber).Distinct().Count();

    private static ExamSetting BuildSetting(ExamSettingDto dto) => new()
    {
        ShuffleQuestions = dto.ShuffleQuestions,
        ShuffleAnswers = dto.ShuffleAnswers,
        MaxAttempts = dto.MaxAttempts,
        ShowResultAfterSubmit = dto.ShowResultAfterSubmit,
        RequireFullscreen = dto.RequireFullscreen
    };

    private static void ApplyExamFields(Exam exam, UpdateExamRequest request)
    {
        exam.Title = request.Title.Trim();
        exam.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        exam.DurationMinutes = request.DurationMinutes;
        exam.StartTime = ExamDateTimeHelper.NormalizeNullableUtc(request.StartTime);
        exam.EndTime = ExamDateTimeHelper.NormalizeNullableUtc(request.EndTime);
        exam.EnableAntiCheat = request.EnableAntiCheat;
    }

    private static void UpsertSetting(Exam exam, ExamSettingDto dto)
    {
        exam.Setting ??= new ExamSetting { ExamId = exam.Id };
        exam.Setting.ShuffleQuestions = dto.ShuffleQuestions;
        exam.Setting.ShuffleAnswers = dto.ShuffleAnswers;
        exam.Setting.MaxAttempts = dto.MaxAttempts;
        exam.Setting.ShowResultAfterSubmit = dto.ShowResultAfterSubmit;
        exam.Setting.RequireFullscreen = dto.RequireFullscreen;
    }

    private static void PatchExamSetting(Exam exam, PatchExamSettingDto patch)
    {
        exam.Setting ??= new ExamSetting { ExamId = exam.Id };

        if (patch.ShuffleQuestions.IsSpecified)
            exam.Setting.ShuffleQuestions = patch.ShuffleQuestions.Value;

        if (patch.ShuffleAnswers.IsSpecified)
            exam.Setting.ShuffleAnswers = patch.ShuffleAnswers.Value;

        if (patch.MaxAttempts.IsSpecified)
            exam.Setting.MaxAttempts = patch.MaxAttempts.Value;

        if (patch.ShowResultAfterSubmit.IsSpecified)
            exam.Setting.ShowResultAfterSubmit = patch.ShowResultAfterSubmit.Value;

        if (patch.RequireFullscreen.IsSpecified)
            exam.Setting.RequireFullscreen = patch.RequireFullscreen.Value;
    }

    private static void EnsureExamWindowValid(DateTime? startTime, DateTime? endTime)
    {
        if (startTime.HasValue && endTime.HasValue && endTime <= startTime)
            throw new InvalidOperationException("Thời gian đóng đề phải sau thời gian mở đề.");
    }

    private static void EnsureCanPublishExam(Exam exam)
    {
        var errors = new List<string>();

        if (exam.DurationMinutes <= 0)
            errors.Add("Thời gian làm bài phải lớn hơn 0 phút.");

        if ((exam.Setting?.MaxAttempts ?? 1) <= 0)
            errors.Add("Số lần làm tối đa phải lớn hơn 0.");

        if (exam.StartTime.HasValue && exam.EndTime.HasValue && exam.EndTime <= exam.StartTime)
            errors.Add("Thời gian đóng đề phải sau thời gian mở đề.");

        var questions = exam.Questions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .ToList();

        if (questions.Count == 0)
            errors.Add("Đề thi cần ít nhất một câu hỏi trước khi publish.");

        foreach (var question in questions)
            AddQuestionPublishErrors(question, errors);

        if (errors.Count > 0)
            throw new InvalidOperationException("Đề thi chưa đủ điều kiện publish: " + string.Join(" ", errors));
    }

    private static void AddQuestionPublishErrors(Question question, List<string> errors)
    {
        var label = $"Câu {question.OrderIndex}";
        var answers = question.Answers
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .ToList();
        var correctCount = answers.Count(x => x.IsCorrect);

        if (string.IsNullOrWhiteSpace(question.Content))
            errors.Add($"{label}: nội dung câu hỏi không được để trống.");

        if (question.Score <= 0)
            errors.Add($"{label}: điểm câu hỏi phải lớn hơn 0.");

        switch (question.QuestionType)
        {
            case QuestionType.SingleChoice:
                if (answers.Count < 2)
                    errors.Add($"{label}: câu một đáp án cần ít nhất 2 lựa chọn.");
                if (correctCount != 1)
                    errors.Add($"{label}: câu một đáp án phải có đúng 1 đáp án đúng.");
                break;

            case QuestionType.MultipleChoice:
                if (answers.Count < 2)
                    errors.Add($"{label}: câu nhiều đáp án cần ít nhất 2 lựa chọn.");
                if (correctCount == 0)
                    errors.Add($"{label}: câu nhiều đáp án cần ít nhất 1 đáp án đúng.");
                break;

            case QuestionType.TrueFalse:
                if (answers.Count != 2)
                    errors.Add($"{label}: câu đúng/sai phải có đúng 2 lựa chọn Đúng và Sai.");
                if (correctCount != 1)
                    errors.Add($"{label}: câu đúng/sai phải có đúng 1 đáp án đúng.");
                break;

            case QuestionType.ShortAnswer:
                if (answers.Count == 0)
                    errors.Add($"{label}: câu tự luận ngắn cần ít nhất 1 đáp án mẫu.");
                break;

            default:
                errors.Add($"{label}: loại câu hỏi chưa được hỗ trợ.");
                break;
        }
    }

    private async Task<Exam> RequireAccessibleExamAsync(int examId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, exam.ClassroomId, ct);
        if (roles.Contains("Admin") || exam.TeacherId == userId)
            return exam;

        await ClassroomAccessHelper.EnsureCanAccessClassroomAsync(_classroomRepository, classroom, userId, roles, ct);
        if (!exam.IsPublished)
            throw new UnauthorizedAccessException("Bạn không có quyền xem đề thi này.");

        return exam;
    }

    private async Task<Exam> RequireTeacherOwnedExamAsync(int examId, string teacherId, CancellationToken ct)
    {
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
        if (exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được thực hiện thao tác này.");
        return exam;
    }

    private Task<Exam> RequireTeacherOwnedExamWithQuestionsAsync(int examId, string teacherId, CancellationToken ct) =>
        RequireTeacherOwnedExamAsync(examId, teacherId, ct);

    private async Task<Exam> RequireQuestionImportExamAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct)
    {
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("KhÃ´ng tÃ¬m tháº¥y Ä‘á» thi.");

        if (roles.Contains("Admin"))
            return exam;

        if (roles.Contains("Teacher") && exam.TeacherId == userId)
            return exam;

        throw new UnauthorizedAccessException("Only the teacher who created the exam or an admin can import questions.");
    }

    private async Task<Question> RequireTeacherOwnedQuestionAsync(int questionId, string teacherId, CancellationToken ct)
    {
        var question = await _examRepository.GetQuestionByIdAsync(questionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy câu hỏi.");
        if (question.Exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được quản lý câu hỏi.");
        return question;
    }

    private static void EnsureQuestionBankAccess(Exam exam, string userId, IReadOnlyList<string> roles)
    {
        if (roles.Contains("Admin") || exam.TeacherId == userId)
            return;
        throw new UnauthorizedAccessException("Bạn chưa thể xem nội dung câu hỏi ở màn hình này.");
    }
}
