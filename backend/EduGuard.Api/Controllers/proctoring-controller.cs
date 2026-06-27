using System.Security.Claims;
using EduGuard.Application.DTOs.Common;
using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduGuard.Api.Controllers;

[ApiController]
[Authorize]
public class ProctoringController : ControllerBase
{
    private readonly IProctoringService _proctoringService;
    private readonly IExamLobbyService _examLobbyService;
    private readonly IStudentProctoringService _studentProctoringService;
    private readonly ILiveProctoringService _liveProctoringService;
    private readonly IProctoringActionService _proctoringActionService;
    private readonly IProctoringEvidenceService _proctoringEvidenceService;
    private readonly IProctoringDetectionService _proctoringDetectionService;
    private readonly IWebRtcConfigService _webRtcConfigService;
    private readonly ILiveKitTokenService _liveKitTokenService;

    public ProctoringController(
        IProctoringService proctoringService,
        IExamLobbyService examLobbyService,
        IStudentProctoringService studentProctoringService,
        ILiveProctoringService liveProctoringService,
        IProctoringActionService proctoringActionService,
        IProctoringEvidenceService proctoringEvidenceService,
        IProctoringDetectionService proctoringDetectionService,
        IWebRtcConfigService webRtcConfigService,
        ILiveKitTokenService liveKitTokenService)
    {
        _proctoringService = proctoringService;
        _examLobbyService = examLobbyService;
        _studentProctoringService = studentProctoringService;
        _liveProctoringService = liveProctoringService;
        _proctoringActionService = proctoringActionService;
        _proctoringEvidenceService = proctoringEvidenceService;
        _proctoringDetectionService = proctoringDetectionService;
        _webRtcConfigService = webRtcConfigService;
        _liveKitTokenService = liveKitTokenService;
    }

    [HttpGet("api/proctoring/webrtc-config")]
    [Authorize(Roles = "Teacher,Student,Admin")]
    public ActionResult<ApiResponse<object>> GetWebRtcConfig()
    {
        return Ok(ApiResponse<object>.CreateSuccess(new
        {
            iceServers = _webRtcConfigService.GetIceServers()
        }));
    }

    [HttpGet("api/proctoring/sfu-config")]
    [Authorize(Roles = "Teacher,Student,Admin")]
    public ActionResult<ApiResponse<SfuConfigDto>> GetSfuConfig() =>
        Ok(ApiResponse<SfuConfigDto>.CreateSuccess(_liveKitTokenService.GetConfig()));

    [HttpGet("api/proctoring/detection-config")]
    [Authorize(Roles = "Teacher,Student,Admin")]
    public async Task<ActionResult<ApiResponse<ProctoringDetectionConfigDto>>> GetDetectionConfig(CancellationToken ct) =>
        Ok(ApiResponse<ProctoringDetectionConfigDto>.CreateSuccess(
            await _proctoringService.GetDetectionConfigAsync(ct)));

    [HttpGet("api/exams/{examId:int}/proctoring/sfu-token")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<SfuTokenDto>>> GetTeacherSfuToken(int examId, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _liveKitTokenService.CreateTeacherTokenAsync(examId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/attempts/{attemptId:int}/proctoring/sfu-token")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<SfuTokenDto>>> GetStudentSfuToken(int attemptId, CancellationToken ct) =>
        await ExecuteStudentAsync(() => _liveKitTokenService.CreateStudentTokenAsync(attemptId, GetUserId()!, ct));

    [HttpGet("api/exams/{examId:int}/proctoring/room")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<ProctoringRoomDto>>> GetRoom(int examId, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetRoomAsync(examId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/exams/{examId:int}/proctoring/states")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProctoringStateSummaryDto>>>> GetStates(int examId, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetStatesAsync(examId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/attempts/{attemptId:int}/proctoring/detail")]
    [Authorize(Roles = "Teacher,Admin,Student")]
    public async Task<ActionResult<ApiResponse<ProctoringAttemptDetailDto>>> GetAttemptDetail(int attemptId, CancellationToken ct) =>
        await ExecuteAsync(() => _proctoringService.GetAttemptDetailAsync(attemptId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/attempts/{attemptId:int}/proctoring/state")]
    [Authorize(Roles = "Teacher,Admin,Student")]
    public async Task<ActionResult<ApiResponse<ProctoringStateDto>>> GetAttemptState(int attemptId, CancellationToken ct) =>
        await ExecuteAsync(() => _proctoringService.GetAttemptStateAsync(attemptId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/exams/{examId:int}/lobby")]
    [Authorize(Roles = "Student,Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<ExamLobbyStatusDto>>> GetLobbyStatus(int examId, CancellationToken ct)
    {
        try
        {
            var data = await _examLobbyService.GetLobbyStatusAsync(examId, GetUserId(), ct);
            return Ok(ApiResponse<ExamLobbyStatusDto>.CreateSuccess(data));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<ExamLobbyStatusDto>.CreateFailure(ex.Message)); }
    }

    [HttpPost("api/exams/{examId:int}/lobby/join")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> JoinLobby(int examId, [FromBody] LobbyPresenceRequest request, CancellationToken ct) =>
        await ExecuteStudentVoidAsync(async () =>
        {
            await _examLobbyService.JoinLobbyAsync(examId, GetUserId()!, request.CameraReady, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã vào phòng chờ.");
        });

    [HttpPost("api/exams/{examId:int}/lobby/heartbeat")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> LobbyHeartbeat(int examId, [FromBody] LobbyPresenceRequest request, CancellationToken ct) =>
        await ExecuteStudentVoidAsync(async () =>
        {
            await _examLobbyService.HeartbeatLobbyAsync(examId, GetUserId()!, request.CameraReady, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Cập nhật phòng chờ thành công.");
        });

    [HttpPost("api/exams/{examId:int}/lobby/leave")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> LeaveLobby(int examId, CancellationToken ct) =>
        await ExecuteStudentVoidAsync(async () =>
        {
            await _examLobbyService.LeaveLobbyAsync(examId, GetUserId()!, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã rời phòng chờ.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/start")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> StartProctoring(int attemptId, CancellationToken ct) =>
        await ExecuteStudentVoidAsync(async () =>
        {
            await _studentProctoringService.StartProctoringAsync(attemptId, GetUserId()!, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Bắt đầu giám sát thành công.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/heartbeat")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<ProctoringStateDto>>> ProctoringHeartbeat(
        int attemptId,
        [FromBody] ProctoringHeartbeatRequest request,
        CancellationToken ct) =>
        await ExecuteStudentAsync(() => _studentProctoringService.HeartbeatAsync(attemptId, GetUserId()!, request, ct));

    [HttpPost("api/attempts/{attemptId:int}/proctoring/stop")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ApiResponse<object>>> StopProctoring(int attemptId, CancellationToken ct) =>
        await ExecuteStudentVoidAsync(async () =>
        {
            await _studentProctoringService.StopProctoringAsync(attemptId, GetUserId()!, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Dừng giám sát thành công.");
        });

    [HttpPost("api/attempts/{attemptId:int}/live-proctoring/request")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> RequestWatch(int attemptId, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _liveProctoringService.RequestWatchAsync(attemptId, GetUserId()!, GetRoles(), ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã yêu cầu xem live.");
        });

    [HttpPost("api/attempts/{attemptId:int}/live-proctoring/stop")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> StopWatch(int attemptId, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _liveProctoringService.StopWatchAsync(attemptId, GetUserId()!, GetRoles(), ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã dừng xem live.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/log-action")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> LogTeacherAction(
        int attemptId,
        [FromBody] ProctoringLogActionRequest request,
        CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringActionService.LogTeacherActionAsync(
                attemptId,
                GetUserId()!,
                GetRoles(),
                request.ActionType,
                request.Reason,
                ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã ghi nhận thao tác.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/warn")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> WarnStudent(int attemptId, [FromBody] ProctoringReasonRequest request, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringActionService.WarnStudentAsync(attemptId, GetUserId()!, GetRoles(), request.Reason, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã gửi nhắc nhở.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/move-to-waiting-room")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> PauseAttempt(int attemptId, [FromBody] ProctoringReasonRequest request, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringActionService.PauseAttemptAsync(attemptId, GetUserId()!, GetRoles(), request.Reason, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã tạm dừng bài làm.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/resume")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> ResumeAttempt(int attemptId, [FromBody] ProctoringReasonRequest request, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringActionService.ResumeAttemptAsync(attemptId, GetUserId()!, GetRoles(), request.Reason, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã cho tiếp tục làm bài.");
        });

    [HttpPost("api/attempts/{attemptId:int}/proctoring/terminate")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> TerminateAttempt(int attemptId, [FromBody] ProctoringReasonRequest request, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringActionService.TerminateAttemptAsync(attemptId, GetUserId()!, GetRoles(), request.Reason, ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã kết thúc bài làm.");
        });

    [HttpGet("api/proctoring/evidence")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<ProctoringEvidenceListResultDto>>> GetEvidenceList(
        [FromQuery] int? examId,
        [FromQuery] int? attemptId,
        [FromQuery] string? evidenceType,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken ct = default) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetEvidenceListAsync(
            new ProctoringEvidenceListQuery
            {
                ExamId = examId,
                AttemptId = attemptId,
                EvidenceType = evidenceType,
                Search = search,
                Page = page,
                PageSize = pageSize
            },
            GetUserId()!,
            GetRoles(),
            ct));

    [HttpPost("api/attempts/{attemptId:int}/proctoring/evidence")]
    [Authorize(Roles = "Teacher,Admin,Student")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<ProctoringEvidenceDto>>> UploadEvidence(
        int attemptId,
        IFormFile file,
        [FromForm] string evidenceType,
        [FromForm] string captureSource,
        [FromForm] string? triggerEventType,
        [FromForm] string? metadata,
        CancellationToken ct) =>
        await ExecuteAsync(async () =>
        {
            if (file is null || file.Length <= 0)
                throw new ArgumentException("File bằng trống.");

            await using var stream = file.OpenReadStream();
            return await _proctoringEvidenceService.SaveEvidenceAsync(
                attemptId,
                GetUserId()!,
                GetRoles(),
                stream,
                file.FileName,
                file.ContentType,
                evidenceType,
                captureSource,
                triggerEventType,
                metadata,
                ct);
        });

    [HttpGet("api/attempts/{attemptId:int}/proctoring/evidence/{evidenceId:int}/file")]
    [Authorize(Roles = "Teacher,Admin,Student")]
    public async Task<IActionResult> DownloadEvidence(int attemptId, int evidenceId, CancellationToken ct)
    {
        if (GetUserId() is null)
            return Unauthorized();

        try
        {
            var file = await _proctoringEvidenceService.GetEvidenceFileAsync(
                attemptId,
                evidenceId,
                GetUserId()!,
                GetRoles(),
                ct);

            Response.Headers.CacheControl = "private, no-store";
            return File(file.Stream, file.ContentType, file.FileName, enableRangeProcessing: true);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("api/attempts/{attemptId:int}/proctoring/detect")]
    [Authorize(Roles = "Teacher,Admin,Student")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<ProctoringDetectionResultDto>>> Detect(
        int attemptId,
        IFormFile file,
        CancellationToken ct) =>
        await ExecuteAsync(async () =>
        {
            await using var stream = file.OpenReadStream();
            return await _proctoringDetectionService.DetectAsync(
                attemptId,
                GetUserId()!,
                GetRoles(),
                stream,
                file.FileName,
                file.ContentType,
                ct);
        });

    [HttpGet("api/exams/{examId:int}/proctors")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExamProctorAssignmentDto>>>> GetProctors(int examId, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetProctorsAsync(examId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/exams/{examId:int}/proctors/candidates")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProctorCandidateDto>>>> GetProctorCandidates(int examId, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetProctorCandidatesAsync(examId, GetUserId()!, GetRoles(), ct));

    [HttpGet("api/teacher/proctoring/assigned-exams")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssignedProctorExamDto>>>> GetAssignedExams(CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.GetAssignedExamsAsync(GetUserId()!, GetRoles(), ct));

    [HttpPost("api/exams/{examId:int}/proctors")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<ExamProctorAssignmentDto>>> AddProctor(int examId, [FromBody] AddExamProctorRequest request, CancellationToken ct) =>
        await ExecuteTeacherAsync(() => _proctoringService.AddProctorAsync(examId, request, GetUserId()!, GetRoles(), ct));

    [HttpDelete("api/exams/{examId:int}/proctors/{teacherId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> RemoveProctor(int examId, string teacherId, CancellationToken ct) =>
        await ExecuteTeacherVoidAsync(async () =>
        {
            await _proctoringService.RemoveProctorAsync(examId, teacherId, GetUserId()!, GetRoles(), ct);
            return ApiResponse<object>.CreateSuccess(null!, "Đã xóa co-proctor.");
        });

    [HttpGet("api/admin/proctoring/ai-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProctoringAiSettingsDto>>> GetAiSettings(CancellationToken ct)
    {
        var data = await _proctoringService.GetAiSettingsAsync(ct);
        return Ok(ApiResponse<ProctoringAiSettingsDto>.CreateSuccess(data));
    }

    [HttpPut("api/admin/proctoring/ai-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProctoringAiSettingsDto>>> UpdateAiSettings(
        [FromBody] UpdateProctoringAiSettingsRequest request,
        CancellationToken ct)
    {
        var data = await _proctoringService.UpdateAiSettingsAsync(request, ct);
        return Ok(ApiResponse<ProctoringAiSettingsDto>.CreateSuccess(data, "Cập nhật cấu hình AI thành công."));
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private List<string> GetRoles() => User.FindAll(ClaimTypes.Role).Select(x => x.Value).ToList();

    private async Task<ActionResult<ApiResponse<T>>> ExecuteAsync<T>(Func<Task<T>> action)
    {
        if (GetUserId() is null)
            return Unauthorized(ApiResponse<T>.CreateFailure("Token không hợp lệ."));

        try
        {
            return Ok(ApiResponse<T>.CreateSuccess(await action()));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<T>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<T>.CreateFailure(ex.Message)); }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<T>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<T>.CreateFailure(ex.Message)); }
    }

    private Task<ActionResult<ApiResponse<T>>> ExecuteTeacherAsync<T>(Func<Task<T>> action) => ExecuteAsync(action);

    private async Task<ActionResult<ApiResponse<T>>> ExecuteStudentAsync<T>(Func<Task<T>> action)
    {
        if (GetUserId() is null)
            return Unauthorized(ApiResponse<T>.CreateFailure("Token không hợp lệ."));

        try
        {
            return Ok(ApiResponse<T>.CreateSuccess(await action()));
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<T>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<T>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<T>.CreateFailure(ex.Message)); }
    }

    private async Task<ActionResult<ApiResponse<object>>> ExecuteTeacherVoidAsync(Func<Task<ApiResponse<object>>> action)
    {
        if (GetUserId() is null)
            return Unauthorized(ApiResponse<object>.CreateFailure("Token không hợp lệ."));

        try
        {
            return Ok(await action());
        }
        catch (KeyNotFoundException ex) { return NotFound(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (UnauthorizedAccessException ex) { return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (ArgumentException ex) { return BadRequest(ApiResponse<object>.CreateFailure(ex.Message)); }
        catch (InvalidOperationException ex) { return BadRequest(ApiResponse<object>.CreateFailure(ex.Message)); }
    }

    private Task<ActionResult<ApiResponse<object>>> ExecuteStudentVoidAsync(Func<Task<ApiResponse<object>>> action) =>
        ExecuteTeacherVoidAsync(action);
}

public class LobbyPresenceRequest
{
    public bool CameraReady { get; set; }
}
