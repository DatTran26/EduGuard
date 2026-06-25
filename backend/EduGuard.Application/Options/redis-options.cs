namespace EduGuard.Application.Options;

public class RedisOptions
{
    public const string SectionName = "Redis";

    public bool Enabled { get; set; } = true;
    public string InstanceName { get; set; } = "eduguard";
    public int QuestionCacheMinutes { get; set; } = 30;
    public int AntiCheatSummarySeconds { get; set; } = 45;
    public int PresenceTtlSeconds { get; set; } = 120;
    public bool AbortOnConnectFail { get; set; }
}
