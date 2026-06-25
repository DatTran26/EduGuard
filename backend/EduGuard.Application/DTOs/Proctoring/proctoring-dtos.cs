namespace EduGuard.Application.DTOs.Proctoring;

public class ProctoringRoomDto
{
    public int ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public int ClassroomId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool EnableLiveProctoring { get; set; }
    public int MaxActiveLiveTiles { get; set; }
    public int InProgressCount { get; set; }
    public int SubmittedCount { get; set; }
    public int PausedCount { get; set; }
    public int LiveSessionCount { get; set; }
    public IReadOnlyList<ProctoringStateSummaryDto> Students { get; set; } = [];
}

public class ProctoringStateSummaryDto
{
    public int AttemptId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AttemptStatus { get; set; } = string.Empty;
    public string CameraStatus { get; set; } = string.Empty;
    public string LiveStatus { get; set; } = string.Empty;
    public string ConnectionStatus { get; set; } = string.Empty;
    public string EnvironmentStatus { get; set; } = string.Empty;
    public int SuspicionScore { get; set; }
    public string RiskLevel { get; set; } = "Normal";
    public int WarningCount { get; set; }
    public int EvidenceCount { get; set; }
    public string? WatchedByTeacherId { get; set; }
    public string? WatchedByTeacherName { get; set; }
    public DateTime? LatestWarningAt { get; set; }
}

public class ProctoringAttemptDetailDto
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AttemptStatus { get; set; } = string.Empty;
    public ProctoringStateDto State { get; set; } = new();
    public IReadOnlyList<ProctorActionDto> RecentActions { get; set; } = [];
    public IReadOnlyList<ProctoringEvidenceDto> Evidence { get; set; } = [];
}

public class ProctoringStateDto
{
    public string CameraStatus { get; set; } = "Unknown";
    public string LiveStatus { get; set; } = "Inactive";
    public string FullscreenStatus { get; set; } = "Unknown";
    public string ConnectionStatus { get; set; } = "Unknown";
    public string EnvironmentStatus { get; set; } = "Normal";
    public string? LatestDetectionType { get; set; }
    public int WarningCount { get; set; }
    public int EvidenceCount { get; set; }
    public int SuspicionScore { get; set; }
    public string RiskLevel { get; set; } = "Normal";
    public DateTime LastHeartbeatAt { get; set; }
    public DateTime? LatestWarningAt { get; set; }
}

public class ProctorActionDto
{
    public int Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProctoringEvidenceDto
{
    public int Id { get; set; }
    public string EvidenceType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string CaptureSource { get; set; } = string.Empty;
    public string? TriggerEventType { get; set; }
    public decimal? Confidence { get; set; }
    public DateTime CapturedAt { get; set; }
}

public class ExamLobbyStatusDto
{
    public int ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool IsOpen { get; set; }
    public bool RequireCamera { get; set; }
    public bool RequireFullscreen { get; set; }
    public int SecondsUntilOpen { get; set; }
    public int WaitingStudentCount { get; set; }
}

public class ExamProctorAssignmentDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AddExamProctorRequest
{
    public string TeacherId { get; set; } = string.Empty;
}

public class ProctoringAiSettingsDto
{
    public bool EnableYoloDetection { get; set; }
    public string AiServiceBaseUrl { get; set; } = string.Empty;
    public decimal PhoneVisibleMinConfidence { get; set; }
    public decimal BookVisibleMinConfidence { get; set; }
    public decimal SecondPersonMinConfidence { get; set; }
    public int DetectionIntervalSeconds { get; set; }
}

public class UpdateProctoringAiSettingsRequest
{
    public bool EnableYoloDetection { get; set; }
    public string AiServiceBaseUrl { get; set; } = string.Empty;
    public decimal PhoneVisibleMinConfidence { get; set; }
    public decimal BookVisibleMinConfidence { get; set; }
    public decimal SecondPersonMinConfidence { get; set; }
    public int DetectionIntervalSeconds { get; set; }
}

public class ProctoringHeartbeatRequest
{
    public string CameraStatus { get; set; } = "On";
    public string FullscreenStatus { get; set; } = "Unknown";
    public string ConnectionStatus { get; set; } = "Online";
}

public class ProctoringReasonRequest
{
    public string Reason { get; set; } = string.Empty;
}
