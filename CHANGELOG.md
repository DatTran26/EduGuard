# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Backend

- Fixed real-time notifications for students by broadcasting classroom notifications via `INotificationNotifier` on creation.
- Added `Notification` and `UserNotification` tables to SQL Server database with cascading delete rules for user notifications.
- Implemented `NotificationService` that handles classroom notifications creation for teachers, fetching announcements of a classroom, and get/mark-as-read/mark-all-as-read API operations.
- Registered `INotificationService` in DI container and exposed endpoints under `NotificationsController` protected by JWT role authorization, including `GET /api/notifications/classroom/{classroomId}`.
- Added `POST /api/exams/{id}/questions/import` for Teacher/Admin question import from `.csv`, `.xlsx`, `.txt`, `.docx`, and text-based `.pdf` files.
- Added all-or-nothing import validation for file size, supported extension, content type, required columns, `question_type`, `correct_answer`, and `score` before saving questions.
- Added official Teacher/Admin import template listing and download APIs: `GET /api/exams/question-import/templates` and `GET /api/exams/question-import/templates/{fileName}`.
- Added the backend-hosted standard import markdown file and `GET /api/exams/question-import/prompt` so Teacher/Admin can load the copyable conversion prompt through authenticated APIs.
- Standardized the backend-hosted teacher template set to 20 no-accent file names across four question types and five supported formats.
- Added `short_answer` import support where `correct_answer` becomes the accepted sample answer; unsupported `essay`, legacy Office formats, ZIP/media imports, and scanned PDFs remain rejected.

### Frontend

- Redesigned the Student's "Bài tập / Bài thi" page (`ExamListPage.jsx`):
  - Replaced the mixed student list view with a compact page header titled "Bài tập / Bài thi" and a clear segmented switch for `Bài thi` / `Bài tập`.
  - Rebuilt `StudentTaskTabs.jsx`, `StudentTaskToolbar.jsx`, `StudentTaskGrid.jsx`, `StudentAssignmentCard.jsx`, and `StudentExamCard.jsx` into a responsive card-grid flow with separate loading and empty states per tab.
  - Student now sees exactly one dataset at a time: the assignments tab renders only assignments, and the exams tab renders only exams.
  - Kept the existing API/routing flow intact by continuing to fetch exams from the current list API and aggregate assignments from the joined classrooms list, then filtering the visible data by the active tab.
  - Updated the student breadcrumb label in `TopBar.jsx` so `/student/exams` displays `Trang chủ > Bài kiểm tra`.
- Redesigned the Student's "Lớp của tôi" (My Classrooms) list page (`ClassroomListPage.jsx`):
  - Created `StudentClassroomCard.jsx` rendering compact, white-background classroom cards with hover elevations, green status badges, mono join codes, and a prominent "Vào lớp" button.
  - Created `StudentClassroomSummary.jsx` displaying exactly 2 clean metrics: total joined classrooms and active pending assignments/exams.
  - Created `StudentClassroomToolbar.jsx` supporting search (by name or join code) and simple status filtering (Tất cả, Đang học, Đã kết thúc).
  - Integrated the redesigned components in `ClassroomListPage.jsx` for `isStudentView`.
  - Replaced the bulky student hero block with a simple flex header row containing only the title "Lớp của tôi" and "Tham gia lớp" action button.
  - Implemented parallel loading of assignments and exams for all student classrooms to calculate the pending tasks count in real-time.
  - Removed charts, notification widgets, and side lists to keep the view focused and simple.
- Redesigned the Teacher's Classroom Detail (Chi tiết lớp học của giảng viên) page (`ClassroomDetailPage.jsx`):
  - Created `ClassDetailHeader.jsx` replacing the hero banner with a compact layout displaying title, status badges, copyable join codes, and quick action shortcuts.
  - Created `ClassQuickStats.jsx` with a 5-column grid for key metrics (members, assignments, exams, submission rate, alerts).
  - Created `ClassOverviewPanel.jsx` in a 2-column layout introducing a dynamic "Việc cần xử lý" (Pending Tasks) system, recent activity timeline, assignment submission trackers, copyable info cards, and quick action toolbars.
  - Lifted resource loading to the parent to fetch exams, attempts, assignments, submissions, and alerts in parallel.
  - Implemented query string triggers (`tab=assignments&create=1`, `tab=notifications&create=1`, `assignmentId={id}`) for automatic form opening and card auto-expanding/scrolling.
  - Added a Cancel button to the classroom edit form and updated empty states for tab views.
- Redesigned the Teacher's Classrooms (Lớp học của giảng viên) page (`ClassroomListPage.jsx`):
  - Removed the bulky hero banner and replaced it with a clean, compact header title and a "Tạo lớp học" button.
  - Implemented `ClassroomSummary.jsx` displaying 4 key classroom metrics: total classrooms, total students, open assignments, and active exams.
  - Implemented `ClassroomToolbar.jsx` supporting search (by name or join code), status filtering (Tất cả, Đang mở, Đã đóng), and sorting (Mới nhất, Tên A-Z, Nhiều sinh viên nhất).
  - Implemented `TeacherClassroomCard.jsx` displaying classrooms in a 2-column grid layout with copyable join codes, compact indicator stats, and quick links to "Xem lớp" and "Gửi thông báo".
  - Built an API enrichment engine fetching exams, assignments, and attempts in parallel to aggregate metrics per classroom without changing backend schemas.
- Redesigned the Teacher Dashboard to be lighter, more compact, and cleaner:
  - Replaced the large Hero section with a clean title and quick action buttons row (`Tạo bài tập`, `Tạo đề thi`, `Gửi thông báo`).
  - Arranged the 6 KPI cards (`Lớp`, `Sinh viên`, `Bài kiểm tra`, `Bài tập`, `Tỉ lệ nộp bài`, `Cảnh báo bất thường`) in a single row without text wrapping.
  - Relocated the "Hoạt động 7 ngày gần nhất" line chart to the top (immediately below the title) side-by-side with "Cơ cấu trạng thái bài kiểm tra".
  - Removed all card sub-descriptions to simplify the user interface.
  - Updated sidebar color `--color-obsidian` to `#1E293B` and active items to use background `#243B55` with a subtle white border/inset shadow.
- Added "Xem thông báo" link to Student sidebar navigation pointing to `/notifications` with the `FiBell` icon.
- Removed "Thông báo" and "Giám sát thi" from Teacher sidebar navigation.
- Added `notificationApi.js` supporting classroom notifications creation, fetching classroom announcements, user notifications, unread count, and mark-as-read/mark-all-as-read actions.
- Added route `/notifications` and built `NotificationsPage.jsx` displaying a clean notifications inbox with relative dates and reading status.
- Integrated a notification tab in the teacher's classroom view (`TeacherNotificationTab.jsx`) displaying sent announcements, with a "Tạo thông báo" button to toggle the form.
- Updated `TopBar.jsx` header bell and dropdown to call live backend notification APIs, update unread count dynamically, and support read updates. Removed unnecessary detail descriptions from the UI.
- Added a centered sub-navigation bar (tab switcher) to the Student "Bài kiểm tra" page, allowing students to switch between "Bài thi" (Exams) and "Bài tập" (Assignments) with custom page title updates.
- Integrated classroom assignment data for students by fetching and mapping them in memory, supporting search filtering by name/description alongside classroom filters.
- Created an expandable assignment details card visualizer that displays grading score, teacher feedback, maximum points, and submission/grading dates.
- Redesigned the entire UX/UI across Admin, Student, and Teacher modules to use a premium, consistent design system (Outfit/Inter typography, radial gradients, glowing heroes, standardized `StatCard`, `MetricBarList`, `TimelineList` components, and support for light/dark themes).
- Refactored the role-based dashboard system (Admin, Teacher, Student) to connect to live backend APIs, replacing mock statistics with real aggregated data from `userApi`, `classroomApi`, `examApi`, `examAttemptApi`, `antiCheatApi`, and `assignmentApi` endpoints.
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

- Added teacher-facing question import template documentation and usage guidance under `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md` and `docs/11_QUESTION_IMPORT_TEMPLATE_USAGE.md`.
- Added DOCX/PDF teacher import guide files with no-accent names under `docs/`.
- Clarified that `CHANGELOG.md` is the main project changelog and `docs/project-changelog.md` remains the detailed feature history.

### Fixed

- Fixed missing brand color variables in `index.css` so that the notification unread count badge, unread dot indicators, and status badges render with the correct colors instead of default/transparent styles.
- Fixed syntax errors and leftover mock logic in `dashboardApi.js`, cleanly implementing `buildStudentDashboardDataFromRealApis()` and `getStudentDashboard()`.
- Fixed layout compliance by replacing mock-like hardcoded CSS in dashboard cards with standard theme variables (`bg-surface-sunken`/`bg-surface`).
- Implemented a dynamic SignalR connection state indicator for the health system check in the Admin Dashboard, which monitors the real connection status of the notification hub.
- Implemented deficiency disclosures on the Student Dashboard to transparently mark unsupported student endpoints (submission tracking, global attempt history, global notifications) with clear badges (`Thiếu API` / `Yêu cầu API Backend`).
- Added animated loading skeletons and error alert states with retry actions across all dashboard pages.
- Fixed the frontend auth `401` interceptor so invalid login attempts no longer hard-refresh `/login`; inline error messages now stay visible and the form state is preserved.
- Fixed the Teacher exam create-flow save action so the first save now auto-publishes when the final question set is non-empty, keeps draft status when there are no questions, and includes backend-previewed import questions in the initial saved exam.
- Fixed the Teacher exam create payload so draft/preview answer IDs are no longer sent as non-numeric temporary strings, preventing `POST /api/classrooms/{id}/exams` from failing with `400` during the first save; also trimmed the final create CTA UI and removed the extra in-page import success explanation.
- Fixed the Teacher create CTA so the final `Tạo đề` button now submits the exam form explicitly via `requestSubmit()`, and removed the redundant `Thêm vào đề nháp` action from draft file-import flow because previewed questions are already saved together with the exam.
- Fixed the Teacher create/import workspace so the final `Tạo đề` action now calls the shared exam submit callback directly, imported review questions can be edited before save/commit, and edited review items are persisted as real questions instead of re-importing the original file.
- Fixed a follow-up regression in the Teacher exam create flow so the footer `Tạo đề` / `Lưu thay đổi đề` action now binds directly to the HTML form via the `form` attribute, preventing missed submits caused by the callback-ref bridge.
- Fixed backend exam import build blockers by replacing the ambiguous preview-question mapper method group and removing a duplicate `file` local declaration in `ExamsController`.
- Fixed Swagger/OpenAPI generation for multipart question import by binding the uploaded file through a form model.
- Fixed tabular import parsing for CSV/XLSX templates that contain title or instruction rows before the real header row, and ignored trailing note rows.
- Fixed DOCX import parsing so Word line breaks in table cells are preserved.
- Fixed text-based PDF template parsing by decoding `/ToUnicode` CMap hex text operators.
- Synced local frontend dependencies after merging release changes so the merged `tw-animate-css` import builds correctly again.
- Updated `normalizeAssignmentDto` in `assignmentApi.js` to map `mySubmission` so that student submission results are correctly propagated to the React state.
- Fixed `AssignmentSection.jsx` to use a stable `classroomId` load flow, keep the student submission map in sync after submit, and cache the latest submission locally so classroom cards no longer fall into an error or stale state.
- Fixed submission-state resolution across `AssignmentSection.jsx` and `ExamListPage.jsx` by preferring backend `mySubmission` and using the local cache only as a fallback, so students now consistently see `Đã nộp` in `Bài kiểm tra -> Bài tập` after submitting from the classroom page.
- Fixed display logic in `AssignmentSection.jsx` to render the student's submission status, graded score, and teacher feedback when the card is expanded on the Classroom page, resolving the issue where graded scores did not appear for students.
- Implemented automatic redirection in `ExamAttemptPage.jsx` so that students are returned to the "Bài kiểm tra" page immediately after exam submission if the exam's settings have `showResultAfterSubmit` set to `false`.

### Known risks

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


