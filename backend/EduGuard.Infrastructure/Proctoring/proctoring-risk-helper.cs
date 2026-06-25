namespace EduGuard.Infrastructure.Proctoring;

public static class ProctoringRiskHelper
{
    public static string GetRiskLevel(int suspicionScore) => suspicionScore switch
    {
        <= 20 => "Normal",
        <= 50 => "Watch",
        <= 80 => "Warning",
        _ => "Critical"
    };
}
