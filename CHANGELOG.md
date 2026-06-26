# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Frontend

- **Proctoring evidence gallery:** Added sidebar tab **Bằng chứng vi phạm** (`/teacher/proctoring-evidence`, `/admin/proctoring-evidence`) with filterable grid, lightbox viewer, and stats for snapshots/clips/auto evidence — no need to browse server folders.

### Backend

- **Proctoring evidence list API:** `GET /api/proctoring/evidence` returns paginated evidence with exam/student context; teachers see owned/co-proctor exams only, admins see all.

### Frontend

- **Exam and assignment notifications:** Students receive in-app and SignalR alerts when a teacher publishes an exam or creates an assignment; teacher success toasts note that the class was notified; notification inbox supports `ExamPublished` and `AssignmentNew` types with deep links.

### Backend

- **Exam and assignment notifications:** `PublishAsync` notifies active classroom students (`ExamPublished`); `AssignmentService.CreateAsync` notifies students (`AssignmentNew`) with dedupe via `SourceKey` and realtime push.

### Frontend

- **Bug fix (proctoring camera):** Proctoring room shows a warning when the exam has anti-cheat only (no camera flags); anti-cheat monitoring panel links to log view instead of live camera room when camera monitoring is disabled.

### Backend

- **Bug fix (exam settings):** Updating an exam now persists all monitoring settings (camera, live proctoring, AI detection, snapshots); previously only shuffle/fullscreen fields were saved to SQL.

- **Exam and assignment notifications:** Publishing an exam or creating an assignment pushes notifications to all active students in the classroom (persisted + SignalR).

### Docs

- **Run guide:** Clarified that `use-tunnel.cmd` (Admin) already opens LAN firewall — `open-lan-firewall.cmd` only needed for `use-lan` / `use-tailscale`, or when tunnel script was not run as Administrator. Updated [`docs/HUONG_DAN_CHAY_HE_THONG.md`](docs/HUONG_DAN_CHAY_HE_THONG.md) and [`docs/PROCTORING_NETWORK_MODES.md`](docs/PROCTORING_NETWORK_MODES.md).
- **Run guide:** Added [`docs/HUONG_DAN_CHAY_HE_THONG.md`](docs/HUONG_DAN_CHAY_HE_THONG.md) — consolidated guide for all ways to run EduGuard (localhost dev, Visual Studio, Redis, LiveKit SFU, AI service, LAN/Tailscale/Tunnel network modes, full stack).

### Infra

- **TURN (coturn):** Enabled coturn in `infra/livekit` (UDP/TCP `3478`) with `.env.example` for credentials; for cross-network proctoring alongside tunneled `wss://livekit.wpcteam.homes`.

### Frontend

- **Classroom notifications:** Fixed notification type colors (khẩn cấp = đỏ, cảnh báo = vàng, chung = xanh); create form adds recipient picker with **Chọn hết** for one or many students. — waiting room no longer links back to exam list; shows **Tiếp tục làm bài** when teacher resumes; exam list/detail show **Tạm dừng** / **Tiếp tục làm bài** instead of **Đã thi** for `PausedByProctor`.
- **Exam lobby UI:** Redesigned student waiting room with gradient layout, status pills, flip-style countdown digits, and urgency states; countdown now ticks client-side from `startTime` every second instead of waiting on 5s lobby polling.
- **Exam attempt header:** Prominent centered countdown timer in the sticky header (segmented digit boxes, hides leading `00:` hours, urgency coloring under 5 minutes / 1 minute) instead of a small badge.
- **Config:** `VITE_LIVEKIT_URL` in `.env` overrides LiveKit WebSocket URL for browser SFU connections (fallback: API `sfu-config` url → `ws://localhost:7880`).
- **LiveKit RTC:** SFU connect passes explicit `iceServers` only when API includes TURN entries.
- **Bug fix:** Proctoring room no longer shows **Phiên đã kết thúc** before the scheduled start time; badge shows **Chờ mở đề** and the header countdown counts down to exam start instead of end.
- **Proctoring student tiles:** Camera/network/live signals now show Vietnamese labels with hints instead of raw **Unknown**; attempt status uses **Đang làm bài** / **Đã nộp bài**; submitted students explain why live camera is unavailable; P2P mode shows a one-student-at-a-time viewing hint.

### Backend

- **Classroom notifications:** `POST /api/notifications/classroom` accepts optional `recipientIds` to target specific active students; realtime tone follows notification type. `PausedByProctor` attempts instead of treating them as finished; max-attempt check counts only **Submitted** attempts; exam list/detail for students expose `myAttemptId`, `myAttemptStatus`, `myLatestScore`.
- **TURN ICE:** `WebRtc__IceServers__*` env vars for coturn (`turn:livekit.wpcteam.homes:3478`).

## [1.3.0-rc.1] - 2026-06-26

### Security

- Removed committed Redis Cloud password and production JWT key from tracked `appsettings.json`; RC deploys must set `ConnectionStrings__Redis`, `Jwt__Key`, and LiveKit secrets via environment variables or user secrets.
- Restricted `GET /api/notifications/classroom/{classroomId}` to classroom teachers and admins so students cannot enumerate anti-cheat or proctoring notifications.

### Backend

- **Late exam join alerts:** When a student starts a new attempt after the scheduled open time, teachers and co-proctors receive an in-app notification (`LateJoin`) plus a realtime SignalR event (`StudentJoinedExamLate`) on the exam monitoring hub; proctoring state summaries expose `isLateJoin` and `lateByMinutes`.
- **Anti-cheat in-app notifications:** Cheating logs now persist notifications for exam owner and co-proctors (`AntiCheat`, `AntiCheatHighRisk`), with SignalR push, dedupe window, deep links, and migration `ExtendNotificationMetadata` (`ActionUrl`, `RelatedExamId`, `SourceKey`).
- **Co-proctor invite notifications:** `AddProctorAsync` now creates an in-app notification and SignalR push for the invited teacher (`Type: ProctorInvite`, link to proctoring room).
- **Co-proctor exam discovery:** `GET /api/teacher/proctoring/assigned-exams` returns exams where the teacher is assigned as co-proctor; co-proctors can also load exam detail, attempts, and anti-cheat summary for those exams.
- Added **LiveKit SFU** for multi-stream teacher proctoring: `LiveKit` config section, JWT token service, `GET /api/proctoring/sfu-config`, teacher/student SFU token endpoints; SignalR retained for control events (warn/pause/terminate).
- Added teacher-owned question banks with bank questions, bank answers, difficulty/status metadata, versioning for snapshotted questions, and archived-question history.
- Added exam matrix APIs so teachers can define matrix rows, validate available approved bank questions, generate a balanced preview, and create draft exams from the selected bank.
- Added Admin read access for exam matrix list/detail while keeping create/update/delete/preview/create-exam restricted to Teacher-owned resources.
- Aligned matrix exam creation with the proctoring integration contract by wrapping exam creation, `ExamSetting`, question snapshots, and bank usage updates in a single transaction.
- Added EF Core migration `AddQuestionBanksAndExamMatrices` for `QuestionBanks`, `BankQuestions`, `BankAnswers`, `ExamMatrices`, `ExamMatrixItems`, and `Questions.BankQuestionId/BankQuestionVersion` snapshot metadata.

### Frontend

- **Late exam join UX:** Students joining after open time see device-check and attempt-page warnings about camera requirements; teachers in the proctoring room get a realtime toast and a "Vào trễ" badge on student tiles.
- **Notification center navigation:** Bell dropdown and `/notifications` now open the relevant monitoring/proctoring page from `actionUrl` and notification type (anti-cheat, proctor invite, high-risk).
- **Co-proctor monitoring:** `examApi.getAll()` merges assigned proctoring exams so co-proctors see them under **Giám sát thi** without owning the classroom.
- Fixed sidebar navigation showing duplicate icons on small screens when the desktop collapsed state was persisted in localStorage; nav items now render a single icon (plain on mobile, boxed on desktop) plus label, with truncated text and tooltip when space is tight. (`/student/exams/:examId/lobby`): single-column focus layout with a live countdown timer, camera preview only when the exam requires it, and removal of redundant badges, duplicate session metadata, and unused consent checkbox that contradicted optional-camera exams. (`useTeacherSfuViewer`, `useStudentSfuPublisher`) for multi-tile proctoring grid (up to `maxActiveLiveTiles`); falls back to SignalR P2P when `LiveKit:Enabled` is false.
- Fixed teacher classroom creation returning 403 when the UI showed `Giảng viên` but the stored JWT access token still carried an older role set; session hydration now compares JWT role claims with `/auth/me` and refreshes the token when they diverge, and axios retries once after a permission 403 following a silent token refresh.
- Improved API error toasts so users see Vietnamese messages from the backend (or friendly fallbacks) instead of raw HTTP status text such as `Request failed with status code 403`.
- Added frontend question bank and exam matrix API adapters with enum normalization for question type, difficulty, and bank question status.
- Added the Teacher sidebar route `/teacher/question-banks` while keeping the existing exam create/detail flow intact.
- Changed the Teacher question bank route to open on a bank list first; selecting a bank now enters the full edit workspace with a collapsible horizontal question form, full-width question list, clearer status/difficulty badges, matrix jump action, and a closable matrix-shortfall dialog that lists required versus available questions.
- Added a `Ngân hàng` mode to the Teacher exam create workspace so approved bank questions can be selected into an unsaved draft or snapshotted into an already saved exam through `POST /api/exams/{examId}/bank-questions`.
- Redesigned the Teacher monitoring hub (`/teacher/monitoring`) with a split master-detail layout: compact exam list on the left, workspace on the right with a single tab bar for **Camera trực tiếp** vs **Log anti-cheat**, removing duplicate stat cards and repeated live-camera buttons.
- Fixed anti-cheat log panel showing **Đang trực tiếp** after an exam session ended; the live badge now reflects exam window and in-progress attempts, not only the SignalR socket state.
- Fixed proctoring room header stuck on **Đang kết nối realtime…** when no student tile was selected; the room now opens a shared SignalR hub on load and shows **Phiên đã kết thúc** after the exam window closes.
- Fixed late exam entry skipping camera/microphone checks when only `enableCameraProctoring` was enabled; device-check now uses the same proctoring flags as the live room, requests mic when `requireMicrophone` is set, and starts proctoring for all live-proctoring exams.
- Teacher proctoring room now auto-selects the first in-progress student for live watch, enables student audio by default in the grid/drawer, and passes `enableAudio` when requesting WebRTC streams.
- Redesigned **Phòng giám sát bài thi** as a standalone control-room tab (no workspace sidebar): dark cockpit layout, expanded status bar and filters aligned to the live proctoring spec, collapsible co-proctor panel, and focused/grid view modes. Entry links now open the room in a new browser tab.
- Co-proctor management opens in a modal dialog; teacher candidates load via `GET /exams/{id}/proctors/candidates` instead of admin-only user list.
- Fixed teacher sidebar highlighting both **Đề thi** and **Giám sát thi** when viewing a proctoring room URL.
- Enabled **Admin** access to the live proctoring room and per-exam monitoring: routes `/admin/exams/:examId/proctoring` and `/admin/exam-monitoring`; proctoring links now resolve by role (backend already authorized Admin on proctoring APIs, SignalR hub, and LiveKit tokens).

### Docs

- Added `docs/PROCTORING_SFU_SETUP.md` — LiveKit Docker, TURN/STUN env vars, teacher/student SFU flows, dev test steps.
- Added `docs/apiList.md` registry entries for `API-QBK-*` and `API-MTX-*`, including non-conflicting Swagger/API groups for Question Bank and Exam Matrix.

### Known risks

- Matrix-generated exams are created as drafts; publishing still uses the existing exam detail publish checklist.

## [1.2.0] - 2026-06-25

### Security

- Proctoring evidence is served only through authenticated `GET /api/attempts/{attemptId}/proctoring/evidence/{evidenceId}/file`; public static access to `/uploads/proctoring` is blocked.
- Non-Development environments fail fast when `Jwt:Key` is missing or still contains the demo placeholder.

### Backend

- Added **Live Proctoring Control Room** module: proctoring entities/migration, lobby, WebRTC signaling via `ExamMonitoringHub`, teacher room/states APIs, watch lock (Redis), pause/resume/warn/terminate (SignalR + reason dialog), co-proctor assignments, evidence upload to `wwwroot/uploads/proctoring`, heartbeat policy with auto-snapshot flag, YOLO detection proxy with optional Ultralytics inference, admin AI settings, tile live preview, manual clip recording, CheatingLog integration (camera off, fullscreen exit, disconnect, AI detect), and YOLO bounding-box metadata on evidence.
- Added FastAPI stub service at `ai-services/proctoring-ai-service/` for local YOLO integration testing.
- Added Docker Compose and production README for the proctoring AI service; `PROCTORING_MODEL` env for Ultralytics weights.
- WebRTC ICE config omits empty TURN credentials; see `docs/proctoring-webrtc-nat.md` for STUN/TURN across NAT.
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

- Added teacher **Phòng giám sát bài thi** (`/teacher/exams/:examId/proctoring`) with risk-prioritized camera grid, live video on active tile + drawer, co-proctor panel, manual snapshot/clip/pause/warn/terminate controls, and link from Teacher Monitoring.
- Added student proctoring lobby/device-check/paused flows, camera preview + watermark on attempt, WebRTC publisher, and realtime proctoring warning toasts.
- Added admin **Cấu hình AI giám sát** page (`/admin/proctoring-ai`).
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
- The production frontend upload UI for browsing templates and displaying row-level import errors is still pending.
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

[1.3.0-rc.1]: https://github.com/DatTran26/EduGuard/compare/v1.2.0...v1.3.0-rc.1
[1.2.0]: https://github.com/DatTran26/EduGuard/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/DatTran26/EduGuard/compare/v1.0.0...v1.1.0

## [1.0.0] - 2026-06-10

### Added

- Backend scaffold: `EduGuard.Api`, `Domain`, `Application`, and `Infrastructure` projects (.NET 8)
- Frontend folder structure for auth, exams, classrooms, assignments, anti-cheat, and notifications
- Project documentation suite (`docs/01`–`08`), design tokens (`design.md`), and UI guidelines


