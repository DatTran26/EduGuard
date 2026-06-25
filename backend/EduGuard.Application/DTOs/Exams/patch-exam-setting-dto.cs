using EduGuard.Application.DTOs.Common;

namespace EduGuard.Application.DTOs.Exams;

public class PatchExamSettingDto
{
    public Optional<bool> ShuffleQuestions { get; set; }
    public Optional<bool> ShuffleAnswers { get; set; }
    public Optional<int> MaxAttempts { get; set; }
    public Optional<bool> ShowResultAfterSubmit { get; set; }
    public Optional<bool> RequireFullscreen { get; set; }

    public Optional<string> AntiCheatMode { get; set; }
    public Optional<bool> RequireCamera { get; set; }
    public Optional<bool> RequireMicrophone { get; set; }
    public Optional<bool> EnableLiveProctoring { get; set; }
    public Optional<bool> EnableCameraProctoring { get; set; }
    public Optional<bool> EnableExternalDeviceDetection { get; set; }
    public Optional<bool> CaptureSnapshotOnViolation { get; set; }
    public Optional<bool> EnableRealtimeWarning { get; set; }
    public Optional<int> CameraHeartbeatIntervalSeconds { get; set; }
    public Optional<int> MaxCameraOffSeconds { get; set; }
    public Optional<int> SnapshotCooldownSeconds { get; set; }
    public Optional<int> MaxSnapshotsPerAttempt { get; set; }
    public Optional<int> MaxActiveLiveTiles { get; set; }
    public Optional<string> DefaultLiveQuality { get; set; }
    public Optional<string> FocusedLiveQuality { get; set; }
    public Optional<bool> AllowTeacherManualSnapshot { get; set; }
    public Optional<bool> AllowTeacherManualRecording { get; set; }
    public Optional<bool> AllowMoveToWaitingRoom { get; set; }
    public Optional<string> ViolationAction { get; set; }
}
