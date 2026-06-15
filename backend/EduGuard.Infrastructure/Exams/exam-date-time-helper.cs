namespace EduGuard.Infrastructure.Exams;

internal static class ExamDateTimeHelper
{
    public static DateTime? NormalizeNullableUtc(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        return NormalizeUtc(value.Value);
    }

    public static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    public static DateTime? MarkNullableAsUtc(DateTime? value)
    {
        if (!value.HasValue)
            return null;

        return MarkAsUtc(value.Value);
    }

    public static DateTime MarkAsUtc(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
