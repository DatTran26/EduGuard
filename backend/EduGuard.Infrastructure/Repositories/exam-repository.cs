using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Domain.Enums;
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EduGuard.Infrastructure.Repositories;

public class ExamRepository : IExamRepository
{
    private readonly AppDbContext _db;

    public ExamRepository(AppDbContext db) => _db = db;

    public Task<Exam?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.Exams
            .Include(x => x.Setting)
            .Include(x => x.Teacher)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<Exam?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default) =>
        _db.Exams
            .Include(x => x.Setting)
            .Include(x => x.Teacher)
            .Include(x => x.Questions)
                .ThenInclude(q => q.Answers)
            .Include(x => x.Attempts)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<List<Exam>> GetByClassroomIdAsync(int classroomId, CancellationToken ct = default) =>
        _db.Exams
            .Include(x => x.Setting)
            .Include(x => x.Questions)
            .Include(x => x.Attempts)
            .Where(x => x.ClassroomId == classroomId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

    public Task<Question?> GetQuestionByIdAsync(int questionId, CancellationToken ct = default) =>
        _db.Questions
            .Include(x => x.Answers)
            .Include(x => x.Exam)
            .FirstOrDefaultAsync(x => x.Id == questionId, ct);

    public Task<Answer?> GetAnswerByIdAsync(int answerId, CancellationToken ct = default) =>
        _db.Answers
            .Include(x => x.Question)
                .ThenInclude(q => q.Exam)
            .FirstOrDefaultAsync(x => x.Id == answerId, ct);

    public Task<ExamAttempt?> GetAttemptByIdAsync(int attemptId, CancellationToken ct = default) =>
        _db.ExamAttempts
            .Include(x => x.Student)
            .Include(x => x.Exam)
                .ThenInclude(e => e.Setting)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct);

    public Task<ExamAttempt?> GetAttemptWithAnswersAsync(int attemptId, CancellationToken ct = default) =>
        _db.ExamAttempts
            .Include(x => x.Student)
            .Include(x => x.Exam)
                .ThenInclude(e => e.Setting)
            .Include(x => x.Exam)
                .ThenInclude(e => e.Questions)
                    .ThenInclude(q => q.Answers)
            .Include(x => x.StudentAnswers)
            .FirstOrDefaultAsync(x => x.Id == attemptId, ct);

    public Task<int> CountAttemptsAsync(int examId, int studentId, CancellationToken ct = default) =>
        _db.ExamAttempts.CountAsync(x => x.ExamId == examId && x.StudentId == studentId, ct);

    public Task<ExamAttempt?> GetInProgressAttemptAsync(int examId, int studentId, CancellationToken ct = default) =>
        _db.ExamAttempts
            .Include(x => x.StudentAnswers)
            .FirstOrDefaultAsync(
                x => x.ExamId == examId && x.StudentId == studentId && x.Status == ExamAttemptStatus.InProgress,
                ct);

    public Task<List<ExamAttempt>> GetAttemptsByExamIdAsync(int examId, CancellationToken ct = default) =>
        _db.ExamAttempts
            .Include(x => x.Student)
            .Where(x => x.ExamId == examId)
            .OrderByDescending(x => x.StartedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Exam exam, CancellationToken ct = default) =>
        await _db.Exams.AddAsync(exam, ct);

    public async Task AddQuestionAsync(Question question, CancellationToken ct = default) =>
        await _db.Questions.AddAsync(question, ct);

    public async Task AddAnswerAsync(Answer answer, CancellationToken ct = default) =>
        await _db.Answers.AddAsync(answer, ct);

    public async Task AddAttemptAsync(ExamAttempt attempt, CancellationToken ct = default) =>
        await _db.ExamAttempts.AddAsync(attempt, ct);

    public async Task AddStudentAnswersAsync(IEnumerable<StudentAnswer> answers, CancellationToken ct = default) =>
        await _db.StudentAnswers.AddRangeAsync(answers, ct);

    public void Update(Exam exam) => _db.Exams.Update(exam);

    public void Remove(Exam exam) => _db.Exams.Remove(exam);

    public void UpdateQuestion(Question question) => _db.Questions.Update(question);

    public void RemoveQuestion(Question question) => _db.Questions.Remove(question);

    public void RemoveAnswers(IEnumerable<Answer> answers) => _db.Answers.RemoveRange(answers);

    public void UpdateAnswer(Answer answer) => _db.Answers.Update(answer);

    public void RemoveAnswer(Answer answer) => _db.Answers.Remove(answer);

    public void UpdateAttempt(ExamAttempt attempt) => _db.ExamAttempts.Update(attempt);

    public void RemoveStudentAnswers(IEnumerable<StudentAnswer> answers) =>
        _db.StudentAnswers.RemoveRange(answers);

    public Task SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
