using EduGuard.Domain.Entities;

namespace EduGuard.Application.Repositories.Interfaces;

public interface IClassroomRepository
{
    Task<Classroom?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Classroom?> GetByJoinCodeAsync(string joinCode, CancellationToken ct = default);
    Task<bool> JoinCodeExistsAsync(string joinCode, CancellationToken ct = default);
    Task<List<Classroom>> GetByTeacherIdAsync(int teacherId, CancellationToken ct = default);
    Task<List<Classroom>> GetByStudentIdAsync(int studentId, CancellationToken ct = default);
    Task<ClassroomMember?> GetMemberAsync(int classroomId, int studentId, CancellationToken ct = default);
    Task<List<ClassroomMember>> GetActiveMembersAsync(int classroomId, CancellationToken ct = default);
    Task AddAsync(Classroom classroom, CancellationToken ct = default);
    Task AddMemberAsync(ClassroomMember member, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
