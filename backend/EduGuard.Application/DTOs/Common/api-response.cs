namespace EduGuard.Application.DTOs.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public static ApiResponse<T> CreateSuccess(T data, string message = "Thành công.")
        => new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> CreateFailure(string message)
        => new() { Success = false, Message = message };
}
