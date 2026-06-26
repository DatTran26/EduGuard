using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.DTOs.QuestionBanks;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Exams;
using FluentValidation;

namespace EduGuard.Infrastructure.QuestionBanks;

public class QuestionBankService : IQuestionBankService
{
    private const long MaxImportFileBytes = 5 * 1024 * 1024;
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".csv", ".xlsx", ".txt", ".docx", ".pdf" };

    private readonly IQuestionBankRepository _questionBankRepository;
    private readonly IExamRepository _examRepository;
    private readonly IValidator<CreateQuestionBankRequest> _createBankValidator;
    private readonly IValidator<UpdateQuestionBankRequest> _updateBankValidator;
    private readonly IValidator<CreateBankQuestionRequest> _createQuestionValidator;
    private readonly IValidator<UpdateBankQuestionRequest> _updateQuestionValidator;
    private readonly IValidator<ImportBankQuestionsRequest> _importValidator;
    private readonly IValidator<SnapshotBankQuestionsRequest> _snapshotValidator;

    public QuestionBankService(
        IQuestionBankRepository questionBankRepository,
        IExamRepository examRepository,
        IValidator<CreateQuestionBankRequest> createBankValidator,
        IValidator<UpdateQuestionBankRequest> updateBankValidator,
        IValidator<CreateBankQuestionRequest> createQuestionValidator,
        IValidator<UpdateBankQuestionRequest> updateQuestionValidator,
        IValidator<ImportBankQuestionsRequest> importValidator,
        IValidator<SnapshotBankQuestionsRequest> snapshotValidator)
    {
        _questionBankRepository = questionBankRepository;
        _examRepository = examRepository;
        _createBankValidator = createBankValidator;
        _updateBankValidator = updateBankValidator;
        _createQuestionValidator = createQuestionValidator;
        _updateQuestionValidator = updateQuestionValidator;
        _importValidator = importValidator;
        _snapshotValidator = snapshotValidator;
    }

    public async Task<IReadOnlyList<QuestionBankDto>> GetBanksAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var banks = await _questionBankRepository.GetBanksAsync(userId, IsAdmin(roles), ct);
        return banks.Select(QuestionBankMapper.MapBank).ToList();
    }

    public async Task<QuestionBankDto> GetBankByIdAsync(int bankId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var bank = await RequireAccessibleBankAsync(bankId, userId, roles, ct);
        return QuestionBankMapper.MapBank(bank);
    }

    public async Task<QuestionBankDto> CreateBankAsync(CreateQuestionBankRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createBankValidator.ValidateAndThrowAsync(request, ct);

        var bank = new QuestionBank
        {
            TeacherId = teacherId,
            Name = request.Name.Trim(),
            Description = NormalizeOptional(request.Description),
            Subject = NormalizeOptional(request.Subject),
            GradeLevel = NormalizeOptional(request.GradeLevel),
            CreatedAt = DateTime.UtcNow
        };

        await _questionBankRepository.AddBankAsync(bank, ct);
        await _questionBankRepository.SaveChangesAsync(ct);
        return QuestionBankMapper.MapBank(bank);
    }

    public async Task<QuestionBankDto> UpdateBankAsync(int bankId, UpdateQuestionBankRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateBankValidator.ValidateAndThrowAsync(request, ct);
        var bank = await RequireTeacherBankAsync(bankId, teacherId, ct);

        bank.Name = request.Name.Trim();
        bank.Description = NormalizeOptional(request.Description);
        bank.Subject = NormalizeOptional(request.Subject);
        bank.GradeLevel = NormalizeOptional(request.GradeLevel);
        bank.UpdatedAt = DateTime.UtcNow;

        _questionBankRepository.UpdateBank(bank);
        await _questionBankRepository.SaveChangesAsync(ct);
        return QuestionBankMapper.MapBank(bank);
    }

    public async Task DeleteBankAsync(int bankId, string teacherId, CancellationToken ct = default)
    {
        var bank = await RequireTeacherBankAsync(bankId, teacherId, ct);
        _questionBankRepository.RemoveBank(bank);
        await _questionBankRepository.SaveChangesAsync(ct);
    }
    public async Task<IReadOnlyList<BankQuestionDto>> GetQuestionsAsync(int bankId, string userId, IReadOnlyList<string> roles, string? keyword, DifficultyLevel? difficulty, QuestionType? questionType, QuestionStatus? status, string? chapter, CancellationToken ct = default)
    {
        await RequireAccessibleBankAsync(bankId, userId, roles, ct);
        var questions = await _questionBankRepository.GetQuestionsAsync(bankId, keyword, difficulty, questionType, status, chapter, ct);
        return questions.Select(QuestionBankMapper.MapQuestion).ToList();
    }

    public async Task<BankQuestionDto> GetQuestionByIdAsync(int questionId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var question = await RequireAccessibleQuestionAsync(questionId, userId, roles, ct);
        return QuestionBankMapper.MapQuestion(question);
    }

    public async Task<BankQuestionDto> CreateQuestionAsync(int bankId, CreateBankQuestionRequest request, string teacherId, CancellationToken ct = default)
    {
        await _createQuestionValidator.ValidateAndThrowAsync(request, ct);
        var bank = await RequireTeacherBankAsync(bankId, teacherId, ct);
        var question = BuildBankQuestion(bank, request, teacherId);

        await _questionBankRepository.AddQuestionAsync(question, ct);
        bank.UpdatedAt = DateTime.UtcNow;
        _questionBankRepository.UpdateBank(bank);
        await _questionBankRepository.SaveChangesAsync(ct);
        return QuestionBankMapper.MapQuestion(question);
    }

    public async Task<BankQuestionDto> UpdateQuestionAsync(int questionId, UpdateBankQuestionRequest request, string teacherId, CancellationToken ct = default)
    {
        await _updateQuestionValidator.ValidateAndThrowAsync(request, ct);
        var question = await RequireTeacherQuestionAsync(questionId, teacherId, ct);
        var snapshotCount = await _questionBankRepository.CountExamSnapshotsAsync(question.Id, ct);

        if (snapshotCount > 0)
        {
            question.Status = QuestionStatus.Archived;
            question.UpdatedAt = DateTime.UtcNow;
            _questionBankRepository.UpdateQuestion(question);

            var nextVersion = BuildBankQuestion(question.QuestionBank, request, teacherId);
            nextVersion.ParentQuestionId = question.Id;
            nextVersion.Version = question.Version + 1;
            await _questionBankRepository.AddQuestionAsync(nextVersion, ct);
            await _questionBankRepository.SaveChangesAsync(ct);
            return QuestionBankMapper.MapQuestion(nextVersion);
        }

        ApplyBankQuestionUpdate(question, request);
        _questionBankRepository.RemoveAnswers(question.Answers);
        question.Answers = BuildAnswers(ExamQuestionValidator.NormalizeAnswers(request.QuestionType, request.Answers));
        _questionBankRepository.UpdateQuestion(question);
        await _questionBankRepository.SaveChangesAsync(ct);
        return QuestionBankMapper.MapQuestion(question);
    }

    public async Task ArchiveQuestionAsync(int questionId, string teacherId, CancellationToken ct = default)
    {
        var question = await RequireTeacherQuestionAsync(questionId, teacherId, ct);
        question.Status = QuestionStatus.Archived;
        question.UpdatedAt = DateTime.UtcNow;
        _questionBankRepository.UpdateQuestion(question);
        await _questionBankRepository.SaveChangesAsync(ct);
    }
    public async Task<BankQuestionImportResultDto> ImportQuestionsAsync(int bankId, Stream fileStream, string fileName, string contentType, long fileLength, ImportBankQuestionsRequest request, string teacherId, CancellationToken ct = default)
    {
        await _importValidator.ValidateAndThrowAsync(request, ct);
        var bank = await RequireTeacherBankAsync(bankId, teacherId, ct);
        var result = new BankQuestionImportResultDto { FileName = Path.GetFileName(fileName) };
        AddFileErrors(result, fileName, fileLength);
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

        var imported = parsed.Questions.Select(question => BuildBankQuestion(bank, BuildCreateRequest(question, request), teacherId)).ToList();
        await _questionBankRepository.AddQuestionsAsync(imported, ct);
        bank.UpdatedAt = DateTime.UtcNow;
        _questionBankRepository.UpdateBank(bank);
        await _questionBankRepository.SaveChangesAsync(ct);

        result.ImportedCount = imported.Count;
        result.Questions = imported.Select(QuestionBankMapper.MapQuestion).ToList();
        return result;
    }
    public async Task<IReadOnlyList<QuestionDto>> SnapshotQuestionsToExamAsync(int examId, SnapshotBankQuestionsRequest request, string teacherId, CancellationToken ct = default)
    {
        await _snapshotValidator.ValidateAndThrowAsync(request, ct);
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct);
        if (exam is null)
            throw new KeyNotFoundException("Exam not found.");

        if (exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only add bank questions to your own exams.");

        var bankQuestions = await _questionBankRepository.GetQuestionsByIdsAsync(request.BankQuestionIds, ct);
        EnsureAllQuestionsFound(request.BankQuestionIds, bankQuestions);
        EnsureSnapshotAllowed(bankQuestions, teacherId);

        var snapshots = await AddSnapshotsAsync(exam, request, bankQuestions, ct);
        return snapshots.Select(x => ExamMapper.MapQuestion(x)).ToList();
    }

    private async Task<QuestionBank> RequireTeacherBankAsync(int bankId, string teacherId, CancellationToken ct)
    {
        var bank = await _questionBankRepository.GetBankByIdAsync(bankId, includeQuestions: true, ct);
        if (bank is null)
            throw new KeyNotFoundException("Question bank not found.");

        if (bank.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only manage your own question banks.");

        return bank;
    }

    private async Task<QuestionBank> RequireAccessibleBankAsync(int bankId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var bank = await _questionBankRepository.GetBankByIdAsync(bankId, includeQuestions: true, ct);
        if (bank is null)
            throw new KeyNotFoundException("Question bank not found.");

        if (IsAdmin(roles) || bank.TeacherId == userId)
            return bank;

        throw new UnauthorizedAccessException("You cannot access this question bank.");
    }

    private static bool IsAdmin(IReadOnlyList<string> roles) => roles.Contains("Admin");

    private async Task<BankQuestion> RequireTeacherQuestionAsync(int questionId, string teacherId, CancellationToken ct)
    {
        var question = await _questionBankRepository.GetQuestionByIdAsync(questionId, ct);
        if (question is null)
            throw new KeyNotFoundException("Question not found.");

        if (question.TeacherId != teacherId)
            throw new UnauthorizedAccessException("You can only manage your own bank questions.");

        return question;
    }

    private async Task<BankQuestion> RequireAccessibleQuestionAsync(int questionId, string userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var question = await _questionBankRepository.GetQuestionByIdAsync(questionId, ct);
        if (question is null)
            throw new KeyNotFoundException("Question not found.");

        if (IsAdmin(roles) || question.TeacherId == userId)
            return question;

        throw new UnauthorizedAccessException("You cannot access this bank question.");
    }

    private async Task<List<Question>> AddSnapshotsAsync(Exam exam, SnapshotBankQuestionsRequest request, IReadOnlyList<BankQuestion> bankQuestions, CancellationToken ct)
    {
        var orderedBankQuestions = request.BankQuestionIds.Select(id => bankQuestions.First(x => x.Id == id)).ToList();
        var insertIndex = request.StartOrderIndex ?? (exam.Questions.Count + 1);
        ShiftExistingQuestions(exam.Questions, insertIndex, orderedBankQuestions.Count);

        var snapshots = new List<Question>();
        for (var index = 0; index < orderedBankQuestions.Count; index++)
        {
            var source = orderedBankQuestions[index];
            var snapshot = BuildExamQuestionSnapshot(source, insertIndex + index, exam.Id);
            snapshots.Add(snapshot);
            await _examRepository.AddQuestionAsync(snapshot, ct);
            source.TimesUsed += 1;
            source.UpdatedAt = DateTime.UtcNow;
            _questionBankRepository.UpdateQuestion(source);
        }

        exam.UpdatedAt = DateTime.UtcNow;
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);
        return snapshots;
    }

    private static BankQuestion BuildBankQuestion(QuestionBank bank, CreateBankQuestionRequest request, string teacherId)
    {
        var normalizedAnswers = ExamQuestionValidator.NormalizeAnswers(request.QuestionType, request.Answers);
        ExamQuestionValidator.ValidateQuestionInput(request.QuestionType, normalizedAnswers);

        return new BankQuestion
        {
            QuestionBankId = bank.Id,
            TeacherId = teacherId,
            Content = request.Content.Trim(),
            QuestionType = request.QuestionType,
            Difficulty = request.Difficulty,
            DefaultScore = request.DefaultScore,
            Subject = NormalizeOptional(request.Subject) ?? bank.Subject,
            Chapter = NormalizeOptional(request.Chapter),
            Lesson = NormalizeOptional(request.Lesson),
            LearningOutcome = NormalizeOptional(request.LearningOutcome),
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            Answers = BuildAnswers(normalizedAnswers)
        };
    }

    private static void ApplyBankQuestionUpdate(BankQuestion question, CreateBankQuestionRequest request)
    {
        question.Content = request.Content.Trim();
        question.QuestionType = request.QuestionType;
        question.Difficulty = request.Difficulty;
        question.DefaultScore = request.DefaultScore;
        question.Subject = NormalizeOptional(request.Subject);
        question.Chapter = NormalizeOptional(request.Chapter);
        question.Lesson = NormalizeOptional(request.Lesson);
        question.LearningOutcome = NormalizeOptional(request.LearningOutcome);
        question.Status = request.Status;
        question.UpdatedAt = DateTime.UtcNow;
    }

    private static List<BankAnswer> BuildAnswers(IReadOnlyList<AnswerInputDto> answers) =>
        answers.Select((answer, index) => new BankAnswer
        {
            Content = answer.Content.Trim(),
            IsCorrect = answer.IsCorrect,
            OrderIndex = index + 1
        }).ToList();

    private static CreateBankQuestionRequest BuildCreateRequest(CreateQuestionRequest parsedQuestion, ImportBankQuestionsRequest defaults) => new()
    {
        Content = parsedQuestion.Content,
        QuestionType = parsedQuestion.QuestionType,
        Difficulty = ParseDifficultyLevel(parsedQuestion.Difficulty, defaults.Difficulty),
        DefaultScore = parsedQuestion.Score,
        Subject = NormalizeOptional(defaults.Subject),
        Chapter = NormalizeOptional(defaults.Chapter),
        Lesson = NormalizeOptional(defaults.Lesson),
        LearningOutcome = NormalizeOptional(defaults.LearningOutcome),
        Status = defaults.Status,
        Answers = parsedQuestion.Answers
    };

    private static DifficultyLevel ParseDifficultyLevel(string? value, DifficultyLevel defaultDifficulty)
    {
        if (string.IsNullOrWhiteSpace(value))
            return defaultDifficulty;

        var normalized = value.Trim().ToLowerInvariant();
        if (normalized.Contains("easy") || normalized.Contains("de") || normalized == "0")
            return DifficultyLevel.Easy;
        if (normalized.Contains("hard") || normalized.Contains("kho") || normalized == "2")
            return DifficultyLevel.Hard;
        if (normalized.Contains("medium") || normalized.Contains("trung binh") || normalized == "1")
            return DifficultyLevel.Medium;

        return defaultDifficulty;
    }

    private static Question BuildExamQuestionSnapshot(BankQuestion source, int orderIndex, int examId) => new()
    {
        ExamId = examId,
        BankQuestionId = source.Id,
        BankQuestionVersion = source.Version,
        Content = source.Content,
        QuestionType = source.QuestionType,
        Score = source.DefaultScore,
        OrderIndex = orderIndex,
        CreatedAt = DateTime.UtcNow,
        Answers = source.Answers.OrderBy(x => x.OrderIndex).Select((answer, index) => new Answer
        {
            Content = answer.Content,
            IsCorrect = answer.IsCorrect,
            OrderIndex = index + 1
        }).ToList()
    };

    private static void ShiftExistingQuestions(ICollection<Question> questions, int startOrderIndex, int count)
    {
        foreach (var question in questions.Where(x => x.OrderIndex >= startOrderIndex))
            question.OrderIndex += count;
    }

    private static void EnsureAllQuestionsFound(IEnumerable<int> requestedIds, IReadOnlyList<BankQuestion> questions)
    {
        var foundIds = questions.Select(x => x.Id).ToHashSet();
        var missingIds = requestedIds.Where(id => !foundIds.Contains(id)).ToList();
        if (missingIds.Count > 0)
            throw new KeyNotFoundException("Some bank questions were not found.");
    }

    private static void EnsureSnapshotAllowed(IReadOnlyList<BankQuestion> questions, string teacherId)
    {
        foreach (var question in questions)
        {
            if (question.TeacherId != teacherId)
                throw new UnauthorizedAccessException("You can only snapshot your own bank questions.");

            if (question.Status != QuestionStatus.Approved)
                throw new InvalidOperationException("Only approved bank questions can be added to an exam.");
        }
    }

    private static void AddFileErrors(BankQuestionImportResultDto result, string fileName, long fileLength)
    {
        if (fileLength <= 0)
        {
            result.Errors.Add(new QuestionImportErrorDto { RowNumber = 1, FieldName = "file", ErrorMessage = "Import file is empty." });
            return;
        }

        if (fileLength > MaxImportFileBytes)
            result.Errors.Add(new QuestionImportErrorDto { RowNumber = 1, FieldName = "file", ErrorMessage = "Import file must not exceed 5 MB." });

        var extension = Path.GetExtension(Path.GetFileName(fileName));
        if (string.IsNullOrWhiteSpace(extension))
            result.Errors.Add(new QuestionImportErrorDto { RowNumber = 1, FieldName = "file", ErrorMessage = "Import file must include an extension." });
        else if (!SupportedExtensions.Contains(extension))
            result.Errors.Add(new QuestionImportErrorDto { RowNumber = 1, FieldName = "file", ErrorMessage = "Unsupported import file extension." });
    }

    private static int CountFailedRows(IEnumerable<QuestionImportErrorDto> errors) =>
        errors.Select(x => x.RowNumber).Where(x => x > 0).Distinct().Count();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

