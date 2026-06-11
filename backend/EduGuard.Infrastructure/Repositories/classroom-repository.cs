using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class ClassroomRepository : IClassroomRepository
{
    private readonly AppDbContext _db;

    public ClassroomRepository(AppDbContext db)
    {
        _db = db;
    }

    public Task<Classroom?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.Classrooms
            .Include(x => x.Teacher)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<Classroom?> GetByJoinCodeAsync(string joinCode, CancellationToken ct = default) =>
        _db.Classrooms
            .Include(x => x.Teacher)
            .FirstOrDefaultAsync(x => x.JoinCode == joinCode, ct);

    public Task<bool> JoinCodeExistsAsync(string joinCode, CancellationToken ct = default) =>
        _db.Classrooms.AnyAsync(x => x.JoinCode == joinCode, ct);

    public Task<List<Classroom>> GetByTeacherIdAsync(int teacherId, CancellationToken ct = default) =>
        _db.Classrooms
            .Include(x => x.Teacher)
            .Where(x => x.TeacherId == teacherId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<List<Classroom>> GetByStudentIdAsync(int studentId, CancellationToken ct = default) =>
        _db.ClassroomMembers
            .Where(x => x.StudentId == studentId && x.Status == ClassroomMemberStatus.Active)
            .Include(x => x.Classroom)
            .ThenInclude(x => x.Teacher)
            .OrderByDescending(x => x.JoinedAt)
            .Select(x => x.Classroom)
            .ToListAsync(ct);

    public Task<ClassroomMember?> GetMemberAsync(int classroomId, int studentId, CancellationToken ct = default) =>
        _db.ClassroomMembers
            .FirstOrDefaultAsync(x => x.ClassroomId == classroomId && x.StudentId == studentId, ct);

    public Task<List<ClassroomMember>> GetActiveMembersAsync(int classroomId, CancellationToken ct = default) =>
        _db.ClassroomMembers
            .Where(x => x.ClassroomId == classroomId && x.Status == ClassroomMemberStatus.Active)
            .Include(x => x.Student)
            .OrderBy(x => x.JoinedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Classroom classroom, CancellationToken ct = default) =>
        await _db.Classrooms.AddAsync(classroom, ct);

    public async Task AddMemberAsync(ClassroomMember member, CancellationToken ct = default) =>
        await _db.ClassroomMembers.AddAsync(member, ct);

    public void Update(Classroom classroom) =>
        _db.Classrooms.Update(classroom);

    public void Remove(Classroom classroom) =>
        _db.Classrooms.Remove(classroom);

    public void RemoveMember(ClassroomMember member) =>
        _db.ClassroomMembers.Remove(member);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
