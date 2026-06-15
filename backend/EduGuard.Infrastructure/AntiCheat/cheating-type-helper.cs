using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.AntiCheat;

public static class CheatingTypeHelper
{
    private static readonly Dictionary<CheatingType, int> DefaultSuspicionPoints = new()
    {
        [CheatingType.TabSwitch] = 5,
        [CheatingType.WindowBlur] = 4,
        [CheatingType.CopyPaste] = 10,
        [CheatingType.ExitFullscreen] = 8,
        [CheatingType.PageReload] = 6,
        [CheatingType.Disconnected] = 5,
        [CheatingType.WebcamOff] = 15
    };

    public static int GetSuspicionPoint(CheatingType type) =>
        DefaultSuspicionPoints.TryGetValue(type, out var point) ? point : 3;

    public static string ToApiType(CheatingType type) => type switch
    {
        CheatingType.TabSwitch => "TAB_SWITCH",
        CheatingType.WindowBlur => "WINDOW_BLUR",
        CheatingType.CopyPaste => "COPY_PASTE",
        CheatingType.ExitFullscreen => "EXIT_FULLSCREEN",
        CheatingType.PageReload => "PAGE_RELOAD",
        CheatingType.Disconnected => "DISCONNECTED",
        CheatingType.WebcamOff => "WEBCAM_OFF",
        _ => type.ToString().ToUpperInvariant()
    };

    public static CheatingType ParseType(string rawType)
    {
        var normalized = rawType.Trim().ToUpperInvariant().Replace('-', '_');

        return normalized switch
        {
            "TAB_SWITCH" => CheatingType.TabSwitch,
            "WINDOW_BLUR" => CheatingType.WindowBlur,
            "COPY_PASTE" => CheatingType.CopyPaste,
            "EXIT_FULLSCREEN" => CheatingType.ExitFullscreen,
            "PAGE_RELOAD" => CheatingType.PageReload,
            "DISCONNECTED" => CheatingType.Disconnected,
            "WEBCAM_OFF" => CheatingType.WebcamOff,
            _ => throw new ArgumentException($"Loại hành vi anti-cheat không hợp lệ: {rawType}.")
        };
    }
}
