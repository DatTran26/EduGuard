using EduGuard.Application.Options;
using EduGuard.Application.Redis;
using EduGuard.Application.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace EduGuard.Infrastructure.Redis;

public class ExamCacheInvalidator : IExamCacheInvalidator
{
    private readonly ICacheService _cacheService;
    private readonly RedisOptions _options;

    public ExamCacheInvalidator(ICacheService cacheService, IOptions<RedisOptions> options)
    {
        _cacheService = cacheService;
        _options = options.Value;
    }

    public Task InvalidateExamQuestionsAsync(int examId, CancellationToken ct = default) =>
        _cacheService.RemoveAsync(RedisKeyNames.ExamQuestions(_options.InstanceName, examId), ct);

    public Task InvalidateExamAntiCheatSummaryAsync(int examId, CancellationToken ct = default) =>
        _cacheService.RemoveAsync(RedisKeyNames.ExamAntiCheatSummary(_options.InstanceName, examId), ct);

    public async Task InvalidateExamAsync(int examId, CancellationToken ct = default)
    {
        await InvalidateExamQuestionsAsync(examId, ct);
        await InvalidateExamAntiCheatSummaryAsync(examId, ct);
    }
}
