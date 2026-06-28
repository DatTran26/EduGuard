using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Exams;

public static class ExamJoinHelper
{
    private static readonly TimeSpan LateJoinGracePeriod = TimeSpan.FromMinutes(1);

    public static bool IsLateJoin(Exam exam, DateTime startedAtUtc)
    {
        var startTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.StartTime);
        if (!startTime.HasValue)
            return false;

        return startedAtUtc > startTime.Value.Add(LateJoinGracePeriod);
    }

    public static int GetLateByMinutes(Exam exam, DateTime startedAtUtc)
    {
        var startTime = ExamDateTimeHelper.MarkNullableAsUtc(exam.StartTime);
        if (!startTime.HasValue || startedAtUtc <= startTime.Value)
            return 0;

        return Math.Max(1, (int)Math.Ceiling((startedAtUtc - startTime.Value).TotalMinutes));
    }
}
