using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Common;
using FluentValidation;

namespace EduGuard.Infrastructure.Exams;

public class ExamService : IExamService
{
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

    public async Task<ExamDto> CreateAsync(int classroomId, CreateExamRequest request, int teacherId, CancellationToken ct = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, ct);
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, classroomId, ct);
        ClassroomAccessHelper.EnsureTeacherOwnsClassroom(classroom, teacherId);

        var exam = new Exam
        {
            ClassroomId = classroomId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DurationMinutes = request.DurationMinutes,
            StartTime = request.StartTime?.ToUniversalTime(),
            EndTime = request.EndTime?.ToUniversalTime(),
            EnableAntiCheat = request.EnableAntiCheat,
            CreatedAt = DateTime.UtcNow,
            Setting = BuildSetting(request.Settings)
        };

        await _examRepository.AddAsync(exam, ct);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<IReadOnlyList<ExamDto>> GetByClassroomAsync(
        int classroomId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
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

    public async Task<ExamDto> GetByIdAsync(int examId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var exam = await RequireAccessibleExamAsync(examId, userId, roles, ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<ExamDto> UpdateAsync(int examId, UpdateExamRequest request, int teacherId, CancellationToken ct = default)
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

    public async Task<ExamDto> PatchAsync(int examId, PatchExamRequest request, int teacherId, CancellationToken ct = default)
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
            exam.StartTime = request.StartTime.Value?.ToUniversalTime();

        if (request.EndTime.IsSpecified)
            exam.EndTime = request.EndTime.Value?.ToUniversalTime();

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

    public async Task DeleteAsync(int examId, int teacherId, CancellationToken ct = default)
    {
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);
        _examRepository.Remove(exam);
        await _examRepository.SaveChangesAsync(ct);
    }

    public async Task<ExamDto> PublishAsync(int examId, int teacherId, CancellationToken ct = default)
    {
        var exam = await RequireTeacherOwnedExamAsync(examId, teacherId, ct);
        if (exam.Questions.Count == 0)
            throw new InvalidOperationException("Đề thi cần ít nhất một câu hỏi trước khi publish.");

        exam.IsPublished = true;
        exam.UpdatedAt = DateTime.UtcNow;
        _examRepository.Update(exam);
        await _examRepository.SaveChangesAsync(ct);
        return ExamMapper.MapExam(exam);
    }

    public async Task<IReadOnlyList<QuestionDto>> GetQuestionsAsync(
        int examId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var exam = await RequireAccessibleExamAsync(examId, userId, roles, ct);
        EnsureQuestionBankAccess(exam, userId, roles);
        return exam.Questions.OrderBy(x => x.OrderIndex).ThenBy(x => x.Id).Select(x => ExamMapper.MapQuestion(x)).ToList();
    }

    public async Task<QuestionDto> AddQuestionAsync(int examId, CreateQuestionRequest request, int teacherId, CancellationToken ct = default)
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

    public async Task<QuestionDto> UpdateQuestionAsync(int questionId, UpdateQuestionRequest request, int teacherId, CancellationToken ct = default)
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
        int questionId, PatchQuestionRequest request, int teacherId, CancellationToken ct = default)
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

    public async Task DeleteQuestionAsync(int questionId, int teacherId, CancellationToken ct = default)
    {
        var question = await RequireTeacherOwnedQuestionAsync(questionId, teacherId, ct);
        var exam = await _examRepository.GetByIdWithDetailsAsync(question.ExamId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        _examRepository.RemoveAnswers(question.Answers);
        _examRepository.RemoveQuestion(question);
        ExamQuestionOrderHelper.Renumber(exam.Questions.Where(x => x.Id != question.Id).ToList());
        await _examRepository.SaveChangesAsync(ct);
    }

    public async Task<AnswerDto> AddAnswerAsync(int questionId, CreateAnswerRequest request, int teacherId, CancellationToken ct = default)
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

    public async Task<AnswerDto> UpdateAnswerAsync(int answerId, UpdateAnswerRequest request, int teacherId, CancellationToken ct = default)
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
        int answerId, PatchAnswerRequest request, int teacherId, CancellationToken ct = default)
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
        exam.StartTime = request.StartTime?.ToUniversalTime();
        exam.EndTime = request.EndTime?.ToUniversalTime();
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

    private async Task<Exam> RequireAccessibleExamAsync(int examId, int userId, IReadOnlyList<string> roles, CancellationToken ct)
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

    private async Task<Exam> RequireTeacherOwnedExamAsync(int examId, int teacherId, CancellationToken ct)
    {
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
        if (exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được thực hiện thao tác này.");
        return exam;
    }

    private Task<Exam> RequireTeacherOwnedExamWithQuestionsAsync(int examId, int teacherId, CancellationToken ct) =>
        RequireTeacherOwnedExamAsync(examId, teacherId, ct);

    private async Task<Question> RequireTeacherOwnedQuestionAsync(int questionId, int teacherId, CancellationToken ct)
    {
        var question = await _examRepository.GetQuestionByIdAsync(questionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy câu hỏi.");
        if (question.Exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được quản lý câu hỏi.");
        return question;
    }

    private static void EnsureQuestionBankAccess(Exam exam, int userId, IReadOnlyList<string> roles)
    {
        if (roles.Contains("Admin") || exam.TeacherId == userId)
            return;
        throw new UnauthorizedAccessException("Bạn chưa thể xem nội dung câu hỏi ở màn hình này.");
    }
}
