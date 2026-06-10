# 02. Cấu hình ban đầu và cấu trúc dự án EduGuard

## 1. Mục tiêu tài liệu

Tài liệu này mô tả cách cấu hình ban đầu cho hệ thống EduGuard, bao gồm:

- Cấu trúc repo tổng thể.
- Cấu trúc backend ASP.NET Core Web API.
- Cấu trúc frontend ReactJS + TailwindCSS.
- Cách backend tương tác với frontend.
- Cách cấu hình SQL Server, Redis, Swagger, CORS, JWT, SignalR.
- Cách chạy dự án bằng Visual Studio và VS Code.

## 2. Cấu trúc repo tổng thể

Khuyến nghị sử dụng một repo duy nhất:

```txt
EduGuard/
│
├── backend/
│   ├── EduGuard.sln
│   ├── EduGuard.Api/
│   ├── EduGuard.Application/
│   ├── EduGuard.Domain/
│   └── EduGuard.Infrastructure/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── docs/
│   ├── README.md
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_SETUP_AND_PROJECT_STRUCTURE.md
│   └── ...
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

Cách mở project:

```txt
backend/EduGuard.sln  → mở bằng Visual Studio tím
frontend/             → mở bằng VS Code
```

## 3. Cấu trúc backend theo 4 project

Backend nên tách thành 4 project:

```txt
EduGuard.Api
EduGuard.Application
EduGuard.Domain
EduGuard.Infrastructure
```

## 3.1. EduGuard.Api

Vai trò:

- Nhận request từ frontend React.
- Chứa Controller.
- Chứa SignalR Hub.
- Cấu hình Swagger.
- Cấu hình CORS.
- Cấu hình JWT.
- Cấu hình Dependency Injection.

Cấu trúc:

```txt
EduGuard.Api/
│
├── Controllers/
│   ├── AuthController.cs
│   ├── ClassroomsController.cs
│   ├── ExamsController.cs
│   ├── AssignmentsController.cs
│   ├── AntiCheatController.cs
│   └── NotificationsController.cs
│
├── Hubs/
│   ├── NotificationHub.cs
│   └── ExamMonitoringHub.cs
│
├── Middlewares/
│   └── ExceptionHandlingMiddleware.cs
│
├── Program.cs
├── appsettings.json
└── EduGuard.Api.csproj
```

## 3.2. EduGuard.Application

Vai trò:

- Chứa Service.
- Chứa DTO.
- Chứa Request / Response model.
- Chứa interface của Service.
- Chứa interface của Repository.
- Chứa validation rule với FluentValidation (validate thủ công trong Service, không dùng `FluentValidation.AspNetCore` — package đó đã deprecated).

Cấu trúc:

```txt
EduGuard.Application/
│
├── DTOs/
│   ├── Auth/
│   ├── Classrooms/
│   ├── Assignments/
│   ├── Exams/
│   ├── AntiCheat/
│   └── Notifications/
│
├── Services/
│   ├── Interfaces/
│   │   ├── IAuthService.cs
│   │   ├── IClassroomService.cs
│   │   ├── IAssignmentService.cs
│   │   ├── IExamService.cs
│   │   └── IAntiCheatService.cs
│   │
│   ├── AuthService.cs
│   ├── ClassroomService.cs
│   ├── AssignmentService.cs
│   ├── ExamService.cs
│   └── AntiCheatService.cs
│
├── Interfaces/
│   ├── IClassroomRepository.cs
│   ├── IAssignmentRepository.cs
│   ├── IExamRepository.cs
│   └── ICheatingLogRepository.cs
│
├── Validators/
│   ├── RegisterRequestValidator.cs
│   ├── CreateClassroomRequestValidator.cs
│   └── CreateExamRequestValidator.cs
│
└── Mappings/
    └── MappingProfile.cs
```

## 3.3. EduGuard.Domain

Vai trò:

- Chứa entity cốt lõi.
- Chứa enum.
- Không phụ thuộc vào database, React, Redis, API.

Cấu trúc:

```txt
EduGuard.Domain/
│
├── Entities/
│   ├── ApplicationUser.cs
│   ├── RefreshToken.cs
│   ├── Classroom.cs
│   ├── ClassroomMember.cs
│   ├── Assignment.cs
│   ├── Submission.cs
│   ├── SubmissionFile.cs
│   ├── Exam.cs
│   ├── ExamSetting.cs
│   ├── Question.cs
│   ├── Answer.cs
│   ├── ExamAttempt.cs
│   ├── StudentAnswer.cs
│   ├── CheatingLog.cs
│   ├── Notification.cs
│   └── ActivityLog.cs
│
└── Enums/
    ├── UserRoleType.cs
    ├── QuestionType.cs
    ├── ExamAttemptStatus.cs
    ├── CheatingType.cs
    └── NotificationType.cs
```

## 3.4. EduGuard.Infrastructure

Vai trò:

- Chứa AppDbContext.
- Chứa Repository implementation.
- Kết nối SQL Server.
- Kết nối Redis.
- Cấu hình logging.
- Chứa service kỹ thuật như cache, email, file storage nếu có.

Cấu trúc (tên file **kebab-case**; class bên trong vẫn PascalCase, ví dụ `app-db-context.cs` → `AppDbContext`):

**Hiện có (Giai đoạn 1):**

```txt
EduGuard.Infrastructure/
│
├── Data/
│   ├── app-db-context.cs
│   ├── Configurations/
│   │   ├── classroom-configuration.cs
│   │   ├── classroom-member-configuration.cs
│   │   └── refresh-token-configuration.cs
│   └── Migrations/
│
├── dependency-injection.cs          # AddInfrastructure — đăng ký DbContext
├── Repositories/                  # (.gitkeep — chưa implement)
├── Redis/                         # (.gitkeep)
└── Logging/                       # (.gitkeep)
```

**Kế hoạch (Giai đoạn 2+):**

```txt
├── Identity/
│   └── identity-seed.cs
├── Auth/
│   ├── i-jwt-token-service.cs
│   └── jwt-token-service.cs
├── Repositories/
│   ├── classroom-repository.cs
│   └── ...
├── Redis/
│   └── redis-cache-service.cs
└── Logging/
    └── serilog-configuration.cs
```

## 4. Project Reference trong Visual Studio

Thiết lập reference như sau:

```txt
EduGuard.Api
├── reference EduGuard.Application
└── reference EduGuard.Infrastructure

EduGuard.Application
└── reference EduGuard.Domain

EduGuard.Infrastructure
├── reference EduGuard.Application
└── reference EduGuard.Domain

EduGuard.Domain
└── không reference project nào
```

## 5. Cài package backend cần thiết

Cài cho `EduGuard.Api`:

```powershell
Install-Package Swashbuckle.AspNetCore 6.6.2
Install-Package Microsoft.AspNetCore.Authentication.JwtBearer 8.0.24
```

Cài cho `EduGuard.Infrastructure`:

```powershell
Install-Package Microsoft.EntityFrameworkCore 8.0.24
Install-Package Microsoft.EntityFrameworkCore.SqlServer 8.0.24
Install-Package Microsoft.EntityFrameworkCore.Tools 8.0.24
Install-Package Microsoft.AspNetCore.Identity.EntityFrameworkCore 8.0.24
Install-Package StackExchange.Redis 2.12.14
Install-Package Serilog.AspNetCore 8.0.2
Install-Package Serilog.Sinks.Console 5.0.0
Install-Package Serilog.Sinks.File 5.0.0
```

Cài cho `EduGuard.Application`:

```powershell
Install-Package AutoMapper 15.1.3
Install-Package AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.0
Install-Package FluentValidation -Version 12.1.1
Install-Package FluentValidation.DependencyInjectionExtensions -Version 12.1.1
Install-Package Microsoft.Extensions.Identity.Stores 8.0.24
```

> **Lưu ý:** Không cài `FluentValidation.AspNetCore` — NuGet đánh dấu deprecated và không còn được maintain. Inject `IValidator<T>` vào Service, gọi `ValidateAsync()` trước khi xử lý business logic. Đăng ký validator trong `Program.cs`:

```csharp
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
```

## 6. Cấu hình appsettings.json

File: `EduGuard.Api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=WPC-ADMIN\\SQLEXPRESS;Database=EduGuardExam;Trusted_Connection=True;TrustServerCertificate=True;",
    "Redis": "localhost:6379"
  },

  "Jwt": {
    "Key": "THIS_IS_A_DEMO_SECRET_KEY_FOR_EDUGUARD_CHANGE_LATER",
    "Issuer": "EduGuard",
    "Audience": "EduGuardClient",
    "ExpireMinutes": 60
  },

  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173"
    ]
  },

  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },

  "AllowedHosts": "*"
}
```

## 7. Cấu hình Program.cs

### 7.1. Hiện tại (Giai đoạn 0–1) — khớp codebase

File: `backend/EduGuard.Api/Program.cs`

DbContext **không** đăng ký trực tiếp trong `Program.cs`; gọi extension `AddInfrastructure` từ `backend/EduGuard.Infrastructure/dependency-injection.cs`.

```csharp
using EduGuard.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");

app.MapControllers();

app.Run();
```

File: `backend/EduGuard.Infrastructure/dependency-injection.cs`

```csharp
using EduGuard.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EduGuard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        return services;
    }
}
```

> Chưa có: `AddIdentity`, JwtBearer, `UseAuthentication` / `UseAuthorization`, SignalR — sẽ bổ sung ở Giai đoạn 2+.

### 7.2. Mục tiêu Giai đoạn 2+ (Auth + JWT)

**Quy ước:** Mọi `builder.Services.Add…` (Identity, JwtBearer, auth services) đăng ký trong **`dependency-injection.cs`** — mở rộng `AddInfrastructure` hoặc helper `AddAuth` gọi từ đó. **`Program.cs` chỉ gọi `AddInfrastructure` và middleware pipeline** (`UseAuthentication`, `UseAuthorization`).

File: `backend/EduGuard.Infrastructure/dependency-injection.cs` (mở rộng)

```csharp
using System.Text;
using EduGuard.Domain.Entities;
using EduGuard.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace EduGuard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddIdentity<ApplicationUser, IdentityRole<int>>(options =>
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
            });

        services.AddAuthorization();

        // services.AddScoped<IJwtTokenService, JwtTokenService>();
        // services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
```

File: `backend/EduGuard.Api/Program.cs` — chỉ thêm middleware (sau `UseCors`, trước `MapControllers`):

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

`Program.cs` **không** gọi trực tiếp `AddIdentity` / `AddJwtBearer`; vẫn chỉ `builder.Services.AddInfrastructure(builder.Configuration)`.

CORS: chỉ thêm `.AllowCredentials()` khi cần cookie hoặc SignalR; với JWT Bearer thuần (header `Authorization`) như hiện tại thì không bắt buộc.

SignalR (`AddSignalR`, `MapHub`) — Giai đoạn 8; đăng ký service trong `AddInfrastructure`, `MapHub` trong `Program.cs` — xem `docs/03_BACKEND_ARCHITECTURE.md` §6–7.

## 8. Cấu trúc frontend ReactJS

Khuyến nghị dùng Vite React.

```txt
frontend/
│
├── public/
│
├── src/
│   ├── api/
│   │   ├── axiosClient.js
│   │   ├── authApi.js
│   │   ├── classroomApi.js
│   │   ├── examApi.js
│   │   └── antiCheatApi.js
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── dashboard/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── classrooms/
│   │   ├── assignments/
│   │   ├── exams/
│   │   ├── anti-cheat/
│   │   └── notifications/
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useSignalR.js
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx
│   │
│   ├── signalr/
│   │   ├── notificationConnection.js
│   │   └── examMonitoringConnection.js
│   │
│   ├── utils/
│   │   ├── tokenStorage.js
│   │   └── formatDate.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 9. Cấu hình frontend .env

File: `frontend/.env`

```env
VITE_API_BASE_URL=https://localhost:7234/api
VITE_SIGNALR_URL=https://localhost:7234/hubs
```

Thay `7234` bằng port thật của backend trong Visual Studio.

## 10. Cấu hình Axios

File: `frontend/src/api/axiosClient.js`

```js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
```

## 11. Cấu hình SignalR frontend

Cài package:

```bash
npm install @microsoft/signalr
```

File: `frontend/src/signalr/notificationConnection.js`

```js
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${import.meta.env.VITE_SIGNALR_URL}/notifications`)
  .withAutomaticReconnect()
  .build();

export default connection;
```

## 12. Luồng frontend tương tác backend

```txt
React Component
    ↓
API function trong src/api
    ↓
axiosClient
    ↓
ASP.NET Core Controller
    ↓
Service
    ↓
Repository
    ↓
DbContext
    ↓
SQL Server
```

Ví dụ tạo lớp học:

```txt
CreateClassroomPage.jsx
    ↓
classroomApi.createClassroom(data)
    ↓
POST /api/classrooms
    ↓
ClassroomsController
    ↓
ClassroomService
    ↓
ClassroomRepository
    ↓
AppDbContext
    ↓
SQL Server
```

## 13. Cách chạy dự án

### 13.1. Chạy backend

Mở:

```txt
backend/EduGuard.sln
```

Bằng Visual Studio tím.

Chọn project startup:

```txt
EduGuard.Api
```

Run bằng HTTPS.

Swagger thường nằm ở:

```txt
https://localhost:7234/swagger
```

### 13.2. Chạy frontend

Mở folder:

```txt
frontend/
```

Bằng VS Code.

Cài package:

```bash
npm install
```

Chạy:

```bash
npm run dev
```

Frontend thường nằm ở:

```txt
http://localhost:5173
```

## 14. Cấu hình Docker Compose dự kiến

File: `docker-compose.yml`

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "5000:8080"
    depends_on:
      - sqlserver
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

Giai đoạn đầu có thể chưa cần Docker ngay. Nên chạy local ổn trước, sau đó mới containerize.

