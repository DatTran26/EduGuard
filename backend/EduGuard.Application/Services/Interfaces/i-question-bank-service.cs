using EduGuard.Application.DTOs.Exams;
using EduGuard.Application.DTOs.QuestionBanks;
using EduGuard.Domain.Enums;

namespace EduGuard.Application.Services.Interfaces;

public interface IQuestionBankService
{
    Task<IReadOnlyList<QuestionBankDto>> GetBanksAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<QuestionBankDto> GetBankByIdAsync(int bankId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<QuestionBankDto> CreateBankAsync(CreateQuestionBankRequest request, string teacherId, CancellationToken ct = default);
    Task<QuestionBankDto> UpdateBankAsync(int bankId, UpdateQuestionBankRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteBankAsync(int bankId, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<BankQuestionDto>> GetQuestionsAsync(int bankId, string userId, IReadOnlyList<string> roles, string? keyword, DifficultyLevel? difficulty, QuestionType? questionType, QuestionStatus? status, string? chapter, CancellationToken ct = default);
    Task<BankQuestionDto> GetQuestionByIdAsync(int questionId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<BankQuestionDto> CreateQuestionAsync(int bankId, CreateBankQuestionRequest request, string teacherId, CancellationToken ct = default);
    Task<BankQuestionDto> UpdateQuestionAsync(int questionId, UpdateBankQuestionRequest request, string teacherId, CancellationToken ct = default);
    Task ArchiveQuestionAsync(int questionId, string teacherId, CancellationToken ct = default);
    Task<BankQuestionImportResultDto> ImportQuestionsAsync(int bankId, Stream fileStream, string fileName, string contentType, long fileLength, ImportBankQuestionsRequest request, string teacherId, CancellationToken ct = default);
    Task<BankQuestionImportResultDto> GenerateQuestionsAiAsync(int bankId, GenerateBankQuestionsAiRequest request, string teacherId, CancellationToken ct = default);
    Task<IReadOnlyList<QuestionDto>> SnapshotQuestionsToExamAsync(int examId, SnapshotBankQuestionsRequest request, string teacherId, CancellationToken ct = default);
}
