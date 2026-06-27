using EduGuard.Application.DTOs.ExamMatrices;
using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Common;
using EduGuard.Infrastructure.Data;
using EduGuard.Infrastructure.Exams;
using EduGuard.Infrastructure.QuestionBanks;
using FluentValidation;

namespace EduGuard.Infrastructure.ExamMatrices;

public class ExamMatrixService : IExamMatrixService
{
    private readonly IExamMatrixRepository _matrixRepository;
    private readonly IQuestionBankRepository _questionBankRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IExamRepository _examRepository;
    private readonly AppDbContext _db;
    private readonly IValidator<CreateExamMatrixRequest> _createValidator;
    private readonly IValidator<UpdateExamMatrixRequest> _updateValidator;
    private readonly IValidator<CreateExamFromMatrixRequest> _createExamValidator;

    public ExamMatrixService(
        IExamMatrixRepository matrixRepository,
        IQuestionBankRepository questionBankRepository,
        IClassroomRepository classroomRepository,
        IExamRepository examRepository,
        AppDbContext db,
        IValidator<CreateExamMatrixRequest> createValidator,
        IValidator<UpdateExamMatrixRequest> updateValidator,
        IValidator<CreateExamFromMatrixRequest> createExamValidator)
    {
        _matrixRepository = matrixRepository;
        _questionBankRepository = questionBankRepository;
        _classroomRepository = classroomRepository;
        _examRepository = examRepository;
        _db = db;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _createExamValidator = createExamValidator;
    }

    public async Task<IReadOnlyList<ExamMatrixDto>> GetMatricesAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var matrices = IsAdmin(roles)
            ? await _matrixRepository.GetAllAsync(ct)
            : await _matrixRepository.GetByTeacherAsync(userId, ct);

        return matrices.Select(ExamMatrixMapper.MapMatrix).ToList();
    }

    public async Task<ExamMatrixDto> GetByIdAsync(int matrixId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var matrix = await RequireAccessibleMatrixAsync(matrixId, userId, roles, ct);
        return ExamMatrixMapper.MapMatrix(matrix);
    }

    public async Task<ExamMatrixDto> CreateAsync(CreateExamMatrixRequest request, string teacherId, CancellationToken ct = default)
    {
        PrepareMatrixRequest(request);
        await _createValidator.ValidateAndThrowAsync(request, ct);
        ValidateMatrixTotals(request.TotalQuestions, request.Items);
        var matrix = BuildMatrix(request, teacherId);
        await _matrixRepository.AddAsync(matrix, ct);
        await _matrixRepository.SaveChangesAsync(ct);
        return ExamMatrixMapper.MapMatrix(matrix);
    }

    public async Task<ExamMatrixDto> UpdateAsync(int matrixId, UpdateExamMatrixRequest request, string teacherId, CancellationToken ct = default)
    {
        PrepareMatrixRequest(request);
        await _updateValidator.ValidateAndThrowAsync(request, ct);
        ValidateMatrixTotals(request.TotalQuestions, request.Items);
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        ApplyMatrixUpdate(matrix, request);
        _matrixRepository.RemoveItems(matrix.Items);
        matrix.Items = BuildItems(request.Items, CalculateScorePerQuestion(request.TotalScore, request.TotalQuestions));
        _matrixRepository.Update(matrix);
        await _matrixRepository.SaveChangesAsync(ct);
        return ExamMatrixMapper.MapMatrix(matrix);
    }

    public async Task DeleteAsync(int matrixId, string teacherId, CancellationToken ct = default)
    {
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        _matrixRepository.Remove(matrix);
        await _matrixRepository.SaveChangesAsync(ct);
    }
    public async Task<ExamMatrixValidationResultDto> ValidateAsync(int matrixId, int questionBankId, string teacherId, CancellationToken ct = default)
    {
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        var bank = await RequireTeacherBankAsync(questionBankId, teacherId, ct);
        var questions = await _questionBankRepository.GetQuestionsAsync(bank.Id, null, null, null, QuestionStatus.Approved, null, ct);
        return ValidateMatrixAgainstQuestions(matrix, questions);
    }

    public async Task<ExamMatrixPreviewDto> GeneratePreviewAsync(int matrixId, int questionBankId, string teacherId, CancellationToken ct = default)
    {
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        var bank = await RequireTeacherBankAsync(questionBankId, teacherId, ct);
        var questions = await _questionBankRepository.GetQuestionsAsync(bank.Id, null, null, null, QuestionStatus.Approved, null, ct);
        return BuildPreview(matrix, questions);
    }
    public async Task<ExamDto> CreateExamAsync(int matrixId, CreateExamFromMatrixRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createExamValidator.ValidateAndThrowAsync(request, ct);
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        await RequireTeacherBankAsync(request.QuestionBankId, teacherId, ct);
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, request.ClassroomId, ct);
        ClassroomAccessHelper.EnsureTeacherOwnsClassroom(classroom, teacherId);

        var draftQuestions = request.Questions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.BankQuestionId)
            .ToList();
        var selectedQuestionIds = draftQuestions.Select(x => x.BankQuestionId).ToList();
        var sourceQuestions = await _questionBankRepository.GetQuestionsByIdsAsync(selectedQuestionIds, ct);
        ValidateDraftQuestions(matrix, request.QuestionBankId, teacherId, draftQuestions, sourceQuestions);
        var sourceById = sourceQuestions.ToDictionary(x => x.Id);
        var examQuestions = BuildExamQuestionsFromDraft(draftQuestions, sourceById);

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        foreach (var sourceQuestion in sourceQuestions)
        {
            sourceQuestion.TimesUsed += 1;
            sourceQuestion.UpdatedAt = DateTime.UtcNow;
            _questionBankRepository.UpdateQuestion(sourceQuestion);
        }

        var startTime = ExamDateTimeHelper.NormalizeNullableUtc(request.StartTime);
        var endTime = ExamDateTimeHelper.NormalizeNullableUtc(request.EndTime);
        EnsureExamWindowValid(startTime, endTime);

        var exam = new Exam
        {
            ClassroomId = request.ClassroomId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = NormalizeOptional(request.Description),
            DurationMinutes = matrix.DurationMinutes,
            StartTime = startTime,
            EndTime = endTime,
            EnableAntiCheat = request.EnableAntiCheat,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            Setting = ExamSettingMapper.BuildEntity(request.Settings),
            Questions = examQuestions
        };

        await _examRepository.AddAsync(exam, ct);
        await _examRepository.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return ExamMapper.MapExam(exam, exam.Setting);
    }

    private static ExamMatrixPreviewDto BuildPreview(ExamMatrix matrix, IReadOnlyList<BankQuestion> questions)
    {
        var validation = ValidateMatrixAgainstQuestions(matrix, questions);
        var scorePerQuestion = CalculateScorePerQuestion(matrix.TotalScore, matrix.TotalQuestions);
        var preview = new ExamMatrixPreviewDto
        {
            Success = validation.IsValid,
            Message = validation.Message,
            TotalQuestions = validation.TotalQuestions,
            TotalScore = validation.TotalScore,
            Errors = validation.Errors
        };

        if (!validation.IsValid)
            return preview;

        var usedIds = new HashSet<int>();
        foreach (var item in matrix.Items.OrderBy(x => x.Id))
        {
            var selected = FilterQuestions(questions, matrix, item)
                .Where(question => !usedIds.Contains(question.Id))
                .Take(item.QuestionCount)
                .ToList();

            foreach (var question in selected)
            {
                usedIds.Add(question.Id);
                preview.Questions.Add(new ExamMatrixPreviewQuestionDto
                {
                    MatrixItemId = item.Id,
                    Score = scorePerQuestion,
                    Question = QuestionBankMapper.MapQuestion(question)
                });
            }
        }

        preview.Success = preview.Questions.Count == matrix.TotalQuestions;
        preview.Message = preview.Success ? "Generated exam preview successfully." : "Preview could not select enough distinct questions.";
        return preview;
    }

    private static List<Question> BuildExamQuestionsFromPreview(ExamMatrixPreviewDto preview)
    {
        return preview.Questions.Select((previewQuestion, index) => new Question
        {
            BankQuestionId = previewQuestion.Question.Id,
            BankQuestionVersion = previewQuestion.Question.Version,
            Content = previewQuestion.Question.Content,
            QuestionType = previewQuestion.Question.QuestionType,
            Score = previewQuestion.Score,
            OrderIndex = index + 1,
            CreatedAt = DateTime.UtcNow,
            Answers = previewQuestion.Question.Answers.Select((answer, answerIndex) => new Answer
            {
                Content = answer.Content,
                IsCorrect = answer.IsCorrect,
                OrderIndex = answerIndex + 1
            }).ToList()
        }).ToList();
    }

    private static List<Question> BuildExamQuestionsFromDraft(
        IReadOnlyList<CreateExamFromMatrixQuestionRequest> draftQuestions,
        IReadOnlyDictionary<int, BankQuestion> sourceById)
    {
        return draftQuestions.Select((draftQuestion, index) =>
        {
            var sourceQuestion = sourceById[draftQuestion.BankQuestionId];
            var normalizedAnswers = ExamQuestionValidator.NormalizeAnswers(draftQuestion.QuestionType, draftQuestion.Answers);
            ExamQuestionValidator.ValidateQuestionInput(draftQuestion.QuestionType, normalizedAnswers);

            return new Question
            {
                BankQuestionId = sourceQuestion.Id,
                BankQuestionVersion = draftQuestion.BankQuestionVersion.GetValueOrDefault(sourceQuestion.Version),
                Content = draftQuestion.Content.Trim(),
                QuestionType = draftQuestion.QuestionType,
                Score = draftQuestion.Score,
                OrderIndex = index + 1,
                CreatedAt = DateTime.UtcNow,
                Answers = normalizedAnswers.Select((answer, answerIndex) => new Answer
                {
                    Content = answer.Content,
                    IsCorrect = answer.IsCorrect,
                    OrderIndex = answerIndex + 1
                }).ToList()
            };
        }).ToList();
    }

    private static void ValidateDraftQuestions(
        ExamMatrix matrix,
        int questionBankId,
        string teacherId,
        IReadOnlyList<CreateExamFromMatrixQuestionRequest> draftQuestions,
        IReadOnlyList<BankQuestion> sourceQuestions)
    {
        if (draftQuestions.Count != matrix.TotalQuestions)
            throw new InvalidOperationException("Số câu trong đề nháp chưa khớp với tổng số câu của ma trận.");

        var sourceIds = draftQuestions.Select(x => x.BankQuestionId).ToList();
        if (sourceIds.Count != sourceIds.Distinct().Count())
            throw new InvalidOperationException("Đề nháp đang có câu hỏi nguồn bị trùng.");

        var sourceById = sourceQuestions.ToDictionary(x => x.Id);
        var missingSourceIds = sourceIds.Where(id => !sourceById.ContainsKey(id)).ToList();
        if (missingSourceIds.Count > 0)
            throw new InvalidOperationException("Một số câu hỏi trong đề nháp không còn tồn tại trong ngân hàng.");

        foreach (var sourceQuestion in sourceQuestions)
        {
            if (sourceQuestion.QuestionBankId != questionBankId || sourceQuestion.TeacherId != teacherId)
                throw new UnauthorizedAccessException("Bạn chỉ được tạo đề từ câu hỏi thuộc ngân hàng của mình.");
        }

        var matrixItemById = matrix.Items.ToDictionary(x => x.Id);
        foreach (var draftQuestion in draftQuestions)
        {
            if (!matrixItemById.ContainsKey(draftQuestion.MatrixItemId))
                throw new InvalidOperationException("Đề nháp có câu hỏi không thuộc dòng ma trận đang chọn.");
        }

        foreach (var item in matrix.Items)
        {
            var actualCount = draftQuestions.Count(x => x.MatrixItemId == item.Id);
            if (actualCount != item.QuestionCount)
                throw new InvalidOperationException("Số câu trong đề nháp chưa khớp với từng dòng ma trận.");
        }
    }

    private static ExamMatrixValidationResultDto ValidateMatrixAgainstQuestions(ExamMatrix matrix, IReadOnlyList<BankQuestion> questions)
    {
        var result = new ExamMatrixValidationResultDto
        {
            TotalQuestions = matrix.Items.Sum(x => x.QuestionCount),
            TotalScore = matrix.TotalScore
        };

        if (result.TotalQuestions != matrix.TotalQuestions)
            result.Errors.Add(new ExamMatrixValidationIssueDto { Required = matrix.TotalQuestions, Available = result.TotalQuestions, Message = "Matrix question total does not match." });

        foreach (var item in matrix.Items)
        {
            var available = FilterQuestions(questions, matrix, item).Count;
            var availabilityItem = BuildAvailabilityItem(matrix, item, available);
            result.Items.Add(availabilityItem);

            if (available < item.QuestionCount)
                result.Errors.Add(availabilityItem);
        }

        result.IsValid = result.Errors.Count == 0;
        result.Message = result.IsValid ? "Matrix is valid." : "Question bank does not have enough approved questions.";
        return result;
    }

    private static List<BankQuestion> FilterQuestions(IEnumerable<BankQuestion> questions, ExamMatrix matrix, ExamMatrixItem item) =>
        questions.Where(question =>
            question.Status == QuestionStatus.Approved
            && question.Difficulty == item.Difficulty
            && SubjectMatches(question.Subject, matrix.Subject)
            && (!item.QuestionType.HasValue || question.QuestionType == item.QuestionType.Value)
            && ChapterOptionalTextMatches(question.Chapter, item.Chapter)
            && OptionalTextMatches(question.Lesson, item.Lesson)
            && OptionalTextMatches(question.LearningOutcome, item.LearningOutcome))
            .OrderBy(question => question.TimesUsed)
            .ThenBy(question => question.Id)
            .ToList();

    private static bool SubjectMatches(string? actual, string? expected)
    {
        if (string.IsNullOrWhiteSpace(expected) || string.IsNullOrWhiteSpace(actual))
            return true;

        var s1 = actual.Trim().ToLowerInvariant();
        var s2 = expected.Trim().ToLowerInvariant();

        if (s1 == s2) return true;

        s1 = RemoveDiacritics(s1).Replace(" học", "").Replace(" hoc", "");
        s2 = RemoveDiacritics(s2).Replace(" học", "").Replace(" hoc", "");

        if (s1 == s2) return true;

        return s1.Contains(s2) || s2.Contains(s1);
    }

    private static string RemoveDiacritics(string text)
    {
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }

    private static bool ChapterOptionalTextMatches(string? actual, string? expected)
    {
        if (string.IsNullOrWhiteSpace(expected))
            return true;

        var actualNormalized = NormalizeOptional(actual);
        if (string.IsNullOrWhiteSpace(actualNormalized))
            return false;

        var expectedChapters = expected.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => ExtractChapterDigits(x))
            .Where(x => !string.IsNullOrEmpty(x))
            .ToList();

        if (expectedChapters.Count == 0)
            return true;

        var actualDigits = ExtractChapterDigits(actualNormalized);
        return expectedChapters.Any(exp => string.Equals(actualDigits, exp, StringComparison.OrdinalIgnoreCase));
    }

    private static string? ExtractChapterDigits(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        return !string.IsNullOrEmpty(digits) ? digits : trimmed;
    }

    private static bool OptionalTextMatches(string? actual, string? expected) =>
        string.IsNullOrWhiteSpace(expected) || TextEquals(actual, expected);

    private static bool TextEquals(string? actual, string? expected) =>
        string.Equals(NormalizeOptional(actual), NormalizeOptional(expected), StringComparison.OrdinalIgnoreCase);

    private static ExamMatrixValidationIssueDto BuildAvailabilityItem(ExamMatrix matrix, ExamMatrixItem item, int available) => new()
    {
        MatrixItemId = item.Id,
        Subject = matrix.Subject,
        Chapter = item.Chapter,
        Lesson = item.Lesson,
        LearningOutcome = item.LearningOutcome,
        QuestionType = item.QuestionType,
        Difficulty = item.Difficulty,
        Required = item.QuestionCount,
        Available = available,
        Message = available < item.QuestionCount
            ? "Not enough approved questions for this matrix item."
            : "Enough approved questions for this matrix item."
    };

    private static ExamMatrix BuildMatrix(CreateExamMatrixRequest request, string teacherId) => new()
    {
        TeacherId = teacherId,
        Name = request.Name.Trim(),
        Subject = NormalizeOptional(request.Subject),
        GradeLevel = NormalizeOptional(request.GradeLevel),
        TotalQuestions = request.TotalQuestions,
        TotalScore = request.TotalScore,
        DurationMinutes = request.DurationMinutes,
        CreatedAt = DateTime.UtcNow,
        Items = BuildItems(request.Items, CalculateScorePerQuestion(request.TotalScore, request.TotalQuestions))
    };

    private static void ApplyMatrixUpdate(ExamMatrix matrix, CreateExamMatrixRequest request)
    {
        matrix.Name = request.Name.Trim();
        matrix.Subject = NormalizeOptional(request.Subject);
        matrix.GradeLevel = NormalizeOptional(request.GradeLevel);
        matrix.TotalQuestions = request.TotalQuestions;
        matrix.TotalScore = request.TotalScore;
        matrix.DurationMinutes = request.DurationMinutes;
        matrix.UpdatedAt = DateTime.UtcNow;
    }

    private static List<ExamMatrixItem> BuildItems(IEnumerable<CreateExamMatrixItemRequest> items, decimal scorePerQuestion) =>
        items.Select(item => new ExamMatrixItem
        {
            Chapter = NormalizeOptional(item.Chapter),
            Lesson = NormalizeOptional(item.Lesson),
            LearningOutcome = NormalizeOptional(item.LearningOutcome),
            QuestionType = item.QuestionType,
            Difficulty = item.Difficulty,
            QuestionCount = item.QuestionCount,
            ScorePerQuestion = scorePerQuestion
        }).ToList();

    private static void PrepareMatrixRequest(CreateExamMatrixRequest request)
    {
        request.Items ??= [];
        request.TotalQuestions = request.Items.Sum(x => x.QuestionCount);
        var scorePerQuestion = CalculateScorePerQuestion(request.TotalScore, request.TotalQuestions);

        foreach (var item in request.Items)
        {
            item.ScorePerQuestion = scorePerQuestion;
        }
    }

    private static void ValidateMatrixTotals(int totalQuestions, IEnumerable<CreateExamMatrixItemRequest> items)
    {
        var itemList = items.ToList();
        if (totalQuestions <= 0)
            throw new InvalidOperationException("Matrix must have at least one question.");

        if (itemList.Sum(x => x.QuestionCount) != totalQuestions)
            throw new InvalidOperationException("Matrix item question count must match total questions.");
    }

    private static decimal CalculateScorePerQuestion(decimal totalScore, int totalQuestions) =>
        totalQuestions > 0 ? totalScore / totalQuestions : 0;

    private static void EnsureExamWindowValid(DateTime? startTime, DateTime? endTime)
    {
        if (startTime.HasValue && endTime.HasValue && endTime <= startTime)
            throw new InvalidOperationException("Thời gian đóng đề phải sau thời gian mở đề.");
    }

    private async Task<ExamMatrix> RequireTeacherMatrixAsync(int matrixId, string teacherId, CancellationToken ct)
    {
        var matrix = await _matrixRepository.GetByIdAsync(matrixId, ct);
        if (matrix is null)
            throw new KeyNotFoundException("Exam matrix not found.");

        if (matrix.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only manage your own exam matrices.");

        return matrix;
    }

    private async Task<ExamMatrix> RequireAccessibleMatrixAsync(int matrixId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var matrix = await _matrixRepository.GetByIdAsync(matrixId, ct);
        if (matrix is null)
            throw new KeyNotFoundException("Exam matrix not found.");

        if (IsAdmin(roles) || matrix.TeacherId == userId)
            return matrix;

        throw new UnauthorizedAccessException("You cannot access this exam matrix.");
    }

    private async Task<QuestionBank> RequireTeacherBankAsync(int bankId, string teacherId, CancellationToken ct)
    {
        var bank = await _questionBankRepository.GetBankByIdAsync(bankId, includeQuestions: false, ct);
        if (bank is null)
            throw new KeyNotFoundException("Question bank not found.");

        if (bank.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only use your own question banks.");

        return bank;
    }

    private static bool IsAdmin(IReadOnlyList<string> roles) => roles.Contains("Admin");

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
