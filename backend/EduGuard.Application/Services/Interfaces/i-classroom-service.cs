using EduGuard.Application.DTOs.Classrooms;

namespace EduGuard.Application.Services.Interfaces;

public interface IClassroomService
{
    Task<ClassroomDto> CreateAsync(CreateClassroomRequest request, int teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomDto>> GetMyClassroomsAsync(int userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ClassroomDto> JoinAsync(JoinClassroomRequest request, int studentId, CancellationToken ct = default);
    Task<IReadOnlyList<ClassroomMemberDto>> GetMembersAsync(int classroomId, int userId, CancellationToken ct = default);
}
