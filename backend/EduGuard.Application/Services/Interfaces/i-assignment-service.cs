using EduGuard.Application.DTOs.Assignments;

namespace EduGuard.Application.Services.Interfaces;

public interface IAssignmentService
{
    Task<AssignmentDto> CreateAsync(int classroomId, CreateAssignmentRequest request, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<AssignmentDto>> GetByClassroomAsync(int classroomId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<AssignmentDto> GetByIdAsync(int assignmentId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<AssignmentDto> UpdateAsync(int assignmentId, UpdateAssignmentRequest request, string teacherId, CancellationToken ct = default);
    Task<AssignmentDto> PatchAsync(int assignmentId, PatchAssignmentRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteAsync(int assignmentId, string teacherId, CancellationToken ct = default);
    Task<SubmissionDto> SubmitAsync(int assignmentId, SubmitAssignmentRequest request, string studentId, CancellationToken ct = default);
    Task<IReadOnlyList<SubmissionDto>> GetSubmissionsAsync(int assignmentId, string teacherId, CancellationToken ct = default);
    Task<SubmissionDto> GradeAsync(int submissionId, GradeSubmissionRequest request, string teacherId, CancellationToken ct = default);
}
