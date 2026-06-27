using System.Net;
using System.Security.Cryptography;
using EduGuard.Application.DTOs.Auth;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EduGuard.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private const int DefaultRefreshTokenDays = 7;
    private const string DefaultRole = "Student";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IEmailSender _emailSender;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly IEmailSettingsService _emailSettingsService;
    private readonly AppDbContext _db;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<VerifyEmailRequest> _verifyEmailValidator;
    private readonly IValidator<ResendVerificationRequest> _resendVerificationValidator;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly ILogger<AuthService> _logger;
    private readonly int _refreshTokenDays;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        IEmailSender emailSender,
        IEmailVerificationService emailVerificationService,
        IEmailSettingsService emailSettingsService,
        AppDbContext db,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<VerifyEmailRequest> verifyEmailValidator,
        IValidator<ResendVerificationRequest> resendVerificationValidator,
        IHostEnvironment hostEnvironment,
        ILogger<AuthService> logger,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _emailSender = emailSender;
        _emailVerificationService = emailVerificationService;
        _emailSettingsService = emailSettingsService;
        _db = db;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _verifyEmailValidator = verifyEmailValidator;
        _resendVerificationValidator = resendVerificationValidator;
        _hostEnvironment = hostEnvironment;
        _logger = logger;
        _refreshTokenDays = int.TryParse(configuration["Jwt:RefreshTokenDays"], out var days)
            ? days
            : DefaultRefreshTokenDays;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        await _registerValidator.ValidateAndThrowAsync(request, ct);

        var emailSettings = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        var requiresVerification = emailSettings.RequireOnRegister;
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = !requiresVerification
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(
                string.Join("; ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, DefaultRole);

        if (requiresVerification)
            await SendVerificationEmailAsync(user, ct);

        return new RegisterResponse
        {
            User = MapUser(user, [DefaultRole]),
            RequiresEmailVerification = requiresVerification
        };
    }

    public async Task<LoginResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken ct = default)
    {
        await _verifyEmailValidator.ValidateAndThrowAsync(request, ct);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Mã xác thực không hợp lệ hoặc đã hết hạn.");

        if (user.EmailConfirmed)
            throw new InvalidOperationException("Email đã được xác thực trước đó.");

        var isValid = await _emailVerificationService.ValidateOtpAsync(request.Email, request.Code, ct);
        if (!isValid)
            throw new UnauthorizedAccessException("Mã xác thực không hợp lệ hoặc đã hết hạn.");

        user.EmailConfirmed = true;
        user.UpdatedAt = DateTime.UtcNow;
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            throw new InvalidOperationException(
                string.Join("; ", updateResult.Errors.Select(e => e.Description)));

        return await BuildLoginResponseAsync(user, ct);
    }

    public async Task ResendVerificationEmailAsync(ResendVerificationRequest request, CancellationToken ct = default)
    {
        await _resendVerificationValidator.ValidateAndThrowAsync(request, ct);

        var emailSettings = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        if (!emailSettings.RequireOnRegister)
            throw new InvalidOperationException("Xác thực email đang tắt trên hệ thống.");

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            return;

        if (user.EmailConfirmed)
            throw new InvalidOperationException("Email đã được xác thực trước đó.");

        var canResend = await _emailVerificationService.CanResendAsync(request.Email, ct);
        if (!canResend)
            throw new InvalidOperationException(
                $"Vui lòng đợi {emailSettings.ResendCooldownSeconds} giây trước khi gửi lại mã.");

        await SendVerificationEmailAsync(user, ct);
        await _emailVerificationService.MarkResentAsync(request.Email, ct);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        await _loginValidator.ValidateAndThrowAsync(request, ct);

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        var emailSettings = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        if (emailSettings.RequireOnRegister && !user.EmailConfirmed)
            throw new UnauthorizedAccessException("Vui lòng xác thực email trước khi đăng nhập.");

        var signIn = await _signInManager.CheckPasswordSignInAsync(
            user, request.Password, lockoutOnFailure: true);

        if (!signIn.Succeeded)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        return await BuildLoginResponseAsync(user, ct);
    }

    public async Task<LoginResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await _db.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == refreshToken, ct);

        if (stored is null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token không hợp lệ.");

        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;

        return await BuildLoginResponseAsync(stored.User, ct);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == refreshToken, ct);

        if (stored is null)
            return;

        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetMeAsync(string userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Không tìm thấy user.");

        var roles = await _userManager.GetRolesAsync(user);
        return MapUser(user, roles);
    }

    private async Task SendVerificationEmailAsync(ApplicationUser user, CancellationToken ct)
    {
        var emailSettings = await _emailSettingsService.GetRuntimeSettingsAsync(ct);
        var otp = await _emailVerificationService.CreateAndStoreOtpAsync(user.Email!, ct);
        var subject = "Mã xác thực đăng ký EduGuard";
        var htmlBody = $"""
            <p>Xin chào {WebUtility.HtmlEncode(user.FullName)},</p>
            <p>Mã xác thực đăng ký tài khoản EduGuard của bạn là:</p>
            <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">{otp}</p>
            <p>Mã có hiệu lực trong {emailSettings.OtpExpiryMinutes} phút.</p>
            <p>Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
            """;

        if (_hostEnvironment.IsDevelopment())
        {
            _logger.LogInformation(
                "DEV email verification OTP for {Email}: {Otp}",
                user.Email,
                otp);
        }

        await _emailSender.SendAsync(user.Email!, subject, htmlBody, ct);
    }

    private async Task<LoginResponse> BuildLoginResponseAsync(ApplicationUser user, CancellationToken ct)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = await CreateRefreshTokenAsync(user.Id, ct);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapUser(user, roles)
        };
    }

    private async Task<string> CreateRefreshTokenAsync(string userId, CancellationToken ct)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenDays),
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return token;
    }

    private static UserDto MapUser(ApplicationUser user, IList<string> roles) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email ?? string.Empty,
        AvatarUrl = user.AvatarUrl,
        IsActive = user.IsActive,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        Roles = roles
    };
}
