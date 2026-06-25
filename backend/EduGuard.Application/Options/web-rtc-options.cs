namespace EduGuard.Application.Options;

public class WebRtcOptions
{
    public const string SectionName = "WebRtc";

    public List<WebRtcIceServerOptions> IceServers { get; set; } =
    [
        new WebRtcIceServerOptions { Urls = ["stun:stun.l.google.com:19302"] }
    ];
}

public class WebRtcIceServerOptions
{
    public string[] Urls { get; set; } = [];
    public string? Username { get; set; }
    public string? Credential { get; set; }
}
