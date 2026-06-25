using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;

namespace EduGuard.Infrastructure.Exams;

public class ExamMonitoringService : IExamMonitoringService
{
    private readonly IExamRepository _examRepository;
    private readonly IProctoringRepository _proctoringRepository;

    public ExamMonitoringService(
        IExamRepository examRepository,
        IProctoringRepository proctoringRepository)
    {
        _examRepository = examRepository;
        _proctoringRepository = proctoringRepository;
    }

    public async Task EnsureCanMonitorExamAsync(
        int examId,
        string userId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        if (examId <= 0)
            throw new ArgumentException("Mã đề thi không hợp lệ.", nameof(examId));

        var exam = await _examRepository.GetByIdAsync(examId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy đề thi.");

        if (roles.Contains("Admin") || exam.TeacherId == userId)
            return;

        if (await _proctoringRepository.IsAssignedProctorAsync(examId, userId, ct))
            return;

        throw new UnauthorizedAccessException("Bạn không có quyền theo dõi phòng thi này.");
    }
}
