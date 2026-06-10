# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0-rc.1] - 2026-06-10

### Added

- **Authentication API:** register, login, refresh-token, logout, `GET /api/auth/me`
- JWT Bearer + ASP.NET Identity; refresh token rotation/revoke
- `ApiResponse<T>` envelope (`CreateSuccess` / `CreateFailure`)
- **Classroom API:** `POST /api/classrooms`, `GET /api/classrooms`, `POST /api/classrooms/join`, `GET /api/classrooms/{id}/members`
- Domain entities: `ApplicationUser`, `RefreshToken`, `Classroom`, `ClassroomMember`
- EF Core migration `InitialIdentityAndClassroom`; role seed Admin/Teacher/Student
- FluentValidation for auth and classroom requests

### Changed

- `Program.cs`: Swagger Bearer security, FluentValidation, auth middleware
- `TestController` standardized to `ApiResponse` envelope

### Security

- **RC limitation:** demo `Jwt:Key` in `appsettings.json` — override via User Secrets/env before non-local deploy
- Join codes are 6-character hex; rate limiting not yet implemented

### Known limitations (RC)

- No automated integration tests; manual Swagger E2E recommended
- `GET /api/classrooms/{id}` (classroom detail) deferred
- Members endpoint returns email for active members; tighten for production if needed

[1.1.0-rc.1]: https://github.com/DatTran26/EduGuard/compare/v1.0.0...v1.1.0-rc.1

## [1.0.0] - 2026-06-10

### Added

- Backend scaffold: `EduGuard.Api`, `Domain`, `Application`, and `Infrastructure` projects (.NET 8)
- Frontend folder structure for auth, exams, classrooms, assignments, anti-cheat, and notifications
- Project documentation suite (`docs/01`–`08`), design tokens (`design.md`), and UI guidelines
- Deploy workflow guide with staging-to-production flow diagram
- Git governance: Husky hooks, branch policy, push/ship agent skills, and `Todo List.md`
- Sample `GET /WeatherForecast` API endpoint and Swagger in Development

### Changed

- Expanded root `README.md` with project overview and status table

### Security

- Pin `System.Text.Json` to address transitive advisory GHSA-8g4q-xg66-9fp4
- Remove authorization middleware until authentication is implemented (Phase 2)

### Known limitations (scaffold baseline)

- No automated test projects yet; Husky `npm test` runs an empty test solution
- No database, auth, SignalR, or runnable frontend app in this release
- Infrastructure packages (EF Core, Redis, Serilog) referenced but not wired in `Program.cs`

[1.0.0]: https://github.com/DatTran26/EduGuard/compare/84d0699...v1.0.0
