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
        [CheatingType.WebcamOff] = 15,
        [CheatingType.PhoneVisible] = 12,
        [CheatingType.BookVisible] = 10,
        [CheatingType.SecondPersonVisible] = 12,
        [CheatingType.PersonNotVisible] = 8
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
        CheatingType.PhoneVisible => "PHONE_VISIBLE",
        CheatingType.BookVisible => "BOOK_VISIBLE",
        CheatingType.SecondPersonVisible => "SECOND_PERSON_VISIBLE",
        CheatingType.PersonNotVisible => "PERSON_NOT_VISIBLE",
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
            "PHONE_VISIBLE" => CheatingType.PhoneVisible,
            "BOOK_VISIBLE" => CheatingType.BookVisible,
            "SECOND_PERSON_VISIBLE" => CheatingType.SecondPersonVisible,
            "PERSON_NOT_VISIBLE" => CheatingType.PersonNotVisible,
            _ => throw new ArgumentException($"Loại hành vi anti-cheat không hợp lệ: {rawType}.")
        };
    }

    public static string GetDisplayName(CheatingType type) => type switch
    {
        CheatingType.TabSwitch => "Chuyển tab",
        CheatingType.WindowBlur => "Rời khỏi cửa sổ",
        CheatingType.CopyPaste => "Sao chép / dán",
        CheatingType.ExitFullscreen => "Thoát toàn màn hình",
        CheatingType.PageReload => "Tải lại trang",
        CheatingType.Disconnected => "Mất kết nối",
        CheatingType.WebcamOff => "Tắt webcam",
        CheatingType.PhoneVisible => "Phát hiện điện thoại",
        CheatingType.BookVisible => "Phát hiện tài liệu",
        CheatingType.SecondPersonVisible => "Phát hiện người thứ hai",
        CheatingType.PersonNotVisible => "Không thấy người trong khung hình",
        _ => "Hành vi nghi ngờ"
    };

    public static bool IsHighSeverity(CheatingType type) => type switch
    {
        CheatingType.CopyPaste => true,
        CheatingType.WebcamOff => true,
        CheatingType.PhoneVisible => true,
        CheatingType.BookVisible => true,
        CheatingType.SecondPersonVisible => true,
        CheatingType.PersonNotVisible => true,
        _ => false
    };
}
