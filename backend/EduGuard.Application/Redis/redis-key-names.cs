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

    public static string ExamLobbyStudent(string instanceName, int examId, string studentId) =>
        $"{Prefix(instanceName)}exam:{examId}:lobby:{studentId}";

    public static string ExamLobbyIndex(string instanceName, int examId) =>
        $"{Prefix(instanceName)}exam:{examId}:lobby:students";

    public static string ProctoringWatchLock(string instanceName, int attemptId) =>
        $"{Prefix(instanceName)}proctoring:watch-lock:{attemptId}";
}
