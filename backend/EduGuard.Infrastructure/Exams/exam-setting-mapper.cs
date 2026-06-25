using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Exams;

public static class ExamSettingMapper
{
    public static ExamSettingDto MapDto(ExamSetting? setting) => new()
    {
        ShuffleQuestions = setting?.ShuffleQuestions ?? false,
        ShuffleAnswers = setting?.ShuffleAnswers ?? false,
        MaxAttempts = setting?.MaxAttempts ?? 1,
        ShowResultAfterSubmit = setting?.ShowResultAfterSubmit ?? false,
        RequireFullscreen = setting?.RequireFullscreen ?? false,
        AntiCheatMode = setting?.AntiCheatMode ?? "BASIC",
        RequireCamera = setting?.RequireCamera ?? false,
        RequireMicrophone = setting?.RequireMicrophone ?? false,
        EnableLiveProctoring = setting?.EnableLiveProctoring ?? false,
        EnableCameraProctoring = setting?.EnableCameraProctoring ?? false,
        EnableExternalDeviceDetection = setting?.EnableExternalDeviceDetection ?? false,
        CaptureSnapshotOnViolation = setting?.CaptureSnapshotOnViolation ?? false,
        EnableRealtimeWarning = setting?.EnableRealtimeWarning ?? true,
        CameraHeartbeatIntervalSeconds = setting?.CameraHeartbeatIntervalSeconds ?? 10,
        MaxCameraOffSeconds = setting?.MaxCameraOffSeconds ?? 15,
        SnapshotCooldownSeconds = setting?.SnapshotCooldownSeconds ?? 30,
        MaxSnapshotsPerAttempt = setting?.MaxSnapshotsPerAttempt ?? 20,
        MaxActiveLiveTiles = setting?.MaxActiveLiveTiles ?? 9,
        DefaultLiveQuality = setting?.DefaultLiveQuality ?? "360p",
        FocusedLiveQuality = setting?.FocusedLiveQuality ?? "720p",
        AllowTeacherManualSnapshot = setting?.AllowTeacherManualSnapshot ?? true,
        AllowTeacherManualRecording = setting?.AllowTeacherManualRecording ?? false,
        AllowMoveToWaitingRoom = setting?.AllowMoveToWaitingRoom ?? true,
        ViolationAction = setting?.ViolationAction ?? "WARN_TEACHER"
    };

    public static ExamSetting BuildEntity(ExamSettingDto dto) => new()
    {
        ShuffleQuestions = dto.ShuffleQuestions,
        ShuffleAnswers = dto.ShuffleAnswers,
        MaxAttempts = dto.MaxAttempts,
        ShowResultAfterSubmit = dto.ShowResultAfterSubmit,
        RequireFullscreen = dto.RequireFullscreen,
        AntiCheatMode = string.IsNullOrWhiteSpace(dto.AntiCheatMode) ? "BASIC" : dto.AntiCheatMode.Trim(),
        RequireCamera = dto.RequireCamera,
        RequireMicrophone = dto.RequireMicrophone,
        EnableLiveProctoring = dto.EnableLiveProctoring,
        EnableCameraProctoring = dto.EnableCameraProctoring,
        EnableExternalDeviceDetection = dto.EnableExternalDeviceDetection,
        CaptureSnapshotOnViolation = dto.CaptureSnapshotOnViolation,
        EnableRealtimeWarning = dto.EnableRealtimeWarning,
        CameraHeartbeatIntervalSeconds = dto.CameraHeartbeatIntervalSeconds,
        MaxCameraOffSeconds = dto.MaxCameraOffSeconds,
        SnapshotCooldownSeconds = dto.SnapshotCooldownSeconds,
        MaxSnapshotsPerAttempt = dto.MaxSnapshotsPerAttempt,
        MaxActiveLiveTiles = dto.MaxActiveLiveTiles,
        DefaultLiveQuality = string.IsNullOrWhiteSpace(dto.DefaultLiveQuality) ? "360p" : dto.DefaultLiveQuality.Trim(),
        FocusedLiveQuality = string.IsNullOrWhiteSpace(dto.FocusedLiveQuality) ? "720p" : dto.FocusedLiveQuality.Trim(),
        AllowTeacherManualSnapshot = dto.AllowTeacherManualSnapshot,
        AllowTeacherManualRecording = dto.AllowTeacherManualRecording,
        AllowMoveToWaitingRoom = dto.AllowMoveToWaitingRoom,
        ViolationAction = string.IsNullOrWhiteSpace(dto.ViolationAction) ? "WARN_TEACHER" : dto.ViolationAction.Trim()
    };

    public static void ApplyDto(ExamSetting target, ExamSettingDto dto)
    {
        target.ShuffleQuestions = dto.ShuffleQuestions;
        target.ShuffleAnswers = dto.ShuffleAnswers;
        target.MaxAttempts = dto.MaxAttempts;
        target.ShowResultAfterSubmit = dto.ShowResultAfterSubmit;
        target.RequireFullscreen = dto.RequireFullscreen;
        target.AntiCheatMode = string.IsNullOrWhiteSpace(dto.AntiCheatMode) ? "BASIC" : dto.AntiCheatMode.Trim();
        target.RequireCamera = dto.RequireCamera;
        target.RequireMicrophone = dto.RequireMicrophone;
        target.EnableLiveProctoring = dto.EnableLiveProctoring;
        target.EnableCameraProctoring = dto.EnableCameraProctoring;
        target.EnableExternalDeviceDetection = dto.EnableExternalDeviceDetection;
        target.CaptureSnapshotOnViolation = dto.CaptureSnapshotOnViolation;
        target.EnableRealtimeWarning = dto.EnableRealtimeWarning;
        target.CameraHeartbeatIntervalSeconds = dto.CameraHeartbeatIntervalSeconds;
        target.MaxCameraOffSeconds = dto.MaxCameraOffSeconds;
        target.SnapshotCooldownSeconds = dto.SnapshotCooldownSeconds;
        target.MaxSnapshotsPerAttempt = dto.MaxSnapshotsPerAttempt;
        target.MaxActiveLiveTiles = dto.MaxActiveLiveTiles;
        target.DefaultLiveQuality = string.IsNullOrWhiteSpace(dto.DefaultLiveQuality) ? "360p" : dto.DefaultLiveQuality.Trim();
        target.FocusedLiveQuality = string.IsNullOrWhiteSpace(dto.FocusedLiveQuality) ? "720p" : dto.FocusedLiveQuality.Trim();
        target.AllowTeacherManualSnapshot = dto.AllowTeacherManualSnapshot;
        target.AllowTeacherManualRecording = dto.AllowTeacherManualRecording;
        target.AllowMoveToWaitingRoom = dto.AllowMoveToWaitingRoom;
        target.ViolationAction = string.IsNullOrWhiteSpace(dto.ViolationAction) ? "WARN_TEACHER" : dto.ViolationAction.Trim();
    }

    public static void ApplyPatch(ExamSetting target, PatchExamSettingDto patch)
    {
        if (patch.ShuffleQuestions.IsSpecified) target.ShuffleQuestions = patch.ShuffleQuestions.Value;
        if (patch.ShuffleAnswers.IsSpecified) target.ShuffleAnswers = patch.ShuffleAnswers.Value;
        if (patch.MaxAttempts.IsSpecified) target.MaxAttempts = patch.MaxAttempts.Value;
        if (patch.ShowResultAfterSubmit.IsSpecified) target.ShowResultAfterSubmit = patch.ShowResultAfterSubmit.Value;
        if (patch.RequireFullscreen.IsSpecified) target.RequireFullscreen = patch.RequireFullscreen.Value;
        if (patch.AntiCheatMode.IsSpecified) target.AntiCheatMode = patch.AntiCheatMode.Value ?? "BASIC";
        if (patch.RequireCamera.IsSpecified) target.RequireCamera = patch.RequireCamera.Value;
        if (patch.RequireMicrophone.IsSpecified) target.RequireMicrophone = patch.RequireMicrophone.Value;
        if (patch.EnableLiveProctoring.IsSpecified) target.EnableLiveProctoring = patch.EnableLiveProctoring.Value;
        if (patch.EnableCameraProctoring.IsSpecified) target.EnableCameraProctoring = patch.EnableCameraProctoring.Value;
        if (patch.EnableExternalDeviceDetection.IsSpecified) target.EnableExternalDeviceDetection = patch.EnableExternalDeviceDetection.Value;
        if (patch.CaptureSnapshotOnViolation.IsSpecified) target.CaptureSnapshotOnViolation = patch.CaptureSnapshotOnViolation.Value;
        if (patch.EnableRealtimeWarning.IsSpecified) target.EnableRealtimeWarning = patch.EnableRealtimeWarning.Value;
        if (patch.CameraHeartbeatIntervalSeconds.IsSpecified) target.CameraHeartbeatIntervalSeconds = patch.CameraHeartbeatIntervalSeconds.Value;
        if (patch.MaxCameraOffSeconds.IsSpecified) target.MaxCameraOffSeconds = patch.MaxCameraOffSeconds.Value;
        if (patch.SnapshotCooldownSeconds.IsSpecified) target.SnapshotCooldownSeconds = patch.SnapshotCooldownSeconds.Value;
        if (patch.MaxSnapshotsPerAttempt.IsSpecified) target.MaxSnapshotsPerAttempt = patch.MaxSnapshotsPerAttempt.Value;
        if (patch.MaxActiveLiveTiles.IsSpecified) target.MaxActiveLiveTiles = patch.MaxActiveLiveTiles.Value;
        if (patch.DefaultLiveQuality.IsSpecified) target.DefaultLiveQuality = patch.DefaultLiveQuality.Value ?? "360p";
        if (patch.FocusedLiveQuality.IsSpecified) target.FocusedLiveQuality = patch.FocusedLiveQuality.Value ?? "720p";
        if (patch.AllowTeacherManualSnapshot.IsSpecified) target.AllowTeacherManualSnapshot = patch.AllowTeacherManualSnapshot.Value;
        if (patch.AllowTeacherManualRecording.IsSpecified) target.AllowTeacherManualRecording = patch.AllowTeacherManualRecording.Value;
        if (patch.AllowMoveToWaitingRoom.IsSpecified) target.AllowMoveToWaitingRoom = patch.AllowMoveToWaitingRoom.Value;
        if (patch.ViolationAction.IsSpecified) target.ViolationAction = patch.ViolationAction.Value ?? "WARN_TEACHER";
    }
}
