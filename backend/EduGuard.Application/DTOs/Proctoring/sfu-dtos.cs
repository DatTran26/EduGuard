namespace EduGuard.Application.DTOs.Proctoring;

public class SfuConfigDto
{
    public bool Enabled { get; set; }
    public string Mode { get; set; } = "livekit";
    public string? Url { get; set; }
    public IReadOnlyList<object> IceServers { get; set; } = [];
}

public class SfuTokenDto
{
    public string Url { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string Identity { get; set; } = string.Empty;
}
