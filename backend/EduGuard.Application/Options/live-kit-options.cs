namespace EduGuard.Application.Options;

public class LiveKitOptions
{
    public const string SectionName = "LiveKit";

    /// <summary>When false, clients fall back to SignalR P2P WebRTC.</summary>
    public bool Enabled { get; set; }

    /// <summary>WebSocket URL, e.g. ws://localhost:7880</summary>
    public string Url { get; set; } = "ws://localhost:7880";

    public string ApiKey { get; set; } = "devkey";

    public string ApiSecret { get; set; } = "secret";

    /// <summary>Token lifetime in seconds.</summary>
    public int TokenTtlSeconds { get; set; } = 3600;

    /// <summary>Room name prefix; final room is {RoomPrefix}{examId}.</summary>
    public string RoomPrefix { get; set; } = "exam-";

    public string RoomSuffix { get; set; } = "-proctoring";

    public string BuildRoomName(int examId) => $"{RoomPrefix}{examId}{RoomSuffix}";

    public static string BuildStudentIdentity(int attemptId) => $"attempt-{attemptId}";

    public static string BuildTeacherIdentity(string teacherId) => $"teacher-{teacherId}";

    public static int? TryParseAttemptId(string identity)
    {
        if (!identity.StartsWith("attempt-", StringComparison.OrdinalIgnoreCase))
            return null;

        return int.TryParse(identity["attempt-".Length..], out var attemptId) ? attemptId : null;
    }
}
