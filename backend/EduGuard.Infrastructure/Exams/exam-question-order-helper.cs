using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Exams;

public static class ExamQuestionOrderHelper
{
    public static void Resequence(IList<Question> questions, int movingQuestionId, int targetOrderIndex)
    {
        var moving = questions.FirstOrDefault(x => x.Id == movingQuestionId);
        if (moving is null)
            return;

        var siblings = questions
            .Where(x => x.Id != movingQuestionId)
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .ToList();

        var clampedIndex = Math.Clamp(targetOrderIndex, 1, siblings.Count + 1);
        siblings.Insert(clampedIndex - 1, moving);

        for (var index = 0; index < siblings.Count; index++)
            siblings[index].OrderIndex = index + 1;
    }

    public static void Renumber(IList<Question> questions)
    {
        var ordered = questions.OrderBy(x => x.OrderIndex).ThenBy(x => x.Id).ToList();
        for (var index = 0; index < ordered.Count; index++)
            ordered[index].OrderIndex = index + 1;
    }
}
