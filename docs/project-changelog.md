# Project Changelog

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
