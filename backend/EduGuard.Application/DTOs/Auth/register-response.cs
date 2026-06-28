namespace EduGuard.Application.DTOs.Auth;

public class RegisterResponse
{
    public UserDto User { get; set; } = new();
    public bool RequiresEmailVerification { get; set; }
}
