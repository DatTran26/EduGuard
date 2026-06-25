using EduGuard.Application.Options;
using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Proctoring;

public class WebRtcConfigService : IWebRtcConfigService
{
    private readonly WebRtcOptions _options;

    public WebRtcConfigService(IOptions<WebRtcOptions> options) => _options = options.Value;

    public IReadOnlyList<object> GetIceServers() =>
        _options.IceServers
            .Where(server => server.Urls.Length > 0)
            .Select(server => (object)new Dictionary<string, object?>
            {
                ["urls"] = server.Urls,
                ["username"] = server.Username,
                ["credential"] = server.Credential
            })
            .ToList();
}
