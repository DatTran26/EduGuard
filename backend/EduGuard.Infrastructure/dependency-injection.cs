using EduGuard.Application.DTOs.Common;
using EduGuard.Application.Repositories.Interfaces;
using EduGuard.Application.Services.Interfaces;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.AntiCheat;
using EduGuard.Infrastructure.Assignments;
using EduGuard.Infrastructure.Auth;
using EduGuard.Infrastructure.Classrooms;
using EduGuard.Infrastructure.Exams;
using EduGuard.Infrastructure.ExamMatrices;
using EduGuard.Infrastructure.Data;
using EduGuard.Application.Options;
using EduGuard.Infrastructure.Proctoring;
using EduGuard.Infrastructure.QuestionBanks;
using EduGuard.Infrastructure.Redis;
using EduGuard.Infrastructure.Repositories;
using EduGuard.Infrastructure.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace EduGuard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
        })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        var jwtKey = configuration["Jwt:Key"]!;
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/hubs"))
                            context.Token = accessToken;

                        return Task.CompletedTask;
                    },
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        await WriteAuthFailureAsync(
                            context.HttpContext,
                            StatusCodes.Status401Unauthorized,
                            "Bạn cần đăng nhập để truy cập tài nguyên này.");
                    },
                    OnForbidden = async context =>
                    {
                        await WriteAuthFailureAsync(
                            context.HttpContext,
                            StatusCodes.Status403Forbidden,
                            "Bạn không có quyền thực hiện thao tác này.");
                    }
                };
            });

        services.AddAuthorization();

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IClassroomRepository, ClassroomRepository>();
        services.AddScoped<IClassroomService, ClassroomService>();
        services.AddScoped<IAssignmentRepository, AssignmentRepository>();
        services.AddScoped<IAssignmentService, AssignmentService>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IQuestionBankRepository, QuestionBankRepository>();
        services.AddScoped<IQuestionBankService, QuestionBankService>();
        services.AddScoped<IExamMatrixRepository, ExamMatrixRepository>();
        services.AddScoped<IExamMatrixService, ExamMatrixService>();
        services.AddScoped<IExamAttemptService, ExamAttemptService>();
        services.AddScoped<IExamMonitoringService, ExamMonitoringService>();
        services.AddScoped<IProctoringRepository, ProctoringRepository>();
        services.AddScoped<IProctoringService, ProctoringService>();
        services.AddScoped<IExamLobbyService, ExamLobbyService>();
        services.AddScoped<IStudentProctoringService, StudentProctoringService>();
        services.AddScoped<ILiveProctoringService, LiveProctoringService>();
        services.AddScoped<IProctoringActionService, ProctoringActionService>();
        services.AddScoped<IProctoringEvidenceService, ProctoringEvidenceService>();
        services.AddScoped<IProctoringPolicyService, ProctoringPolicyService>();
        services.AddScoped<IProctoringDetectionService, ProctoringDetectionService>();
        services.AddScoped<IProctoringSignalingService, ProctoringSignalingService>();
        services.AddScoped<IWebRtcConfigService, WebRtcConfigService>();
        services.AddScoped<ICheatingLogRepository, CheatingLogRepository>();
        services.AddScoped<IAntiCheatService, AntiCheatService>();

        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.Configure<WebRtcOptions>(configuration.GetSection(WebRtcOptions.SectionName));
        services.Configure<ProctoringOptions>(configuration.GetSection(ProctoringOptions.SectionName));
        var redisOptions = configuration.GetSection(RedisOptions.SectionName).Get<RedisOptions>() ?? new RedisOptions();

        if (redisOptions.Enabled)
        {
            services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
                var options = ConfigurationOptions.Parse(connectionString);
                options.AbortOnConnectFail = redisOptions.AbortOnConnectFail;
                var multiplexer = ConnectionMultiplexer.Connect(options);
                var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("Redis");
                logger.LogInformation("Redis connection established.");
                return multiplexer;
            });
            services.AddScoped<ICacheService, RedisCacheService>();
            services.AddScoped<IAttemptPresenceService, RedisAttemptPresenceService>();
        }
        else
        {
            services.AddScoped<ICacheService, NullCacheService>();
            services.AddScoped<IAttemptPresenceService, NullAttemptPresenceService>();
        }

        services.AddScoped<IExamCacheInvalidator, ExamCacheInvalidator>();
        services.AddHttpClient("ProctoringAi");

        return services;
    }

    private static Task WriteAuthFailureAsync(HttpContext context, int statusCode, string message)
    {
        if (context.Response.HasStarted)
            return Task.CompletedTask;

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsJsonAsync(ApiResponse<object>.CreateFailure(message));
    }
}
