using EduGuard.Application.DTOs.Classrooms;

namespace EduGuard.Application.Services.Interfaces;

public interface IClassroomService
{
    Task<ClassroomDto> CreateAsync(CreateClassroomRequest request, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomDto>> GetMyClassroomsAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ClassroomDto> JoinAsync(JoinClassroomRequest request, string studentId, CancellationToken ct = default);
    Task<ClassroomDto> GetByIdAsync(int classroomId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ClassroomDto> UpdateAsync(int classroomId, UpdateClassroomRequest request, string teacherId, CancellationToken ct = default);
    Task<ClassroomDto> PatchAsync(int classroomId, PatchClassroomRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteAsync(int classroomId, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomMemberDto>> GetMembersAsync(int classroomId, string userId, CancellationToken ct = default);
    Task RemoveMemberAsync(int classroomId, string studentId, string teacherId, CancellationToken ct = default);
}
