using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Proctoring;

public static class ProctoringSettingsHelper
{
    public static bool IsCameraMonitoringEnabled(ExamSetting? setting) =>
        setting?.EnableLiveProctoring == true ||
        setting?.RequireCamera == true ||
        setting?.EnableCameraProctoring == true;

    public static void EnsureCameraMonitoringEnabled(Exam exam)
    {
        if (!IsCameraMonitoringEnabled(exam.Setting))
            throw new InvalidOperationException("Đề thi này không bật giám sát camera.");
    }
}
