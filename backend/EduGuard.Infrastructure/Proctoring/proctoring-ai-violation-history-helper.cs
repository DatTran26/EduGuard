using System.Text.Json;
using EduGuard.Application.DTOs.Proctoring;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;

namespace EduGuard.Infrastructure.Proctoring;

public static class ProctoringAiViolationHistoryHelper
{
    private static readonly HashSet<CheatingType> AiCheatingTypes =
    [
        CheatingType.PhoneVisible,
        CheatingType.BookVisible,
        CheatingType.SecondPersonVisible,
        CheatingType.PersonNotVisible,
    ];

    public static IReadOnlyList<ProctoringAiViolationHistoryItemDto> BuildHistory(IEnumerable<CheatingLog> logs)
    {
        var items = new List<ProctoringAiViolationHistoryItemDto>();

        foreach (var log in logs)
        {
            if (!AiCheatingTypes.Contains(log.Type))
            {
                continue;
            }

            var (detectionType, confidence) = ParseLog(log);
            if (string.IsNullOrWhiteSpace(detectionType))
            {
                continue;
            }

            items.Add(new ProctoringAiViolationHistoryItemDto
            {
                DetectionType = detectionType,
                Confidence = confidence,
            });
        }

        return items
            .GroupBy(x => x.DetectionType, StringComparer.OrdinalIgnoreCase)
            .Select(group => new ProctoringAiViolationHistoryItemDto
            {
                DetectionType = group.First().DetectionType,
                Confidence = group.Max(x => x.Confidence),
            })
            .ToList();
    }

    private static (string? DetectionType, decimal Confidence) ParseLog(CheatingLog log)
    {
        if (!string.IsNullOrWhiteSpace(log.Metadata))
        {
            try
            {
                using var document = JsonDocument.Parse(log.Metadata);
                var root = document.RootElement;
                var detectionType = root.TryGetProperty("detectionType", out var typeElement)
                    ? typeElement.GetString()
                    : null;
                var confidence = root.TryGetProperty("confidence", out var confidenceElement)
                    ? confidenceElement.GetDecimal()
                    : 0m;

                if (!string.IsNullOrWhiteSpace(detectionType))
                {
                    return (detectionType, confidence);
                }
            }
            catch (JsonException)
            {
                // Fall back to cheating type mapping below.
            }
        }

        return (MapCheatingTypeToDetectionType(log.Type), 0m);
    }

    private static string? MapCheatingTypeToDetectionType(CheatingType type) => type switch
    {
        CheatingType.PhoneVisible => "PhoneVisible",
        CheatingType.BookVisible => "BookVisible",
        CheatingType.SecondPersonVisible => "MultipleFaces",
        CheatingType.PersonNotVisible => "PersonNotVisible",
        _ => null,
    };
}
