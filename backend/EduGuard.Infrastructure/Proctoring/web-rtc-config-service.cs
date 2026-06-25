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
            .Select(server =>
            {
                var ice = new Dictionary<string, object> { ["urls"] = server.Urls };
                if (!string.IsNullOrWhiteSpace(server.Username))
                    ice["username"] = server.Username;
                if (!string.IsNullOrWhiteSpace(server.Credential))
                    ice["credential"] = server.Credential;
                return (object)ice;
            })
            .ToList();
}
