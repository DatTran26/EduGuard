namespace EduGuard.Application.Redis;

public static class RedisKeyNames
{
    public static string Prefix(string instanceName) =>
        string.IsNullOrWhiteSpace(instanceName) ? "eduguard:" : $"{instanceName.Trim()}:";

    public static string ExamQuestions(string instanceName, int examId) =>
        $"{Prefix(instanceName)}exam:{examId}:questions";

    public static string ExamAntiCheatSummary(string instanceName, int examId) =>
        $"{Prefix(instanceName)}exam:{examId}:anticheat:summary";

    public static string AttemptPresence(string instanceName, int attemptId) =>
        $"{Prefix(instanceName)}attempt:{attemptId}:presence";

    public static string ExamPresenceIndex(string instanceName, int examId) =>
        $"{Prefix(instanceName)}exam:{examId}:presence:attempts";
}
