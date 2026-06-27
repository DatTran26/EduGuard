# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Backend

- **Bug fix (GPT settings):** Admin GPT API key/model/base URL now persist in `GptSettings` database table (same pattern as email settings) instead of writing only to `.env`, which failed on deployed servers.

### Frontend

- **Proctoring room filters:** Added **Đang làm** filter; when selected, shows **Lọc theo AI detect** sub-filters (all AI violations, phone, document, multiple faces, person not visible).
- **Proctoring student tile AI UX:** Each student tile always shows an **AI status** line (Bình thường / vi phạm / AI tắt); header overlay adds **AI Bật/Tắt** toggle per student for the teacher session.
- **Proctoring room bulk AI toggle:** Header adds **Bật tắt AI** button to enable or disable AI monitoring for all students in the live room at once (session-local, same as per-student toggle).
- **Bug fix (proctoring violation history):** Violation log panel in the proctor drawer no longer flashes "Đang tải log…" every AI detection cycle; background refresh is silent, debounced, and scoped to the selected student only.
- **GPT admin settings:** Helper text updated to reflect DB storage; form refreshes masked key after save.

## [1.3.0] - 2026-06-27

### AI Services

- **Proctoring AI logging:** FastAPI service logs startup config, request timing, detection results (type, confidence, labels, inference ms), and errors for bad images or failed inference. Configurable via `PROCTORING_LOG_LEVEL`.

### Backend

- **Admin email settings:** Gmail/SMTP and OTP verification settings stored in DB; admin APIs `GET/PUT /api/admin/email-settings` and `POST /api/admin/email-settings/test`. Runtime auth email flow reads from DB instead of appsettings only.

### Frontend

- **Admin email settings page:** New `/admin/email-settings` screen for Admin role to configure Gmail account, sender info, OTP rules, and send test email.

### Backend

### Frontend

- **Register email verification:** Step 4 OTP flow wired to backend verify/resend APIs; account is created at step 3, verification completes registration and signs in.

### Frontend

- **Proctoring room UX:** Stopped auto-opening student detail when someone joins the live room; added **Lịch sử vi phạm** on each student tile (opens drawer with AI / Hành vi sub-tabs); **Cảnh báo AI & vi phạm** feed is collapsed by default.

### Frontend

- **Bug fix (student exam camera):** Surveillance camera preview sits beside the countdown in the exam header; fixed blank local preview after late join or page refresh (F5) when the teacher still received the stream — single preview element, `mediaStream` state binding, and cancel-safe `getUserMedia`.
- **Device check redesign:** New two-column readiness checklist with camera preview; fullscreen is requested automatically (no manual button); fullscreen also triggers on **Bắt đầu làm bài** via user gesture.

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
### Backend

- Cập nhật API `createExamFromMatrix` hỗ trợ nhận tham số `isPublished` để xác định trạng thái xuất bản của đề thi tạo từ ma trận (nháp hay chính thức).
- Điều chỉnh `ExamMatrixService` gán giá trị `IsPublished` của `Exam` được sinh từ ma trận theo tham số `request.IsPublished` từ client thay vì cố định gán bằng `true`.
- Cải tiến thuật toán khớp môn học trong ma trận (`SubjectMatches`) trở nên không phân biệt hoa thường và hỗ trợ chuẩn hóa xóa dấu/so sánh cụm từ (ví dụ: "Toán học" khớp với "toán").
- Nâng cấp bộ lọc chương học (`ChapterOptionalTextMatches`) hỗ trợ bóc tách số tự động từ cả chuỗi ký tự (ví dụ: "chương 1, 4, 2" sẽ khớp với các câu hỏi thuộc chương 1, 4 hoặc 2).
- Ràng buộc trường chương học (Chapter) chỉ hiển thị số thứ tự chương (dạng chữ số đơn thuần, ví dụ: 1, 2, 3) tương ứng với bài học được suy luận từ nội dung câu hỏi (ví dụ: bài CSS cơ bản thuộc chương 1). Tích hợp helper chuẩn hóa `ExtractChapterNumber` tự động lọc lấy số từ các phản hồi của AI hoặc từ dữ liệu nhập vào của giảng viên.
- Cải tiến cơ chế tự động điền các thông tin môn học, chương học, bài học còn thiếu bằng AI cho cả luồng lưu câu hỏi đơn lẻ, cập nhật câu hỏi, và lưu câu hỏi hàng loạt (CreateQuestionsBulk) để bảo đảm dữ liệu luôn được điền đầy đủ và chính xác khi lưu vào cơ sở dữ liệu.
- Tích hợp cơ chế tự động điền các thông tin môn học (Subject), chương học (Chapter), bài học (Lesson) còn thiếu bằng AI (OpenAI) khi sinh câu hỏi hoặc import tệp Excel/CSV/PDF/Docx/Txt của giảng viên.
- Bổ sung validate chặn sinh câu hỏi cho nhiều môn học hoặc khác môn học của ngân hàng trong cùng một yêu cầu API sinh bằng AI (trả về 400 Bad Request kèm thông báo lỗi tiếng Việt cụ thể).
- Added a direct AI question generation endpoint `POST api/question-banks/{bankId}/questions/generate-ai` that calls OpenAI using structured JSON outputs (`gpt-5.5` with reasoning_effort medium).
- Added `OpenAiQuestionGeneratorService` to call the OpenAI completion API and deserialize generated questions directly matching the database schema.
- Extended `IQuestionBankService` with `GenerateQuestionsAiAsync` to automatically parse and save AI-generated questions into the database.
- Added difficulty parsing to the question import parser from Excel/CSV columns ("difficulty", "do kho", "muc do") and structured text metadata ("difficulty", "Mức độ", "Do khó").
- Mapped question-specific difficulty into bank question import requests, falling back to defaults if not specified.

### Frontend

- Tách nút "Xác nhận đề nháp và đặt lịch" thành 2 nút: "Lưu đề nháp" và "Tạo đề" trên trang ma trận đề thi ngân hàng câu hỏi.
- Điều chỉnh hộp thoại `GenerateExamConfirmDialog` (thành hộp thoại Lưu đề nháp) phù hợp cho luồng lưu bản nháp: gỡ bỏ bắt buộc nhập giờ mở đề/đóng đề và cập nhật thông báo/nút hành động phù hợp.
- Nút "Lưu đề nháp" thực hiện tạo đề thi trên backend với trạng thái nháp (`isPublished: false`).
- Nút "Tạo đề" thực hiện chuyển hướng sang trang tạo đề thi đầy đủ (`ExamListPage`), chuyển tiếp toàn bộ thông tin đề nháp (lớp, tiêu đề, thời gian làm bài, giám sát, cài đặt trộn đề/đáp án, tối đa số lần làm bài và danh sách câu hỏi) để tự động điền (autofill) các trường thông tin tương ứng.
- Bổ sung hộp thoại xác nhận thay thế câu hỏi (`SubstitutionConfirmDialog`) khi sinh đề thi từ ma trận mà ngân hàng thiếu câu hỏi có độ khó tương ứng. Đưa ra lựa chọn đồng ý tự động bù câu hỏi có độ khó khác hoặc không đồng ý để hủy và hiển thị thông báo các dòng ma trận thiếu câu.
- Cải tiến giao diện bảng chi tiết ma trận và trạng thái ngân hàng câu hỏi: Thêm highlight tiêu đề xanh, hiệu ứng hover dòng, và tô màu nền phân biệt dòng đủ câu (xanh lá nhạt) và thiếu câu (đỏ nhạt) trực quan.

- Bổ dung tự động lọc câu hỏi trong ngân hàng khi chọn các bộ lọc dropdown (độ khó, loại câu, trạng thái).
- Thiết kế thanh điều hướng thêm câu hỏi dạng các tab thư mục (folder tabs) gồm: "Thêm câu hỏi", "Tạo câu hỏi với AI", và "Nhập câu hỏi từ tệp". Khung viền của tab đang chọn kết nối liền mạch với viền của card nội dung phía dưới, mang lại giao diện trực quan và chuyên nghiệp.
- Di chuyển bộ lọc câu hỏi vào đầu component danh sách câu hỏi ngân hàng câu hỏi.
- Thiết lập số lượng câu hỏi mặc định của ma trận đề thi là 10 câu và cấu hình phân bổ đều (3 dễ, 3 trung bình, 4 khó) khi khởi tạo hoặc khi thay đổi tổng số câu.
- Cải tiến giao diện bằng cách highlight nổi bật hai tab điều hướng "Câu hỏi trong ngân hàng" và "Ma trận đề thi" theo kiểu tab tròn đồng bộ.

- Bổ sung tự động lọc câu hỏi trong ngân hàng khi chọn các bộ lọc dropdown (độ khó, loại câu, trạng thái).
- Thiết kế thanh điều hướng thêm câu hỏi dạng các tab thư mục (folder tabs) gồm: "Thêm câu hỏi", "Tạo câu hỏi với AI", và "Nhập câu hỏi từ tệp". Khung viền của tab đang chọn kết nối liền mạch với viền của card nội dung phía dưới, mang lại giao diện trực quan và chuyên nghiệp.
- Di chuyển bộ lọc câu hỏi vào đầu component danh sách câu hỏi ngân hàng câu hỏi.
- Thiết lập số lượng câu hỏi mặc định của ma trận đề thi là 10 câu và cấu hình phân bổ đều (3 dễ, 3 trung bình, 4 khó) khi khởi tạo hoặc khi thay đổi tổng số câu.
- Cải tiến giao diện bằng cách highlight nổi bật hai tab điều hướng "Câu hỏi trong ngân hàng" và "Ma trận đề thi" theo kiểu tab tròn đồng bộ.

- Replaced the static manual instructions box in `QuestionImportResources.jsx` with a tabbed UI, introducing an interactive "Tạo câu hỏi bằng AI" panel alongside the manual Excel import instructions.
- Added prompt text inputs, optional local-storage saved OpenAI API Key inputs, and advanced configuration defaults (difficulty, status, subject, chapter) directly into the AI Question Generator.
- Integrated AI generation directly in `QuestionBankPage.jsx` and `TeacherQuestionWorkspace.jsx` to refresh lists upon successful question generation.
- Moved exam matrix filters (Chapter, Lesson, LearningOutcome, QuestionType) to top-level fields in the matrix editor form, and removed row-level grids and "Thêm dòng" button entirely.
- Redesigned the exam matrix difficulty configuration with a global multi-range interactive slider mapping to Easy, Medium, and Hard counts.
- Replaced the custom file upload form in the question bank page with the reusable `QuestionImportPanel` and `QuestionImportResources` components.
- Added a collapsible panel with a toggle button to hide the AI Excel template guide in the manual exam creation workspace by default.
- Added a "Bài" (lesson) input text field to the import defaults card, and removed the "Độ khó" dropdown.
- Streamlined the saved matrix workflow by adding a copy configuration dropdown directly in the matrix editor form, removing arbitrary selection dropdowns, and binding validation/preview generation directly to the active bank and active matrix.
- Removed statistics dashboards cards and info blocks from both the list and detail views of the question bank page.

- Recolored the shared authenticated sidebar across Admin, Teacher, and Student roles back to a dark blue gradient that matches the login hero panel, restoring the darker shell chrome while keeping the updated boxed icons and refined active state.
- Redesigned the Admin Monitoring dashboard page (`AdminMonitoringPage.jsx`) by removing the "Điểm nghi ngờ" KPI card and highlighting the remaining 3 cards ("Tổng log" in Indigo, "Lượt cảnh báo" in Amber, and "Nguy cơ cao" in Rose) with vibrant left-border accents, themed backgrounds, and a highly compact height layout (reducing padding and text margins to minimize empty space). Also, updated the horizontal tab bar with fully rounded (`rounded-full`) capsule buttons, removed record count badges from tab titles, separated the tabs using vertical line separators (`|`), and wrapped list items inside each tab with a max height of 10 items (`max-h-[500px]`) and vertical scrollbars.
- Configured the second KPI card (Tổng sinh viên) on the teacher dashboard (`TeacherDashboardPage.jsx`) to open a modal dialog displaying a complete list of all unique students participating in all classrooms managed by the teacher. When clicked, the dashboard loads all classrooms and members concurrently, aggregates them to avoid duplicates, and displays their names, emails, and list of enrolled classrooms, complete with a client-side search filter.
- Fixed the Student exam attempt flow so required fullscreen mode is automatically exited after the attempt ends, including successful submission, hidden-result redirect after submission, and proctor-forced pause or termination, preventing students from being left stuck in fullscreen after the session.
- Updated the Teacher exam and assignment creation forms on the tasks workspace (`TeacherLearningTasksPage.jsx`) to render within a centered modal overlay dialog. Opening the form dims and blurs the background layout (`backdrop-blur-[2px]` and `bg-slate-900/60`) to focus on creation, and the modal automatically closes upon successful creation or when clicking the close button/overlay backdrop.
- Adjusted the Teacher assignment table `Đã nộp` progress pill in `/teacher/tasks?type=assignment` so it turns green only when the submission count reaches the full class size; incomplete progress now shows a yellow warning state instead of the previous success styling.
- Refined the 6 KPI card components on the teacher dashboard (`TeacherDashboardPage.jsx`) for light mode harmony, using clean white backgrounds, matching color-toned borders, left-aligned layout structure, larger icons, and micro-rotations on hover. Also configured custom Tailwind CSS v4 selector-based dark mode (`[data-theme="dark"]` variant in `index.css`) to align Tailwind `dark:` utilities with the React application state instead of system preferences.
- Redesigned and colorized the 6 KPI card components on the teacher dashboard (`TeacherDashboardPage.jsx`) to use a more vibrant and premium theme. Each card now features a Flat Premium Card design with a soft solid pastel background (Indigo for classes, Violet for students, Emerald for exams, Sky for assignments, Amber for submission rates, and Rose for warnings) paired with a thick colored left border accent line (border-l-4) and responsive hover translation with soft shadow glows, complying with design guidelines while providing a vibrant visual look. Deprecated standard icons have been replaced with modern Lucide icons (`School`, `Users`, `ClipboardCheck`, `NotebookPen`, `TrendingUp`, `ShieldAlert`), and custom micro-animations (`eg-pulse-subtle` and `eg-bounce-subtle`) have been added to the warning card and its icon to highlight abnormal alerts.
- Fixed exam detail breadcrumbs for Teacher and Student so the shell header now resolves and displays the actual exam title instead of the numeric `examId` on `/teacher/exams/:examId` and `/student/exams/:examId`.
- Refined Teacher exam cards in `/teacher/tasks?type=exam` so the classroom name is aligned to the left edge of the card content while the exam title and quick stats remain visually emphasized and centered more clearly, the exam title is constrained to a single line for better alignment, the `Tạo: ...` line is removed, the card is slightly more compact, the `câu hỏi` and `lượt làm` labels are removed, the schedule now uses a wider compact 2-line open/close timeline without the extra calendar icon while keeping the visible vertical interval marker, the `Kết quả` action button is slightly more prominent, and the main content slots are height-normalized so cards line up more consistently.
- Updated the Teacher **Bài tập** view inside the unified learning-tasks workspace (`/teacher/tasks?type=assignment`) to show a management table with columns `Tên bài tập`, `Tên lớp`, `Hạn nộp`, `Chưa chấm`, and `Đã nộp`, plus inline icon actions to open grading, edit, and delete assignments. Clicking an assignment title or the eye icon now hides the table and opens a dedicated grading workspace with a back button to return to the list, while the edit icon opens a separate edit page without the grading workspace.
- Updated the Teacher assignment table `Đã nộp` column in `/teacher/tasks?type=assignment` to show submission progress as `đã nộp / tổng sinh viên` (for example `15/30`), with the denominator excluding the teacher account.
- Added per-student review status badges (`Đã chấm` / `Chưa chấm`) in the Teacher assignment grading workspace so teachers can see grading progress directly in the submission list.
- Changed the default Teacher assignment list ordering to newest-created first, and automatically migrated the previous legacy assignment sort query (`sort=deadline-asc`) to the new default so newly created assignments are easier to find.
- Fixed a white screen crash on the classroom detail page (`ClassroomDetailPage.jsx`) by importing the missing `TEACHER_CLASSROOM_TABS` array.

- Redesigned the Teacher **Bài thi / Đề thi** tab layout in the learning tasks workspace (`/teacher/tasks` when `type=exam`) to use a compact, responsive 4-column grid layout instead of the split 2-column view, completely removing the redundant "Khu điều hành bài kiểm tra" detail panel for exams. Exam cards have been compressed vertically and rebalanced with centered title/stat hierarchy plus a compact 2-line schedule timeline to maximize space without losing readability. Further UX passes unify the top section (page hero header and stats bar) to be compact for both **Bài tập** (Assignment) and **Bài thi / Đề thi** (Exam) views. The four stats cards are styled larger, using bolder, high-contrast background and border colors, with a distinct visual active state to make them easily distinguishable. Action controls are fully integrated on the card with a primary action button and a dropdown options menu (`...`) for editing, publishing, deleting, closing early, and monitoring. Editing an exam's information now opens in a beautiful, focused pop-up overlay modal instead of inline.
- Unified Teacher **Bài tập** and **Đề thi** management into a shared **Hoạt động học tập** workspace at `/teacher/tasks`, with `type=assignment|exam`, shared stats/list/detail UI, stat-card quick filters (click `Đang mở` / `Sắp đến hạn` / `Cần chấm` / `Đã publish` to filter immediately), compatibility redirects from `/teacher/assignments` and `/teacher/exams`, and updated sidebar/quick-create/search/dashboard/classroom/question-bank entry points. Assignment grading remains inline in the unified page; advanced exam question editing still lives on `/teacher/exams/:examId`. Follow-up UX passes also compact the page header, split the list vs workspace areas more clearly, auto-scroll `Mở chấm bài` into the grading workspace, remove redundant `Mở chi tiết` buttons, trim the workspace chrome so only the title remains while the extra `Danh sách hoạt động` intro block is removed, and collapse the assignment detail panel so it jumps straight into `Workspace chấm bài` instead of repeating assignment summary cards and description.

## [1.3.0-rc.1] - 2026-06-26

### Security

- Removed committed Redis Cloud password and production JWT key from tracked `appsettings.json`; RC deploys must set `ConnectionStrings__Redis`, `Jwt__Key`, and LiveKit secrets via environment variables or user secrets.
- Restricted `GET /api/notifications/classroom/{classroomId}` to classroom teachers and admins so students cannot enumerate anti-cheat or proctoring notifications.

### Backend

- Changed matrix-generated exam creation to require a confirmed draft-question snapshot, validate a start time, build the real exam from the edited snapshot instead of regenerating the matrix preview, publish the exam immediately for scheduling, and still update source bank-question usage counts transactionally.
- Fixed the live-proctoring migration for SQL Server by changing the `ProctoringEvidences -> CheatingLogs` delete rule to `NO ACTION`, allowing pending database migrations to apply cleanly before matrix-generated exams save full `ExamSetting` rows.
- Added database-save error handling to matrix exam creation so EF save failures return a Vietnamese API error message instead of a generic 500 toast.
- Fixed matrix-generated exam creation to validate the exam time window and build the full exam setting entity, preventing invalid generate-exam requests from falling through as a generic 500 error.
- Fixed matrix availability matching so chapter, lesson, and learning-outcome comparisons ignore surrounding spaces/case, while questions with blank subject metadata are still usable inside the selected bank instead of being incorrectly reported as missing.
- Changed exam matrix create/update/preview/generated exam scoring to derive `TotalQuestions` from matrix rows and use one common `ScorePerQuestion = TotalScore / TotalQuestions`; matrix availability now returns every row and counts only approved questions matching the matrix subject plus row filters.
- **Late exam join alerts:** When a student starts a new attempt after the scheduled open time, teachers and co-proctors receive an in-app notification (`LateJoin`) plus a realtime SignalR event (`StudentJoinedExamLate`) on the exam monitoring hub; proctoring state summaries expose `isLateJoin` and `lateByMinutes`.
- **Anti-cheat in-app notifications:** Cheating logs now persist notifications for exam owner and co-proctors (`AntiCheat`, `AntiCheatHighRisk`), with SignalR push, dedupe window, deep links, and migration `ExtendNotificationMetadata` (`ActionUrl`, `RelatedExamId`, `SourceKey`).
- **Co-proctor invite notifications:** `AddProctorAsync` now creates an in-app notification and SignalR push for the invited teacher (`Type: ProctorInvite`, link to proctoring room).
- **Co-proctor exam discovery:** `GET /api/teacher/proctoring/assigned-exams` returns exams where the teacher is assigned as co-proctor; co-proctors can also load exam detail, attempts, and anti-cheat summary for those exams.
- Added **LiveKit SFU** for multi-stream teacher proctoring: `LiveKit` config section, JWT token service, `GET /api/proctoring/sfu-config`, teacher/student SFU token endpoints; SignalR retained for control events (warn/pause/terminate).
- Fixed 400 Bad Request error when creating assignments by replacing the strict `Deadline` comparison `GreaterThan(DateTime.UtcNow.AddMinutes(-1))` with a basic `NotEmpty()` validation check to prevent timezone and clock drift issues.
- Fixed timezone discrepancy in assignment deadlines where retrieved DateTime objects were interpreted as browser local time by forcing them to UTC kind in MapAssignment and MapSubmission, preventing false overdue states for active assignments.
- Added teacher-owned question banks with bank questions, bank answers, difficulty/status metadata, versioning for snapshotted questions, and archived-question history.
- Added exam matrix APIs so teachers can define matrix rows, validate available approved bank questions, generate a balanced preview, and create draft exams from the selected bank.
- Added Admin read access for exam matrix list/detail while keeping create/update/delete/preview/create-exam restricted to Teacher-owned resources.
- Aligned matrix exam creation with the proctoring integration contract by wrapping exam creation, `ExamSetting`, question snapshots, and bank usage updates in a single transaction.
- Added EF Core migration `AddQuestionBanksAndExamMatrices` for `QuestionBanks`, `BankQuestions`, `BankAnswers`, `ExamMatrices`, `ExamMatrixItems`, and `Questions.BankQuestionId/BankQuestionVersion` snapshot metadata.

### Frontend

- Reworked `Sinh đề từ ma trận` into a draft-first workflow: teachers generate a local draft from the matrix, edit each draft question in a popup without changing the question bank, see non-blocking matrix-mismatch warnings, then confirm the draft and choose class/start time/settings in a scheduling popup before creating the real test.
- Auto-fills `Đóng đề` in the matrix scheduling popup as `Mở đề + Thời gian làm bài` from the selected matrix, while still letting teachers adjust the close time if needed.
- Added a time-window guard before matrix exam generation so teachers see `Thời gian đóng đề phải sau thời gian mở đề` before the confirmation request is sent.
- Added `Môn` to matrix availability row conditions so teachers can see every filter used when a row reports enough or missing questions.
- Reworked the Teacher matrix builder for the MVP matrix workflow: teachers enter `Tổng điểm`, score per question is computed read-only, realtime totals/difficulty counts are shown, matrix sections now render as stacked full-width cards, the saved matrix detail panel shows overview/difficulty/detail/availability tables, and `Sinh đề nháp` requires a successful availability check plus confirmation modal.
- Fixed the Teacher question bank workspace to use fully accented Vietnamese labels for breadcrumbs, difficulty/status dropdowns, badges, buttons, toasts, and matrix validation errors; `Chuẩn đầu ra` is now shown as `Yêu cầu cần đạt`, and editing a bank question now opens in a modal so teachers keep their position in the question list, with client-side validation before marking a question ready.
- **Late exam join UX:** Students joining after open time see device-check and attempt-page warnings about camera requirements; teachers in the proctoring room get a realtime toast and a "Vào trễ" badge on student tiles.
- **Notification center navigation:** Bell dropdown and `/notifications` now open the relevant monitoring/proctoring page from `actionUrl` and notification type (anti-cheat, proctor invite, high-risk).
- **Co-proctor monitoring:** `examApi.getAll()` merges assigned proctoring exams so co-proctors see them under **Giám sát thi** without owning the classroom.
- Fixed sidebar navigation showing duplicate icons on small screens when the desktop collapsed state was persisted in localStorage; nav items now render a single icon (plain on mobile, boxed on desktop) plus label, with truncated text and tooltip when space is tight. (`/student/exams/:examId/lobby`): single-column focus layout with a live countdown timer, camera preview only when the exam requires it, and removal of redundant badges, duplicate session metadata, and unused consent checkbox that contradicted optional-camera exams. (`useTeacherSfuViewer`, `useStudentSfuPublisher`) for multi-tile proctoring grid (up to `maxActiveLiveTiles`); falls back to SignalR P2P when `LiveKit:Enabled` is false.
- Fixed teacher classroom creation returning 403 when the UI showed `Giảng viên` but the stored JWT access token still carried an older role set; session hydration now compares JWT role claims with `/auth/me` and refreshes the token when they diverge, and axios retries once after a permission 403 following a silent token refresh.
- Improved API error toasts so users see Vietnamese messages from the backend (or friendly fallbacks) instead of raw HTTP status text such as `Request failed with status code 403`.
- Added global `Skeleton` components (`SkeletonAvatar`, `SkeletonForm`, `SkeletonTable`, `SkeletonList`) in `Skeleton.jsx` and refactored loading state handlers across all API-dependent pages (Profile, AI settings, lobby, attempt room, device checks, question bank, class workspace, result list, etc.) to use polished Skeleton Screens instead of simple spinners or text placeholders, preventing layout shifts and creating a unified high-premium loading UX.
- Fixed syntax compilation error in Skeleton.jsx by removing duplicate/malformed SkeletonExamCard definition and cleaning up layout hierarchy.
- Replaced local timezone-unaware datetime conversion for assignment deadlines in `AssignmentForm.jsx` and `assignmentHelpers.js` with Vietnam timezone-safe functions (`toAssignmentDateTimeInputValue`, `toAssignmentVietnamISOString`) to prevent timezone conversion discrepancies.
- Added a Teacher `Ngân hàng câu hỏi` workspace for creating question banks, filtering bank questions, manually adding/editing/archiving questions, importing files into a bank, creating matrix rows, previewing matrix selections, and creating draft exams from a matrix.
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

- Matrix-generated exams are now published/scheduled immediately after the teacher confirms the edited draft; teachers should review the draft carefully before creating the real test.

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

[1.3.0]: https://github.com/DatTran26/EduGuard/compare/v1.3.0-rc.1...v1.3.0
[1.3.0-rc.1]: https://github.com/DatTran26/EduGuard/compare/v1.2.0...v1.3.0-rc.1
[1.2.0]: https://github.com/DatTran26/EduGuard/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/DatTran26/EduGuard/compare/v1.0.0...v1.1.0

## [1.0.0] - 2026-06-10

### Added

- Backend scaffold: `EduGuard.Api`, `Domain`, `Application`, and `Infrastructure` projects (.NET 8)
- Frontend folder structure for auth, exams, classrooms, assignments, anti-cheat, and notifications
- Project documentation suite (`docs/01`–`08`), design tokens (`design.md`), and UI guidelines




