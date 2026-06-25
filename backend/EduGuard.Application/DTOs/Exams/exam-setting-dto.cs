namespace EduGuard.Application.DTOs.Exams;

public class ExamSettingDto
{
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleAnswers { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShowResultAfterSubmit { get; set; }
    public bool RequireFullscreen { get; set; }

    public string AntiCheatMode { get; set; } = "BASIC";
    public bool RequireCamera { get; set; }
    public bool RequireMicrophone { get; set; }
    public bool EnableLiveProctoring { get; set; }
    public bool EnableCameraProctoring { get; set; }
    public bool EnableExternalDeviceDetection { get; set; }
    public bool CaptureSnapshotOnViolation { get; set; }
    public bool EnableRealtimeWarning { get; set; } = true;
    public int CameraHeartbeatIntervalSeconds { get; set; } = 10;
    public int MaxCameraOffSeconds { get; set; } = 15;
    public int SnapshotCooldownSeconds { get; set; } = 30;
    public int MaxSnapshotsPerAttempt { get; set; } = 20;
    public int MaxActiveLiveTiles { get; set; } = 9;
    public string DefaultLiveQuality { get; set; } = "360p";
    public string FocusedLiveQuality { get; set; } = "720p";
    public bool AllowTeacherManualSnapshot { get; set; } = true;
    public bool AllowTeacherManualRecording { get; set; }
    public bool AllowMoveToWaitingRoom { get; set; } = true;
    public string ViolationAction { get; set; } = "WARN_TEACHER";
}
