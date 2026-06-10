# Project Changelog

## Release: v1.1.0 (stable) — promote from v1.1.0-rc.1

Date: 2026-06-10

Branch/source: `main` @ `e09ae0c` (merged PR #3)

Description:

- RC `v1.1.0-rc.1` validated (auth + classroom Swagger E2E).
- Tagged stable `v1.1.0` on `main`; GitHub Release published (non-prerelease).
- `CHANGELOG.md` updated: section `[1.1.0]` replaces `[1.1.0-rc.1]`.

Validation:

- RC manual Swagger E2E confirmed by user before promote.

## Feature: Phase 3 — Classroom Management API (backend)

Date: 2026-06-10

Branch/source: `devD`

Description:

- Hoàn thành backend Giai đoạn 3 (phạm vi MVP): Teacher tạo lớp, Student join bằng mã, danh sách lớp, danh sách thành viên.
- Application: DTOs (`CreateClassroomRequest`, `ClassroomDto`, `JoinClassroomRequest`, `ClassroomMemberDto`), `IClassroomRepository`, `IClassroomService`, FluentValidation.
- Infrastructure: `ClassroomRepository`, `ClassroomService` (sinh `JoinCode` 6 ký tự, rejoin sau Removed), DI registration.
- Api: `ClassroomsController` với `[Authorize]`, role Teacher/Student cho create/join.

Changed files:

- `backend/EduGuard.Application/DTOs/Classrooms/**`
- `backend/EduGuard.Application/Repositories/Interfaces/i-classroom-repository.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-classroom-service.cs`
- `backend/EduGuard.Application/Validators/create-classroom-request-validator.cs`
- `backend/EduGuard.Application/Validators/join-classroom-request-validator.cs`
- `backend/EduGuard.Infrastructure/Repositories/classroom-repository.cs`
- `backend/EduGuard.Infrastructure/Classrooms/classroom-service.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Api/Controllers/classrooms-controller.cs`
- `Todo List.md`, `docs/features.md`, `docs/06_DEVELOPMENT_ROADMAP.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx` — 0 errors, 0 warnings.

Unresolved questions:

- `GET /api/classrooms/{id}` (F-CLS-03) chưa trong checklist Giai đoạn 3 — để phase sau hoặc khi FE cần.

## Feature: Phase 2 — Authentication API (backend)

Date: 2026-06-10

Branch/source: `devD`

Description:

- Hoàn thành backend Giai đoạn 2: đăng ký, đăng nhập, refresh/logout token, profile `me`.
- Application: DTOs (`RegisterRequest`, `LoginRequest`, `LoginResponse`, `UserDto`, `ApiResponse`), `IAuthService`, `IJwtTokenService`, FluentValidation.
- Infrastructure: `JwtTokenService`, `AuthService` (Identity + refresh token rotate/revoke), DI registration.
- Api: `AuthController`, Swagger Bearer security, `GET /api/Test/teacher-only` role test.

Changed files:

- `backend/EduGuard.Application/DTOs/**`
- `backend/EduGuard.Application/Services/Interfaces/**`
- `backend/EduGuard.Application/Validators/**`
- `backend/EduGuard.Infrastructure/Auth/**`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Api/Controllers/auth-controller.cs`
- `backend/EduGuard.Api/Controllers/TestController.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Api/EduGuard.Api.csproj`
- `backend/EduGuard.Infrastructure/EduGuard.Infrastructure.csproj`
- `Todo List.md`, `README.md`, `docs/features.md`, `docs/06_DEVELOPMENT_ROADMAP.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx` — 0 errors, 0 warnings.
- Manual Swagger E2E: register, login, me, refresh-token, logout, `GET /api/Test`, `teacher-only` — đã verify 2026-06-10.

## Feature: Docs — Auth DI trong AddInfrastructure

Date: 2026-06-10

Branch/source: `devD`

Description:

- Làm rõ quy ước Giai đoạn 2: `AddIdentity`, JwtBearer, `AddAuthorization`, auth services đăng ký trong `dependency-injection.cs` (`AddInfrastructure`); `Program.cs` chỉ middleware `UseAuthentication` / `UseAuthorization`.
- Bỏ wording mơ hồ "AddInfrastructure hoặc Program.cs" cho đăng ký DI.
- Cập nhật `docs/02_SETUP_AND_PROJECT_STRUCTURE.md` §7.2 (ví dụ đầy đủ) và `docs/03_BACKEND_ARCHITECTURE.md` §6.

Changed files:

- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- `docs/03_BACKEND_ARCHITECTURE.md`
- `docs/project-changelog.md`

Validation:

- Đối chiếu quy ước DI Giai đoạn 1 (`AddDbContext` đã trong `AddInfrastructure`).

Unresolved questions:

- None.

## Feature: Docs sync — Program.cs & AddInfrastructure

Date: 2026-06-10

Branch/source: `devD`

Description:

- Đồng bộ `docs/02_SETUP_AND_PROJECT_STRUCTURE.md` với code Giai đoạn 1: `Program.cs` dùng `AddInfrastructure`, tách mục hiện tại (§7.1) vs mục tiêu Auth/JWT (§7.2).
- Cập nhật cấu trúc Infrastructure: tên file kebab-case thực tế (`app-db-context.cs`, `dependency-injection.cs`, configs) vs thư mục kế hoạch.
- Cập nhật `docs/03_BACKEND_ARCHITECTURE.md` §6: phân biệt DI hiện tại và đăng ký repository/service tương lai.

Changed files:

- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- `docs/03_BACKEND_ARCHITECTURE.md`
- `docs/project-changelog.md`

Validation:

- Đối chiếu với `backend/EduGuard.Api/Program.cs` và `backend/EduGuard.Infrastructure/dependency-injection.cs`.

Unresolved questions:

- None.

## Feature: Phase 1 — Database + Foundation Entities

Date: 2026-06-10

Branch/source: `devD`

Description:

- Hoàn thành Giai đoạn 1: EF Core + SQL Server database `EduGuardExam` với Identity schema và entity nền tảng.
- Domain: `ApplicationUser`, `RefreshToken`, `Classroom`, `ClassroomMember`, `ClassroomMemberStatus`.
- Infrastructure: `AppDbContext`, Fluent API configs, `DependencyInjection.AddInfrastructure`, role seed (Admin/Teacher/Student).
- Migration `InitialIdentityAndClassroom` tạo bảng Users, Roles, UserRoles, RefreshTokens, Classrooms, ClassroomMembers.
- Api: đăng ký `AddInfrastructure` trong `Program.cs`; thêm `Microsoft.EntityFrameworkCore.Design`.

Changed files:

- `backend/EduGuard.Domain/Entities/*.cs`
- `backend/EduGuard.Domain/Enums/ClassroomMemberStatus.cs`
- `backend/EduGuard.Infrastructure/Data/app-db-context.cs`
- `backend/EduGuard.Infrastructure/Data/Configurations/*.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/*`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Api/EduGuard.Api.csproj`
- `Todo List.md`, `README.md`, `docs/06_DEVELOPMENT_ROADMAP.md`, `docs/features.md`

Validation:

- `dotnet build` — 0 errors.
- `dotnet ef migrations add InitialIdentityAndClassroom` — success.
- `dotnet ef database update` — created `EduGuardExam`, applied migration, seeded 3 roles.

Unresolved questions:

- None.

## Feature: Phase 0 — Frontend/Backend API connectivity

Date: 2026-06-10

Branch/source: `devD`

Description:

- Hoàn thành Giai đoạn 0: React (Vite, port 5173) gọi `GET /api/Test`, hiển thị JSON từ ASP.NET Core API (HTTPS 7168).
- Backend: `TestController`, CORS `FrontendPolicy` (`Cors:AllowedOrigins` → `http://localhost:5173`).
- Frontend: `axiosClient`, `.env` (`VITE_API_BASE_URL`), `App.jsx` smoke test; Tailwind deps + `index.css` import.
- Cập nhật tiến độ: `Todo List.md`, `README.md`, roadmap, `features.md`, `apiList.md`.

Changed files:

- `backend/EduGuard.Api/Controllers/TestController.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Api/appsettings.json`
- `frontend/` (Vite, axios, App, env, proxy tùy chọn)
- `Todo List.md`
- `README.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/features.md`
- `docs/apiList.md`
- `docs/project-changelog.md`

Validation:

- `dotnet run` (profile https) + `npm run dev`; trang React hiển thị `{ "message": "EduGuard API is running" }`.

Unresolved questions:

- Gắn `@tailwindcss/vite` vào `vite.config.js` khi bắt đầu dùng utility classes trong component (hiện UI smoke test dùng inline style).

## Feature: Auth stack — Identity + JWT

Date: 2026-06-10

Branch/source: `devD` (documentation only)

Description:

- Chuyển thiết kế auth từ POCO User/Role/UserRole + hash thủ công sang **ASP.NET Core Identity** + **JWT Bearer** + **RefreshToken** custom.
- `ApplicationUser : IdentityUser<int>`, `IdentityDbContext`, seed Admin/Teacher/Student.
- Cập nhật Todo List Phase 1–2, roadmap, entity docs, backend architecture, setup guide, overview, README, API integration notes.
- Connection string dev mẫu: `DefaultConnection` → `EduGuardExam` trên `WPC-ADMIN\SQLEXPRESS`.
- Migration đề xuất: `InitialIdentityAndClassroom`.

Changed files:

- `Todo List.md`
- `docs/01_PROJECT_OVERVIEW.md`
- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- `docs/03_BACKEND_ARCHITECTURE.md`
- `docs/04_DATABASE_ENTITIES.md`
- `docs/05_API_FRONTEND_INTEGRATION.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/README.md`
- `README.md`
- `docs/project-changelog.md`

Validation:

- Documentation review only; no backend code or migration run in this change.

Unresolved questions:

- None.

## Feature: Branching And Change Documentation Policy

Date: 2026-05-31

Branch/source: `devD` local workspace, no push performed

Description:

- Created local branch structure for `release`, `devD`, `devH`, and `devB`.
- Added project rule that code must never be pushed directly to `main`.
- Moved the local Git pre-push guard into Husky so it matches the active hook path.
- Added Husky commit message validation for conventional commit format.
- Added `npm test` script for Husky pre-commit validation.
- Added project rule that every meaningful change requires a detailed description.
- Added project rule that every feature-level change requires a feature-grouped changelog entry.

Changed files:

- `.husky/pre-push`: Added Husky guard that blocks pushes to `refs/heads/main`.
- `.husky/commit-msg`: Added commit message validation.
- `AGENTS.md`: Added Git branch policy, Husky hook guard, detailed change description requirement, and feature changelog requirement.
- `docs/project-changelog.md`: Added initial feature changelog entry for this project governance update.
- `package.json`: Added `test` script for Husky pre-commit.

Validation:

- Ran `git branch --list` and confirmed local branches: `release`, `devD`, `devH`, `devB`.
- Confirmed local Git `core.hooksPath` is `.husky/_`.
- Tested `.husky/commit-msg` with invalid and valid commit messages.
- Tested `.husky/pre-push` with simulated `main` and non-main push refs.
- Ran `npm test`.
- Ran `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx`; result: 0 warnings, 0 errors.
- No remote push command was run.

Unresolved questions:

- None.
