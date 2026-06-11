using EduGuard.Application.DTOs.Assignments;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Common;
using FluentValidation;

namespace EduGuard.Infrastructure.Assignments;

public class AssignmentService : IAssignmentService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IClassroomRepository _classroomRepository;
    private readonly IValidator<CreateAssignmentRequest> _createValidator;
    private readonly IValidator<UpdateAssignmentRequest> _updateValidator;
    private readonly IValidator<PatchAssignmentRequest> _patchValidator;
    private readonly IValidator<SubmitAssignmentRequest> _submitValidator;
    private readonly IValidator<GradeSubmissionRequest> _gradeValidator;

    public AssignmentService(
        IAssignmentRepository assignmentRepository,
        IClassroomRepository classroomRepository,
        IValidator<CreateAssignmentRequest> createValidator,
        IValidator<UpdateAssignmentRequest> updateValidator,
        IValidator<PatchAssignmentRequest> patchValidator,
        IValidator<SubmitAssignmentRequest> submitValidator,
        IValidator<GradeSubmissionRequest> gradeValidator)
    {
        _assignmentRepository = assignmentRepository;
        _classroomRepository = classroomRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _patchValidator = patchValidator;
        _submitValidator = submitValidator;
        _gradeValidator = gradeValidator;
    }

    public async Task<AssignmentDto> CreateAsync(
        int classroomId,
        CreateAssignmentRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, ct);

        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, classroomId, ct);
        ClassroomAccessHelper.EnsureTeacherOwnsClassroom(classroom, teacherId);

        var assignment = new Assignment
        {
            ClassroomId = classroomId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Deadline = request.Deadline.ToUniversalTime(),
            MaxScore = request.MaxScore,
            CreatedAt = DateTime.UtcNow
        };

        await _assignmentRepository.AddAsync(assignment, ct);
        await _assignmentRepository.SaveChangesAsync(ct);
        return MapAssignment(assignment);
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetByClassroomAsync(
        int classroomId,
        int userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, classroomId, ct);
        await ClassroomAccessHelper.EnsureCanAccessClassroomAsync(_classroomRepository, classroom, userId, roles, ct);

        var assignments = await _assignmentRepository.GetByClassroomIdAsync(classroomId, ct);
        return assignments.Select(MapAssignment).ToList();
    }

    public async Task<AssignmentDto> GetByIdAsync(
        int assignmentId,
        int userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        var classroom = await ClassroomAccessHelper.RequireClassroomAsync(_classroomRepository, assignment.ClassroomId, ct);
        await ClassroomAccessHelper.EnsureCanAccessClassroomAsync(_classroomRepository, classroom, userId, roles, ct);
        return MapAssignment(assignment);
    }

    public async Task<AssignmentDto> UpdateAsync(
        int assignmentId,
        UpdateAssignmentRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);

        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo bài tập mới được sửa.");

        assignment.Title = request.Title.Trim();
        assignment.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        assignment.Deadline = request.Deadline.ToUniversalTime();
        assignment.MaxScore = request.MaxScore;
        assignment.UpdatedAt = DateTime.UtcNow;

        _assignmentRepository.Update(assignment);
        await _assignmentRepository.SaveChangesAsync(ct);
        return MapAssignment(assignment);
    }

    public async Task<AssignmentDto> PatchAsync(
        int assignmentId,
        PatchAssignmentRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _patchValidator.ValidateAndThrowAsync(request, ct);

        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo bài tập mới được sửa.");

        if (request.Title.IsSpecified)
            assignment.Title = request.Title.Value!.Trim();

        if (request.Description.IsSpecified)
        {
            assignment.Description = string.IsNullOrWhiteSpace(request.Description.Value)
                ? null
                : request.Description.Value.Trim();
        }

        if (request.Deadline.IsSpecified)
            assignment.Deadline = request.Deadline.Value.ToUniversalTime();

        if (request.MaxScore.IsSpecified)
            assignment.MaxScore = request.MaxScore.Value;

        assignment.UpdatedAt = DateTime.UtcNow;
        _assignmentRepository.Update(assignment);
        await _assignmentRepository.SaveChangesAsync(ct);
        return MapAssignment(assignment);
    }

    public async Task DeleteAsync(int assignmentId, int teacherId, CancellationToken ct = default)
    {
        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo bài tập mới được xóa.");

        _assignmentRepository.Remove(assignment);
        await _assignmentRepository.SaveChangesAsync(ct);
    }

    public async Task<SubmissionDto> SubmitAsync(
        int assignmentId,
        SubmitAssignmentRequest request,
        int studentId,
        CancellationToken ct = default)
    {
        await _submitValidator.ValidateAndThrowAsync(request, ct);

        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        await EnsureActiveStudentInClassroomAsync(assignment.ClassroomId, studentId, ct);

        if (DateTime.UtcNow > assignment.Deadline)
            throw new InvalidOperationException("Đã quá hạn nộp bài.");

        var existing = await _assignmentRepository.GetSubmissionAsync(assignmentId, studentId, ct);
        if (existing is not null)
            throw new InvalidOperationException("Bạn đã nộp bài tập này.");

        var submission = new Submission
        {
            AssignmentId = assignmentId,
            StudentId = studentId,
            Content = request.Content.Trim(),
            SubmittedAt = DateTime.UtcNow
        };

        await _assignmentRepository.AddSubmissionAsync(submission, ct);
        await _assignmentRepository.SaveChangesAsync(ct);

        var saved = await _assignmentRepository.GetSubmissionByIdAsync(submission.Id, ct) ?? submission;
        return MapSubmission(saved);
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetSubmissionsAsync(
        int assignmentId,
        int teacherId,
        CancellationToken ct = default)
    {
        var assignment = await RequireAssignmentAsync(assignmentId, ct);
        if (assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo bài tập mới được xem bài nộp.");

        var submissions = await _assignmentRepository.GetSubmissionsByAssignmentIdAsync(assignmentId, ct);
        return submissions.Select(MapSubmission).ToList();
    }

    public async Task<SubmissionDto> GradeAsync(
        int submissionId,
        GradeSubmissionRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _gradeValidator.ValidateAndThrowAsync(request, ct);

        var submission = await _assignmentRepository.GetSubmissionByIdAsync(submissionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bài nộp.");

        if (submission.Assignment.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên tạo bài tập mới được chấm điểm.");

        if (request.Score > submission.Assignment.MaxScore)
            throw new InvalidOperationException($"Điểm không được vượt quá {submission.Assignment.MaxScore}.");

        submission.Score = request.Score;
        submission.Feedback = string.IsNullOrWhiteSpace(request.Feedback) ? null : request.Feedback.Trim();
        submission.GradedAt = DateTime.UtcNow;

        _assignmentRepository.UpdateSubmission(submission);
        await _assignmentRepository.SaveChangesAsync(ct);
        return MapSubmission(submission);
    }

    private async Task<Assignment> RequireAssignmentAsync(int assignmentId, CancellationToken ct) =>
        await _assignmentRepository.GetByIdAsync(assignmentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy bài tập.");

    private async Task EnsureActiveStudentInClassroomAsync(int classroomId, int studentId, CancellationToken ct)
    {
        var membership = await _classroomRepository.GetMemberAsync(classroomId, studentId, ct);
        if (membership?.Status != ClassroomMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn chưa tham gia lớp học này.");
    }

    private static AssignmentDto MapAssignment(Assignment assignment) => new()
    {
        Id = assignment.Id,
        ClassroomId = assignment.ClassroomId,
        TeacherId = assignment.TeacherId,
        Title = assignment.Title,
        Description = assignment.Description,
        Deadline = assignment.Deadline,
        MaxScore = assignment.MaxScore,
        CreatedAt = assignment.CreatedAt,
        SubmissionCount = assignment.Submissions?.Count ?? 0
    };

    private static SubmissionDto MapSubmission(Submission submission) => new()
    {
        Id = submission.Id,
        AssignmentId = submission.AssignmentId,
        StudentId = submission.StudentId,
        StudentName = submission.Student?.FullName ?? string.Empty,
        StudentEmail = submission.Student?.Email ?? string.Empty,
        Content = submission.Content,
        Score = submission.Score,
        Feedback = submission.Feedback,
        SubmittedAt = submission.SubmittedAt,
        GradedAt = submission.GradedAt
    };
}
