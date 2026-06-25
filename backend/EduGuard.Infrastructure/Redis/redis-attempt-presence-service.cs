using EduGuard.Application.Options;
using EduGuard.Application.Redis;
using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace EduGuard.Infrastructure.Redis;

public class RedisAttemptPresenceService : IAttemptPresenceService
{
    private readonly IDatabase _database;
    private readonly RedisOptions _options;
    private readonly ILogger<RedisAttemptPresenceService> _logger;

    public RedisAttemptPresenceService(
        IConnectionMultiplexer multiplexer,
        IOptions<RedisOptions> options,
        ILogger<RedisAttemptPresenceService> logger)
    {
        _database = multiplexer.GetDatabase();
        _options = options.Value;
        _logger = logger;
    }

    public async Task TouchAsync(
        int attemptId,
        string studentId,
        int examId,
        string? client = null,
        CancellationToken ct = default)
    {
        var presenceKey = RedisKeyNames.AttemptPresence(_options.InstanceName, attemptId);
        var indexKey = RedisKeyNames.ExamPresenceIndex(_options.InstanceName, examId);
        var ttl = TimeSpan.FromSeconds(_options.PresenceTtlSeconds);

        try
        {
            var entries = new HashEntry[]
            {
                new("studentId", studentId),
                new("examId", examId.ToString()),
                new("lastSeenUtc", DateTime.UtcNow.ToString("O")),
                new("client", string.IsNullOrWhiteSpace(client) ? "web" : client.Trim())
            };

            var transaction = _database.CreateTransaction();
            _ = transaction.HashSetAsync(presenceKey, entries);
            _ = transaction.KeyExpireAsync(presenceKey, ttl);
            _ = transaction.SetAddAsync(indexKey, attemptId);
            await transaction.ExecuteAsync().WaitAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis presence touch failed for attempt {AttemptId}.", attemptId);
        }
    }

    public async Task RemoveAsync(int attemptId, int examId, CancellationToken ct = default)
    {
        var presenceKey = RedisKeyNames.AttemptPresence(_options.InstanceName, attemptId);
        var indexKey = RedisKeyNames.ExamPresenceIndex(_options.InstanceName, examId);

        try
        {
            var transaction = _database.CreateTransaction();
            _ = transaction.KeyDeleteAsync(presenceKey);
            _ = transaction.SetRemoveAsync(indexKey, attemptId);
            await transaction.ExecuteAsync().WaitAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis presence remove failed for attempt {AttemptId}.", attemptId);
        }
    }

    public async Task<IReadOnlyList<int>> GetOnlineAttemptIdsByExamAsync(int examId, CancellationToken ct = default)
    {
        var indexKey = RedisKeyNames.ExamPresenceIndex(_options.InstanceName, examId);

        try
        {
            var members = await _database.SetMembersAsync(indexKey).WaitAsync(ct);
            var attemptIds = new List<int>();

            foreach (var member in members)
            {
                if (int.TryParse(member.ToString(), out var attemptId))
                    attemptIds.Add(attemptId);
            }

            return attemptIds;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis presence lookup failed for exam {ExamId}.", examId);
            return [];
        }
    }
}
