using EduGuard.Application.DTOs.Exams;
using EduGuard.Domain.Entities;

namespace EduGuard.Infrastructure.Exams;

public static class ExamShuffleHelper
{
    public static List<QuestionDto> BuildAttemptQuestions(
        IEnumerable<Question> questions,
        ExamSetting? setting,
        bool hideCorrectAnswers = true)
    {
        var questionList = questions
            .OrderBy(x => x.OrderIndex)
            .ThenBy(x => x.Id)
            .ToList();

        if (setting?.ShuffleQuestions == true)
            questionList = questionList.OrderBy(_ => Random.Shared.Next()).ToList();

        return questionList
            .Select(question =>
            {
                var answers = question.Answers
                    .OrderBy(x => x.OrderIndex)
                    .ThenBy(x => x.Id)
                    .ToList();

                if (setting?.ShuffleAnswers == true)
                    answers = answers.OrderBy(_ => Random.Shared.Next()).ToList();

                var clone = new Question
                {
                    Id = question.Id,
                    ExamId = question.ExamId,
                    Content = question.Content,
                    QuestionType = question.QuestionType,
                    Score = question.Score,
                    OrderIndex = question.OrderIndex,
                    Answers = answers
                };

                return ExamMapper.MapQuestion(clone, hideCorrectAnswers);
            })
            .ToList();
    }
}
