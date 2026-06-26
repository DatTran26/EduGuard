using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Application.Options;
using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Proctoring;
public class LiveKitTokenService : ILiveKitTokenService
{
    private readonly LiveKitOptions _liveKitOptions;
    private readonly IWebRtcConfigService _webRtcConfigService;
    private readonly IProctoringSignalingService _proctoringSignalingService;
    private readonly IExamMonitoringService _examMonitoringService;

    public LiveKitTokenService(
        IOptions<LiveKitOptions> liveKitOptions,
        IWebRtcConfigService webRtcConfigService,
        IProctoringSignalingService proctoringSignalingService,
        IExamMonitoringService examMonitoringService)
    {
        _liveKitOptions = liveKitOptions.Value;
        _webRtcConfigService = webRtcConfigService;
        _proctoringSignalingService = proctoringSignalingService;
        _examMonitoringService = examMonitoringService;
    }

    public SfuConfigDto GetConfig() =>
        new()
        {
            Enabled = _liveKitOptions.Enabled,
            Mode = "livekit",
            Url = _liveKitOptions.Enabled ? _liveKitOptions.Url : null,
            IceServers = _webRtcConfigService.GetIceServers(),
        };

    public async Task<SfuTokenDto> CreateTeacherTokenAsync(
        int examId,
        string teacherId,
        IReadOnlyList<string> roles,
        CancellationToken ct = default)
    {
        EnsureEnabled();
        await _examMonitoringService.EnsureCanMonitorExamAsync(examId, teacherId, roles, ct);

        var roomName = _liveKitOptions.BuildRoomName(examId);
        var identity = LiveKitOptions.BuildTeacherIdentity(teacherId);
        var token = CreateJwt(
            identity,
            displayName: "Teacher",
            roomName,
            canPublish: false,
            canSubscribe: true,
            metadata: JsonSerializer.Serialize(new { examId, role = "teacher" }));

        return new SfuTokenDto
        {
            Url = _liveKitOptions.Url,
            Token = token,
            RoomName = roomName,
            Identity = identity,
        };
    }

    public async Task<SfuTokenDto> CreateStudentTokenAsync(
        int attemptId,
        string studentId,
        CancellationToken ct = default)
    {
        EnsureEnabled();
        await _proctoringSignalingService.EnsureStudentCanJoinAttemptStreamAsync(attemptId, studentId, ct);

        var examId = await _proctoringSignalingService.GetExamIdByAttemptAsync(attemptId, ct);
        var roomName = _liveKitOptions.BuildRoomName(examId);
        var identity = LiveKitOptions.BuildStudentIdentity(attemptId);
        var token = CreateJwt(
            identity,
            displayName: "Student",
            roomName,
            canPublish: true,
            canSubscribe: false,
            metadata: JsonSerializer.Serialize(new { attemptId, examId, role = "student" }));

        return new SfuTokenDto
        {
            Url = _liveKitOptions.Url,
            Token = token,
            RoomName = roomName,
            Identity = identity,
        };
    }

    private void EnsureEnabled()
    {
        if (!_liveKitOptions.Enabled)
            throw new InvalidOperationException("SFU (LiveKit) chưa được bật trên server.");

        if (string.IsNullOrWhiteSpace(_liveKitOptions.ApiKey) ||
            string.IsNullOrWhiteSpace(_liveKitOptions.ApiSecret))
        {
            throw new InvalidOperationException("LiveKit ApiKey và ApiSecret phải được cấu hình.");
        }
    }

    private string CreateJwt(
        string identity,
        string displayName,
        string roomName,
        bool canPublish,
        bool canSubscribe,
        string? metadata)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var payload = new Dictionary<string, object>
        {
            ["sub"] = identity,
            ["iss"] = _liveKitOptions.ApiKey,
            ["nbf"] = now - 10,
            ["exp"] = now + Math.Max(60, _liveKitOptions.TokenTtlSeconds),
            ["name"] = displayName,
            ["video"] = new Dictionary<string, object>
            {
                ["room"] = roomName,
                ["roomJoin"] = true,
                ["canPublish"] = canPublish,
                ["canSubscribe"] = canSubscribe,
            },
        };

        if (!string.IsNullOrWhiteSpace(metadata))
            payload["metadata"] = metadata;

        var headerJson = JsonSerializer.Serialize(new { alg = "HS256", typ = "JWT" });
        var payloadJson = JsonSerializer.Serialize(payload);
        var headerSegment = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
        var payloadSegment = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
        var signatureInput = $"{headerSegment}.{payloadSegment}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_liveKitOptions.ApiSecret));
        var signatureSegment = Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(signatureInput)));

        return $"{signatureInput}.{signatureSegment}";
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
