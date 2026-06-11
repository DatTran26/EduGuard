using EduGuard.Application.DTOs.Assignments;

namespace EduGuard.Application.Services.Interfaces;

public interface IAssignmentService
{
    Task<AssignmentDto> CreateAsync(int classroomId, CreateAssignmentRequest request, int teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<AssignmentDto>> GetByClassroomAsync(int classroomId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<AssignmentDto> GetByIdAsync(int assignmentId, int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<AssignmentDto> UpdateAsync(int assignmentId, UpdateAssignmentRequest request, int teacherId, CancellationToken ct = default);
    Task<AssignmentDto> PatchAsync(int assignmentId, PatchAssignmentRequest request, int teacherId, CancellationToken ct = default);
    Task DeleteAsync(int assignmentId, int teacherId, CancellationToken ct = default);
    Task<SubmissionDto> SubmitAsync(int assignmentId, SubmitAssignmentRequest request, int studentId, CancellationToken ct = default);
    Task<IReadOnlyList<SubmissionDto>> GetSubmissionsAsync(int assignmentId, int teacherId, CancellationToken ct = default);
    Task<SubmissionDto> GradeAsync(int submissionId, GradeSubmissionRequest request, int teacherId, CancellationToken ct = default);
}
