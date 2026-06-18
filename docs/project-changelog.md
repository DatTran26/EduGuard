# Project Changelog

## Bug fix: Local frontend/backend dev proxy 502

Date: 2026-06-18

Branch/source: `devB`

Description:

- Fixed local development 502 errors where the Vite frontend proxy targeted `https://127.0.0.1:7168` while the backend default `http` launch profile listens on `http://localhost:5157`.
- Restored backend NuGet assets after a failed offline restore left `project.assets.json` pointing at an unavailable sandbox package cache.
- Restarted local backend and frontend dev servers after applying the proxy fix so Swagger and proxied API calls work again.

Changed files:

- `frontend/vite.config.js`
- `frontend/README.md`
- `docs/project-changelog.md`

Technical summary:

- Added `VITE_DEV_API_TARGET` support in Vite config and defaulted the dev proxy target to `http://127.0.0.1:5157`.
- Kept `secure: false` for `/api` and `/hubs` proxy entries so developers can still override the target to the HTTPS dev profile with self-signed certs.
- Updated frontend README local-run instructions to match the backend `http` launch profile.

Validation:

- `dotnet restore backend\EduGuard.slnx` — succeeded.
- `dotnet build backend\EduGuard.slnx --no-restore` — succeeded, 0 warnings, 0 errors.
- `npm.cmd run build` — succeeded; Vite emitted existing dependency/chunk-size warnings only.
- `curl http://127.0.0.1:5157/swagger/index.html` — returned HTTP 200.
- `curl http://127.0.0.1:5173` — returned HTTP 200.
- `curl http://127.0.0.1:5173/api/Test` — returned HTTP 200 with backend JSON `{ "message": "EduGuard API is running" }`.

Unresolved questions:

- DataProtection logs warnings about an old DPAPI-protected key that cannot be decrypted in the current user context; this does not block Swagger or API proxy calls but should be cleaned separately if it keeps polluting logs.

## Feature: Backend standard-file objective question import

Date: 2026-06-18

Branch/source: `devB`

Description:

- Added backend support for importing objective exam questions from standard files into an existing exam.
- Supports `.csv`, `.xlsx`, `.txt`, `.docx`, and text-based `.pdf` files when they follow the approved question-bank template.
- Scoped import to objective question types only: `single_choice`, `multiple_choice`, and `true_false`; short answer, essay, OCR, ZIP/media imports remain follow-up work.
- Opened the import endpoint to `Teacher` and `Admin`; teachers can import only into their own exams, while admins can import into any exam.
- Added the approved question-bank file import standard to docs and linked it from the documentation index.
- Updated Todo/API/feature tracking so backend and frontend import work are separated clearly.

Changed files:

- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `backend/EduGuard.Application/DTOs/Exams/question-import-error-dto.cs`
- `backend/EduGuard.Application/DTOs/Exams/question-import-result-dto.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/question-import-parser.cs`
- `docs/09_QUESTION_BANK_FILE_IMPORT_STANDARD.md`
- `docs/README.md`
- `docs/apiList.md`
- `docs/features.md`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Added `POST /api/exams/{id}/questions/import` as a Teacher/Admin multipart endpoint using form field `file`.
- Import validates supported extensions, accepted MIME types, 5 MB max size, required headers/templates, question type, score, answer options, and correct-answer references before saving.
- CSV/XLSX rows and TXT/DOCX/PDF text blocks are parsed into the existing `Question` / `Answer` model and reuse existing exam question validation before appending imported questions to the target exam.
- Import is all-or-nothing: if any row has an error, the response includes row-level errors and no database changes are saved.

Validation:

- `dotnet build backend\EduGuard.slnx` — blocked at API output copy because running `EduGuard.Api` / Visual Studio locked DLLs.
- Backend build with isolated output path — succeeded, 0 warnings, 0 errors.
- Backend test with isolated output path — succeeded with exit code 0.
- Parser smoke checks — passed for `.csv`, `.xlsx`, `.txt`, `.docx`, and text-based `.pdf`.
- Backend API E2E import check — passed: imported a standard CSV with 3 objective rows into an exam, verified saved question types `single_choice`, `multiple_choice`, `true_false`, and verified correct-answer counts.

Unresolved questions:

- Frontend upload UI, template download, and row-level/case-level error display are still pending.
- Images/media, ZIP import, OCR for scanned PDFs, short-answer, essay, persistent import batches, and duplicate detection remain later phases.

## Feature: App shell, loading UX, and teacher pages

Date: 2026-06-16

Branch/source: `devD`

Description:

- Upgraded app shell: collapsible sidebar, TopBar with breadcrumb, notifications, centered search, and profile menu navigation to profile route.
- Added InfinityLoader loading screen and shadcn-style UI primitives (breadcrumb, skeleton).
- Modularized classroom list and exam/question forms into helper modules; updated teacher dashboard and related pages.

Changed files:

- `frontend/src/components/layout/AppShell.jsx`, `Sidebar.jsx`, `TopBar.jsx`, `ProtectedRoute.jsx`, `PublicRoute.jsx`
- `frontend/src/components/common/LoadingScreen.jsx`, `Skeleton.jsx`
- `frontend/src/components/ui/flexnative-breadcrumb.tsx`, `loader-13.tsx`
- `frontend/src/features/classrooms/**`, `frontend/src/features/exams/**`, `frontend/src/features/dashboard/**`
- `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.js`, `frontend/src/index.css`
- `docs/project-changelog.md`, `docs/SQL_Excute/Assign_Role_Teacher.sql`, `.gitignore`

Technical summary:

- Sidebar collapse persisted via `localStorage`; TopBar breadcrumb truncates long paths; notifications synced via `eduguard:notification` event.
- Vite `@` alias and `lib/utils.ts` added for shadcn-compatible components.

Validation:

- `npm run build` — succeeded.
- `npm test` (pre-commit) — passed.

Unresolved questions:

- None.

## Feature: Teacher Dashboard Navigation & Search Fix

Date: 2026-06-16

Branch/source: `devD`

Description:
- Resolved visual styling regressions in the Teacher Dashboard navigation bar and search interface for full compliance with the Institutional Slate v1.1.0 design system.
- Refactored `Sidebar.jsx` to replace hardcoded utility colors with semantic CSS classes (`.eg-sidebar-link-active`, `.eg-sidebar-link-idle`) defined in `index.css`.
- Audited and refined the `TopBar` search component styling to use `bg-surface-sunken` and `border-border` correctly with proper contrast, placeholder colors, and transition effects.

Changed files:
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`

Technical summary:
- Removed hardcoded Tailwind colors (`bg-white/10`, `text-slate-400`, `hover:bg-white/5`) from `Sidebar.jsx` navigation links, replacing them with theme-compliant `.eg-sidebar-link-active` and `.eg-sidebar-link-idle`.
- Enhanced search bar input styling in `TopBar.jsx` by adding `placeholder:text-secondary`, `transition-all duration-200`, and a soft focus ring (`focus:ring-3 focus:ring-tertiary/16`) to maintain design consistency with the global input states.

Validation:
- Ran `npm run lint` which completed successfully with 0 errors.
- Ran `npm run build` which compiled Vite and Rolldown successfully.

Unresolved questions:
- None.

## Feature: Modernizing Teacher Dashboard Forms & Classrooms UI

Date: 2026-06-16

Branch/source: `devD`

Description:
- Refactored `ExamForm.jsx` and `QuestionForm.jsx` for full compliance with the "Institutional Slate" v1.1.0 design system.
- Replaced legacy border radius values with standardized token-based borders (`rounded-[12px]` and `rounded-[20px]`).
- Standardized form interactions, input heights, and visual hierarchy using `eg-input` and `eg-button` classes and elements.
- Enforced single-accent CTA rule across complex forms, ensuring visual consistency.
- Modularized frontend components exceeding 200 lines (`ExamForm.jsx`, `QuestionForm.jsx`, `ClassroomListPage.jsx`) into smaller sub-components and pure JS helper files for better code maintenance.

Changed files:
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/exam-form-basic-section.jsx`
- `frontend/src/features/exams/components/exam-form-config-section.jsx`
- `frontend/src/features/exams/components/exam-form-helpers.js`
- `frontend/src/features/exams/components/question-form-answers-section.jsx`
- `frontend/src/features/exams/components/question-form-helpers.js`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/classroom-list-admin-filters.jsx`
- `frontend/src/features/classrooms/pages/classroom-list-helpers.js`

Technical summary:
- Extracted basic fields and advanced configs from `ExamForm` into modularized sub-components and helper functions.
- Extracted answer list creation and correctness options from `QuestionForm` into dynamic sub-components and helpers.
- Modularized `ClassroomListPage.jsx` by extracting pure logic/filtering into `classroom-list-helpers.js` and sorting/searching UI inputs into `classroom-list-admin-filters.jsx`.
- Kept all newly generated code files under 200 lines to align with the repository modularization guidelines.
- Ensured single-accent CTA rule: each form only has exactly one primary action button (accent color blue).

Validation:
- Ran `npm run lint` which completed successfully with 0 errors.
- Ran `npm run build` which compiled Vite and Rolldown successfully.

Unresolved questions:
- None.

## Feature: Teacher Dashboard Modernization & Navigation Workspace

Date: 2026-06-15

Branch/source: `devD`

Description:
- Tái cấu trúc lại giao diện Teacher từ dạng Floating Header cũ sang Nav bar chuyên nghiệp, tạo không gian làm việc đồng bộ, cố định và tối ưu trải nghiệm sử dụng (ergonomics) cho giảng viên.
- Tích hợp thư viện Recharts để trực quan hóa dữ liệu thống kê lớp học sinh động, bao gồm biểu đồ kết hợp (Classroom Performance: Submission Rate vs. Average Score) và biểu đồ tròn (Anti-cheat Incidents breakdown) có chú thích chi tiết.
- Bổ sung panel giám sát phòng thi realtime dưới dạng Proctoring Streams Placeholder có overlay "Coming Soon", định hình lộ trình phát triển tích hợp WebRTC và SignalR Hub trong tương lai.

Changed files:
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/components/teacher-dashboard-charts.jsx`
- `frontend/src/features/dashboard/components/proctoring-streams-placeholder.jsx`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/package.json`
- `frontend/package-lock.json`
- `docs/project-changelog.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/features.md`
- `Todo List.md`

Technical summary:
- Thay thế toàn bộ layout thẻ nổi cũ bằng khung dashboard lưới (grid) linh hoạt, tuân thủ bảng màu Institutional Slate v1.1.
- Sử dụng `<ComposedChart>` hiển thị đồng thời tỉ lệ nộp bài (Bar) và điểm trung bình (Line) của các lớp học, cùng chú giải (Tooltip) tùy biến cao.
- Thiết kế biểu đồ `<PieChart>` với góc bo nhẹ cho từng phần, tự động ánh xạ màu sắc theo mức độ rủi ro (High/Medium/Low) của cheat log, đi kèm Custom Legend dạng nút tròn đồng bộ.
- Xây dựng component `ProctoringStreamsPlaceholder` sử dụng các thẻ stream mô phỏng hoạt động camera giám sát, bọc bởi filter glassmorphic mờ và biểu tượng khóa/thông tin tính năng đang phát triển.

Validation:
- `npm install react-is` — Đã cài đặt dependency bổ sung để giải quyết vấn đề import của Recharts trên môi trường Vite/Rolldown.
- `npm run build` — Biên dịch thành công dự án frontend, mã nguồn tối ưu hóa không có lỗi cú pháp hay import.
- Kiểm tra trực quan cấu trúc giao diện trên trình duyệt đảm bảo responsive đầy đủ ở các độ phân giải màn hình.

Unresolved questions:
- Proctoring streams hiện tại mới là mock placeholder; cần kết nối với camera student thông qua WebRTC và SignalR hub giám sát trong các phase sau.
- Tích hợp dashboard API thật từ backend khi endpoints cho vai trò Teacher được hoàn thiện đầy đủ trên service layer.

## Feature: Backend exam configuration validation

Date: 2026-06-15

Branch/source: `devB`

Description:

- Chuẩn hóa backend cho cấu hình bài kiểm tra trước khi làm tiếp frontend: thời gian mở/đóng đề được lưu và trả về theo UTC rõ ràng để frontend có thể hiển thị đúng giờ Việt Nam.
- Siết validation cấu hình exam ở tầng request/service: duration, max attempts và cửa sổ mở/đóng đề phải hợp lệ.
- Siết điều kiện publish để đề chỉ được publish khi có câu hỏi hợp lệ; lỗi publish trả về message rõ theo từng câu/cấu hình để frontend hiển thị cho teacher.
- Bổ sung validation publish cho trắc nghiệm MVP: `SingleChoice`, `MultipleChoice`, `TrueFalse`; giữ mô hình `Question` / `Answer` gắn trực tiếp với `Exam`, chưa triển khai `QuestionBank` hoặc import file trong bước này.

Changed files:

- `backend/EduGuard.Application/Validators/create-exam-request-validator.cs`
- `backend/EduGuard.Application/Validators/update-exam-request-validator.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-date-time-helper.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-mapper.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Added `ExamDateTimeHelper` to normalize incoming exam schedule values to UTC and mark DB-loaded schedule values as UTC before JSON serialization.
- `ExamMapper.MapExam` now returns UTC-marked `StartTime`, `EndTime`, and `CreatedAt` so serialized API responses include the correct UTC kind.
- `ExamAttemptService.EnsureExamWindowOpen` now normalizes stored schedule values before comparing them with `DateTime.UtcNow`.
- `CreateExamRequestValidator` and `UpdateExamRequestValidator` now guard null settings and compare schedule windows after UTC normalization.
- `ExamService.PublishAsync` now calls publish validation before setting `IsPublished`, checking exam config and question/answer correctness.

Validation:

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -o temp\backend-exam-config-build` — succeeded, 0 warnings, 0 errors. Used separate output because a running `EduGuard.Api` process locked the default build DLLs.
- `npm.cmd test` — passed; current script runs `dotnet test backend/EduGuard.Api/EduGuard.Api.slnx` and the solution currently has no test project output.
- `git diff --check` — passed; only existing LF/CRLF conversion warnings were reported.

Unresolved questions:

- Frontend still needs the matching timezone helper and UI changes so `datetime-local` inputs show `Asia/Ho_Chi_Minh` consistently.
- Manual Swagger/browser publish tests should cover invalid no-question exam, invalid answer counts, invalid correct-answer counts and valid trắc nghiệm exam before commit.
- Question bank/import file remains a later feature; this change keeps questions attached directly to exams for MVP.

## Feature: SignalR realtime monitoring

Date: 2026-06-15

Branch/source: `devB`

Description:

- Hoàn thiện Phase 8 SignalR realtime để teacher nhận cảnh báo anti-cheat ngay khi student phát sinh log hợp lệ trong lúc làm bài.
- Bổ sung `NotificationHub` và `ExamMonitoringHub`; hub dùng JWT Bearer qua query `access_token`, join group theo exam và chỉ teacher sở hữu đề mới được monitor.
- Thêm abstraction notifier trong Application để `AntiCheatService` gửi realtime warning sau khi lưu `CheatingLog` thành công mà không phụ thuộc trực tiếp vào API/Hub.
- Frontend cài `@microsoft/signalr`, thêm connection factory cho notification/exam monitoring, listener notification toàn app và cập nhật `AttemptMonitorPanel` để nhận `ReceiveAntiCheatWarning`, cập nhật score/log realtime và hiển thị toast cho teacher.
- Cập nhật registry/todo feature SignalR; notification realtime hiện có hub/notifier/listener, còn entity/API lưu notification vẫn thuộc Notification System riêng.

Changed files:

- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Api/Hubs/exam-monitoring-hub.cs`
- `backend/EduGuard.Api/Hubs/notification-hub.cs`
- `backend/EduGuard.Api/Realtime/signalr-exam-monitoring-notifier.cs`
- `backend/EduGuard.Api/Realtime/signalr-notification-notifier.cs`
- `backend/EduGuard.Application/DTOs/AntiCheat/anti-cheat-warning-dto.cs`
- `backend/EduGuard.Application/DTOs/Notifications/realtime-notification-dto.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-monitoring-notifier.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-monitoring-service.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-notification-notifier.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/anti-cheat-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-monitoring-service.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.js`
- `frontend/src/App.jsx`
- `frontend/src/features/anti-cheat/components/AttemptMonitorPanel.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/notifications/components/RealtimeNotificationListener.jsx`
- `frontend/src/signalr/signalrConnection.js`
- `frontend/src/signalr/examMonitoringConnection.js`
- `frontend/src/signalr/notificationConnection.js`
- `Todo List.md`
- `README.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/apiList.md`
- `docs/features.md`
- `docs/project-changelog.md`

Technical summary:

- `ExamMonitoringHub` exposes `JoinExam` / `LeaveExam` and uses group name `exam:{examId}` so warning is scoped per exam.
- `ExamMonitoringService` checks exam ownership before allowing a teacher connection to join an exam group.
- `AntiCheatService.LogAsync` now maps the saved log to `AntiCheatWarningDto`, counts logs for the attempt and sends `ReceiveAntiCheatWarning` after `SaveChangesAsync` succeeds; SignalR send failures are logged as warnings and do not invalidate the REST log response.
- `JwtBearerEvents.OnMessageReceived` accepts hub tokens from `access_token` for `/hubs/*`; CORS allows credentials for SignalR dev connections.
- Frontend uses `accessTokenFactory`, automatic reconnect, Vite `/hubs` WebSocket proxy and realtime state updates in the teacher monitor panel.

Validation:

- `npm.cmd --prefix frontend install @microsoft/signalr` — installed `@microsoft/signalr@10.0.0`, audit found 0 vulnerabilities.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj` — succeeded, 0 warnings, 0 errors.
- `npm.cmd --prefix frontend run lint` — passed.
- `npm.cmd --prefix frontend run build` — passed; Vite/Rolldown emitted non-blocking warnings from `@microsoft/signalr` pure annotations and bundle size.
- `npm.cmd test` — passed (`dotnet test backend/EduGuard.Api/EduGuard.Api.slnx`).

Unresolved questions:

- Browser E2E with two logged-in users was not run in this environment; verify manually with teacher exam detail open and student triggering anti-cheat events.
- Notification persistence/list/read APIs are still not implemented; current Phase 8 covers realtime hub/notifier/listener only.
- Frontend production bundle now crosses Vite's default 500 kB chunk warning after adding SignalR; consider route-based code splitting later if bundle size becomes a release concern.

## Feature: Identity keys — int → string (GUID)

Date: 2026-06-13

Branch/source: local workspace

Description:

- Chuyển ASP.NET Core Identity sang mặc định Microsoft: `IdentityUser` / `IdentityRole` với khóa `string` (GUID).
- Các FK liên quan user (`TeacherId`, `StudentId`, `UserId` trên Classroom, Assignment, Exam, …) đổi sang `string`.
- Role seed dùng GUID cố định (`RoleIds.Admin/Teacher/Student`).
- JWT `NameIdentifier` và API DTO `UserDto.Id` trả GUID string.
- Migration `20260613065925_ConvertIdentityKeysToString` dùng raw SQL (drop/recreate PK + indexes) vì SQL Server không cho `AlterColumn` trên cột IDENTITY.
- **Breaking:** DB dev đã drop/recreate; user cũ (id int) không migrate được — cần đăng ký lại.

Changed files:

- `backend/EduGuard.Domain/Entities/ApplicationUser.cs`, `Constants/role-ids.cs`, entity FK fields
- `backend/EduGuard.Infrastructure/Data/app-db-context.cs`, `dependency-injection.cs`, Auth services, repositories, services
- `backend/EduGuard.Application/DTOs/**`, service/repository interfaces
- `backend/EduGuard.Api/Controllers/*.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/20260613065925_ConvertIdentityKeysToString.cs`
- `docs/04_DATABASE_ENTITIES.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` — 0 errors
- `dotnet ef database drop --force` + `dotnet ef database update` — applied all migrations including `ConvertIdentityKeysToString`

Unresolved questions:

- Production DB có dữ liệu thật cần script migrate int→GUID riêng (không dùng migration dev hiện tại).

## Feature: Teacher exam publish and schedule defaults

Date: 2026-06-13

Branch/source: `devH`

Description:

- Sửa luồng tạo bài kiểm tra cho Teacher để có thể chọn publish ngay khi tạo, thay vì luôn tạo ở trạng thái nháp.
- Cho phép backend publish metadata đề thi trước khi có câu hỏi, nhưng chặn Student bắt đầu làm bài nếu đề chưa có câu hỏi để không tạo attempt rỗng.
- Tối ưu form lịch thi: khi nhập thời gian làm bài và chọn thời gian mở đề, frontend tự set thời gian đóng đề bằng `startTime + durationMinutes`; field đóng đề vẫn là input thường để giảng viên chỉnh tay khi cần.
- Đồng bộ lại tài liệu API/test guide để không còn mô tả publish bắt buộc phải có câu hỏi.

Changed files:

- `frontend/src/features/exams/components/ExamForm.jsx`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `docs/apiList.md`
- `docs/swagger-api-testing-guide.md`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint` — passed
- `npm --prefix frontend run build` — passed
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore --configuration Release` — 0 warnings, 0 errors
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore` — blocked by local Debug output lock from running Visual Studio / `EduGuard.Api` process

Unresolved questions:

- Publish hiện công khai metadata đề thi; đề chưa có câu hỏi vẫn không cho Student bắt đầu làm bài.

## Feature: Frontend assignment, exam attempt, and anti-cheat REST workflows

Date: 2026-06-11

Branch/source: `devH`

Description:

- Hoàn thiện 3 luồng frontend còn thiếu nhưng backend đã sẵn sàng: `Assignment Management`, `Online Testing / Exam Attempt`, và `Anti-cheat Monitoring` bản REST cơ bản.
- Gắn `assignment` trực tiếp vào `ClassroomDetailPage`: teacher có thể tạo/sửa/xóa bài tập, mở danh sách bài nộp và chấm điểm; student có thể nộp bài ngay trong lớp học theo đúng palette/token hiện tại.
- Thêm route làm bài riêng cho student tại `student/attempts/:attemptId`: start/resume từ exam detail, timer cố định, auto-save, điều hướng câu hỏi desktop/mobile, xác nhận nộp bài, auto submit khi hết giờ và màn kết quả sau nộp.
- Bổ sung hook anti-cheat REST cơ bản trong lúc làm bài: ghi `TAB_SWITCH`, `COPY_PASTE`, `EXIT_FULLSCREEN`, `PAGE_RELOAD`, `DISCONNECTED`; đồng thời mở `AttemptMonitorPanel` ở exam detail cho teacher để xem suspicion score, log count và timeline theo từng lượt làm.
- Giữ đúng design direction trong `docs/design-guidelines.md` và token màu trong `docs/eduguard-design-tokens-preview.html`: flat surfaces, một primary CTA mỗi vùng, không thêm gradient/shadow mới.

Changed files:

- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/api/antiCheatApi.js`
- `frontend/src/features/assignments/assignmentHelpers.js`
- `frontend/src/features/assignments/components/AssignmentForm.jsx`
- `frontend/src/features/assignments/components/AssignmentSection.jsx`
- `frontend/src/features/anti-cheat/antiCheatHelpers.js`
- `frontend/src/features/anti-cheat/components/AttemptMonitorPanel.jsx`
- `frontend/src/features/exam-attempts/attemptHelpers.js`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Backend hiện chưa có endpoint để student lấy lại bài nộp của chính mình, nên trạng thái `Đã nộp` của assignment đang được giữ ổn định trên FE bằng local cache sau khi submit; teacher vẫn xem/chấm qua API thật bình thường.

## Fix: Refresh JWT claims when backend role changes

Date: 2026-06-11

Branch/source: `devH`

Description:

- Xác định lỗi 403 ở các API chỉ cho `Teacher` như `POST /api/classrooms`: frontend có thể đã đọc role mới từ `GET /api/auth/me`, nhưng access token cũ vẫn giữ claim `Student`.
- Nguyên nhân xảy ra khi quyền được đổi trong database sau lần đăng nhập trước đó; UI route guard nhìn theo `user.roles` mới nên cho vào màn Teacher, còn backend authorize vẫn đọc claim role cũ trong JWT.
- Vá `AuthProvider` để trong lúc hydrate session, nếu role từ `/api/auth/me` khác role đang lưu, app tự gọi `POST /api/auth/refresh-token` và lưu lại access token/refresh token mới trước khi tiếp tục dùng session.
- Nhờ đó các màn Teacher như tạo lớp học, tạo đề thi, xem endpoint `teacher-only` không còn bị lệch giữa role hiển thị ở UI và quyền thật trong token.

Changed files:

- `frontend/src/hooks/useAuth.jsx`
- `docs/project-changelog.md`
- `Todo List.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Nếu tài khoản thực tế chưa được gán role `Teacher` trong database thì backend vẫn sẽ trả `403` đúng thiết kế; fix này chỉ xử lý trường hợp role đã đổi nhưng token chưa được làm mới.

## Feature: Role UI simplification and design-token color alignment

Date: 2026-06-11

Branch/source: `devH`

Description:

- Rà lại các màn chính của `Admin`, `Teacher`, `Student` và bỏ phần mô tả phụ ở cấp page header, section block, stat card, list card, form intro và note panel; UI giữ lại title, số liệu và dữ liệu nghiệp vụ cần đọc.
- Tinh gọn dashboard components dùng chung: `StatCard`, `MetricBarList`, `TimelineList` không còn render helper/subtitle/description mặc định; dữ liệu cần thiết được dồn về title hoặc meta ngắn.
- Dọn các màn classroom, exam, dashboard, user/profile theo hướng title-first: card lớp học và bài kiểm tra không còn đoạn mô tả dài; form tạo/join/chỉnh sửa giảm helper copy không cần thiết.
- Chuẩn hóa màu ở workspace đã đăng nhập theo token trong `docs/eduguard-design-tokens-preview.html`: badge, toast, sidebar active state, user trigger, avatar fallback và shell surface chuyển về palette phẳng, bỏ gradient/tone xanh riêng ở các thành phần này.

Changed files:

- `frontend/src/components/dashboard/StatCard.jsx`
- `frontend/src/components/dashboard/MetricBarList.jsx`
- `frontend/src/components/dashboard/TimelineList.jsx`
- `frontend/src/components/common/Avatar.jsx`
- `frontend/src/components/common/ToastViewport.jsx`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`
- `frontend/src/features/classrooms/components/ClassroomCard.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/components/JoinClassroomForm.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/exams/components/ExamCard.jsx`
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/index.css`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Auth screens và các thành phần ngoài workspace role-based chưa được re-theme trong thay đổi này; nếu muốn toàn bộ frontend dùng cùng hệ màu token, cần thêm một lượt cleanup riêng.

## Feature: Frontend integration for classroom, exam, attempt, and anti-cheat APIs

Date: 2026-06-11

Branch/source: `devH`

Description:

- Chuyển các màn frontend lớp học và bài kiểm tra từ `mockDatabase/localStorage` sang gọi backend thật qua `axiosClient`, bám theo các endpoint đã có trong `docs/apiList.md`.
- Thêm lớp adapter ở FE để chuẩn hóa DTO backend về shape UI hiện tại: classroom có `memberCount` khi role được phép xem thành viên; exam có `statusLabel`, `canEdit`, `canViewQuestionBank`, và tự suy ra `totalQuestionScore`.
- Sửa các form để khớp contract backend thật: tạo lớp không còn nhập `joinCode` thủ công; đề thi không đổi được classroom sau khi tạo; publish dùng endpoint riêng và chỉ xuất hiện ở ngữ cảnh phù hợp.
- Bổ sung API client cho `assignment`, `exam attempt`, `anti-cheat`; đồng thời tận dụng `exam attempt` + `anti-cheat summary` ngay trên trang chi tiết đề thi để teacher xem điểm trung bình và số liệu giám sát thật.
- Giữ rõ trạng thái mock cho các phần backend chưa có endpoint tương ứng như `user/profile` và `dashboard`, đồng thời cập nhật todo/docs để nhóm nhìn đúng tiến độ tích hợp.

Changed files:

- `frontend/src/api/apiHelpers.js`
- `frontend/src/api/classroomApi.js`
- `frontend/src/api/examApi.js`
- `frontend/src/api/assignmentApi.js`
- `frontend/src/api/examAttemptApi.js`
- `frontend/src/api/antiCheatApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/features/classrooms/components/ClassroomCard.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/exams/components/ExamCard.jsx`
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `Todo List.md`
- `docs/05_API_FRONTEND_INTEGRATION.md`
- `docs/apiList.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Backend hiện chưa có user/profile CRUD, dashboard, notification và admin classroom aggregation tương ứng với toàn bộ màn FE hiện có, nên các khu vực đó vẫn đang mock hoặc chỉ hiển thị dữ liệu giới hạn theo quyền endpoint thật.

## Feature: Backend Phase 7 — Anti-cheat Monitoring APIs

Date: 2026-06-11

Branch/source: local workspace (`release`)

Description:

- Thêm entity `CheatingLog`, bảng `CheatingLogs` (gộp trong migration `AddAssignmentsExamsAndAttempts` sau regenerate).
- `AntiCheatController` + `AntiCheatService` + `CheatingLogRepository`: ghi log hành vi, xem log/score theo attempt, tổng hợp theo đề thi.
- Student chỉ ghi log khi attempt **InProgress** và exam **EnableAntiCheat**; cộng dồn `SuspicionScore` trên `ExamAttempt`.
- Loại hành vi API: `TAB_SWITCH`, `WINDOW_BLUR`, `COPY_PASTE`, `EXIT_FULLSCREEN`, `PAGE_RELOAD`, `DISCONNECTED`, `WEBCAM_OFF`.

Changed files:

- `backend/EduGuard.Domain/Entities/CheatingLog.cs`, `Enums/CheatingType.cs`
- `backend/EduGuard.Application/DTOs/AntiCheat/*`, validators, service/repository interfaces
- `backend/EduGuard.Infrastructure/AntiCheat/*`, `Repositories/cheating-log-repository.cs`
- `backend/EduGuard.Infrastructure/Data/Configurations/cheating-log-configuration.cs`
- `backend/EduGuard.Api/Controllers/anti-cheat-controller.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/20260611090709_AddAssignmentsExamsAndAttempts.*`
- `docs/apiList.md`, `docs/swagger-api-testing-guide.md`, `Todo List.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` — 0 errors
- `dotnet ef database update` — applied `20260611090709_AddAssignmentsExamsAndAttempts` (includes `CheatingLogs` table)

Unresolved questions:

- SignalR realtime warning (Phase 8) chưa implement.
- Frontend monitor hook/dashboard chưa làm (ngoài scope backend-only).

## Feature: PATCH endpoints (partial update)

Date: 2026-06-11

Branch/source: local workspace

Description:

- Thêm **PATCH** cho cập nhật một phần: Classroom, Assignment, Exam, Question, Answer.
- Dùng `Optional<T>` — field không có trong JSON body được giữ nguyên; PUT vẫn thay thế đầy đủ.
- Ví dụ: `PATCH /api/classrooms/1` body `{"name":"..."}` — không đổi `description`.

Changed files:

- `backend/EduGuard.Application/DTOs/Common/optional*.cs`
- `backend/EduGuard.Application/DTOs/**/patch-*-request.cs`
- `backend/EduGuard.Application/Validators/patch-*-validator.cs`
- `backend/EduGuard.Infrastructure/**` services (PatchAsync)
- `backend/EduGuard.Api/Controllers/*.cs`, `Program.cs`
- `docs/apiList.md`, `docs/swagger-api-testing-guide.md`

Validation: `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` — 0 errors.

## Fix: JSON response cho 401/403 (Authorize / JWT)

Date: 2026-06-11

Branch/source: local workspace

Description:

- **Bug:** Student gọi API Teacher (vd. `PUT /api/classrooms/{id}`) trả 403 với body rỗng (`content-length: 0`).
- **Fix:** Handler toàn cục `ApiAuthorizationMiddlewareResultHandler` + `JwtBearerEvents` trả `ApiResponse<object>` JSON cho 401/403 trên mọi API có `[Authorize]`.
- Lỗi nghiệp vụ trong controller (`UnauthorizedAccessException`) vẫn trả message chi tiết như trước.

Changed files:

- `backend/EduGuard.Api/Authorization/api-authorization-middleware-result-handler.cs`
- `backend/EduGuard.Api/Authorization/auth-api-response-writer.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `docs/swagger-api-testing-guide.md`
- `docs/project-changelog.md`

Validation:

- `dotnet build` (cần restart/stop `EduGuard.Api` nếu process đang lock DLL)

## Feature: Swagger API testing guide

Date: 2026-06-11

Branch/source: local workspace

Description:

- Thêm `docs/swagger-api-testing-guide.md`: hướng dẫn mở Swagger, Authorize JWT, gán role Teacher qua SQL, luồng test Phase 2–6 và checklist E2E.
- Sửa URL Swagger cũ (`7234`) trong `05_API_FRONTEND_INTEGRATION.md` → `7168`.
- Liên kết từ `apiList.md`, `07_DEVELOPMENT_RULES.md`.

Changed files:

- `docs/swagger-api-testing-guide.md` (mới)
- `docs/05_API_FRONTEND_INTEGRATION.md`
- `docs/07_DEVELOPMENT_RULES.md`
- `docs/apiList.md`
- `docs/project-changelog.md`

Validation:

- Nội dung đối chiếu `launchSettings.json`, controllers và DTO hiện tại.

## Feature: Backend Phase 3–6 — Classroom, Assignment, Exam, Exam Attempt APIs

Date: 2026-06-11

Branch/source: `release` (local workspace)

Description:

- Hoàn thiện **Phase 3** Classroom: GET/PUT/DELETE lớp, xóa thành viên (8/8 API).
- Triển khai **Phase 4** Assignment: entity `Assignment`/`Submission`, 8 API (CRUD, submit, grade).
- Triển khai **Phase 5** Exam: entity `Exam`/`ExamSetting`/`Question`/`Answer`, 11 API + question bank cho teacher.
- Triển khai **Phase 6** Exam Attempt: start (shuffle + resume), save answer, submit (auto-grade), result, list attempts.
- Migration EF `20260611022446_AddAssignmentsExamsAndAttempts` đã apply lên `EduGuardExam`.
- Frontend vẫn dùng mock; tích hợp API thật là bước riêng.

Changed files:

- `backend/EduGuard.Domain/**` (entities, enums)
- `backend/EduGuard.Application/**` (DTOs, interfaces, validators)
- `backend/EduGuard.Infrastructure/**` (repositories, services, EF configs, migration)
- `backend/EduGuard.Api/Controllers/**` (classrooms, assignments, exams, exam-attempts)
- `Todo List.md`, `docs/apiList.md`, `docs/project-changelog.md`

Validation:

- `dotnet build` (backend) — 0 errors
- `dotnet ef database update` — migration applied successfully

Unresolved questions:

- Chưa chạy Swagger E2E đầy đủ classroom → assignment → exam → attempt trên môi trường dev.
- Anti-cheat (Phase 7) chưa ghi log suspicion khi làm bài.

## Feature: Design tokens v1.1 — Institutional Slate palette

Date: 2026-06-11

Branch/source: local workspace (`design.md` + preview + frontend tokens)

Description:

- Nâng cấp bộ màu EduGuard từ Apple Gray sang **Institutional Slate**: slate authority cho text, blue sâu hơn cho CTA, neutral/border tinh chỉnh cho cảm giác B2B education SaaS premium.
- Giữ nguyên quy tắc flat: một accent `tertiary` cho CTA, link riêng, không gradient/shadow trên card.
- Thêm token `tertiary-hover`, `surface-sunken`, `border-subtle`, và `*-muted` cho badge/alert surface.
- Đồng bộ `design.md`, preview HTML, `frontend/src/index.css`, `docs/design-guidelines.md`, và rule files.

Changed files:

- `design.md`
- `plans/visuals/eduguard-design-tokens-preview.html`
- `frontend/src/index.css`
- `docs/design-guidelines.md`
- `.cursor/rules/design-guidelines.mdc`
- `.agents/rules/design-guidelines.mdc`
- `docs/project-changelog.md`

Validation:

- Grep repo: không còn `#0071E3`, `#0066CC`, `#1D1D1F` trong `frontend/`
- Preview: mở `plans/visuals/eduguard-design-tokens-preview.html` trong browser

Unresolved questions:

- Dark mode pairing chưa định nghĩa trong v1.1 (chỉ light theme).

## Feature: Dark theme toggle and mock status mapping

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bật thật chức năng đổi theme từ dropdown thông tin cá nhân trên top bar: người dùng có thể chuyển qua lại giữa giao diện sáng và tối ngay trong khu vực đã đăng nhập.
- Thiết lập `ThemeProvider` và bộ biến màu toàn cục để header, sidebar, card, button, input và dropdown đồng loạt chuyển sang nền tối/chữ sáng thay vì chỉ đổi màu cục bộ ở một vài component.
- Tinh chỉnh nhận diện thương hiệu ở dark mode: logo trên top bar được đặt trong khung bo góc riêng để nổi bật hơn trên nền đen.
- Gắn thêm các khối comment `MOCK STATUS` / `INTEGRATION STATUS` ở các module dữ liệu chính để nhìn nhanh phần nào đã nối backend thật, phần nào vẫn đang chạy bằng `mockDatabase` và `localStorage`.

Changed files:

- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/src/hooks/useTheme.jsx`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/dashboard/StatCard.jsx`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/api/classroomApi.js`
- `frontend/src/api/dashboardApi.js`
- `frontend/src/api/examApi.js`
- `frontend/src/api/userApi.js`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Theme tối hiện đã áp vào khu vực app đã đăng nhập; nếu muốn đồng bộ cả login/register theo theme này thì có thể làm tiếp ở nhịp UI sau.

## Feature: Auth page redesign and top bar logo scaling

Date: 2026-06-11

Branch/source: `devH`

Description:

- Thiết kế lại giao diện xác thực EduGuard theo hướng tối giản, hiện đại: bố cục 2 cột với panel giới thiệu nền navy gradient ở bên trái và form trắng nhiều khoảng thở ở bên phải.
- Panel giới thiệu được tinh chỉnh tiếp theo góp ý UI: logo dùng bản nền trong suốt, phóng lớn hơn, thêm wordmark `EduGuard` ngay dưới logo và chuyển thông điệp thành 2 dòng chữ riêng `Học tập an toàn.` / `Thi trực tuyến minh bạch.` để không bị xuống hàng.
- Màn đăng nhập được bổ sung đúng các thành phần UI yêu cầu: nhãn `XÁC THỰC TÀI KHOẢN`, tiêu đề `Đăng nhập EduGuard`, checkbox `Ghi nhớ đăng nhập`, link `Quên mật khẩu?` và CTA chính màu xanh.
- Đồng bộ lại register page để dùng cùng ngôn ngữ thiết kế mới của khu xác thực thay vì giữ layout cũ lệch tông.
- Chỉnh logo trên top bar: dùng bản logo nền trong suốt, bỏ lớp nền trắng bao quanh và phóng logo lớn lên để cân bằng với chiều cao chữ `EduGuard Workspace`.

Changed files:

- `frontend/src/features/auth/components/AuthLayout.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/public/logo-transparent.png`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Link `Quên mật khẩu?` hiện mới là placeholder UI có toast vì backend chưa có luồng khôi phục mật khẩu tương ứng.

## Feature: Top bar cue cleanup for header actions

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bỏ nút 3 gạch đứng trước logo trong header workspace để phần thương hiệu bên trái gọn hơn đúng theo yêu cầu UI mới.
- Thêm lại dấu `v` ở cuối khối thông tin cá nhân để người dùng dễ nhận ra card này có thể bấm mở dropdown thao tác.

Changed files:

- `frontend/src/components/layout/TopBar.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Sau thay đổi này, header không còn điểm mở sidebar từ chính top bar nữa; nếu sau này cần hỗ trợ mobile rõ hơn có thể cân nhắc đặt trigger ở vị trí khác.

## Feature: Admin classroom list filters and simplified overview

Date: 2026-06-11

Branch/source: `devH`

Description:

- Tinh chỉnh màn `admin/classrooms` để bỏ 3 ô tổng hợp phía trên danh sách lớp học, giữ trọng tâm vào việc duyệt danh sách lớp thay vì overview ngắn.
- Thêm khối `Bộ lọc lớp học` cho Admin với tìm kiếm theo `tên lớp học` hoặc `tên giảng viên`.
- Bổ sung sắp xếp danh sách lớp theo `tên lớp học` và `số lượng thành viên`, đồng thời thêm trạng thái rỗng riêng khi bộ lọc không khớp lớp nào.
- Giữ nguyên flow hiện tại của Teacher và Student để không làm lệch trải nghiệm ở các vai trò còn lại.

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Màn Admin hiện vẫn đọc dữ liệu lớp học từ mock API; khi nối backend thật có thể đẩy phần sắp xếp/tìm kiếm này xuống query server nếu số lượng lớp tăng lớn.

## Feature: Profile avatar upload and local session hydration

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bổ sung khả năng tải ảnh đại diện từ máy ở trang hồ sơ thay cho việc chỉ nhập `Avatar URL`; người dùng có thể xem trước ảnh, dùng lại avatar mặc định và chỉ cập nhật thật sau khi bấm lưu.
- Thêm kiểm tra định dạng ảnh `PNG/JPG/WEBP` và giới hạn dung lượng `700 KB` để tránh phình `localStorage` trong mock app hiện tại.
- Vá luồng hydrate auth khi tải lại trang: sau khi xác thực token bằng backend `me`, app sẽ trộn lại profile mock cục bộ để avatar và thông tin cá nhân vừa cập nhật không bị mất khỏi session frontend.

Changed files:

- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/hooks/useAuth.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Ảnh đại diện hiện được lưu cục bộ dưới dạng data URL trong trình duyệt; khi nối backend thật nên chuyển sang upload file lên server hoặc object storage.

## Feature: Admin dashboard navigation cleanup and role stats

Date: 2026-06-11

Branch/source: `devH`

Description:

- Tinh gọn lại phần điều hướng của màn `admin/dashboard`: bỏ icon-only ở cạnh phải thẻ thông tin cá nhân trên header để khối user gọn hơn nhưng vẫn giữ dropdown thao tác.
- Đồng bộ menu Admin ở sidebar theo nhãn mới: `Dashboard`, `Quản lí lớp học`, `Quản lí bài kiểm tra`, `Quản lí người dùng`, `Hồ sơ cá nhân`.
- Dọn sidebar để chỉ còn tiêu đề và danh sách route, bỏ hai khối mô tả `EduGuard điều hướng nhanh...` và `Sidebar hiện chỉ giữ...` theo yêu cầu UI.
- Bổ sung thống kê tách riêng `Giảng viên` và `Sinh viên` trên dashboard Admin thay vì chỉ để trong helper text của thẻ `Người dùng`.

Changed files:

- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Dashboard Admin hiện vẫn đọc mock API, nên số liệu giảng viên và sinh viên đang phản ánh dữ liệu mock/session hiện có của frontend.

## Feature: Workspace header layout and simplified role sidebar

Date: 2026-06-11

Branch/source: `devH`

Description:

- Thay khung layout chung của toàn bộ vai trò để bám giao diện EduGuard hiện tại: bỏ `BrandNavbar` cũ ở phía trên, đưa khối workspace lên làm header chính, giữ nền sáng, card trắng, bo góc lớn và tông xanh navy/xanh nhạt.
- Header được tinh chỉnh tiếp theo phản hồi UI: bên trái thay khối `EG` bằng ảnh thật `public/logo.png`, bỏ chữ `Mở menu` và `Khu làm việc`, ở giữa bỏ hẳn khối cờ Việt Nam để tổng thể gọn hơn.
- Khối thông tin người dùng bên phải giữ badge vai trò và dropdown cá nhân; nút `Đăng xuất` được chuyển vào trong dropdown thay vì đứng riêng bên ngoài. Các mục `Thông tin`, `Đổi mật khẩu`, `Chế độ tối`, `EduGuard Premium` vẫn giữ nguyên; chỉ `Thông tin` điều hướng sang hồ sơ, các mục còn lại hiện là placeholder UI để không đụng logic trang.
- Tối giản lại sidebar để chỉ giữ điều hướng, bỏ phần lặp thông tin người dùng; đồng thời chỉnh active state và spacing để nhìn sạch hơn trên desktop lẫn mobile.

Changed files:

- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- `Đổi mật khẩu`, `Chế độ tối`, `EduGuard Premium` hiện mới là mục dropdown ở mức giao diện; nếu muốn dùng thật sẽ cần nối thêm logic riêng sau.

## Feature: Frontend role sync for protected routes and mock dashboards

Date: 2026-06-11

Branch/source: `devH`

Description:

- Vá frontend auth mapping để không còn lấy bừa `roles[0]` từ backend. App giờ chọn role chính theo ưu tiên `Admin -> Teacher -> Student`, nên redirect và route guard không bị lệch khi user có nhiều quyền.
- Sửa bridge giữa backend session và mock database: nếu user đã tồn tại trong mock DB theo `id` hoặc `email`, frontend sẽ cập nhật lại `role`, `email`, `fullName`, trạng thái và timestamp từ session backend thay vì giữ role mock cũ.
- Nhờ đó các màn dashboard mock cho `Admin` và `Teacher` sẽ đọc đúng vai trò mới sau khi đổi quyền trong database và tải lại phiên đăng nhập.

Changed files:

- `frontend/src/api/authApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/hooks/useAuth.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Nếu user đang giữ access token/session cũ từ trước khi đổi role trong DB, vẫn nên tải lại trang hoặc đăng xuất rồi đăng nhập lại để frontend hydrate lại thông tin quyền mới.

## Feature: Frontend auth integration with backend API

Date: 2026-06-11

Branch/source: `devH`

Description:

- Chuyển `LoginPage` và `RegisterPage` sang gọi backend auth thật theo đúng docs và controller hiện tại: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Giữ nguyên trải nghiệm hiện có của frontend bằng cách map `UserDto.Roles` từ backend về shape `user.role` mà app đang dùng, nên route guard, sidebar và redirect theo role không phải sửa lan rộng.
- Vì dashboard/classroom/exam vẫn đang đọc mock API, thêm một lớp bridge trong `mockDatabase` để user đăng nhập từ backend thật vẫn được đồng bộ vào mock DB khi cần, tránh vỡ flow sau lúc login.
- Gỡ luồng Google/demo auth khỏi UI đăng nhập và đăng ký để bám sát yêu cầu hệ thống trong `docs/` và tránh tạo session mock không khớp backend.

Changed files:

- `frontend/src/api/authApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- `users`, `classrooms`, `dashboard`, `exams` trên frontend vẫn còn dùng mock API; bước tiếp theo nên nối dần các module này với backend thật để bỏ bridge tạm.

## Feature: Release integration — backend phases 1-3 with frontend mock MVP

Date: 2026-06-11

Branch/source: `release` (merge `devD` backend line with `devH` frontend line)

Description:

- Gộp nhánh `devH` vào `release` để nhánh tích hợp chứa đồng thời backend Phase 1-3 và frontend mock cho auth, classroom, exam, dashboard.
- Đồng bộ `Todo List.md` để trạng thái dự án phản ánh đúng: backend auth/classroom đã xong, frontend mock đã có nhưng chưa nối API thật.
- Giữ `release` là nhánh tích hợp nội bộ, chưa tạo thêm production release hay PR mới vào `main` trong thay đổi này.

Changed files:

- `Todo List.md`
- `docs/project-changelog.md`
- `frontend/**`

Validation:

- `npm test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Frontend hiện vẫn dùng mock/localStorage cho auth, classroom, dashboard và exam; cần bước tích hợp với backend thật ở nhịp tiếp theo.

## Release: v1.1.0 (stable) — promote from v1.1.0-rc.1

Date: 2026-06-10

Branch/source: `main` @ `e09ae0c` (merged PR #3)

Description:

- RC `v1.1.0-rc.1` validated (auth + classroom Swagger E2E).
- Tagged stable `v1.1.0` on `main`; GitHub Release published (non-prerelease).
- `CHANGELOG.md` updated: section `[1.1.0]` replaces `[1.1.0-rc.1]`.

Validation:

- RC manual Swagger E2E confirmed by user before promote.

## Feature: Mock Google auth, avatar defaults, brand navbar, and dashboard polish

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bổ sung mock social auth bằng Google trên frontend: `LoginPage` và `RegisterPage` đều có nút Google, dùng profile Google demo để mô phỏng OAuth trước khi có backend thật.
- Luồng đăng ký thường giờ gắn sẵn avatar capybara mặc định; luồng Google mock sẽ dùng ảnh từ profile Google demo. Đồng thời thêm component `Avatar` dùng chung cho top bar, sidebar và hồ sơ cá nhân.
- Dựng thêm `BrandNavbar` ngang trên cùng để chừa không gian cho logo/thương hiệu; từ đó hạ sidebar xuống dưới, kéo vùng nội dung chính thoáng hơn và thêm quick links theo role.
- Đổi thứ tự menu của `Teacher` và `Student` để `Dashboard` nằm gần cuối danh sách chức năng như yêu cầu; đồng thời giữ `Hồ sơ` ở cuối.
- Tinh gọn dashboard giảng viên và sinh viên: bỏ thẻ “điểm trung bình” khỏi phần tổng quan, sửa helper text để dashboard chỉ tập trung vào tiến độ, cảnh báo và việc sắp tới.
- Chuyển trang lớp học của giảng viên sang flow thực tế hơn: chỉ hiện button `Tạo lớp học`, bấm vào mới mở form.
- Nâng cấp UI toast: nền dịu hơn, chữ trắng, hiệu ứng nổi rõ hơn; đồng thời thêm thông báo khi đăng nhập thành công và khi đăng xuất.

Changed files:

- `frontend/public/capybara-avatar.svg`
- `frontend/public/google-student-avatar.svg`
- `frontend/src/utils/avatar.js`
- `frontend/src/components/common/Avatar.jsx`
- `frontend/src/components/common/ToastViewport.jsx`
- `frontend/src/components/layout/BrandNavbar.jsx`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/auth/components/GoogleAuthButton.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/api/authApi.js`
- `frontend/src/api/dashboardApi.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/index.css`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Google auth hiện là mock frontend để test UX; khi backend sẵn sàng sẽ cần thay bằng OAuth thật hoặc Google Identity Services.

## Feature: Exam question bank and answer management on mock frontend

Date: 2026-06-10

Branch/source: `devH`

Description:

- Mở rộng `examApi` để quản lý dữ liệu `Question` và `Answer` theo kiểu database thật: lấy danh sách câu hỏi theo đề, thêm câu hỏi, cập nhật câu hỏi, xóa câu hỏi và đồng bộ lại `orderIndex`.
- Thêm validate cho từng loại câu hỏi `SingleChoice / MultipleChoice / TrueFalse / ShortAnswer`, bao gồm số lượng đáp án tối thiểu, số đáp án đúng hợp lệ và bộ đáp án cố định cho câu đúng/sai.
- Dựng `QuestionForm` và `QuestionCard` trong trang chi tiết đề thi để giảng viên thêm/sửa/xóa câu hỏi cùng đáp án ngay tại chỗ; phần chỉnh sửa dùng chung một form động để giảm lặp UI.
- Bổ sung question summary trong `ExamDetailPage`: tổng câu hỏi, tổng điểm, số câu một đáp án, nhiều đáp án và tự luận; sau mỗi thao tác CRUD sẽ reload lại dữ liệu để summary luôn khớp mock DB.
- Giữ quyền truy cập an toàn hơn ở mức frontend mock: `Admin` xem được question bank, `Teacher` chỉ quản lý đề của mình, `Student` không xem được nội dung câu hỏi/đáp án ở trang detail để tránh lộ đáp án.

Changed files:

- `frontend/src/api/examApi.js`
- `frontend/src/features/exams/examHelpers.js`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/QuestionCard.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Chưa có màn hình làm bài và chấm điểm thật, nên phần `ShortAnswer` hiện mới lưu các đáp án mẫu chấp nhận để chuẩn bị cho bước exam attempt sau.

## Feature: Global toast notifications for frontend feedback

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bổ sung hệ thống toast dùng chung cho toàn frontend để các thông báo thành công/thất bại hiện ở góc trên bên phải màn hình và tự ẩn sau 3 giây.
- Thay các banner thông báo tạm thời trong login, register, classroom, exam, profile, user management và dashboard bằng popup toast để giao diện gọn hơn, thống nhất hơn.
- Giữ `EmptyState` cho các trường hợp tải dữ liệu thất bại nghiêm trọng để người dùng vẫn có ngữ cảnh màn hình, còn các phản hồi thao tác nhanh sẽ đi qua toast.
- Rà lại dependency của các `useEffect` liên quan đến `showToast` và dọn timer cleanup trong provider để tránh warning lint.

Changed files:

- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/src/components/common/ToastViewport.jsx`
- `frontend/src/hooks/useToast.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Khi nối backend thật hoặc thêm realtime sau này, có thể cần mở rộng toast thành nhiều mức ưu tiên hơn như queue, action button hoặc cảnh báo không tự ẩn.

## Feature: Exam CRUD on role-based mock API

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bổ sung `examApi` cho CRUD bài kiểm tra theo mock database: danh sách, chi tiết, tạo, cập nhật, xóa; quyền được tách rõ cho `Admin / Teacher / Student`.
- Mở rộng route và navigation với khu vực `Bài kiểm tra` cho cả 3 role; sau đó dựng `ExamListPage`, `ExamDetailPage`, `ExamForm`, `ExamCard`.
- Teacher hiện có thể tạo/sửa/xóa/publish-unpublish đề thi ở mức metadata + settings: lớp học, thời lượng, lịch mở-đóng, anti-cheat, fullscreen, random câu hỏi/đáp án, max attempts, show result.
- Student chỉ nhìn thấy đề đã publish trong các lớp đã tham gia; Admin có thể xem toàn bộ đề thi trong hệ thống mock.
- Mở rộng mock database với `examSettings`, `questions`, `answers` để bám sát tài liệu entity và chuẩn bị cho bước question editor sau.
- Vá logic xóa lớp học để cascade luôn `assignments`, `submissions`, `exams`, `examSettings`, `questions`, `answers`, `examAttempts`, `cheatingLogs`, tránh dashboard đếm sai dữ liệu mồ côi.

Changed files:

- `frontend/src/api/classroomApi.js`
- `frontend/src/api/examApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/components/forms/CheckboxField.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/exams/examHelpers.js`
- `frontend/src/features/exams/components/ExamCard.jsx`
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Chưa triển khai editor câu hỏi/đáp án trên UI, mới dừng ở CRUD đề thi và settings.
- Chưa có backend thật; toàn bộ exam CRUD hiện chạy trên localStorage theo mock API.

## Feature: Role-based dashboards on mock API

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bổ sung `dashboardApi` chạy trên mock database để mô phỏng 3 endpoint `GET /api/dashboard/admin`, `GET /api/dashboard/teacher`, `GET /api/dashboard/student`.
- Mở rộng mock database với các bảng dữ liệu phục vụ thống kê: `assignments`, `submissions`, `exams`, `examAttempts`, `cheatingLogs`, `notifications`; dùng cơ chế bổ sung schema mềm để không phải reset dữ liệu classroom cũ trong localStorage.
- Thêm dashboard riêng cho `Admin`, `Teacher`, `Student`; mỗi role có nội dung khác nhau: admin xem user/classroom/activity, teacher xem hiệu suất lớp/rủi ro anti-cheat/lịch thi, student xem tiến độ cá nhân/việc sắp tới/kết quả.
- Thêm các component dashboard dùng chung như `StatCard`, `MetricBarList`, `TimelineList` để giữ UI thống nhất và bám theo design guideline phần dashboard.
- Đổi luồng đăng nhập mặc định sang dashboard theo role thay vì vào thẳng trang classroom.

Changed files:

- `frontend/src/api/dashboardApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/components/dashboard/StatCard.jsx`
- `frontend/src/components/dashboard/MetricBarList.jsx`
- `frontend/src/components/dashboard/TimelineList.jsx`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Dashboard hiện dùng mock data trong localStorage, chưa lấy từ backend thật.
- Chưa có chart library, nên biểu đồ đang ở mức progress bar và timeline cơ bản.

## Feature: Role-based mock API, classroom CRUD, and profile management

Date: 2026-06-10

Branch/source: `devH`

Description:

- Chuyển frontend từ mức UI skeleton sang mock logic gần giống backend thật: dữ liệu lưu trong localStorage theo các bảng `users`, `classrooms`, `classroomMembers`, `refreshTokens`, `activityLogs`.
- Đổi `authApi`, `classroomApi`, thêm `userApi` để response có dạng `success/message/data`, gần với tài liệu API integration và dễ thay bằng backend ASP.NET Core sau này.
- Tách route theo role `Admin / Teacher / Student`; mỗi role có luồng classroom riêng, teacher có CRUD lớp học, student join lớp bằng mã, admin xem người dùng và lớp học tổng quan.
- Bổ sung trang hồ sơ cá nhân cho mọi role; người dùng có thể xem và sửa `fullName`, `email`, `avatarUrl`, đồng thời đồng bộ lại session đang đăng nhập.
- Rà lại logic truy cập classroom: teacher chỉ quản lý lớp mình tạo, student chỉ xem lớp đã tham gia, admin xem toàn hệ thống.

Changed files:

- `frontend/src/api/authApi.js`
- `frontend/src/api/classroomApi.js`
- `frontend/src/api/mockDatabase.js`
- `frontend/src/api/userApi.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/main.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/ProtectedRoute.jsx`
- `frontend/src/components/layout/PublicRoute.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/components/ClassroomCard.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/components/JoinClassroomForm.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `frontend/src/features/classrooms/mockClassrooms.js` *(removed)*
- `frontend/src/features/classrooms/useDemoClassrooms.jsx` *(removed)*
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Chưa có backend thật, nên toàn bộ auth/classroom/profile hiện vẫn là mock API chạy trên localStorage.
- Chưa triển khai dashboard, assignment, exam CRUD và các luồng thi/anti-cheat.

## Feature: Frontend demo polish and classroom state persistence

Date: 2026-06-10

Branch/source: `devH`

Description:

- Rà lại logic demo frontend và sửa lỗi classroom state: lớp mới tạo giờ dùng chung qua provider + local storage, không còn mất khi đổi route hoặc mở trang chi tiết.
- Sửa hành vi mobile sidebar để bấm menu item là đóng sidebar luôn, tránh cảm giác route đã đổi mà panel vẫn che màn hình.
- Tinh gọn lại giao diện auth, top bar, sidebar và classroom theo hướng ít chữ hơn, rõ hành động hơn, bám sát design guideline Apple-inspired và quy tắc Vietnamese-first.
- Giữ nguyên chế độ test/mock khi chưa có backend: auth vẫn đăng nhập demo, classroom vẫn chạy bằng dữ liệu mô phỏng.

Changed files:

- `frontend/src/main.jsx`
- `frontend/src/index.css`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/auth/components/AuthLayout.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/mockClassrooms.js`
- `frontend/src/features/classrooms/useDemoClassrooms.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/components/JoinClassroomForm.jsx`
- `frontend/src/features/classrooms/components/ClassroomCard.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `Todo List.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Chưa có backend thật, nên auth/classroom vẫn chỉ kiểm thử bằng dữ liệu demo và local storage.

## Feature: Frontend foundation, auth routing skeleton, and classroom skeleton

Date: 2026-06-10

Branch/source: `devH`

Description:

- Dựng lại nền giao diện frontend theo token trong `design.md`: bỏ template Vite demo, thay bằng palette phẳng, surface/card, button/input/badge dùng chung và layout Apple-inspired.
- Thêm `react-router-dom`, dựng `AppRoutes`, `PublicRoute`, `ProtectedRoute`, `AppShell`, `Sidebar`, `TopBar` để khóa sớm luồng route theo role.
- Tạo auth skeleton chạy bằng local storage mô phỏng: login, register, session tạm, logout, role-based redirect; mục tiêu là test UI và flow trước khi backend auth sẵn sàng.
- Tạo classroom skeleton với mock data: danh sách lớp, form tạo lớp cho Teacher, form nhập mã cho Student, classroom detail + thành viên.
- Bổ sung comment tiếng Việt trong từng component/hàm để dễ đọc lại khi học hoặc tiếp tục phát triển.

Changed files:

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/index.css`
- `frontend/src/api/axiosClient.js`
- `frontend/src/api/authApi.js`
- `frontend/src/api/classroomApi.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/components/common/*`
- `frontend/src/components/forms/*`
- `frontend/src/components/layout/*`
- `frontend/src/features/auth/components/AuthLayout.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/mockClassrooms.js`
- `frontend/src/features/classrooms/components/*`
- `frontend/src/features/classrooms/pages/*`
- `Todo List.md`

Validation:

- `npm run lint`
- `npm run build`

Unresolved questions:

- Auth và classroom hiện mới là skeleton UI dùng local storage + mock data; cần nối `authApi` và `classroomApi` khi backend phase 2 và 3 sẵn sàng.

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
- `Todo List.md`
- `docs/features.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`

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
- `Todo List.md`
- `README.md`
- `docs/features.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`

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
- `Todo List.md`
- `README.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/features.md`

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
