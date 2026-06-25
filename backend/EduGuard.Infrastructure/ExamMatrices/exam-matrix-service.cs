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
        await _createValidator.ValidateAndThrowAsync(request, ct);
        ValidateMatrixTotals(request.TotalQuestions, request.TotalScore, request.Items);
        var matrix = BuildMatrix(request, teacherId);
        await _matrixRepository.AddAsync(matrix, ct);
        await _matrixRepository.SaveChangesAsync(ct);
        return ExamMatrixMapper.MapMatrix(matrix);
    }

    public async Task<ExamMatrixDto> UpdateAsync(int matrixId, UpdateExamMatrixRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);
        ValidateMatrixTotals(request.TotalQuestions, request.TotalScore, request.Items);
        var matrix = await RequireTeacherMatrixAsync(matrixId, teacherId, ct);
        ApplyMatrixUpdate(matrix, request);
        _matrixRepository.RemoveItems(matrix.Items);
        matrix.Items = BuildItems(request.Items);
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

        var preview = await GeneratePreviewAsync(matrixId, request.QuestionBankId, teacherId, ct);
        if (!preview.Success)
            throw new InvalidOperationException(preview.Message);

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        var selectedQuestionIds = preview.Questions.Select(x => x.Question.Id).ToList();
        var sourceQuestions = await _questionBankRepository.GetQuestionsByIdsAsync(selectedQuestionIds, ct);
        foreach (var sourceQuestion in sourceQuestions)
        {
            sourceQuestion.TimesUsed += 1;
            sourceQuestion.UpdatedAt = DateTime.UtcNow;
            _questionBankRepository.UpdateQuestion(sourceQuestion);
        }

        var exam = new Exam
        {
            ClassroomId = request.ClassroomId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = NormalizeOptional(request.Description),
            DurationMinutes = matrix.DurationMinutes,
            StartTime = ExamDateTimeHelper.NormalizeNullableUtc(request.StartTime),
            EndTime = ExamDateTimeHelper.NormalizeNullableUtc(request.EndTime),
            EnableAntiCheat = request.EnableAntiCheat,
            IsPublished = false,
            CreatedAt = DateTime.UtcNow,
            Setting = new ExamSetting
            {
                ShuffleQuestions = request.Settings.ShuffleQuestions,
                ShuffleAnswers = request.Settings.ShuffleAnswers,
                MaxAttempts = request.Settings.MaxAttempts,
                ShowResultAfterSubmit = request.Settings.ShowResultAfterSubmit,
                RequireFullscreen = request.Settings.RequireFullscreen
            },
            Questions = BuildExamQuestionsFromPreview(preview)
        };

        await _examRepository.AddAsync(exam, ct);
        await _examRepository.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return ExamMapper.MapExam(exam, exam.Setting);
    }

    private static ExamMatrixPreviewDto BuildPreview(ExamMatrix matrix, IReadOnlyList<BankQuestion> questions)
    {
        var validation = ValidateMatrixAgainstQuestions(matrix, questions);
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
            var selected = FilterQuestions(questions, item)
                .Where(question => !usedIds.Contains(question.Id))
                .Take(item.QuestionCount)
                .ToList();

            foreach (var question in selected)
            {
                usedIds.Add(question.Id);
                preview.Questions.Add(new ExamMatrixPreviewQuestionDto
                {
                    MatrixItemId = item.Id,
                    Score = item.ScorePerQuestion,
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

    private static ExamMatrixValidationResultDto ValidateMatrixAgainstQuestions(ExamMatrix matrix, IReadOnlyList<BankQuestion> questions)
    {
        var result = new ExamMatrixValidationResultDto
        {
            TotalQuestions = matrix.Items.Sum(x => x.QuestionCount),
            TotalScore = matrix.Items.Sum(x => x.QuestionCount * x.ScorePerQuestion)
        };

        if (result.TotalQuestions != matrix.TotalQuestions)
            result.Errors.Add(new ExamMatrixValidationIssueDto { Required = matrix.TotalQuestions, Available = result.TotalQuestions, Message = "Matrix question total does not match." });

        if (result.TotalScore != matrix.TotalScore)
            result.Errors.Add(new ExamMatrixValidationIssueDto { Message = "Matrix score total does not match." });

        foreach (var item in matrix.Items)
        {
            var available = FilterQuestions(questions, item).Count;
            if (available < item.QuestionCount)
                result.Errors.Add(BuildIssue(item, available));
        }

        result.IsValid = result.Errors.Count == 0;
        result.Message = result.IsValid ? "Matrix is valid." : "Question bank does not have enough approved questions.";
        return result;
    }

    private static List<BankQuestion> FilterQuestions(IEnumerable<BankQuestion> questions, ExamMatrixItem item) =>
        questions.Where(question =>
            question.Status == QuestionStatus.Approved
            && question.Difficulty == item.Difficulty
            && (!item.QuestionType.HasValue || question.QuestionType == item.QuestionType.Value)
            && (string.IsNullOrWhiteSpace(item.Chapter) || question.Chapter == item.Chapter)
            && (string.IsNullOrWhiteSpace(item.Lesson) || question.Lesson == item.Lesson)
            && (string.IsNullOrWhiteSpace(item.LearningOutcome) || question.LearningOutcome == item.LearningOutcome))
            .OrderBy(question => question.TimesUsed)
            .ThenBy(question => question.Id)
            .ToList();

    private static ExamMatrixValidationIssueDto BuildIssue(ExamMatrixItem item, int available) => new()
    {
        MatrixItemId = item.Id,
        Chapter = item.Chapter,
        Lesson = item.Lesson,
        LearningOutcome = item.LearningOutcome,
        QuestionType = item.QuestionType,
        Difficulty = item.Difficulty,
        Required = item.QuestionCount,
        Available = available,
        Message = "Not enough approved questions for this matrix item."
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
        Items = BuildItems(request.Items)
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

    private static List<ExamMatrixItem> BuildItems(IEnumerable<CreateExamMatrixItemRequest> items) =>
        items.Select(item => new ExamMatrixItem
        {
            Chapter = NormalizeOptional(item.Chapter),
            Lesson = NormalizeOptional(item.Lesson),
            LearningOutcome = NormalizeOptional(item.LearningOutcome),
            QuestionType = item.QuestionType,
            Difficulty = item.Difficulty,
            QuestionCount = item.QuestionCount,
            ScorePerQuestion = item.ScorePerQuestion
        }).ToList();

    private static void ValidateMatrixTotals(int totalQuestions, decimal totalScore, IEnumerable<CreateExamMatrixItemRequest> items)
    {
        var itemList = items.ToList();
        if (itemList.Sum(x => x.QuestionCount) != totalQuestions)
            throw new InvalidOperationException("Matrix item question count must match total questions.");

        var itemScore = itemList.Sum(x => x.QuestionCount * x.ScorePerQuestion);
        if (itemScore != totalScore)
            throw new InvalidOperationException("Matrix item score must match total score.");
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
