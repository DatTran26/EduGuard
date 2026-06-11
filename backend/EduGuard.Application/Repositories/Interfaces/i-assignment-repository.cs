using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IAssignmentRepository
{
    Task<Assignment?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<Assignment>> GetByClassroomIdAsync(int classroomId, CancellationToken ct = default);
    Task<Submission?> GetSubmissionAsync(int assignmentId, int studentId, CancellationToken ct = default);
    Task<Submission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default);
    Task<List<Submission>> GetSubmissionsByAssignmentIdAsync(int assignmentId, CancellationToken ct = default);
    Task AddAsync(Assignment assignment, CancellationToken ct = default);
    Task AddSubmissionAsync(Submission submission, CancellationToken ct = default);
    void Update(Assignment assignment);
    void Remove(Assignment assignment);
    void UpdateSubmission(Submission submission);
    Task SaveChangesAsync(CancellationToken ct = default);
}
