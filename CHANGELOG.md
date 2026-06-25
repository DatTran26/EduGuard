# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Backend

- Added teacher-owned question banks with bank questions, bank answers, difficulty/status metadata, versioning for snapshotted questions, and archived-question history.
- Added exam matrix APIs so teachers can define matrix rows, validate available approved bank questions, generate a balanced preview, and create draft exams from the selected bank.
- Added Admin read access for exam matrix list/detail while keeping create/update/delete/preview/create-exam restricted to Teacher-owned resources.
- Aligned matrix exam creation with the proctoring integration contract by wrapping exam creation, `ExamSetting`, question snapshots, and bank usage updates in a single transaction.
- Added EF Core migration `AddQuestionBanksAndExamMatrices` for `QuestionBanks`, `BankQuestions`, `BankAnswers`, `ExamMatrices`, `ExamMatrixItems`, and `Questions.BankQuestionId/BankQuestionVersion` snapshot metadata.
- Added `POST /api/exams/{id}/questions/import` for Teacher/Admin question import from `.csv`, `.xlsx`, `.txt`, `.docx`, and text-based `.pdf` files.
- Added all-or-nothing import validation for file size, supported extension, content type, required columns, `question_type`, `correct_answer`, and `score` before saving questions.
- Added official Teacher/Admin import template listing and download APIs: `GET /api/exams/question-import/templates` and `GET /api/exams/question-import/templates/{fileName}`.
- Added the backend-hosted standard import markdown file and `GET /api/exams/question-import/prompt` so Teacher/Admin can load the copyable conversion prompt through authenticated APIs.
- Standardized the backend-hosted teacher template set to 20 no-accent file names across four question types and five supported formats.
- Added `short_answer` import support where `correct_answer` becomes the accepted sample answer; unsupported `essay`, legacy Office formats, ZIP/media imports, and scanned PDFs remain rejected.

### Frontend

- Added a Teacher `Ngân hàng câu hỏi` workspace for creating question banks, filtering bank questions, manually adding/editing/archiving questions, importing files into a bank, creating matrix rows, previewing matrix selections, and creating draft exams from a matrix.
- Added frontend question bank and exam matrix API adapters with enum normalization for question type, difficulty, and bank question status.
- Added the Teacher sidebar route `/teacher/question-banks` while keeping the existing exam create/detail flow intact.
- Redesigned the entire UX/UI across Admin, Student, and Teacher modules to use a premium, consistent design system (Outfit/Inter typography, radial gradients, glowing heroes, standardized `StatCard`, `MetricBarList`, `TimelineList` components, and support for light/dark themes).
- Upgraded the Authentication flow with a 2-column branding layout and a new 4-step register wizard mockup.
- Revamped Admin pages including Admin Dashboard (with real-time system health widgets), Admin Monitoring (risk cards, severity filters), and User Management.
- Updated Student Dashboard with standardized Page Heroes and info blocks.
- Standardized Teacher pages (Dashboard, Classroom List, Classroom Detail tabs, Exam List, Exam Detail section layouts, Teacher Monitoring risk cards, Results, Assignments, and Notifications).
- Teacher classroom detail now emphasizes `Sao chép mã lớp` as the remaining header CTA, removes direct `Tạo bài tập` / `Tạo đề thi` shortcuts there, and keeps member browsing in the dedicated `Thành viên` tab instead of the Teacher overview.
- Teacher-facing Exam Management now uses an explicit draft-to-publish workflow instead of a publish checkbox; exam detail shows publish readiness, backend publish errors, a dedicated publish action, and complete question-type statistics for the backend-supported exam model.
- Exam schedule inputs are now handled in Vietnam time (`UTC+7`) on the frontend while requests still go to the backend in UTC, reducing timezone drift between create/edit and detail screens.
- Teacher question forms now explain the validation rules for single-choice, multiple-choice, true/false, and short-answer items so the publish checklist is easier to satisfy before release.
- Teacher/Admin question workspace now shows an integrated AI import workflow guide, with a standard `.md` guide download, collapsible prompt preview, one-click copy action, and four guided steps for generating then uploading the Excel import file.
- Teacher exam file upload now validates the selected format on the client, sends valid files to the backend preview API immediately, shows imported questions and answers for review before commit, and moves the main create-flow save action to the final step under the question workspace.
- Fixed the local Vite development proxy to target the backend HTTP profile on port `5157`, with `VITE_DEV_API_TARGET` available for overrides.

### Docs

- Added `docs/apiList.md` registry entries for `API-QBK-*` and `API-MTX-*`, including non-conflicting Swagger/API groups for Question Bank and Exam Matrix.
- Added teacher-facing question import template documentation and usage guidance under `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md` and `docs/11_QUESTION_IMPORT_TEMPLATE_USAGE.md`.
- Added DOCX/PDF teacher import guide files with no-accent names under `docs/`.
- Clarified that `CHANGELOG.md` is the main project changelog and `docs/project-changelog.md` remains the detailed feature history.

### Fixed

- Fixed the frontend auth `401` interceptor so invalid login attempts no longer hard-refresh `/login`; inline error messages now stay visible and the form state is preserved.
- Fixed the Teacher exam create-flow save action so the first save now auto-publishes when the final question set is non-empty, keeps draft status when there are no questions, and includes backend-previewed import questions in the initial saved exam.
- Fixed the Teacher exam create payload so draft/preview answer IDs are no longer sent as non-numeric temporary strings, preventing `POST /api/classrooms/{id}/exams` from failing with `400` during the first save; also trimmed the final create CTA UI and removed the extra in-page import success explanation.
- Fixed the Teacher create CTA so the final `Tạo đề` button now submits the exam form explicitly via `requestSubmit()`, and removed the redundant `Thêm vào đề nháp` action from draft file-import flow because previewed questions are already saved together with the exam.
- Fixed the Teacher create/import workspace so the final `Tạo đề` action now calls the shared exam submit callback directly, imported review questions can be edited before save/commit, and edited review items are persisted as real questions instead of re-importing the original file.
- Fixed backend exam import build blockers by replacing the ambiguous preview-question mapper method group and removing a duplicate `file` local declaration in `ExamsController`.
- Fixed Swagger/OpenAPI generation for multipart question import by binding the uploaded file through a form model.
- Fixed tabular import parsing for CSV/XLSX templates that contain title or instruction rows before the real header row, and ignored trailing note rows.
- Fixed DOCX import parsing so Word line breaks in table cells are preserved.
- Fixed text-based PDF template parsing by decoding `/ToUnicode` CMap hex text operators.
- Synced local frontend dependencies after merging release changes so the merged `tw-animate-css` import builds correctly again.

### Known risks

- The new question bank workspace is a focused teacher workflow; a richer reusable bank picker inside the existing exam question workspace can be added later if teachers need in-place selection while editing a specific exam.
- Matrix-generated exams are created as drafts; publishing still uses the existing exam detail publish checklist.
- PDF import supports text-based PDFs only; scanned/image PDFs still require OCR and are not supported.
- The frontend now exposes the standard markdown guide and prompt; full browsing of all 20 per-question-type template files remains API-only for now.
- Uploaded import file names do not need to match template names, but the extension must match the actual file format so the backend selects the correct parser.

## [1.1.0] - 2026-06-10

Stable release promoted from `v1.1.0-rc.1` after RC validation (auth + classroom Swagger E2E).

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

- Demo `Jwt:Key` in `appsettings.json` — override via User Secrets/env before non-local deploy
- Join codes are 6-character hex; rate limiting not yet implemented

### Known limitations

- No automated integration tests; manual Swagger E2E validated for this release
- `GET /api/classrooms/{id}` (classroom detail) deferred
- Members endpoint returns email for active members; tighten for production if needed

[1.1.0]: https://github.com/DatTran26/EduGuard/compare/v1.0.0...v1.1.0

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
