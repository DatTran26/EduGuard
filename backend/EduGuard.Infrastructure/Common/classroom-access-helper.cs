using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Common;

public static class ClassroomAccessHelper
{
    public static async Task<Classroom> RequireClassroomAsync(
        IClassroomRepository repository,
        int classroomId,
        CancellationToken ct)
    {
        return await repository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");
    }

    public static async Task EnsureCanAccessClassroomAsync(
        IClassroomRepository repository,
        Classroom classroom,
        int userId,
        IReadOnlyList<string> roles,
        CancellationToken ct)
    {
        if (roles.Contains("Admin"))
            return;

        if (classroom.TeacherId == userId)
            return;

        var membership = await repository.GetMemberAsync(classroom.Id, userId, ct);
        if (membership?.Status == ClassroomMemberStatus.Active)
            return;

        throw new UnauthorizedAccessException("Bạn không có quyền truy cập lớp học này.");
    }

    public static void EnsureTeacherOwnsClassroom(Classroom classroom, int userId)
    {
        if (classroom.TeacherId != userId)
            throw new UnauthorizedAccessException("Chỉ giáo viên chủ lớp mới được thực hiện thao tác này.");
    }
}
