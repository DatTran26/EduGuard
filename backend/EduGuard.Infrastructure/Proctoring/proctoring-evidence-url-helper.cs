namespace EduGuard.Infrastructure.Proctoring;

public static class ProctoringEvidenceUrlHelper
{
    public static string ToDownloadApiPath(int attemptId, int evidenceId) =>
        $"/api/attempts/{attemptId}/proctoring/evidence/{evidenceId}/file";
}
