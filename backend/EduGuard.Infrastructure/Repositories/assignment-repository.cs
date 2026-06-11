using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class AssignmentRepository : IAssignmentRepository
{
    private readonly AppDbContext _db;

    public AssignmentRepository(AppDbContext db) => _db = db;

    public Task<Assignment?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.Assignments
            .Include(x => x.Teacher)
            .Include(x => x.Submissions)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<List<Assignment>> GetByClassroomIdAsync(int classroomId, CancellationToken ct = default) =>
        _db.Assignments
            .Include(x => x.Submissions)
            .Where(x => x.ClassroomId == classroomId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<Submission?> GetSubmissionAsync(int assignmentId, int studentId, CancellationToken ct = default) =>
        _db.Submissions.FirstOrDefaultAsync(x => x.AssignmentId == assignmentId && x.StudentId == studentId, ct);

    public Task<Submission?> GetSubmissionByIdAsync(int submissionId, CancellationToken ct = default) =>
        _db.Submissions
            .Include(x => x.Student)
            .Include(x => x.Assignment)
            .FirstOrDefaultAsync(x => x.Id == submissionId, ct);

    public Task<List<Submission>> GetSubmissionsByAssignmentIdAsync(int assignmentId, CancellationToken ct = default) =>
        _db.Submissions
            .Include(x => x.Student)
            .Where(x => x.AssignmentId == assignmentId)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Assignment assignment, CancellationToken ct = default) =>
        await _db.Assignments.AddAsync(assignment, ct);

    public async Task AddSubmissionAsync(Submission submission, CancellationToken ct = default) =>
        await _db.Submissions.AddAsync(submission, ct);

    public void Update(Assignment assignment) => _db.Assignments.Update(assignment);

    public void Remove(Assignment assignment) => _db.Assignments.Remove(assignment);

    public void UpdateSubmission(Submission submission) => _db.Submissions.Update(submission);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
