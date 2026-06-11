using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Common;
using FluentValidation;

namespace EduGuard.Infrastructure.Exams;

public class ExamAttemptService : IExamAttemptService
{
    private readonly IExamRepository _examRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IValidator<SaveStudentAnswerRequest> _saveAnswerValidator;

    public ExamAttemptService(
        IExamRepository examRepository,
        IClassroomRepository classroomRepository,
        IValidator<SaveStudentAnswerRequest> saveAnswerValidator)
    {
        _examRepository = examRepository;
        _classroomRepository = classroomRepository;
        _saveAnswerValidator = saveAnswerValidator;
    }

    public async Task<StartExamResponse> StartAsync(int examId, int studentId, CancellationToken ct = default)
    {
        var exam = await _examRepository.GetByIdWithDetailsAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        await EnsureStudentCanTakeExamAsync(exam, studentId, ct);
        EnsureExamWindowOpen(exam);

        var setting = exam.Setting;
        var maxAttempts = setting?.MaxAttempts ?? 1;
        var attemptCount = await _examRepository.CountAttemptsAsync(examId, studentId, ct);
        var inProgress = await _examRepository.GetInProgressAttemptAsync(examId, studentId, ct);

        if (inProgress is not null)
        {
            return BuildStartResponse(exam, inProgress);
        }

        if (attemptCount >= maxAttempts)
            throw new InvalidOperationException("Bạn đã hết lượt làm bài.");

        var attempt = new ExamAttempt
        {
            ExamId = examId,
            StudentId = studentId,
            StartedAt = DateTime.UtcNow,
            Status = ExamAttemptStatus.InProgress
        };

        await _examRepository.AddAttemptAsync(attempt, ct);
        await _examRepository.SaveChangesAsync(ct);

        var saved = await _examRepository.GetAttemptByIdAsync(attempt.Id, ct) ?? attempt;
        return BuildStartResponse(exam, saved);
    }

    public async Task<ExamAttemptDetailDto> GetAttemptAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await RequireAttemptAccessAsync(attemptId, userId, roles, ct);
        var exam = attempt.Exam;

        return new ExamAttemptDetailDto
        {
            Id = attempt.Id,
            ExamId = attempt.ExamId,
            StudentId = attempt.StudentId,
            StudentName = attempt.Student?.FullName ?? string.Empty,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            Score = attempt.Score,
            SuspicionScore = attempt.SuspicionScore,
            Status = attempt.Status,
            Questions = ExamShuffleHelper.BuildAttemptQuestions(exam.Questions, exam.Setting),
            SavedAnswers = ExamMapper.MapSavedAnswers(attempt.StudentAnswers)
        };
    }

    public async Task SaveAnswerAsync(int attemptId, SaveStudentAnswerRequest request, int studentId, CancellationToken ct = default)
    {
        await _saveAnswerValidator.ValidateAndThrowAsync(request, ct);

        var attempt = await _examRepository.GetAttemptWithAnswersAsync(attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        EnsureInProgressOwnedByStudent(attempt, studentId);

        var question = attempt.Exam.Questions.FirstOrDefault(x => x.Id == request.QuestionId)
            ?? throw new KeyNotFoundException("Câu hỏi không thuộc đề thi này.");

        ValidateAnswerPayload(question, request);

        var existing = attempt.StudentAnswers.Where(x => x.QuestionId == request.QuestionId).ToList();
        _examRepository.RemoveStudentAnswers(existing);

        var newAnswers = BuildStudentAnswerRows(attempt.Id, question, request);
        await _examRepository.AddStudentAnswersAsync(newAnswers, ct);
        await _examRepository.SaveChangesAsync(ct);
    }

    public async Task<ExamResultDto> SubmitAsync(int attemptId, int studentId, CancellationToken ct = default)
    {
        var attempt = await _examRepository.GetAttemptWithAnswersAsync(attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        EnsureInProgressOwnedByStudent(attempt, studentId);

        attempt.Score = ExamGradingHelper.GradeExam(attempt.Exam, attempt.StudentAnswers.ToList());
        attempt.SubmittedAt = DateTime.UtcNow;
        attempt.Status = ExamAttemptStatus.Submitted;
        _examRepository.UpdateAttempt(attempt);
        await _examRepository.SaveChangesAsync(ct);

        return BuildResult(attempt, showDetails: attempt.Exam.Setting?.ShowResultAfterSubmit ?? false);
    }

    public async Task<ExamResultDto> GetResultAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var attempt = await RequireAttemptAccessAsync(attemptId, userId, roles, ct);
        if (attempt.Status != ExamAttemptStatus.Submitted)
            throw new InvalidOperationException("Lượt thi chưa được nộp.");

        var showDetails = roles.Contains("Admin")
            || attempt.Exam.TeacherId == userId
            || (attempt.StudentId == userId && (attempt.Exam.Setting?.ShowResultAfterSubmit ?? false));

        return BuildResult(attempt, showDetails);
    }

    public async Task<IReadOnlyList<ExamAttemptDto>> GetAttemptsByExamAsync(int examId, int teacherId, CancellationToken ct = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");
        if (exam.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được xem lượt thi.");

        var attempts = await _examRepository.GetAttemptsByExamIdAsync(examId, ct);
        return attempts.Select(ExamMapper.MapAttempt).ToList();
    }

    private async Task EnsureStudentCanTakeExamAsync(Exam exam, int studentId, CancellationToken ct)
    {
        if (!exam.IsPublished)
            throw new InvalidOperationException("Đề thi chưa được publish.");

        var membership = await _classroomRepository.GetMemberAsync(exam.ClassroomId, studentId, ct);
        if (membership?.Status != ClassroomMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn chưa tham gia lớp học này.");
    }

    private static void EnsureExamWindowOpen(Exam exam)
    {
        var now = DateTime.UtcNow;
        if (exam.StartTime.HasValue && now < exam.StartTime.Value)
            throw new InvalidOperationException("Đề thi chưa mở.");
        if (exam.EndTime.HasValue && now > exam.EndTime.Value)
            throw new InvalidOperationException("Đề thi đã đóng.");
    }

    private static void EnsureInProgressOwnedByStudent(ExamAttempt attempt, int studentId)
    {
        if (attempt.StudentId != studentId)
            throw new UnauthorizedAccessException("Bạn không có quyền thao tác lượt thi này.");
        if (attempt.Status != ExamAttemptStatus.InProgress)
            throw new InvalidOperationException("Lượt thi đã kết thúc.");
    }

    private async Task<ExamAttempt> RequireAttemptAccessAsync(
        int attemptId, int userId, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var attempt = await _examRepository.GetAttemptWithAnswersAsync(attemptId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt thi.");

        if (roles.Contains("Admin") || attempt.Exam.TeacherId == userId || attempt.StudentId == userId)
            return attempt;

        throw new UnauthorizedAccessException("Bạn không có quyền xem lượt thi này.");
    }

    private static StartExamResponse BuildStartResponse(Exam exam, ExamAttempt attempt) => new()
    {
        Attempt = ExamMapper.MapAttempt(attempt),
        DurationMinutes = exam.DurationMinutes,
        Questions = ExamShuffleHelper.BuildAttemptQuestions(exam.Questions, exam.Setting)
    };

    private static void ValidateAnswerPayload(Question question, SaveStudentAnswerRequest request)
    {
        if (question.QuestionType == QuestionType.ShortAnswer)
        {
            if (string.IsNullOrWhiteSpace(request.TextAnswer))
                throw new InvalidOperationException("Cần nhập câu trả lời.");
            return;
        }

        if (request.AnswerIds.Count == 0)
            throw new InvalidOperationException("Cần chọn ít nhất một đáp án.");

        var validIds = question.Answers.Select(x => x.Id).ToHashSet();
        if (request.AnswerIds.Any(id => !validIds.Contains(id)))
            throw new InvalidOperationException("Đáp án không hợp lệ.");

        if (question.QuestionType == QuestionType.SingleChoice && request.AnswerIds.Count != 1)
            throw new InvalidOperationException("Câu một đáp án chỉ được chọn một lựa chọn.");
    }

    private static List<StudentAnswer> BuildStudentAnswerRows(
        int attemptId, Question question, SaveStudentAnswerRequest request)
    {
        if (question.QuestionType == QuestionType.ShortAnswer)
        {
            return
            [
                new StudentAnswer
                {
                    ExamAttemptId = attemptId,
                    QuestionId = question.Id,
                    TextAnswer = request.TextAnswer!.Trim()
                }
            ];
        }

        return request.AnswerIds
            .Distinct()
            .Select(answerId => new StudentAnswer
            {
                ExamAttemptId = attemptId,
                QuestionId = question.Id,
                AnswerId = answerId
            })
            .ToList();
    }

    private static ExamResultDto BuildResult(ExamAttempt attempt, bool showDetails)
    {
        var result = new ExamResultDto
        {
            Attempt = ExamMapper.MapAttempt(attempt)
        };

        if (!showDetails)
            return result;

        result.Questions = attempt.Exam.Questions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .Select(question =>
            {
                var saved = attempt.StudentAnswers.Where(x => x.QuestionId == question.Id).ToList();
                var earned = ExamGradingHelper.GradeQuestion(question, saved);
                return new QuestionResultDto
                {
                    QuestionId = question.Id,
                    Content = question.Content,
                    Score = question.Score,
                    EarnedScore = earned,
                    IsCorrect = earned >= question.Score,
                    SelectedAnswerIds = saved.Where(x => x.AnswerId.HasValue).Select(x => x.AnswerId!.Value).ToList(),
                    TextAnswer = saved.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x.TextAnswer))?.TextAnswer
                };
            })
            .ToList();

        return result;
    }
}
