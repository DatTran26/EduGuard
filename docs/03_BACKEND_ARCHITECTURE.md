# 03. Kiến trúc backend EduGuard

## 1. Mô hình backend sử dụng

Backend EduGuard triển khai theo luồng:

```txt
Controller → Service → Repository → DbContext → SQL Server
```

Khi kết hợp với 4 project, cách phân bổ là:

| Thành phần | Project | Nhiệm vụ |
|---|---|---|
| Controller | EduGuard.Api | Nhận request từ frontend, gọi service, trả response |
| Service | EduGuard.Application | Xử lý nghiệp vụ |
| Repository Interface | EduGuard.Application | Định nghĩa thao tác dữ liệu cần có |
| Repository Implementation | EduGuard.Infrastructure | Code thao tác database thật |
| DbContext | EduGuard.Infrastructure | Làm việc với SQL Server thông qua EF Core |
| Entity | EduGuard.Domain | Model cốt lõi ánh xạ database |
| DTO / Request / Response | EduGuard.Application | Dữ liệu vào/ra API |

## 2. Vì sao dùng kiến trúc này?

Kiến trúc này giúp:

- Controller không bị quá nhiều logic.
- Service tập trung xử lý nghiệp vụ.
- Repository tách riêng truy vấn database.
- DbContext không bị gọi trực tiếp từ Controller.
- Code dễ test, dễ sửa, dễ mở rộng.
- Dễ giải thích trong báo cáo đồ án.

## 3. Vai trò từng tầng

### 3.1. Controller

Controller là nơi nhận request từ frontend.

Nhiệm vụ:

- Nhận dữ liệu request.
- Gọi service tương ứng.
- Trả HTTP response.
- Không xử lý nghiệp vụ phức tạp.
- Không truy cập DbContext trực tiếp.

Ví dụ:

```csharp
[ApiController]
[Route("api/classrooms")]
public class ClassroomsController : ControllerBase
{
    private readonly IClassroomService _classroomService;

    public ClassroomsController(IClassroomService classroomService)
    {
        _classroomService = classroomService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateClassroomRequest request)
    {
        int teacherId = 1; // Sau này lấy từ JWT
        var result = await _classroomService.CreateAsync(request, teacherId);
        return Ok(result);
    }
}
```

### 3.2. Service

Service là nơi xử lý nghiệp vụ chính.

Nhiệm vụ:

- Kiểm tra quyền.
- Kiểm tra dữ liệu nghiệp vụ.
- Tạo mã lớp.
- Random câu hỏi.
- Chấm điểm bài thi.
- Tính Suspicion Score.
- Gửi notification.
- Gọi repository để thao tác database.

Ví dụ:

```csharp
public class ClassroomService : IClassroomService
{
    private readonly IClassroomRepository _classroomRepository;

    public ClassroomService(IClassroomRepository classroomRepository)
    {
        _classroomRepository = classroomRepository;
    }

    public async Task<ClassroomDto> CreateAsync(CreateClassroomRequest request, int teacherId)
    {
        var classroom = new Classroom
        {
            Name = request.Name,
            Description = request.Description,
            TeacherId = teacherId,
            JoinCode = GenerateJoinCode(),
            CreatedAt = DateTime.UtcNow
        };

        await _classroomRepository.AddAsync(classroom);
        await _classroomRepository.SaveChangesAsync();

        return new ClassroomDto
        {
            Id = classroom.Id,
            Name = classroom.Name,
            Description = classroom.Description,
            JoinCode = classroom.JoinCode,
            TeacherId = classroom.TeacherId,
            CreatedAt = classroom.CreatedAt
        };
    }

    private static string GenerateJoinCode()
    {
        return Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
    }
}
```

### 3.3. Repository

Repository là nơi làm việc trực tiếp với database thông qua DbContext.

Nhiệm vụ:

- Thêm dữ liệu.
- Sửa dữ liệu.
- Xóa dữ liệu.
- Truy vấn dữ liệu.
- Không xử lý nghiệp vụ phức tạp.

Interface đặt ở Application:

```csharp
public interface IClassroomRepository
{
    Task<List<Classroom>> GetAllAsync();
    Task<Classroom?> GetByIdAsync(int id);
    Task AddAsync(Classroom classroom);
    void Update(Classroom classroom);
    void Delete(Classroom classroom);
    Task SaveChangesAsync();
}
```

Implementation đặt ở Infrastructure:

```csharp
public class ClassroomRepository : IClassroomRepository
{
    private readonly AppDbContext _context;

    public ClassroomRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Classroom>> GetAllAsync()
    {
        return await _context.Classrooms.ToListAsync();
    }

    public async Task<Classroom?> GetByIdAsync(int id)
    {
        return await _context.Classrooms.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task AddAsync(Classroom classroom)
    {
        await _context.Classrooms.AddAsync(classroom);
    }

    public void Update(Classroom classroom)
    {
        _context.Classrooms.Update(classroom);
    }

    public void Delete(Classroom classroom)
    {
        _context.Classrooms.Remove(classroom);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
```

### 3.4. DbContext

DbContext là class đại diện cho database trong Entity Framework Core.

Ví dụ:

```csharp
public class AppDbContext
    : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Classroom> Classrooms { get; set; }
    public DbSet<Exam> Exams { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<ExamAttempt> ExamAttempts { get; set; }
    public DbSet<CheatingLog> CheatingLogs { get; set; }
}
```

## 4. Luồng xử lý ví dụ

### 4.1. Tạo lớp học

```txt
React gửi POST /api/classrooms
        ↓
ClassroomsController.Create()
        ↓
ClassroomService.CreateAsync()
        ↓
ClassroomRepository.AddAsync()
        ↓
AppDbContext.SaveChangesAsync()
        ↓
SQL Server lưu bảng Classrooms
```

### 4.2. Làm bài thi

```txt
Student bấm Bắt đầu thi
        ↓
POST /api/exams/{id}/start
        ↓
ExamsController.StartExam()
        ↓
ExamService.StartExamAsync()
        ↓
ExamRepository lấy câu hỏi
        ↓
ExamService random câu hỏi/đáp án
        ↓
ExamAttemptRepository tạo lượt thi
        ↓
Trả đề thi về frontend
```

### 4.3. Ghi log gian lận

```txt
Frontend phát hiện chuyển tab
        ↓
POST /api/anti-cheat/logs
        ↓
AntiCheatController.CreateLog()
        ↓
AntiCheatService.LogAsync()
        ↓
CheatingLogRepository.AddAsync()
        ↓
Cập nhật Suspicion Score
        ↓
SignalR gửi cảnh báo cho Teacher
```

## 5. Quy tắc quan trọng khi code

### 5.1. Controller không gọi DbContext

Không nên:

```csharp
_context.Classrooms.Add(classroom);
await _context.SaveChangesAsync();
```

trong Controller.

Nên:

```csharp
await _classroomService.CreateAsync(request, teacherId);
```

### 5.2. Service không nên biết chi tiết SQL Server

Service chỉ gọi interface:

```csharp
await _classroomRepository.AddAsync(classroom);
```

Không quan tâm dữ liệu đang lưu bằng SQL Server, MySQL hay MongoDB.

### 5.3. Repository không xử lý nghiệp vụ

Repository không nên random câu hỏi, tính điểm nghi ngờ, kiểm tra quyền teacher.

Các logic đó thuộc về Service.

### 5.4. Entity không trả thẳng ra frontend

Không nên:

```csharp
return Ok(user);
```

Vì có thể lộ `PasswordHash`, `RefreshToken`.

Nên trả DTO:

```csharp
return Ok(userDto);
```

## 6. Dependency Injection

Trong `Program.cs` hoặc extension method:

```csharp
builder.Services.AddScoped<IClassroomService, ClassroomService>();
builder.Services.AddScoped<IClassroomRepository, ClassroomRepository>();
```

Nếu nhiều service/repository, nên tạo file:

```txt
EduGuard.Infrastructure/DependencyInjection.cs
```

Ví dụ:

```csharp
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IClassroomRepository, ClassroomRepository>();
        services.AddScoped<IExamRepository, ExamRepository>();
        services.AddScoped<ICheatingLogRepository, CheatingLogRepository>();

        return services;
    }
}
```

Trong `Program.cs` gọi:

```csharp
builder.Services.AddInfrastructure(builder.Configuration);
```

## 7. Authentication — Identity + JWT

Auth **không** đi qua Repository pattern. Luồng:

```txt
AuthController
    ↓
AuthService (UserManager, SignInManager, RoleManager)
    ↓
IJwtTokenService → sinh access JWT (claims: sub, email, role)
    ↓
RefreshToken lưu qua DbContext / IRefreshTokenRepository
```

| Thành phần | Vai trò |
|---|---|
| `UserManager<ApplicationUser>` | Register, đổi mật khẩu, lockout |
| `SignInManager<ApplicationUser>` | Login, kiểm tra password |
| `RoleManager<IdentityRole<int>>` | Seed/gán role |
| `IJwtTokenService` | Access token JWT |
| `AuthService` | Orchestrate register/login/refresh |

Controller lấy `userId` từ JWT claims (`User.FindFirstValue(ClaimTypes.NameIdentifier)`), không hard-code.

SPA React: **JwtBearer** + header `Authorization: Bearer …` — không dùng cookie Identity.

## 8. Các service chính cần có

```txt
AuthService
IJwtTokenService / JwtTokenService
UserService
ClassroomService
AssignmentService
ExamService
ExamAttemptService
AntiCheatService
NotificationService
DashboardService
```

## 9. Các repository chính cần có

```txt
ClassroomRepository
AssignmentRepository
SubmissionRepository
ExamRepository
QuestionRepository
AnswerRepository
ExamAttemptRepository
StudentAnswerRepository
CheatingLogRepository
NotificationRepository
ActivityLogRepository
```

*(Auth không dùng UserRepository / RoleRepository — Identity quản lý Users/Roles.)*

## 10. Kết luận

Kiến trúc backend của EduGuard nên giữ nguyên tắc:

```txt
Controller nhận request
Service xử lý nghiệp vụ
Repository thao tác database
DbContext kết nối SQL Server
Entity nằm trong Domain
DTO nằm trong Application
```

Đây là cấu trúc phù hợp cho hệ thống có nhiều module, dễ mở rộng và dễ bảo trì.

