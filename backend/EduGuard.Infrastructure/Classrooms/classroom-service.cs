using EduGuard.Application.DTOs.Classrooms;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using FluentValidation;

namespace EduGuard.Infrastructure.Classrooms;

public class ClassroomService : IClassroomService
{
    private const int JoinCodeLength = 6;
    private const int JoinCodeRetries = 5;

    private readonly IClassroomRepository _classroomRepository;
    private readonly IValidator<CreateClassroomRequest> _createValidator;
    private readonly IValidator<JoinClassroomRequest> _joinValidator;
    private readonly IValidator<UpdateClassroomRequest> _updateValidator;
    private readonly IValidator<PatchClassroomRequest> _patchValidator;

    public ClassroomService(
        IClassroomRepository classroomRepository,
        IValidator<CreateClassroomRequest> createValidator,
        IValidator<JoinClassroomRequest> joinValidator,
        IValidator<UpdateClassroomRequest> updateValidator,
        IValidator<PatchClassroomRequest> patchValidator)
    {
        _classroomRepository = classroomRepository;
        _createValidator = createValidator;
        _joinValidator = joinValidator;
        _updateValidator = updateValidator;
        _patchValidator = patchValidator;
    }

    public async Task<ClassroomDto> CreateAsync(
        CreateClassroomRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, ct);

        var joinCode = await GenerateUniqueJoinCodeAsync(ct);
        var classroom = new Classroom
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            TeacherId = teacherId,
            JoinCode = joinCode,
            CreatedAt = DateTime.UtcNow
        };

        await _classroomRepository.AddAsync(classroom, ct);
        await _classroomRepository.SaveChangesAsync(ct);

        var created = await _classroomRepository.GetByIdAsync(classroom.Id, ct)
            ?? classroom;

        return MapClassroom(created);
    }

    public async Task<IReadOnlyList<ClassroomDto>> GetMyClassroomsAsync(
        int userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var classrooms = new List<Classroom>();

        if (roles.Contains("Teacher"))
            classrooms.AddRange(await _classroomRepository.GetByTeacherIdAsync(userId, ct));

        if (roles.Contains("Student"))
            classrooms.AddRange(await _classroomRepository.GetByStudentIdAsync(userId, ct));

        return classrooms
            .GroupBy(x => x.Id)
            .Select(g => g.First())
            .OrderByDescending(x => x.CreatedAt)
            .Select(MapClassroom)
            .ToList();
    }

    public async Task<ClassroomDto> JoinAsync(
        JoinClassroomRequest request,
        int studentId,
        CancellationToken ct = default)
    {
        await _joinValidator.ValidateAndThrowAsync(request, ct);

        var joinCode = request.JoinCode.Trim().ToUpperInvariant();
        var classroom = await _classroomRepository.GetByJoinCodeAsync(joinCode, ct)
            ?? throw new KeyNotFoundException("Mã lớp không hợp lệ.");

        if (classroom.TeacherId == studentId)
            throw new InvalidOperationException("Giáo viên không thể tham gia lớp do chính mình tạo.");

        var existing = await _classroomRepository.GetMemberAsync(classroom.Id, studentId, ct);
        if (existing is not null)
        {
            if (existing.Status == ClassroomMemberStatus.Active)
                throw new InvalidOperationException("Bạn đã tham gia lớp này.");

            existing.Status = ClassroomMemberStatus.Active;
            existing.JoinedAt = DateTime.UtcNow;
        }
        else
        {
            await _classroomRepository.AddMemberAsync(new ClassroomMember
            {
                ClassroomId = classroom.Id,
                StudentId = studentId,
                JoinedAt = DateTime.UtcNow,
                Status = ClassroomMemberStatus.Active
            }, ct);
        }

        await _classroomRepository.SaveChangesAsync(ct);
        return MapClassroom(classroom);
    }

    public async Task<ClassroomDto> GetByIdAsync(
        int classroomId,
        int userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        var isTeacher = classroom.TeacherId == userId;
        var membership = await _classroomRepository.GetMemberAsync(classroomId, userId, ct);
        var isActiveStudent = membership?.Status == ClassroomMemberStatus.Active;
        var isAdmin = roles.Contains("Admin");

        if (!isAdmin && !isTeacher && !isActiveStudent)
            throw new UnauthorizedAccessException("Bạn không có quyền xem lớp học này.");

        return MapClassroom(classroom);
    }

    public async Task<ClassroomDto> UpdateAsync(
        int classroomId,
        UpdateClassroomRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _updateValidator.ValidateAndThrowAsync(request, ct);

        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        if (classroom.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên chủ lớp mới được sửa lớp.");

        classroom.Name = request.Name.Trim();
        classroom.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        classroom.UpdatedAt = DateTime.UtcNow;

        _classroomRepository.Update(classroom);
        await _classroomRepository.SaveChangesAsync(ct);
        return MapClassroom(classroom);
    }

    public async Task<ClassroomDto> PatchAsync(
        int classroomId,
        PatchClassroomRequest request,
        int teacherId,
        CancellationToken ct = default)
    {
        await _patchValidator.ValidateAndThrowAsync(request, ct);

        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        if (classroom.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên chủ lớp mới được sửa lớp.");

        if (request.Name.IsSpecified)
            classroom.Name = request.Name.Value!.Trim();

        if (request.Description.IsSpecified)
        {
            classroom.Description = string.IsNullOrWhiteSpace(request.Description.Value)
                ? null
                : request.Description.Value.Trim();
        }

        classroom.UpdatedAt = DateTime.UtcNow;
        _classroomRepository.Update(classroom);
        await _classroomRepository.SaveChangesAsync(ct);
        return MapClassroom(classroom);
    }

    public async Task DeleteAsync(int classroomId, int teacherId, CancellationToken ct = default)
    {
        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        if (classroom.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên chủ lớp mới được xóa lớp.");

        _classroomRepository.Remove(classroom);
        await _classroomRepository.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<ClassroomMemberDto>> GetMembersAsync(
        int classroomId,
        int userId,
        CancellationToken ct = default)
    {
        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        var isTeacher = classroom.TeacherId == userId;
        var membership = await _classroomRepository.GetMemberAsync(classroomId, userId, ct);
        var isActiveStudent = membership?.Status == ClassroomMemberStatus.Active;

        if (!isTeacher && !isActiveStudent)
            throw new UnauthorizedAccessException("Bạn không có quyền xem thành viên lớp này.");

        var members = await _classroomRepository.GetActiveMembersAsync(classroomId, ct);
        return members.Select(MapMember).ToList();
    }

    public async Task RemoveMemberAsync(
        int classroomId,
        int studentId,
        int teacherId,
        CancellationToken ct = default)
    {
        var classroom = await _classroomRepository.GetByIdAsync(classroomId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lớp học.");

        if (classroom.TeacherId != teacherId)
            throw new UnauthorizedAccessException("Chỉ giáo viên chủ lớp mới được xóa thành viên.");

        var member = await _classroomRepository.GetMemberAsync(classroomId, studentId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy học sinh trong lớp.");

        _classroomRepository.RemoveMember(member);
        await _classroomRepository.SaveChangesAsync(ct);
    }

    private async Task<string> GenerateUniqueJoinCodeAsync(CancellationToken ct)
    {
        for (var i = 0; i < JoinCodeRetries; i++)
        {
            var code = Guid.NewGuid().ToString("N")[..JoinCodeLength].ToUpperInvariant();
            if (!await _classroomRepository.JoinCodeExistsAsync(code, ct))
                return code;
        }

        throw new InvalidOperationException("Không thể tạo mã lớp. Vui lòng thử lại.");
    }

    private static ClassroomDto MapClassroom(Classroom classroom) => new()
    {
        Id = classroom.Id,
        Name = classroom.Name,
        Description = classroom.Description,
        JoinCode = classroom.JoinCode,
        TeacherId = classroom.TeacherId,
        TeacherName = classroom.Teacher?.FullName ?? string.Empty,
        CreatedAt = classroom.CreatedAt
    };

    private static ClassroomMemberDto MapMember(ClassroomMember member) => new()
    {
        Id = member.Id,
        StudentId = member.StudentId,
        FullName = member.Student?.FullName ?? string.Empty,
        Email = member.Student?.Email ?? string.Empty,
        JoinedAt = member.JoinedAt,
        Status = member.Status
    };
}
