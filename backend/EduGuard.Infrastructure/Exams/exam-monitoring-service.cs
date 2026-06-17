using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;

namespace EduGuard.Infrastructure.Exams;

public class ExamMonitoringService : IExamMonitoringService
{
    private readonly IExamRepository _examRepository;

    public ExamMonitoringService(IExamRepository examRepository) => _examRepository = examRepository;

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

        throw new UnauthorizedAccessException("Chỉ giáo viên tạo đề mới được theo dõi phòng thi này.");
    }
}
