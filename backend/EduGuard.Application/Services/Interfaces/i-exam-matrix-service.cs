using EduGuard.Application.DTOs.ExamMatrices;
using EduGuard.Application.DTOs.Exams;

namespace EduGuard.Application.Services.Interfaces;

public interface IExamMatrixService
{
    Task<IReadOnlyList<ExamMatrixDto>> GetMatricesAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamMatrixDto> GetByIdAsync(int matrixId, string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<ExamMatrixDto> CreateAsync(CreateExamMatrixRequest request, string teacherId, CancellationToken ct = default);
    Task<ExamMatrixDto> UpdateAsync(int matrixId, UpdateExamMatrixRequest request, string teacherId, CancellationToken ct = default);
    Task DeleteAsync(int matrixId, string teacherId, CancellationToken ct = default);
    Task<ExamMatrixValidationResultDto> ValidateAsync(int matrixId, int questionBankId, string teacherId, CancellationToken ct = default);
    Task<ExamMatrixPreviewDto> GeneratePreviewAsync(int matrixId, int questionBankId, string teacherId, CancellationToken ct = default);
    Task<ExamDto> CreateExamAsync(int matrixId, CreateExamFromMatrixRequest request, string teacherId, CancellationToken ct = default);
}
