# Project Changelog

## Feature: Exam and assignment student notifications

Date: 2026-06-27

Branch/source: `devD`

Description:

- Feature or fix name: Exam and assignment student notifications.
- Purpose and user/business impact: When a teacher publishes an exam or creates an assignment, active students in the classroom now receive in-app notifications and realtime SignalR alerts instead of discovering new tasks only by browsing lists. Teachers see clearer success toasts confirming the class was notified.
- Files or modules changed: `i-notification-service.cs`, `notification-service.cs`, `exam-service.cs`, `assignment-service.cs`; `notificationUtils.js`, `ExamListPage.jsx`, `ExamDetailPage.jsx`, `AssignmentSection.jsx`, `TeacherAssignmentListPage.jsx`.
- Technical summary: Added `CreateExamPublishedNotificationAsync` (on first publish, type `ExamPublished`, link `/student/exams/{id}`) and `CreateAssignmentCreatedNotificationAsync` (on create, type `AssignmentNew`, link `/student/classrooms/{id}?assignmentId={id}`); shared helper delivers `UserNotification` rows and SignalR push to active classroom members; dedupe via `SourceKey`; frontend maps new notification types and improves teacher success copy.
- Validation: `dotnet build` on `EduGuard.Infrastructure` succeeded; frontend linter clean on touched files.
- Known risks: Draft exams do not notify until publish; classrooms with zero active students skip notification silently; deadline text uses server local timezone.

Unresolved questions:

- None.

## Feature: Proctoring camera heartbeat and live stream fixes (bug fix)

Date: 2026-06-27

Branch/source: `devD`

Description:

- Feature or fix name: Proctoring camera heartbeat and live stream fixes (bug fix).
- Purpose and user/business impact: Teachers in the proctoring room now receive student camera/network/live status instead of perpetual **Chưa rõ**; students with `enableCameraProctoring` can publish heartbeats; camera preview attaches reliably during exam attempts; SFU can connect on tunnel deploys without manual `VITE_LIVEKIT_URL` when LiveKit is on `livekit.{domain}`.
- Files or modules changed: `proctoring-settings-helper.cs`, `student-proctoring-service.cs`, `exam-lobby-service.cs`, `notification-service.cs`; `useCameraStream.js`, `useProctoringHeartbeat.js`, `useStudentSfuPublisher.js`, `livekitConfig.js`, `ExamAttemptPage.jsx`, `TeacherProctoringRoomPage.jsx`.
- Technical summary: Centralized `IsCameraMonitoringEnabled` (live proctoring, require camera, camera proctoring); heartbeat sets `LiveStatus=Active` when camera on; frontend re-binds `MediaStream` when video mounts; heartbeat bootstraps `startProctoring`; LiveKit URL derives `wss://livekit.wpcteam.homes` from `class.wpcteam.homes` when API returns localhost; teacher watch effect keys on `attemptId` to reduce START/STOP spam.
- Validation: Frontend linter clean on touched files; backend build attempted (`dotnet build`) — blocked by running API file lock on `EduGuard.Infrastructure.dll`.
- Known risks: LiveKit subdomain derivation assumes `livekit.{parentDomain}`; set `VITE_LIVEKIT_URL` explicitly if your tunnel uses a different hostname. Redeploy backend + rebuild frontend for production (`class.wpcteam.homes`).

Unresolved questions:

- Confirm production `LiveKit:Enabled=true` and tunnel `wss://livekit.wpcteam.homes` after deploy.

## Feature: Classroom notification colors and recipient picker

Date: 2026-06-27

Branch/source: `devD`

Description:

- Feature or fix name: Classroom notification colors and recipient picker.
- Purpose and user/business impact: Teachers see correct banner colors per notification type (emergency red, warning yellow, general blue) and can send announcements to one or many selected class members instead of always broadcasting to the whole class.
- Files or modules changed: `TeacherNotificationTab.jsx`, `TeacherClassroomWorkspace.jsx`, `ClassOverviewPanel.jsx`, `classroomNotificationUtils.js`, `notificationApi.js`, `notificationUtils.js`; `CreateNotificationRequest.cs`, `notification-service.cs`, `notifications-controller.cs`.
- Technical summary: Replaced misused `Success` type with `Emergency` for khẩn cấp; shared classroom notification meta for consistent tones; form layout adds right-side member checklist with select-all; API/backend filter active students by `recipientIds` when provided; legacy `Success` entries still render as khẩn cấp red.
- Validation: Frontend linter clean on touched files; backend build blocked by running `EduGuard.Api` process file lock (code review).
- Known risks: Existing notifications stored as `Success` remain in DB but display as khẩn cấp; new sends use `Emergency`.

Unresolved questions:

- None.

## Feature: Student paused exam resume flow (bug fix)

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Student paused exam resume flow (bug fix).
- Purpose and user/business impact: When a teacher pauses a student mid-exam, the student can return to the waiting room, see correct **Tạm dừng** status (not **Đã thi**), and continue when the teacher resumes — without losing their attempt or being blocked by max-attempt limits.
- Files or modules changed: `exam-attempt-service.cs`, `exam-repository.cs`, `exam-service.cs`, `exam-dto.cs`, `exam-mapper.cs`, `exam-attempts-controller.cs`; `ExamPausedPage.jsx`, `ExamDetailPage.jsx`, `StudentExamCard.jsx`, `proctoringRouting.js`, `useStudentProctoringEvents.js`, `examApi.js`, `examAttemptApi.js`.
- Technical summary: Backend treats `PausedByProctor` as resumable (same as `InProgress` for start); only submitted attempts count toward max attempts; student exam DTO includes latest attempt status; paused page removes exit link, polls every 3s, enables continue button on resume; list/detail route students to paused or attempt pages by status.
- Validation: Linter clean on touched frontend files; backend build blocked by running API process (file lock), code review only.
- Known risks: Student must keep paused tab open or revisit exam detail/list to re-enter waiting room after navigation away.

Unresolved questions:

- None.

## Feature: Exam attempt header countdown prominence

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Exam attempt header countdown prominence.
- Purpose and user/business impact: Students can see remaining exam time clearly at the center of the sticky header while taking a test, with visual urgency when time is running low.
- Files or modules changed: `ExamAttemptHeaderCountdown.jsx`, `ExamAttemptPage.jsx`.
- Technical summary: Replaced small time badge with a centered header countdown component (segmented digit boxes, `MM:SS` when under one hour, amber under 5 minutes, rose under 1 minute); fixed header grid overlap and removed full-timer pulse animation.
- Validation: Linter clean on touched files.
- Known risks: None identified.

Unresolved questions:

- None.

## Feature: Exam lobby UI refresh and countdown performance

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Exam lobby UI refresh and countdown performance.
- Purpose and user/business impact: Students waiting before an exam see a clearer, more polished lobby and a countdown that updates every second instead of feeling laggy between server polls.
- Files or modules changed: `useLobbyOpenCountdown.js`, `ExamLobbyCountdown.jsx`, `ExamLobbyPage.jsx`; removed `ExamLobbyCountdown.css`.
- Technical summary: Countdown derives remaining time from `startTime` on the client (same pattern as proctoring room header); lobby page layout uses gradient hero, device/waiting status pills, and segmented digit cards with urgency coloring under 5 minutes / 1 minute.
- Validation: Linter clean on touched files.
- Known risks: Countdown requires a valid `startTime` from lobby status or exam detail; falls back to “Đang mở đề” when time has passed.

Unresolved questions:

- None.

## Feature: System run guide (all modes)

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: System run guide — all startup modes.
- Purpose and user/business impact: Developers can start EduGuard using any supported method from one document (basic dev, VS/IIS, Redis, SFU, AI, network modes, full stack). Clarifies that `use-tunnel.cmd` run as Administrator already opens LAN firewall (no separate `open-lan-firewall.cmd` unless LAN-only mode or non-Admin run).
- Files or modules changed: `docs/HUONG_DAN_CHAY_HE_THONG.md`, `docs/PROCTORING_NETWORK_MODES.md`, `docs/README.md`, `CHANGELOG.md`.
- Technical summary: Consolidated run instructions; added per-script firewall table; merged hybrid tunnel steps 2–3 into single Admin `use-tunnel.cmd` flow; comparison table column for auto firewall in `PROCTORING_NETWORK_MODES.md`.
- Validation: Doc review against `apply-proctoring-network.ps1` (`Enable-LanFirewallRules` when `-Mode tunnel`).
- Known risks: None — documentation only.

Unresolved questions:

- None.

## Feature: Proctoring network modes (LAN / Tailscale / Tunnel)

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Proctoring network modes documentation.
- Purpose and user/business impact: School Wi-Fi without port forward can use LAN; remote GV/dev can use Tailscale; production uses tunnel + TURN later.
- Files or modules changed: `docs/PROCTORING_NETWORK_MODES.md`, `frontend/.env`, `backend/EduGuard.Api/.env`, `docs/PROCTORING_SFU_SETUP.md`, `.env.example`.
- Technical summary: Three-mode guide with IP examples (LAN `10.20.4.154`, Tailscale `100.86.244.117`, tunnel `wss://livekit.wpcteam.homes`).
- Validation: Doc review; `tailscale ip -4` on host.
- Known risks: Tailscale requires client install per machine; not for large exam halls without IT.

Unresolved questions:

- None.

## Feature: Coturn TURN for cross-network proctoring

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Coturn TURN for cross-network live proctoring.
- Purpose and user/business impact: Relay WebRTC when GV/SV are on different networks; signaling via Cloudflare tunnel `wss://livekit.wpcteam.homes`, media via TURN/UDP 3478 and LiveKit UDP 50000–50100.
- Files or modules changed: `infra/livekit/docker-compose.yml`, `.env.example`, `backend/EduGuard.Api/.env`, `livekitRtcConfig.js`, SFU hooks, `docs/PROCTORING_SFU_SETUP.md`.
- Technical summary: coturn container; backend `WebRtc__IceServers` credentials; frontend injects `rtcConfig` only when API returns `turn:` URLs.
- Validation: `docker compose up -d` — `livekit-coturn-1` Up on 3478.
- Known risks: UDP 3478 and 50000–50100 must be port-forwarded on router; set `TURN_EXTERNAL_IP` in `infra/livekit/.env` on NAT.

Unresolved questions:

- Confirm router forwards UDP 3478 and UDP 50000–50100.

## Feature: LiveKit / Redis .env configuration

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: LiveKit / Redis .env configuration.
- Purpose and user/business impact: Easier deploy/host tuning without editing `appsettings.json`; frontend can point browsers at reachable LiveKit host when API still returns `localhost`.
- Files or modules changed: `frontend/.env.example`, `frontend/src/config/livekitConfig.js`, `useTeacherSfuViewer.js`, `useStudentSfuPublisher.js`, `devLogger.js`, `backend/EduGuard.Api/.env.example`, `Program.cs`, `EduGuard.Api.csproj` (DotNetEnv), `.gitignore`.
- Technical summary: `VITE_LIVEKIT_URL` priority over API url then `ws://localhost:7880`; backend `DotNetEnv.Env.TraversePath().Load()` before `WebApplication.CreateBuilder`.
- Validation: Code review; API build blocked by running `EduGuard.Api` process (file lock) — restart API to pick up DotNetEnv.
- Known risks: `.env` secrets must not be committed; production HTTPS needs `wss://` for LiveKit.

Unresolved questions:

- None.

## Feature: Proctoring student tile status UX

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Proctoring student tile status UX.
- Purpose and user/business impact: Teachers can understand what **Unknown** meant (no heartbeat yet), see Vietnamese attempt status, and get clearer guidance when live camera is unavailable (submitted vs waiting vs P2P single-view).
- Files or modules changed: `proctoringStudentStatus.js`, `StudentLiveTile.jsx`, `StudentCameraGrid.jsx`, `AttemptProctorDrawer.jsx`, `TeacherProctoringRoomPage.jsx`.
- Technical summary: Added status label helpers; redesigned tile signal chips (Camera/Mạng/Live); contextual video placeholders; P2P re-watch on same tile; auto-select first watchable student.
- Validation: Linter clean on touched files.
- Known risks: Live video still requires student to publish (SFU) or teacher to select tile (P2P); **Đã nộp bài** students cannot stream by design.

Unresolved questions:

- None.

## Feature: Proctoring room pre-start session status

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Proctoring room pre-start session status (bug fix).
- Purpose and user/business impact: Teachers opening the proctoring room before the scheduled start no longer see a false **Phiên đã kết thúc** badge while the countdown still shows time remaining; the room now shows **Chờ mở đề** and counts down to start time until the exam window opens.
- Files or modules changed: `proctoringRoomHelpers.js`, `useExamEndCountdown.js`, `ProctoringRoomHeader.jsx`, `TeacherProctoringRoomPage.jsx`.
- Technical summary: Split session phase into `upcoming` / `live` / `ended`; only `ended` disables realtime and shows session-ended badge; countdown uses `startTime` before open and `endTime` after.
- Validation: Manual logic review; linter clean on touched files.
- Known risks: None identified; timezone handling unchanged (same `Date` parsing as before).

Unresolved questions:

- None.

## Release: v1.3.0-rc.1

Date: 2026-06-26

Branch/source: `devD` → `release`

Description:

- Feature or fix name: Live proctoring SFU control room release candidate.
- Purpose and user/business impact: Ships LiveKit multi-stream proctoring, question banks/exam matrices, anti-cheat and late-join notifications, co-proctor workflows, and teacher monitoring UI redesign for RC staging validation.
- Files or modules changed: backend proctoring/notifications/question-banks, frontend proctoring/monitoring/classrooms, infra LiveKit compose, docs setup guides.
- Technical summary: Merged `devD` into `release`, tagged `v1.3.0-rc.1`, opened PR to `main`. Sanitized tracked appsettings secrets and restricted classroom notification listing to teachers/admins before RC.
- Validation: `npm test` / `dotnet test` passed; code-reviewer gate run (remaining high items documented in PR as non-blocking for RC).
- Known risks: Refresh-token rotation race, zero automated integration tests, LiveKit/Redis must be configured via env for RC deploy. Rotate any credentials that were previously committed.

Unresolved questions:

- RC deploy target: local tunnel vs cloud — confirm LiveKit stack per `docs/PROCTORING_SFU_SETUP.md`.

## Feature: Late exam join notifications and camera gate

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Late exam join notifications and student camera gate.
- Purpose and user/business impact: When a student enters an exam after the scheduled start, they now see explicit camera/late-join warnings instead of silently skipping the lobby flow. Teachers and co-proctors are notified in-app and via SignalR in the proctoring room.
- Files or modules changed: exam attempt start flow, notification service, exam monitoring notifier, proctoring state DTOs, student device check / attempt pages, teacher proctoring room, notification utils.

Changed files:

- `backend/EduGuard.Infrastructure/Exams/exam-join-helper.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `backend/EduGuard.Infrastructure/Notifications/notification-service.cs`
- `backend/EduGuard.Api/Realtime/signalr-exam-monitoring-notifier.cs`
- `backend/EduGuard.Application/DTOs/Exams/start-exam-response.cs`
- `backend/EduGuard.Application/DTOs/Proctoring/late-join-event-dto.cs`
- `backend/EduGuard.Application/DTOs/Proctoring/proctoring-dtos.cs`
- `frontend/src/features/proctoring/utils/proctoringRouting.js`
- `frontend/src/features/proctoring/pages/StudentDeviceCheckPage.jsx`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/proctoring/pages/TeacherProctoringRoomPage.jsx`
- `frontend/src/features/proctoring/components/StudentLiveTile.jsx`
- `frontend/src/features/notifications/utils/notificationUtils.js`
- `frontend/src/signalr/examMonitoringConnection.js`
- `CHANGELOG.md`, `docs/project-changelog.md`

Validation:

- `dotnet build` on `EduGuard.Infrastructure` succeeds.
- `npm test` passes.

Unresolved questions:

- Late join uses a 1-minute grace period after `startTime` before flagging as late.
- Resume of an in-progress attempt does not re-send late-join notifications.

## Feature: Anti-cheat notification persistence

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Anti-cheat notification persistence for teachers.
- Purpose and user/business impact: Cheating/proctoring alerts now appear in the in-app notification bell (not only live SignalR on the monitoring page). Teachers and co-proctors get persisted alerts with links to logs or proctoring room; high-risk threshold (≥51) triggers a one-time escalation notification.
- Files or modules changed: notification entity/migration/service, anti-cheat service, cheating type labels, frontend notification utils, TopBar, NotificationsPage, RealtimeNotificationListener, changelogs.

Changed files:

- `backend/EduGuard.Domain/Entities/Notification.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/20260626120000_ExtendNotificationMetadata.cs`
- `backend/EduGuard.Infrastructure/Notifications/notification-service.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/anti-cheat-service.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/cheating-type-helper.cs`
- `backend/EduGuard.Application/DTOs/Notifications/NotificationDto.cs`
- `frontend/src/features/notifications/utils/notificationUtils.js`
- `frontend/src/api/notificationApi.js`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/notifications/pages/NotificationsPage.jsx`
- `frontend/src/features/notifications/components/RealtimeNotificationListener.jsx`
- `CHANGELOG.md`, `docs/project-changelog.md`

Validation:

- `dotnet build` on `EduGuard.Infrastructure` succeeds.

Unresolved questions:

- Run `dotnet ef database update` (or apply migration `ExtendNotificationMetadata`) before testing in local/prod DB.
- Historical cheating logs before this change are not backfilled into notifications.

## Feature: Co-proctor invite notification and monitoring visibility

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Co-proctor invite notification and monitoring visibility.
- Purpose and user/business impact: When a teacher is invited to a proctoring room, they now receive an in-app + realtime notification and can see the exam in **Giám sát thi** even if they do not own the classroom.
- Files or modules changed: proctoring service/controller, notification service, exam/attempt/anti-cheat access checks, `examApi.js`, `proctoringApi.js`, changelogs.

Changed files:

- `backend/EduGuard.Infrastructure/Proctoring/proctoring-service.cs`
- `backend/EduGuard.Infrastructure/Notifications/notification-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/anti-cheat-service.cs`
- `backend/EduGuard.Api/Controllers/proctoring-controller.cs`
- `backend/EduGuard.Application/DTOs/Proctoring/proctoring-dtos.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-notification-service.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-proctoring-service.cs`
- `frontend/src/api/examApi.js`
- `frontend/src/api/proctoringApi.js`
- `CHANGELOG.md`, `docs/project-changelog.md`

Validation:

- `dotnet build` on backend.

Unresolved questions:

- Existing co-proctor assignments created before this change do not retroactively send notifications; re-invite or open room via direct URL.

## Feature: Sidebar duplicate icon fix (mobile)

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Sidebar duplicate icon fix on small screens.
- Purpose and user/business impact: Nav items rendered two icons (boxed + inline) on narrow viewports because `inline-flex` conflicted with `hidden` in Tailwind. Each item now uses one icon element; mobile shows icon + truncated label, desktop collapsed shows boxed icon only.
- Files or modules changed: `Sidebar.jsx`.

Changed files:

- `frontend/src/components/layout/Sidebar.jsx`

Validation:

- Logic review: single `ItemIcon` per nav row; `max-lg:` strips boxed styling on mobile; `truncate` on label; `title` for full label on hover.

Unresolved questions:

- None.

## Feature: Student exam lobby UI redesign

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Student exam lobby UI redesign.
- Purpose and user/business impact: Lobby showed too much redundant or incorrect information (e.g. mandatory-camera copy when camera was optional, unused rules checkbox, duplicate open/close times). Students now see a focused waiting screen with countdown and camera only when required.
- Files or modules changed: `ExamLobbyPage.jsx`, new `ExamLobbyCountdown` component and styles.

Changed files:

- `frontend/src/features/proctoring/pages/ExamLobbyPage.jsx`
- `frontend/src/features/proctoring/components/ExamLobbyCountdown.jsx`
- `frontend/src/features/proctoring/components/ExamLobbyCountdown.css`

Validation:

- Manual review of conditional camera/requirements logic against `proctoringRouting.js`; linter clean on touched files.

Unresolved questions:

- None.

## Feature: Admin proctoring room access

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Admin live proctoring room access.
- Purpose and user/business impact: Admins can open the same live proctoring room and per-exam anti-cheat monitoring as teachers (backend already allowed Admin on APIs/hub/tokens; frontend route guards and links were blocking).
- Files or modules changed: `AppRoutes.jsx`, `routeConfig.js`, `ProctoringRoomLink.jsx`, `proctoringRouting.js`, `DEV_LOGIN_ACCOUNTS.md`, `PROCTORING_SFU_SETUP.md`, changelogs.

Changed files:

- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/features/proctoring/components/ProctoringRoomLink.jsx`
- `frontend/src/features/proctoring/utils/proctoringRouting.js`
- `docs/DEV_LOGIN_ACCOUNTS.md`
- `docs/PROCTORING_SFU_SETUP.md`

Validation:

- Code review: backend `proctoring-controller`, `exam-monitoring-hub`, `live-kit-token-service`, `exam-monitoring-service` already include `Admin` role; frontend routes updated to match.

Unresolved questions:

- None.

## Feature: LiveKit SFU multi-stream proctoring

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: LiveKit SFU multi-stream proctoring (Option B).
- Purpose and user/business impact: Teachers can view multiple student camera streams in the proctoring grid (Google Meet style) without opening a separate P2P connection per tile; students publish once to a shared SFU room.
- Files or modules changed: LiveKit infra/docker, backend token API, frontend LiveKit hooks, teacher grid, student publisher, setup docs.

Changed files:

- `infra/livekit/docker-compose.yml`, `infra/livekit/livekit.yaml`
- `backend/EduGuard.Application/Options/live-kit-options.cs`
- `backend/EduGuard.Application/DTOs/Proctoring/sfu-dtos.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-live-kit-token-service.cs`
- `backend/EduGuard.Infrastructure/Proctoring/live-kit-token-service.cs`
- `backend/EduGuard.Api/Controllers/proctoring-controller.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Api/appsettings.json`, `appsettings.Development.json`
- `frontend/package.json`, `frontend/src/api/proctoringApi.js`
- `frontend/src/features/proctoring/hooks/useTeacherSfuViewer.js`
- `frontend/src/features/proctoring/hooks/useStudentSfuPublisher.js`
- `frontend/src/features/proctoring/hooks/useStudentAttemptProctoring.js`
- `frontend/src/features/proctoring/pages/TeacherProctoringRoomPage.jsx`
- `frontend/src/features/proctoring/components/StudentCameraGrid.jsx`
- `frontend/src/features/proctoring/components/StudentLiveTile.jsx`
- `frontend/src/features/proctoring/utils/sfuHelpers.js`
- `docs/PROCTORING_SFU_SETUP.md`
- `CHANGELOG.md`, `docs/project-changelog.md`

Technical summary:

- Chose **LiveKit** over mediasoup for pragmatic React SDK + Docker self-host + JWT token from ASP.NET Core.
- Room `exam-{examId}-proctoring`; identities `attempt-{attemptId}` / `teacher-{userId}`.
- `LiveKit:Enabled=false` keeps SignalR P2P fallback; ICE/TURN still from `WebRtc:IceServers` (default STUN only; coturn documented, not installed).

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx`
- `npm run lint` in `frontend/`

Known risks / follow-up:

- Docker required for local LiveKit; production needs `wss://` and TURN for cross-NAT.
- Redis watch-lock policy unchanged for P2P; SFU multi-tile does not use per-tile `requestWatch`.

## Feature: Proctoring camera/mic enforcement and teacher live audio

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Proctoring camera/mic enforcement and teacher live audio.
- Purpose and user/business impact: Students entering late or with `enableCameraProctoring` now pass device-check and get browser camera/mic prompts when required; teachers hear student audio in the proctoring room and auto-connect to the first in-progress attempt.
- Files or modules changed: proctoring routing helpers, camera stream hook, student device-check/lobby/attempt pages, teacher proctoring room and live tile components, changelogs.

Changed files:

- `frontend/src/features/proctoring/utils/proctoringRouting.js`
- `frontend/src/features/proctoring/hooks/useCameraStream.js`
- `frontend/src/features/proctoring/pages/StudentDeviceCheckPage.jsx`
- `frontend/src/features/proctoring/pages/ExamLobbyPage.jsx`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`
- `frontend/src/features/proctoring/pages/TeacherProctoringRoomPage.jsx`
- `frontend/src/features/proctoring/components/StudentLiveTile.jsx`
- `frontend/src/features/proctoring/components/StudentCameraGrid.jsx`
- `frontend/src/features/proctoring/components/AttemptProctorDrawer.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Aligned `isProctoringRequired` with live-proctoring flags; added `requiresProctoringMicrophone` and `requiresProctoringCamera` helpers.
- Extended `useCameraStream` to validate audio tracks when `audio: true` and expose `isMicReady` / `micStatus`.
- Device-check calls `startProctoring` for any `isLiveProctoringRoomAvailable` exam; shows microphone readiness badge.
- Attempt page publishes WebRTC with audio when microphone is required; teacher room defaults audio on and unmutes grid/drawer video when enabled.

Validation:

- `read_lints` on changed frontend files — no issues.

Known risks / follow-up:

- Teacher still receives only one simultaneous WebRTC stream (active selected student); multi-tile live requires future multi-peer work.
- Re-requesting watch after toggling audio may require re-selecting the student tile.

## Feature: Teacher proctoring control room UX

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Teacher proctoring control room UX.
- Purpose and user/business impact: Proctoring runs in a dedicated full-screen tab so teachers can keep the monitoring hub open while watching live cameras; the room UI follows the control-room spec more closely (status bar, filters, view modes) and sidebar navigation no longer double-highlights **Đề thi** + **Giám sát thi**.
- Files or modules changed: proctoring room page/components, routing, sidebar active-state logic, monitoring/exam/classroom entry links, changelogs.

Changed files:

- `frontend/src/features/proctoring/pages/TeacherProctoringRoomPage.jsx`
- `frontend/src/features/proctoring/components/ProctoringRoomShell.jsx`
- `frontend/src/features/proctoring/components/ProctoringRoomLink.jsx`
- `frontend/src/features/proctoring/components/ProctoringRoomHeader.jsx`
- `frontend/src/features/proctoring/components/ProctoringStatusBar.jsx`
- `frontend/src/features/proctoring/components/ProctoringFilterBar.jsx`
- `frontend/src/features/proctoring/components/StudentCameraGrid.jsx`
- `frontend/src/features/proctoring/components/StudentLiveTile.jsx`
- `frontend/src/features/proctoring/components/CoProctorPanel.jsx`
- `frontend/src/features/proctoring/components/AttemptProctorDrawer.jsx`
- `frontend/src/features/proctoring/utils/proctoringRoomHelpers.js`
- `frontend/src/features/proctoring/utils/proctoringRouting.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/features/anti-cheat/components/TeacherMonitoringWorkspace.jsx`
- `frontend/src/features/anti-cheat/components/AttemptMonitorPanel.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/components/TeacherClassroomWorkspace.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Moved `/teacher/exams/:examId/proctoring` outside `AppShell` into `ProctoringRoomShell` (standalone layout, no sidebar/top bar).
- Added `ProctoringRoomLink` / `openTeacherProctoringRoom` so all live-room CTAs use `target="_blank"`.
- Rebuilt room UI with header (exam window, realtime pulse, refresh, high-risk shortcut), 10-metric status strip, filter chips, view modes (`auto` / `grid` / `focused`), and dark-themed tiles/drawer.
- Sidebar: proctoring URLs activate only **Giám sát thi**, not **Đề thi**.

Validation:

- `read_lints` on changed frontend files — no issues.
- Manual: from `/teacher/monitoring` or exam detail, click **Vào phòng giám sát** — room opens in new tab without workspace chrome; original tab keeps single nav highlight.
- Manual: on proctoring URL in workspace tab (if navigated directly), only **Giám sát thi** is active in sidebar.

Known risks / follow-up:

- Classroom name is not yet shown in the room header (API `ProctoringRoomDto` has no classroom title).
- Filter counts for camera/disconnect depend on heartbeat status strings from student clients.

## Feature: Teacher monitoring hub UX redesign

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Teacher monitoring hub UX redesign.
- Purpose and user/business impact: Teachers can choose an exam once and switch between live camera proctoring and anti-cheat logs without scrolling through repeated buttons and duplicate stat blocks; the primary action to enter the live room appears only in the camera workspace.
- Files or modules changed: monitoring page, new workspace component, attempt monitor panel, shared Button component, changelogs.

Changed files:

- `frontend/src/features/anti-cheat/pages/TeacherMonitoringPage.jsx`
- `frontend/src/features/anti-cheat/components/TeacherMonitoringWorkspace.jsx`
- `frontend/src/features/anti-cheat/components/AttemptMonitorPanel.jsx`
- `frontend/src/components/common/Button.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Replaced stacked full-width exam cards with a sticky left exam picker and a right-hand workspace panel.
- Added `TeacherMonitoringWorkspace` with segmented tabs (`live` / `logs`) synced to `?examId=&view=` query params.
- Added `embedded` mode to `AttemptMonitorPanel` to show inline attempt stats and hide duplicate header/live-camera CTA.
- Extended `Button` with polymorphic `as` prop so link-styled buttons render correctly as React Router `Link`.

Validation:

- Manual: open `/teacher/monitoring`, select an exam, confirm single tab bar and one **Vào phòng giám sát** CTA on the camera tab.
- Manual: switch to **Log anti-cheat** tab and confirm attempt list + detail panel without a third live-camera button.
- `read_lints` on changed frontend files — no issues.

Known risks / follow-up:

- Deep links with only `?examId=` default to the camera tab; anti-cheat-only exams without live proctoring show an explanatory empty state on that tab.

## Feature: Teacher session role sync and API error toasts

Date: 2026-06-26

Branch/source: `devD`

Description:

- Feature or fix name: Teacher session role sync and API error toasts.
- Purpose and user/business impact: Teachers who already appear as `Giảng viên` in the UI can create classrooms again after a role change or stale JWT; error notifications now show readable Vietnamese messages instead of raw HTTP 403 text.
- Files or modules changed: auth hydration hook, axios client, API error helpers, JWT claim parser, toast provider, classroom list page, changelogs.

Changed files:

- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/api/axiosClient.js`
- `frontend/src/api/apiHelpers.js`
- `frontend/src/api/authApi.js`
- `frontend/src/utils/jwtClaims.js`
- `frontend/src/utils/apiErrorMessage.js`
- `frontend/src/hooks/useToast.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Added JWT role-claim parsing and compared token roles with `/auth/me` during session hydration; when they differ, the client refreshes the access token before continuing.
- Added a one-time axios retry for permission `403` responses after a silent refresh, covering race cases where the user acts before hydration finishes.
- Centralized API error message resolution for axios envelopes and mapped generic HTTP failures to Vietnamese fallback text.
- Hardened toast rendering so non-string error payloads do not leak raw status codes or nested JSON into the UI.

Validation:

- `POST /api/auth/login` as `teacher1@eduguard.test` returns JWT with `Teacher` role claim.
- `POST /api/classrooms` with a fresh teacher access token succeeds (`Tạo lớp học thành công`).
- Manual retest after deploy: reload teacher session, create classroom, confirm toast shows Vietnamese permission text on real denial instead of `403`.

Known risks / follow-up:

- Users with an invalid refresh token still need to log out and log in again after roles change.
- Other pages still use `error.message` directly; broader adoption of `resolveApiErrorMessage` can be done incrementally.

## Feature: Question bank list/detail UX and exam bank picker

Date: 2026-06-25

Branch/source: `devB`

Description:

- Feature or fix name: Question bank list/detail UX and exam bank picker.
- Purpose and user/business impact: Opens the Teacher question bank menu on a clear bank list, keeps editing scoped to the selected bank, explains matrix shortages in actionable detail, and lets teachers build an exam by selecting approved questions from a bank.
- Files or modules changed: frontend question bank page, bank question form, question bank helpers/API adapter, Teacher exam create page, Teacher question workspace, main changelog, project changelog, and Todo List.

Changed files:

- `frontend/src/features/question-banks/pages/QuestionBankPage.jsx`
- `frontend/src/features/question-banks/components/BankQuestionForm.jsx`
- `frontend/src/features/question-banks/question-bank-helpers.js`
- `frontend/src/api/questionBankApi.js`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`
- `Todo List.md`

Technical summary:

- Changed `/teacher/question-banks` to render a bank-list landing view first; selecting a bank opens the detail workspace instead of auto-selecting the first bank.
- Reworked bank detail with question/matrix tabs, a matrix jump button, collapsible add/import panels, a horizontal question form layout, and a full-width question list with expandable answers.
- Added status and difficulty marks/variants for faster scanning.
- Added a closable matrix issue dialog that formats backend validation/preview shortages by row condition, required count, available count, and missing count while keeping the backend selection algorithm unchanged.
- Added frontend support for `POST /api/exams/{examId}/bank-questions` and a `Ngân hàng` mode in the Teacher create-exam workspace. Unsaved exams receive local draft questions; saved exams use backend snapshots.

Validation:

- `npm.cmd --prefix frontend run build` passed; Vite/Rolldown still reports existing third-party pure-annotation warnings from `@microsoft/signalr` and the existing large bundle warning.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore` passed with 0 warnings and 0 errors.
- `GET http://127.0.0.1:5173/teacher/question-banks` returned HTTP 200 from the running Vite server.
- `GET http://127.0.0.1:5157/swagger/v1/swagger.json` returned HTTP 200 and contains `/api/exams/{examId}/bank-questions`.
- `git diff --check` passed with no whitespace errors before merge; PowerShell reported only expected LF-to-CRLF working-copy warnings.

Known risks / rollback / follow-up:

- Manual browser UI verification is still recommended for exact spacing against the provided screenshots because the change is layout-heavy.
- The bank picker filters to approved bank questions before adding to an exam, matching backend snapshot rules.
- Rollback: revert the modified frontend question-bank/exam workspace files and remove the related changelog/Todo entries; no new backend schema change was added in this UX update.

## Feature: Question bank and exam matrix workspace

Date: 2026-06-25

Branch/source: `devB`

Description:

- Feature or fix name: Question bank and exam matrix workspace.
- Purpose and user/business impact: Lets teachers maintain reusable approved question banks, import questions into banks, generate exams from a matrix, and keep existing exam snapshots stable after bank questions are edited.
- Files or modules changed: question bank/matrix backend entities, DTOs, validators, repositories, services, controllers, EF Core migration/snapshot, frontend API adapter, Teacher question bank route/page, API registry, changelog, and Todo List.

Changed files:

- `backend/EduGuard.Domain/Entities/QuestionBank.cs`
- `backend/EduGuard.Domain/Entities/BankQuestion.cs`
- `backend/EduGuard.Domain/Entities/BankAnswer.cs`
- `backend/EduGuard.Domain/Entities/ExamMatrix.cs`
- `backend/EduGuard.Domain/Entities/ExamMatrixItem.cs`
- `backend/EduGuard.Domain/Entities/Question.cs`
- `backend/EduGuard.Application/DTOs/QuestionBanks/*`
- `backend/EduGuard.Application/DTOs/ExamMatrices/*`
- `backend/EduGuard.Infrastructure/QuestionBanks/*`
- `backend/EduGuard.Infrastructure/ExamMatrices/*`
- `backend/EduGuard.Api/Controllers/question-banks-controller.cs`
- `backend/EduGuard.Api/Controllers/exam-matrices-controller.cs`
- `frontend/src/api/questionBankApi.js`
- `frontend/src/features/question-banks/*`
- `frontend/src/routes/*`
- `docs/apiList.md`

Technical summary:

- Added teacher-owned question bank APIs for bank CRUD, bank question CRUD, file import, archive, and snapshotting approved bank questions into existing exams.
- Added question snapshot metadata to exam questions so exam history remains stable after bank question revisions.
- Added exam matrix APIs for matrix CRUD, availability validation against approved bank questions, preview generation ordered by lower `TimesUsed`, and draft exam creation.
- Wrapped matrix create-exam in a database transaction that creates the `Exam`, default `ExamSetting`, question/answer snapshots, and bank usage updates together.
- Added `QuestionBank` and `ExamMatrix` Swagger operation tags and documented the `API-QBK-*` / `API-MTX-*` endpoints in `docs/apiList.md`.

Validation:

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore` passed with 0 warnings and 0 errors.
- `npm.cmd --prefix frontend run build` passed; Vite/Rolldown still reports existing third-party pure-annotation warnings from `@microsoft/signalr` and the existing large bundle warning.
- Swagger/runtime checks returned HTTP 200 for question bank and exam matrix routes before this merge.

Known risks / rollback / follow-up:

- Matrix-generated exams are draft exams; teachers still publish them through the existing exam detail publish workflow.
- Rollback: remove the bank/matrix entities, DTOs, validators, repositories, services, controllers, frontend question-bank feature files, route/sidebar entries, and revert migration `20260625075714_AddQuestionBanksAndExamMatrices`.

## Feature: Redesign Student Task Center (Bài tập / Bài thi)

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Redesign Student Task Center (Bài tập / Bài thi).
- Purpose and user/business impact: Make the student task page easier to scan and less ambiguous by separating assignments and exams into distinct tabs, showing only one list at a time, and switching from the older long list/expand pattern to compact responsive cards.
- Files or modules changed: `ExamListPage.jsx`, `TopBar.jsx`, `StudentTaskTabs.jsx`, `StudentTaskToolbar.jsx`, `StudentTaskGrid.jsx`, `StudentAssignmentCard.jsx`, `StudentExamCard.jsx`.

Changed files:

- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/exams/components/StudentTaskTabs.jsx`
- `frontend/src/features/exams/components/StudentTaskToolbar.jsx`
- `frontend/src/features/exams/components/StudentTaskGrid.jsx`
- `frontend/src/features/exams/components/StudentAssignmentCard.jsx`
- `frontend/src/features/exams/components/StudentExamCard.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`
- `Todo List.md`

Technical summary:

- Replaced the student page header in `ExamListPage.jsx` with a compact `StudentTaskTabs` block showing the fixed title `Bài tập / Bài thi`, a `Sinh viên` role label, and a clear segmented switch for `Bài thi` / `Bài tập`.
- Added `StudentTaskToolbar` with only the required filters: classroom select, `Tìm theo tên...` search input, and the existing exam status filter when the exams tab is active.
- Stopped rendering both datasets in the same page state. The assignments tab now renders only `StudentAssignmentCard` items, while the exams tab renders only `StudentExamCard` items.
- Rebuilt both student card types into compact white cards with responsive 1/2/3-column grid layout, concise metadata, small status badges, and action links pointing to the existing classroom-detail or exam-detail routes.
- Kept the existing API logic intact by preserving the shared exam list fetch and the in-memory student assignment aggregation flow.
- Added a breadcrumb label override in `TopBar.jsx` so the Student list route displays `Trang chủ > Bài kiểm tra` instead of the generic exams label.

Validation:

- Frontend build passes (`npm run build`).

Known risks / rollback / follow-up:

- The current student exam list API still does not expose student-specific attempt/result metadata. The redesigned exam cards therefore prioritize schedule state (`Sắp mở`, `Đang mở`, `Hết hạn`) and route users into the existing exam detail flow instead of fabricating per-student result data.

---

## Feature: Redesign Student Classrooms Page (Lớp của tôi)

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Redesign Student Classrooms Page.
- Purpose and user/business impact: Simplify and clean the student's "My Classrooms" interface. Wires dynamic pending tasks calculation, a 2-kpi card row, inline search and filtering toolbar, and compact responsive grid cards.
- Files or modules changed: `ClassroomListPage.jsx`, `StudentClassroomCard.jsx` (New), `StudentClassroomSummary.jsx` (New), `StudentClassroomToolbar.jsx` (New).

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/components/StudentClassroomCard.jsx`
- `frontend/src/features/classrooms/components/StudentClassroomSummary.jsx`
- `frontend/src/features/classrooms/components/StudentClassroomToolbar.jsx`

Technical summary:

- Replaced the old bulky student hero block with a simple flex header row containing only the title "Lớp của tôi" and "Tham gia lớp" button.
- Created `StudentClassroomSummary` displaying total joined classrooms and active pending assignments/exams.
- Implemented parallel loading of assignments and exams for all student classrooms to calculate the pending tasks count in real-time.
- Created `StudentClassroomToolbar` featuring search input ("Tìm lớp theo tên hoặc mã lớp...") and simple status filtering dropdown ("Tất cả trạng thái", "Đang học", "Đã kết thúc").
- Created `StudentClassroomCard` with clean white border, subtle shadow, open/closed status badge, and clear "Vào lớp" CTA button.
- Updated skeleton loaders and default empty states for the student view.
- Removed charts, notifications feeds, and side listing panels from student view.

Validation:

- Frontend builds successfully (`npm run build`).

---

## Feature: Redesign Teacher Classroom Detail Layout & Actions

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Redesign Teacher Classroom Detail Layout & Actions.
- Purpose and user/business impact: Streamline classroom details workspace for teachers. Displays title header with action buttons, 5 KPI cards for key metrics, a 2-column overview panel featuring "Việc cần xử lý" (Pending Tasks), recent timeline activities, learning progress, and a quick action drawer. Wires query parameters for auto-opening forms and expanding specific cards.
- Files or modules changed: `ClassroomDetailPage.jsx`, `ClassDetailHeader.jsx` (New), `ClassQuickStats.jsx` (New), `ClassOverviewPanel.jsx` (New), `CreateClassroomForm.jsx`, `TeacherClassroomWorkspace.jsx`, `AssignmentSection.jsx`, `TeacherNotificationTab.jsx`.

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/components/ClassDetailHeader.jsx`
- `frontend/src/features/classrooms/components/ClassQuickStats.jsx`
- `frontend/src/features/classrooms/components/ClassOverviewPanel.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/components/TeacherClassroomWorkspace.jsx`
- `frontend/src/features/assignments/components/AssignmentSection.jsx`
- `frontend/src/features/classrooms/components/TeacherNotificationTab.jsx`

Technical summary:

- Lifted statistics and resource loading (exams, assignments, submissions, attempts, alerts, notifications) to the parent `ClassroomDetailPage.jsx` page.
- Created `ClassDetailHeader` presenting title, status badge, copyable join code badge, and right-hand buttons row (`Tạo bài tập`, `Tạo bài thi`, `Gửi thông báo`).
- Created `ClassQuickStats` rendering members count, assignments, exams, submission rate, and warnings.
- Created `ClassOverviewPanel` with 2-column layout. Implemented pending tasks logic grouping ungraded assignments, upcoming exams, missing submissions, and anti-cheat anomalies.
- Implemented segmented sticky tab bar with backdrop blur.
- Implemented query string triggers (`tab=assignments&create=1` and `tab=notifications&create=1` to auto-open forms; `assignmentId={id}` to auto-expand and scroll to specific assignment cards).
- Standardized empty states and added form cancel option in classroom edit form.

Validation:

- Frontend builds successfully (`npm run build`).

---

## Feature: Redesign Teacher Classrooms Layout & Filter Toolbar

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Redesign Teacher Classrooms Layout & Filter Toolbar.
- Purpose and user/business impact: Improve classrooms management UX for teachers. Provides real-time stats count summary (students, assignments, exams, anomalies), instant filtering by search term and status, and compact cards with shortcuts like Xem lớp and Gửi thông báo.
- Files or modules changed: `ClassroomListPage.jsx`, `ClassroomSummary.jsx` (New), `ClassroomToolbar.jsx` (New), `TeacherClassroomCard.jsx` (New).

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/components/ClassroomSummary.jsx`
- `frontend/src/features/classrooms/components/ClassroomToolbar.jsx`
- `frontend/src/features/classrooms/components/TeacherClassroomCard.jsx`

Technical summary:

- Replaced hero section for teachers with a compact title + primary button row.
- Built a metrics enrichment engine inside the classrooms list page, fetching exams, assignments, and attempts in parallel to aggregate metrics per classroom.
- Created `ClassroomSummary` displaying managed classrooms, student enrollments, open assignments, and active exams.
- Created `ClassroomToolbar` featuring inline search (name or join code), status dropdowns (Tất cả, Đang mở, Đã đóng), and sort order selectors (Mới nhất, Tên A-Z, Nhiều sinh viên nhất).
- Created `TeacherClassroomCard` styled with clean borders, hover elevations, copyable mono-styled join codes, compact stats, open/closed status badges, and quick links to details and notification tab.

Validation:

- Frontend builds successfully (`npm run build`).

---

## Fix: Define Missing Brand Color Variables for Notification UI

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Define Missing Brand Color Variables for Notification UI.
- Purpose and user/business impact: Resolves the issue where students did not see the unread notification count badge on the bell icon, nor the unread notification indicators in the inbox.
- Files or modules changed: `index.css`.

Changed files:

- `frontend/src/index.css`

Technical summary:

- Defined `--color-brand` as `#1d4ed8` in `@theme` and `:root` configurations.
- Defined `--color-brand` as `#60a5fa` in the dark theme `[data-theme="dark"]` configuration.
- This ensures classes like `bg-brand`, `text-brand`, `border-brand/20`, and `ring-brand/10` resolve to the brand's blue highlight color, making the notification badge count and unread dots visible.

Validation:

- Frontend builds successfully (`npm run build`).

---

## Feature: Teacher Dashboard Layout & Sidebar Redesign

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Teacher Dashboard Layout & Sidebar Redesign.
- Purpose and user/business impact: Improve usability, readability, and speed of access to vital teacher metrics and actions. Placing the activity chart at the top lets teachers see student engagement immediately, and the lighter navy sidebar combined with clearer active state highlights improves navigation flow.
- Files or modules changed: `TeacherDashboardPage.jsx`, `index.css`.

Changed files:

- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/index.css`

Technical summary:

- Changed sidebar color variable `--color-obsidian` from `#0b1120` to `#1E293B`.
- Updated `.eg-sidebar-link-active` background to `#243b55` and replaced the blue gradient with a subtle white border/inset shadow.
- Replaced the large page hero with a header row featuring "Dashboard giảng viên" title and quick action buttons for `Tạo bài tập`, `Tạo đề thi`, and `Gửi thông báo`.
- Mapped and reordered 6 KPI cards (`Lớp`, `Sinh viên`, `Bài kiểm tra`, `Bài tập`, `Tỉ lệ nộp bài`, `Cảnh báo bất thường`) in a single responsive row, ensuring no text wrapping via CSS `whitespace-nowrap truncate min-w-0`.
- Moved the "Hoạt động 7 ngày gần nhất" line chart up to sit side-by-side with "Cơ cấu trạng thái bài kiểm tra".
- Stripped all subheadings and descriptive helper text from dashboard cards to maintain a clean title-only presentation.
- Synchronized loading skeletons to match the new structure.

Validation:

- Frontend builds successfully (`npm run build`).
- Visual check passes: layout fits laptop screens without vertical bloat, navigation items are highly visible.

---

## Fix: Student Notifications Bell Count & Navigation Updates

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: Student notifications bell count and navigation updates.
- Purpose and user/business impact: Resolves the issue where students did not see their unread count badge update immediately after a teacher published a notification. Added a "Xem thông báo" sidebar item for students, and cleaned up unused "Thông báo" and "Giám sát thi" items from the Teacher sidebar.
- Files or modules changed: `NotificationService.cs`, `roleRoutes.js`, `Sidebar.jsx`.

Changed files:

- `backend/EduGuard.Infrastructure/Notifications/notification-service.cs`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/components/layout/Sidebar.jsx`

Technical summary:

- Injected `INotificationNotifier` into `NotificationService` and invoked `SendToUserAsync` for every active student in the classroom when a notification is created.
- Added "Xem thông báo" for role Student pointing to `/notifications`.
- Removed "Thông báo" and "Giám sát thi" from `ROLE_NAVIGATION_ITEMS.Teacher`.
- Mapped "Xem thông báo" to the `FiBell` icon in the sidebar.

Validation:

- Backend compiles successfully (`dotnet build`).
- Frontend builds successfully (`npm run build`).

---

## Feature: System Classroom Notifications

Date: 2026-06-25

Branch/source: `devH`

Description:

- Feature or fix name: System Classroom Notifications.
- Purpose and user/business impact: Enables teachers to send notifications to their students within classrooms they manage. Students receive these notifications, see unread counts on the header bell icon, and can mark notifications as read individually or all at once.
- Files or modules changed: Backend entities (Notification, UserNotification, ApplicationUser, Classroom), EF Core configurations, DTOs, INotificationService, NotificationService, NotificationsController, frontend api (notificationApi.js), AppRoutes, teacher workspace tabs, TeacherNotificationTab, TeacherClassroomWorkspace, NotificationsPage, TopBar.

Changed files:

- `backend/EduGuard.Domain/Entities/Notification.cs`
- `backend/EduGuard.Domain/Entities/UserNotification.cs`
- `backend/EduGuard.Domain/Entities/ApplicationUser.cs`
- `backend/EduGuard.Domain/Entities/Classroom.cs`
- `backend/EduGuard.Infrastructure/Data/Configurations/notification-configuration.cs`
- `backend/EduGuard.Infrastructure/Data/Configurations/user-notification-configuration.cs`
- `backend/EduGuard.Infrastructure/Data/app-db-context.cs`
- `backend/EduGuard.Application/DTOs/Notifications/CreateNotificationRequest.cs`
- `backend/EduGuard.Application/DTOs/Notifications/NotificationDto.cs`
- `backend/EduGuard.Application/DTOs/Notifications/ClassroomNotificationDto.cs`
- `backend/EduGuard.Application/DTOs/Notifications/UnreadCountDto.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-notification-service.cs`
- `backend/EduGuard.Infrastructure/Notifications/notification-service.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Api/Controllers/notifications-controller.cs`
- `backend/EduGuard.Infrastructure/Assignments/assignment-service.cs`
- `frontend/src/api/notificationApi.js`
- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/features/classrooms/components/teacher-classroom-tabs.js`
- `frontend/src/features/classrooms/components/TeacherNotificationTab.jsx`
- `frontend/src/features/classrooms/components/TeacherClassroomWorkspace.jsx`
- `frontend/src/features/notifications/pages/NotificationsPage.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Designed `Notification` and `UserNotification` EF core schemas with Cascade deletes for UserNotifications on Notification/User deletes, and Restrict deletes on Sender.
- Implemented `NotificationService` for managing and delivering classroom-targeted notifications, checking permissions, querying active members, counting unread statuses, and batch database modifications. Added query support for fetching notifications sent to a specific classroom (`GetClassroomNotificationsAsync`).
- Exposed JWT secured endpoints under `NotificationsController` mapping to the notification service operations, including `GET /api/notifications/classroom/{classroomId}`.
- Added `notificationApi.js` in frontend for Axios interactions with backend API endpoints.
- Re-architected `TeacherNotificationTab` UI: it now displays the list of notifications sent inside the classroom. Clicking a new "Tạo thông báo" button toggles a form card to create notifications, which closes and refreshes the list on success.
- Added `NotificationsPage` for students displaying notifications list with relative dates and reading status.
- Updated `TopBar` bell icon badge count, listing the latest 5 unread alerts, and managing read updates. Removed verbose descriptions in empty state and dropdown headers.

Validation:

- Ran backend build successfully via `dotnet build`.
- Migration created and database updated successfully using local `dotnet-ef` 8.0.0 tool.

Known risks / rollback / follow-up:

- Normalizing user primary keys as `string` to match the project's default ASP.NET Core Identity configuration, rather than using `int` as initially specified.
- Rollback: Revert database migration `AddNotificationEntities` and remove the added file changes.

## Feature: Teacher exam create CTA native form submit

Date: 2026-06-21

Branch/source: `devH`

Description:

- Feature or fix name: Teacher exam create CTA native form submit.
- Purpose and user/business impact: Prevent teachers from hitting a dead-looking footer `Tạo đề` button in the exam create flow by wiring the primary CTA directly to the form submission lifecycle.
- Files or modules changed: teacher exam list/create flow page, main changelog, and project changelog.

Changed files:

- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Removed the callback-ref submit bridge (`createExamSubmitRef` / `onRegisterSubmit`) from the Teacher exam create flow page.
- Assigned a stable `formId` to `ExamForm` in `ExamListPage.jsx` and switched the footer CTA to native HTML form submission with `type="submit"` and `form={createExamFormId}`.
- Kept the existing disabled-state guards (`isSubmitting`, `isQuestionSubmitting`, `isImportSubmitting`) intact, so only the submit trigger path changed.

Validation:

- Ran `npm run build -- --outDir temp-build-exam-create-check` inside `frontend/` - passed.
- Ran `npm run build` inside `frontend/` - failed to write the default `dist/` output because `public/capybara-avatar.svg -> dist/capybara-avatar.svg` returned `EPERM`; the alternate outDir build above completed successfully.

Known risks / rollback / follow-up:

- This fix addresses the Teacher exam list/create flow CTA specifically. Any future external submit buttons should use the same native `form` binding pattern instead of recreating a callback-ref bridge.
- Rollback: revert `frontend/src/features/exams/pages/ExamListPage.jsx` to restore the previous callback-ref submit wiring.
## Feature: Student assignment submission state consistency across views

Date: 2026-06-21

Branch/source: `devH`

Description:

- Feature or fix name: Student assignment submission state consistency across classroom detail and the `Bài kiểm tra -> Bài tập` view.
- Purpose and user/business impact: Prevent students from seeing `Chưa nộp` after they have already submitted an assignment that the teacher can see and grade. This keeps the assignment journey trustworthy across both student entry points.
- Files or modules changed: Assignment submission resolver helper (`assignmentHelpers.js`), classroom assignment view (`AssignmentSection.jsx`), student exam/assignment switcher page (`ExamListPage.jsx`), main changelog, project changelog, and Todo List.

Changed files:

- `frontend/src/features/assignments/assignmentHelpers.js`
- `frontend/src/features/assignments/components/AssignmentSection.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`
- `Todo List.md`

Technical summary:

- Added `resolveAssignmentSubmission()` to centralize assignment submission resolution, with backend `mySubmission` taking precedence and local cached submissions used only as a fallback when student lists refresh on another screen before the next classroom reload.
- Fixed `AssignmentSection.jsx` to restore a valid `classroomId`-based loader, update the local student submission map during async loads instead of inside a synchronous effect, and write successful submissions back into both the cache and current assignment card state.
- Updated the student assignment tab inside `ExamListPage.jsx` to reuse the same submission resolver and shared assignment status/deadline badges, eliminating the mismatch where teachers could already see the submission but students still saw `Chưa nộp`.

Validation:

- Ran `npm run build` inside `frontend/` - passed.
- Ran `npx eslint src/features/assignments/assignmentHelpers.js src/features/assignments/components/AssignmentSection.jsx src/features/exams/pages/ExamListPage.jsx` inside `frontend/` - passed.

Known risks / rollback / follow-up:

- The local cache is now intentionally a fallback only. Backend `mySubmission` remains the primary source of truth, so any future submission payload changes must keep that DTO populated consistently.

## Feature: Proctoring ops — WebRTC NAT + AI Docker

Date: 2026-06-25

Branch/source: `feat/live-proctoring-control-room` → `release`

Description:

- Purpose: Production readiness for live proctoring — TURN documentation, cleaner ICE server JSON, Dockerized YOLO service.
- Files: `docs/proctoring-webrtc-nat.md`, `ai-services/proctoring-ai-service/Dockerfile`, `docker-compose.yml`, `web-rtc-config-service.cs`, `appsettings.Development.json`.

Validation:

- `dotnet build` — pending in merge commit
- `docker compose config` — optional local

Unresolved questions: None.

---

## Feature: Live Proctoring Control Room v1

Date: 2026-06-25

Branch/source: `feat/live-proctoring-control-room`

Description:

- Feature or fix name: EduGuard Live Proctoring Control Room v1.
- Purpose and user/business impact: Teachers monitor live student cameras during exams with risk-prioritized grid, manual controls (pause/warn/snapshot/terminate), co-proctor support, and optional YOLO-assisted detection via backend proxy.
- Files or modules changed: Proctoring domain entities/migration, `ProctoringController`, `ExamMonitoringHub` WebRTC signaling, Redis watch lock, teacher/student proctoring pages, evidence storage, policy engine, AI service, admin AI settings, CheatingLog bridge, tile live preview, manual clip recorder.

Changed files (high level):

- `backend/EduGuard.Api/Controllers/proctoring-controller.cs`
- `backend/EduGuard.Api/Hubs/exam-monitoring-hub.cs`
- `backend/EduGuard.Infrastructure/Proctoring/*`
- `backend/EduGuard.Domain/Enums/CheatingType.cs`
- `frontend/src/features/proctoring/**`
- `frontend/src/api/proctoringApi.js`
- `frontend/src/features/admin/pages/AdminProctoringAiSettingsPage.jsx`
- `ai-services/proctoring-ai-service/**`
- `docs/proctoring-devB-integration.md`

Validation:

- `dotnet build` (backend) ΓÇö pass
- `npm run build` (frontend) ΓÇö pass
- `npx eslint src/features/proctoring src/api/proctoringApi.js` ΓÇö pass

Unresolved questions:

- E2E WebRTC verification across NAT / two physical devices.
- Production Ultralytics install and model tuning on AI server.
- Merge/rebase onto `devD` / `devB` per `docs/proctoring-devB-integration.md`.

---

## Feature: Student assignment sub-navigation tab and details visualizer

Date: 2026-06-21

Branch/source: `devH`

Description:

- Feature or fix name: Student assignment sub-navigation tab and details visualizer.
- Purpose and user/business impact: Allows students under the "Bài kiểm tra" (Exams) navigation tab to switch to an "Assignments" (Bài tập) list. This contains a dedicated search filter and classroom filter, letting students quickly search for their classroom tasks, expand details, and view their graded scores and feedback from teachers.
- Files or modules changed: Student exam page (`ExamListPage.jsx`), classroom assignment details view (`AssignmentSection.jsx`), assignment API model (`assignmentApi.js`), project changelog, and main changelog.

Changed files:

- `frontend/src/api/assignmentApi.js`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/assignments/components/AssignmentSection.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Updated `normalizeAssignmentDto` in `assignmentApi.js` to normalize the `mySubmission` object (if present), mapping score and feedback fields so that React can query the student's submission state.
- Added states for `studentSubTab` (exams vs assignments), classroom assignment records, searching text, loading indicators, and active expanded assignment card to `ExamListPage.jsx`.
- Aggregated classroom assignments for the active student in parallel under the initial data load and filter refresh logic of the page.
- Implemented a centered pill-shaped sub-navigation bar below the page hero header for students to toggle between assignments and exams.
- Added a conditional grid cell layout in the filter card: shows the exam schedule status dropdown when on "exams", and displays the text search query input when on "assignments".
- Formatted deadlines using `formatShortDateTime` and conditional status badges (Chưa nộp, Đã nộp (Chờ chấm), Đã chấm: X/Y điểm) depending on the presence of student submission and graded score.
- Provided an inline expandable card layout detailing the assignment's description, maximum score, submitted date, achieved points, and teacher's written comments.
- Updated `AssignmentSection.jsx` expanded student view block to show the real graded score, teacher feedback comments, and status badge when the student views their submission.

Validation:

- Verified that all edited files compile and conform to the ESLint configuration of the frontend workspace.
- Backend database maps the student's authenticated submission DTO to `MySubmission` on assignments queries.

Known risks / rollback / follow-up:

- None. The feature leverages the authenticated student session to query student-scoped assignment lists and submission properties cleanly.

## Feature: Full Role-Based Dashboard Redesign and Real-Data API Integration

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: Full Role-Based Dashboard Redesign and Real-Data API Integration.
- Purpose and user/business impact: Replace all remaining mocked dashboard and monitoring data with real-time statistics aggregated from live backend APIs for Admin, Teacher, and Student roles. Modernize the dashboard visual interfaces to feel premium, responsive, and provide transparency on backend capabilities with loaders, skeletons, and retry actions.
- Files or modules changed: API aggregation layer (`dashboardApi.js`), Admin control center page (`AdminDashboardPage.jsx`), Admin monitoring page (`AdminMonitoringPage.jsx`), Teacher workspace page (`TeacherDashboardPage.jsx`), and Student learning progress page (`StudentDashboardPage.jsx`).

Changed files:

- `frontend/src/api/dashboardApi.js`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/admin/pages/AdminMonitoringPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`

Technical summary:

- Restructured the front-end API layer in `dashboardApi.js` to dynamically fetch and aggregate data from live backend REST endpoints (`userApi`, `classroomApi`, `examApi`, `examAttemptApi`, `antiCheatApi`, `assignmentApi`) for all roles, removing syntax errors and mock leftovers.
- Redesigned `AdminDashboardPage.jsx` and `AdminMonitoringPage.jsx` to show live statistics, system health statuses, recent activities, and high-risk logs. Added a live SignalR hub health check hook that dynamically updates the indicator based on active hub connections.
- Cleaned up the Teacher dashboard `bg-neutral` styles, replacing them with standard theme-compliant variables (`bg-surface-sunken`/`bg-surface`).
- Redesigned `StudentDashboardPage.jsx` to load joined classrooms and upcoming exams from live APIs. For unsupported backend statistics (attempt history, global submissions, warning counts), added clear disclosure alerts and badges (`Thiếu API` / `Yêu cầu API Backend`) explaining the missing backend capabilities.
- Added animated loading skeletons and error alert states with retry actions across all dashboard pages to provide a fluid, robust user experience.

Validation:

- Ran production build check `npm run build` inside `frontend/` - completed successfully with zero errors.
- Ran backend and pre-commit tests `npm test` - completed successfully.

Known risks / rollback / follow-up:

- Student notifications and attempts are marked as pending backend API availability. Once the backend introduces these APIs, the frontend adapters should be updated to query them directly.

## Feature: System-wide UX/UI Redesign and Design System Standardization

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: System-wide UX/UI Redesign and Design System Standardization.
- Purpose and user/business impact: Modernize the entire visual interface of the platform across all roles (Admin, Teacher, Student) to present a premium, unified, SaaS-like aesthetic with responsive layouts and dark/light mode consistency.
- Files or modules changed: Global styles (`index.css`), shared components (`StatCard.jsx`, `MetricBarList.jsx`, `TimelineList.jsx`), Authentication layout/pages (`AuthLayout.jsx`, `GoogleAuthButton.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`), Admin pages, Student pages, Teacher pages, and Profile/ExamAttempt shared screens.

Changed files:

- `frontend/src/index.css`
- `frontend/src/components/dashboard/StatCard.jsx`
- `frontend/src/components/dashboard/MetricBarList.jsx`
- `frontend/src/components/dashboard/TimelineList.jsx`
- `frontend/src/features/auth/components/AuthLayout.jsx`
- `frontend/src/features/auth/components/GoogleAuthButton.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/admin/pages/AdminMonitoringPage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `frontend/src/features/dashboard/pages/StudentDashboardPage.jsx`
- `frontend/src/features/classrooms/pages/JoinClassroomPage.jsx`
- `frontend/src/features/dashboard/pages/TeacherDashboardPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/anti-cheat/pages/TeacherMonitoringPage.jsx`
- `frontend/src/features/results/pages/TeacherResultsPage.jsx`
- `frontend/src/features/assignments/pages/TeacherAssignmentListPage.jsx`
- `frontend/src/features/notifications/pages/TeacherNotificationsPage.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`

Technical summary:

- Appended a comprehensive design system library to `index.css` supporting customized cards, step indicators, system health badges, realtime pulses, custom metric bars, timeline tracks, and heroes.
- Rewrote core visual dashboard components: upgraded `StatCard` with trend and tone styles; `MetricBarList` with modern gradient fill tracks; `TimelineList` with indicator dots and hover slide animations.
- Revamped the Authentication modules: implemented a 2-column branding layout with modern SaaS graphics, feature badges, custom Google OAuth buttons, and a 4-step wizard registration flow.
- Redesigned Admin, Student, and Teacher workspaces to pull hero headers (`eg-page-hero`), structured cards, unified status badges, and cleaner data layouts.
- Refactored `ProfilePage.jsx` and `ExamAttemptPage.jsx` to replace browser-default `bg-neutral` styles with `bg-surface-sunken` or `bg-surface` to secure clean light/dark theme compliance.

Validation:

- Compiled production build successfully (`npm run build` in `frontend/` folder completed with zero errors).
- Executed dotnet unit test runner successfully (`dotnet test` passed).

Known risks / rollback / follow-up:

- None. Visual changes are thoroughly checked against structural code, ensuring compatibility with all roles.

## Feature: Teacher classroom detail action simplification

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: Teacher classroom detail action simplification.
- Purpose and user/business impact: Giß║úm ─æß╗Ö rß╗æi ß╗ƒ trang chi tiß║┐t lß╗¢p hß╗ìc cß╗ºa Teacher bß║▒ng c├ích l├ám nß╗òi bß║¡t thao t├íc sao ch├⌐p m├ú lß╗¢p, bß╗Å c├íc n├║t tß║ío b├ái tß║¡p/─æß╗ü thi ngay tr├¬n header, v├á dß╗ôn viß╗çc xem th├ánh vi├¬n vß╗ü ─æ├║ng tab `Th├ánh vi├¬n` ─æß╗â tab `Tß╗òng quan` chß╗ë c├▓n th├┤ng tin lß╗¢p v├á h├ánh ─æß╗Öng quß║ún trß╗ï.
- Files or modules changed: classroom detail page cß╗ºa Teacher, changelog ch├¡nh, project changelog, v├á Todo List.

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `CHANGELOG.md`
- `docs/project-changelog.md`
- `Todo List.md`

Technical summary:

- R├║t gß╗ìn `PageHeader` cß╗ºa classroom detail ─æß╗â vß╗¢i role kh├íc Student chß╗ë c├▓n n├║t `Sao ch├⌐p m├ú lß╗¢p`; ri├¬ng luß╗ông Teacher giß╗¥ d├╣ng CTA primary ─æß╗â thao t├íc n├áy nß╗òi bß║¡t h╞ín khi v├áo chß╗⌐c n─âng lß╗¢p hß╗ìc.
- Bß╗Å block preview th├ánh vi├¬n ß╗ƒ tab `Tß╗òng quan` cß╗ºa Teacher v├¼ danh s├ích th├ánh vi├¬n ─æ├ú c├│ tab chuy├¬n biß╗çt `Th├ánh vi├¬n`.
- Thay panel phß╗Ñ ß╗ƒ `Tß╗òng quan` bß║▒ng ─æ├║ng hai n├║t nß║▒m ngang `Chß╗ënh sß╗¡a lß╗¢p hß╗ìc` v├á `Xo├í Lß╗¢p hß╗ìc` nh╞░ y├¬u cß║ºu UI.
- Giß╗» lß║íi `CreateClassroomForm` d├╣ng chung cho update, nh╞░ng ─æß╗òi sang chß╗ë hiß╗ân thß╗ï sau khi Teacher bß║Ñm `Chß╗ënh sß╗¡a lß╗¢p hß╗ìc`, v├á tß╗▒ ─æ├│ng lß║íi sau khi cß║¡p nhß║¡t th├ánh c├┤ng ─æß╗â layout tß╗òng quan vß║½n gß╗ìn.

Validation:

- `npm exec eslint src/features/classrooms/pages/ClassroomDetailPage.jsx` (run in `frontend/`) - passed.
- `npm run build` (run in `frontend/`) - passed; Vite vß║½n b├ío c├íc warning ─æ├ú tß╗ôn tß║íi tß╗½ `@microsoft/signalr` vß╗ü `INVALID_ANNOTATION` v├á chunk lß╗¢n, nh╞░ng bundle ─æ╞░ß╗úc tß║ío th├ánh c├┤ng.

Known risks / rollback / follow-up:

- Teacher cß║ºn th├¬m mß╗Öt lß║ºn bß║Ñm ─æß╗â mß╗ƒ form chß╗ënh sß╗¡a lß╗¢p hß╗ìc; ─æ├óy l├á ─æ├ính ─æß╗òi c├│ chß╗º ─æ├¡ch ─æß╗â m├án tß╗òng quan gß╗ìn h╞ín.
- Tab `Th├ánh vi├¬n` hiß╗çn vß║½n giß╗» cß║ú danh s├ích th├ánh vi├¬n c╞í bß║ún lß║½n card thß╗æng k├¬ theo sinh vi├¬n; nß║┐u muß╗æn tiß║┐p tß╗Ñc r├║t gß╗ìn nß╗»a th├¼ cß║ºn chß╗æt lß║íi phß║ím vi hiß╗ân thß╗ï cß╗ºa tab n├áy ß╗ƒ l╞░ß╗út sau.

## Docs: Frontend inventory Excel workbook

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: Frontend inventory Excel workbook.
- Purpose and user/business impact: Tß║ío mß╗Öt workbook Excel dß╗à tra cß╗⌐u ─æß╗â ─æß╗ìc nhanh to├án bß╗Ö c├óy th╞░ mß╗Ñc `frontend`, hiß╗âu vai tr├▓ cß╗ºa tß╗½ng th╞░ mß╗Ñc v├á tß╗çp, ─æß╗ông thß╗¥i xem sß╗æ l╞░ß╗úng/chß╗⌐c n─âng c├íc h├ám trong nhß╗»ng file m├ú nguß╗ôn do dß╗▒ ├ín sß╗ƒ hß╗»u.
- Files or modules changed: workbook t├ái liß╗çu frontend, script sinh workbook, v├á project changelog.

Changed files:

- `docs/doc_hieu.xlsx`
- `docs/doc_hieu.xlxn`
- `temp/generate_frontend_inventory_excel.py`
- `docs/project-changelog.md`

Technical summary:

- Qu├⌐t to├án bß╗Ö `frontend/` ─æß╗â lß║¡p c├óy th╞░ mß╗Ñc, ph├ón loß║íi th╞░ mß╗Ñc m├ú nguß╗ôn, t├ái sß║ún t─⌐nh, cß║Ñu h├¼nh v├á artifact build/debug.
- Ph├ón t├¡ch c├íc file `.js/.jsx/.ts/.tsx` thuß╗Öc m├ú nguß╗ôn dß╗▒ ├ín bß║▒ng Babel AST ─æß╗â lß║Ñy danh s├ích h├ám c├│ t├¬n, loß║íi h├ám, d├▓ng bß║»t ─æß║ºu v├á tham sß╗æ.
- Sinh workbook nhiß╗üu sheet gß╗ôm `TongQuan`, `CayThuMuc`, `ThuMuc`, `TapTin`, `Ham`, c├│ freeze pane, filter, tß╗▒ gi├ún cß╗Öt v├á m├┤ tß║ú tiß║┐ng Viß╗çt ─æß╗â ─æß╗ìc nhanh.
- Ghi th├¬m bß║ún sao `docs/doc_hieu.xlxn` theo ─æ├║ng ─æ╞░ß╗¥ng dß║½n ng╞░ß╗¥i d├╣ng y├¬u cß║ºu, ─æß╗ông thß╗¥i giß╗» `docs/doc_hieu.xlsx` l├á bß║ún mß╗ƒ trß╗▒c tiß║┐p t╞░╞íng th├¡ch vß╗¢i Excel.

Validation:

- `python -m py_compile temp/generate_frontend_inventory_excel.py` - passed.
- `python temp/generate_frontend_inventory_excel.py` - passed; sinh `96` th╞░ mß╗Ñc, `501` tß╗çp v├á `680` h├ám v├áo workbook.
- `python -c "from openpyxl import load_workbook; import json; wb=load_workbook(r'docs/doc_hieu.xlsx', read_only=True); ws=wb['TongQuan']; ws2=wb['TapTin']; payload={'sheets': wb.sheetnames, 'a1': ws['A1'].value, 'a2': ws['A2'].value, 'headers': [c.value for c in next(ws2.iter_rows(min_row=1, max_row=1))], 'sample': [c.value for c in next(ws2.iter_rows(min_row=2, max_row=2))]}; print(json.dumps(payload, ensure_ascii=True))"` - passed.

Known risks / rollback / follow-up:

- M├┤ tß║ú chß╗⌐c n─âng tß╗çp v├á h├ám hiß╗çn ─æ╞░ß╗úc suy ra tß╗½ t├¬n file, t├¬n h├ám v├á vß╗ï tr├¡ th╞░ mß╗Ñc; ─æ├óy l├á t├ái liß╗çu ─æß╗ïnh h╞░ß╗¢ng ─æß╗ìc code, kh├┤ng phß║úi ─æß║╖c tß║ú nghiß╗çp vß╗Ñ chuß║⌐n h├│a thß╗º c├┤ng tß╗½ng h├ám.
- C├íc th╞░ mß╗Ñc phß╗Ñ thuß╗Öc nh╞░ `node_modules` bß╗ï loß║íi trß╗½ khß╗Åi chi tiß║┐t, v├á c├íc file build/minified hoß║╖c DLL chß╗ë ─æ╞░ß╗úc giß╗» ß╗ƒ mß╗⌐c artifact ─æß╗â workbook kh├┤ng ph├¼nh qu├í mß╗⌐c.
- ─Éu├┤i `.xlxn` kh├┤ng phß║úi ─æu├┤i Excel chuß║⌐n; nß║┐u cß║ºn mß╗ƒ trß╗▒c tiß║┐p, d├╣ng `docs/doc_hieu.xlsx` hoß║╖c ─æß╗òi lß║íi ─æu├┤i `.xlsx`.

## Feature: Teacher exam upload preview flow and final save placement

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: Teacher exam upload preview flow and final save placement.
- Purpose and user/business impact: Let teachers review parsed questions and answers from uploaded files before importing them into an exam, while making the main `L╞░u ─æß╗ü` action appear at the end of the create flow so the final confirmation step matches the full drafting workflow.
- Files or modules changed: teacher exam form, question workspace/review cards, exam create page, exam detail page, Todo List, main changelog, and project changelog.

Changed files:

- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/QuestionCard.jsx`
- `frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `Todo List.md`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Added a `formId`/`hideSubmitButton` path in the shared exam form so the Teacher create flow can keep exam metadata at the top while rendering the final save button at the bottom of the drafting workspace.
- Unified teacher file upload handling around `examApi.previewQuestionImportFile()`: when the selected file passes frontend extension/size checks, the frontend now calls the backend preview endpoint immediately instead of only staging the file.
- Reworked the teacher question workspace import mode so backend preview results render as a dedicated review list with visible questions and answers before the user commits them into the draft exam or the persisted exam.
- Updated both `ExamListPage` and `ExamDetailPage` to keep preview state (`staged file`, preview questions, row-level import errors, review info message) separate from the real question bank, and only persist questions after explicit commit.
- Updated the Teacher create-flow final save handler so it now merges draft questions with previewed import questions, saves them on the first create, keeps empty exams as draft, and auto-publishes immediately when the final saved question count is greater than zero.
- Sanitized draft/preview answer IDs in the shared exam write payload so temporary string IDs from local draft state are converted to `null` before hitting the backend create endpoint, eliminating the `400` deserialization failure on first save.
- Simplified the final create-flow action area to keep only the button, and removed the extra in-page "backend ─æ├ú ph├ón t├¡ch..." import success copy while keeping the actual review list visible.
- Replaced the final create CTA form linkage from passive DOM submit wiring with a registered submit callback from `ExamForm`, so the `Tß║ío ─æß╗ü` button reliably triggers validation and save in the create-flow layout.
- Hid the `Th├¬m v├áo ─æß╗ü nh├íp` button in draft file-import mode; previewed questions are now only reviewed there and then saved automatically with the final exam create action.
- Converted import preview questions into editable local draft state in both create and detail workspaces, so teachers can edit review questions directly and the final save/commit path now creates real questions from the edited preview instead of re-importing the original file.

Validation:

- `npm --prefix .\frontend exec eslint frontend/src/features/exams/components/ExamForm.jsx frontend/src/features/exams/components/QuestionCard.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/pages/ExamListPage.jsx frontend/src/features/exams/pages/ExamDetailPage.jsx` - passed.
- `npm --prefix .\frontend exec eslint frontend/src/features/exams/pages/ExamListPage.jsx` - passed after the create-flow auto-publish fix.
- `npm --prefix .\frontend exec eslint frontend/src/api/examApi.js frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/pages/ExamListPage.jsx frontend/src/features/exams/pages/ExamDetailPage.jsx` - passed after the create-payload sanitation and UI cleanup.
- `npm --prefix .\frontend exec eslint frontend/src/features/exams/pages/ExamListPage.jsx frontend/src/features/exams/components/QuestionImportPanel.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx` - passed after the explicit create submit handler and draft-import button removal.
- `npm --prefix .\frontend exec eslint frontend/src/features/exams/components/ExamForm.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/pages/ExamListPage.jsx frontend/src/features/exams/pages/ExamDetailPage.jsx` - passed after the direct submit callback and editable import-review persistence changes.
- `npm --prefix .\frontend run build` - passed; Vite still reports pre-existing SignalR `INVALID_ANNOTATION` warnings and the existing large chunk warning, but the production build completed successfully.

Known risks / rollback / follow-up:

- Import review currently uses the backend preview response only for teacher confirmation; if the backend parser changes field semantics, the review card should be rechecked to keep labels/counts aligned.
- The create-flow save button is now intentionally separated from the metadata form; rollback would mean restoring the original inline submit button inside `ExamForm` for `ExamListPage`.

## Fix: Auth invalid-login refresh and exam import build blockers

Date: 2026-06-20

Branch/source: `devH`

Description:

- Feature or fix name: Auth invalid-login refresh and exam import build blockers.
- Purpose and user/business impact: Prevent the login page from refreshing away inline auth errors on wrong credentials, and restore clean backend compilation for the question import flow so auth and exam features remain testable end-to-end.
- Files or modules changed: frontend auth transport, backend exam import service/controller, Todo List, main changelog, and project changelog.

Changed files:

- `frontend/src/api/axiosClient.js`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `Todo List.md`
- `CHANGELOG.md`
- `docs/project-changelog.md`

Technical summary:

- Updated the global axios `401` interceptor to redirect to `/login` only when a real stored access token exists, so `POST /api/auth/login` failures remain on the current page and can render inline errors without losing the user's form input.
- Replaced the method-group form `previewQuestions.Select(ExamMapper.MapQuestion)` with an explicit lambda so C# can resolve the preview mapping in the exam import flow.
- Removed the duplicate `var file = request.File;` declaration in the teacher/admin question import action, unblocking compilation of the exams controller path.

Validation:

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -o .\temp\backend-check-auth-exam-fixes` - passed with 0 warnings and 0 errors.
- `npm --prefix frontend exec eslint .\frontend\src\api\axiosClient.js` - passed.
- `npm --prefix frontend run build` - passed.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj` on the default `bin\Debug` output is still blocked locally by locked files from `EduGuard.Api (PID 2780)` and Visual Studio handles, so the temp output build was used for clean verification.

Known risks / rollback / follow-up:

- The client still intentionally redirects to `/login` for expired or invalid authenticated sessions; the change only stops unauthenticated login failures from causing a hard page refresh.
- Local in-place backend builds remain sensitive to running API/Visual Studio file locks; stop those processes before rebuilding into the default output if needed.

## Feature: Redis cache & attempt presence (Phase 9)

Date: 2026-06-19

Branch/source: local dev

Description:

- Tích hợp Redis cache-aside cho question bank giáo viên và anti-cheat summary (TTL 45s).
- Thêm heartbeat/presence theo attempt (Hash + Set index, TTL sliding 120s).
- Graceful degradation: Redis down hoặc `Redis:Enabled=false` → fallback DB / no-op.

Changed files:

- `backend/EduGuard.Application/Services/Interfaces/i-cache-service.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-attempt-presence-service.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-cache-invalidator.cs`
- `backend/EduGuard.Application/Options/redis-options.cs`
- `backend/EduGuard.Application/Redis/redis-key-names.cs`
- `backend/EduGuard.Application/DTOs/Exams/attempt-heartbeat-request.cs`
- `backend/EduGuard.Infrastructure/Redis/*`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/anti-cheat-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `backend/EduGuard.Api/Controllers/exam-attempts-controller.cs`
- `backend/EduGuard.Api/appsettings.json`
- `frontend/src/api/examAttemptApi.js`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` — passed.
- `dotnet test` — passed.

## Feature: Teacher import template standardization

Date: 2026-06-20

Branch/source: `devB`

Description:

- Feature or fix name: Teacher import template standardization.
- Purpose and user/business impact: Teachers/Admins download clearer import templates with descriptive no-accent file names, while all five supported upload formats remain parseable by the backend.
- Files or modules changed: backend template resources, exam controller template metadata, question import parser, template documentation, Todo List, main changelog, and project changelog.

Changed files:

- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `backend/EduGuard.Api/Resources/QuestionImportTemplates/`
- `backend/EduGuard.Infrastructure/Exams/question-import-parser.cs`
- `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md`
- `docs/11_QUESTION_IMPORT_TEMPLATE_USAGE.md`
- `docs/Huong_Dan_Su_Dung_File_Mau_Import_De.docx`
- `docs/Huong_Dan_Su_Dung_File_Mau_Import_De.pdf`
- `docs/README.md`
- `Todo List.md`
- `CHANGELOG.md`
## Feature: Teacher shell and classroom workspace aligned with ui_tech spec

Date: 2026-06-20

Branch/source: `devH`

Description:

- ─Éß╗ông bß╗Ö lß║íi khu vß╗▒c Teacher vß╗¢i `docs/ui_tech.md` ß╗ƒ c├íc lß╗çch lß╗¢n nhß║Ñt cß╗ºa frontend: ─æiß╗üu h╞░ß╗¢ng thiß║┐u mß╗Ñc, top bar ch╞░a c├│ search/quick-create, classroom detail ch╞░a c├│ tab nghiß╗çp vß╗Ñ, v├á ch╞░a c├│ c├íc page teacher ri├¬ng cho b├ái tß║¡p, gi├ím s├ít thi, kß║┐t quß║ú, th├┤ng b├ío.
- Giß╗» nguy├¬n API contract hiß╗çn c├│, ╞░u ti├¬n dß╗▒ng lß║íi luß╗ông teacher tß╗½ dß╗» liß╗çu thß║¡t ─æang c├│ thay v├¼ th├¬m mock mß╗¢i.
- Tß║¡n dß╗Ñng notification/local realtime ─æ├ú c├│ sß║╡n ─æß╗â bell dropdown v├á trang `Th├┤ng b├ío` d├╣ng chung mß╗Öt nguß╗ôn dß╗» liß╗çu, tr├ính lß╗çch giß╗»a shell v├á detail page.

Changed files:

- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/components/layout/TeacherShellSearch.jsx`
- `frontend/src/components/layout/TeacherQuickCreateButton.jsx`
- `frontend/src/features/notifications/notificationStorage.js`
- `frontend/src/features/notifications/components/RealtimeNotificationListener.jsx`
- `frontend/src/features/notifications/pages/TeacherNotificationsPage.jsx`
- `frontend/src/features/results/pages/TeacherResultsPage.jsx`
- `frontend/src/features/anti-cheat/pages/TeacherMonitoringPage.jsx`
- `frontend/src/features/assignments/components/AssignmentForm.jsx`
- `frontend/src/features/assignments/pages/TeacherAssignmentListPage.jsx`
- `frontend/src/features/classrooms/components/TeacherClassroomWorkspace.jsx`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Replaced the previous 20 backend template files with the teacher-focused template set from `Bo_File_Mau_Import_De_Cho_Giang_Vien`, renamed to no-accent ASCII names such as `Mau_De_Thi_Trac_Nghiem_Mot_Dap_An.xlsx`.
- Updated the template whitelist metadata so `GET /api/exams/question-import/templates` and template downloads expose only the new no-accent file names.
- Added the teacher usage guide as `docs/11_QUESTION_IMPORT_TEMPLATE_USAGE.md`, plus the provided DOCX/PDF guide files with no-accent names, and refreshed `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md` to match the new standard.
- Fixed DOCX parsing for templates where each question is in a Word table cell with `<w:br/>` line breaks.
- Extended PDF text extraction to decode `/ToUnicode` CMap hex text operators, so the new text-based PDF templates are importable instead of being rejected as unreadable PDFs.

Validation:

- `dotnet restore backend\EduGuard.Api\EduGuard.Api.csproj --ignore-failed-sources` passed using local package cache after NuGet signature checks attempted network access.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore -o temp\backend-template-standard-build` passed with 0 warnings and 0 errors.
- Smoke-tested all 20 backend template files through `QuestionImportParser`: every CSV/XLSX/TXT/DOCX/PDF template returned `questions=8` and `errors=0`.

Known risks / rollback / follow-up:

- The PDF extractor now supports the template generator's `/ToUnicode` CMap pattern; scanned image PDFs still require OCR and remain unsupported.
- Main frontend template browsing remains a separate UI task; the temporary upload test page/server was removed after manual verification.
- Rollback: restore the previous resource files and revert the controller metadata plus parser changes in this feature entry.

## Feature: Backend question import template downloads

Date: 2026-06-19

Branch/source: `devB`

Description:

- Feature or fix name: Backend question import template downloads.
- Purpose and user/business impact: Teachers/Admins can list and download official import templates directly from the backend, so template files used by the import workflow stay versioned with the application instead of living only in local Downloads.
- Files or modules changed: backend API controller, API project resources, import template DTO, imported template documentation, API/feature tracking, Todo List, and project changelog.
- Teacher sidebar nay khß╗¢p spec h╞ín vß╗¢i ─æß║ºy ─æß╗º menu `Dashboard`, `Lß╗¢p hß╗ìc`, `B├ái tß║¡p`, `─Éß╗ü thi`, `Gi├ím s├ít thi`, `Kß║┐t quß║ú`, `Th├┤ng b├ío`, `Hß╗ô s╞í`, ─æß╗ông thß╗¥i bß╗ò sung icon/active-state cho c├íc route mß╗¢i.
- Top bar ─æ╞░ß╗úc n├óng cß║Ñp th├ánh shell l├ám viß╗çc thß╗▒c sß╗▒ cho Teacher: search thß║¡t tr├¬n classroom/exam/assignment/student, quick-create dropdown ─æi thß║│ng tß╗¢i `Tß║ío lß╗¢p hß╗ìc`, `Tß║ío b├ái tß║¡p`, `Tß║ío ─æß╗ü thi`, v├á dropdown th├┤ng b├ío c├│ lß╗æi mß╗ƒ sang trang danh s├ích th├┤ng b├ío.
- Th├¬m c├íc page teacher mß╗¢i d├╣ng dß╗» liß╗çu thß║¡t hiß╗çn c├│: assignment center vß╗¢i grading workspace, monitor list/detail dß╗▒a tr├¬n `AttemptMonitorPanel`, result/report page tß╗òng hß╗úp attempt + anti-cheat, v├á notification page d├╣ng chung local realtime store.
- `ClassroomDetailPage` cß╗ºa Teacher nay c├│ workspace tab `Tß╗òng quan / Hß╗ìc sinh / B├ái tß║¡p / B├ái thi / Kß║┐t quß║ú / Hoß║ít ─æß╗Öng`, gi├║p teacher xem theo ─æ├║ng ngß╗» cß║únh nghiß╗çp vß╗Ñ thay v├¼ mß╗Öt trang detail k├⌐o d├ái mß╗Öt mß║ích.
- `AssignmentForm` ─æ╞░ß╗úc mß╗ƒ rß╗Öng nhß║╣ ─æß╗â hß╗ù trß╗ú chß╗ìn lß╗¢p khi tß║ío b├ái tß║¡p tß╗½ assignment center, nh╞░ng vß║½n t╞░╞íng th├¡ch vß╗¢i flow c┼⌐ trong classroom detail.

Validation:

- `frontend\node_modules\.bin\eslint.cmd frontend\src\routes\routeConfig.js frontend\src\routes\roleRoutes.js frontend\src\routes\AppRoutes.jsx frontend\src\components\layout\Sidebar.jsx frontend\src\components\layout\TopBar.jsx frontend\src\components\layout\TeacherShellSearch.jsx frontend\src\components\layout\TeacherQuickCreateButton.jsx frontend\src\features\notifications\notificationStorage.js frontend\src\features\notifications\components\RealtimeNotificationListener.jsx frontend\src\features\notifications\pages\TeacherNotificationsPage.jsx frontend\src\features\results\pages\TeacherResultsPage.jsx frontend\src\features\anti-cheat\pages\TeacherMonitoringPage.jsx frontend\src\features\assignments\components\AssignmentForm.jsx frontend\src\features\assignments\pages\TeacherAssignmentListPage.jsx frontend\src\features\classrooms\components\TeacherClassroomWorkspace.jsx frontend\src\features\classrooms\pages\ClassroomDetailPage.jsx frontend\src\features\classrooms\pages\ClassroomListPage.jsx frontend\src\features\exams\pages\ExamListPage.jsx` ΓÇö passed.
- `npm.cmd --prefix frontend run build` ΓÇö passed.

Unresolved questions:

- Notification list hiß╗çn vß║½n d├╣ng persistence ß╗ƒ frontend/local realtime store; khi backend notifications API xuß║Ñt hiß╗çn, cß║ºn thay adapter n├áy bß║▒ng nguß╗ôn server-side.
- Assignment center v├á classroom workspace hiß╗çn vß║½n reload lß║íi page sau mß╗Öt sß╗æ thao t├íc create/update/grade ─æß╗â giß╗» thay ─æß╗òi ─æß╗ông bß╗Ö nhanh vß╗¢i data layer hiß╗çn tß║íi; c├│ thß╗â tinh chß╗ënh th├ánh reload cß╗Ñc bß╗Ö sau nß║┐u muß╗æn m╞░ß╗út h╞ín.

## Fix: Exam detail view/edit split and classroom assignment empty-state clarity

Date: 2026-06-20

Branch/source: `devH`

Description:

- Refined the exam detail experience so the default screen stays focused on `Cß║Ñu h├¼nh b├ái kiß╗âm tra`, `Trß║íng th├íi publish`, `T├│m tß║»t ─æß╗ü thi`, and `T├│m tß║»t anti-cheat`, while the heavier edit tools only appear when the teacher explicitly opens them.
- Moved classroom / teacher / schedule metadata out of the always-visible detail form into a compact `Th├┤ng tin th├¬m` hover/focus panel, reducing visual noise on the main exam page without removing useful context.
- Improved the classroom assignment section when no backend records are available by adding a refresh action and a clearer empty-state message tied to the current classroom.

Changed files:

- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/assignments/components/AssignmentSection.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- `ExamDetailPage` now separates read mode from management mode: the page keeps status and summary cards visible by default, exposes teacher/admin metadata through an info icon tooltip, and toggles `ExamForm` plus `TeacherQuestionWorkspace` from a dedicated button above publish status.
- The publish status card now remains visible in read mode for non-editors as well, while teacher-only actions such as publish, exam edit, and destructive controls stay behind the management toggle.
- `AssignmentSection` now exposes a manual refresh action in both the header and empty state, and the empty-state copy explicitly references the current classroom so an actually empty backend is easier to distinguish from a rendering problem.

Validation:

- `frontend\node_modules\.bin\eslint.cmd frontend\src\features\exams\pages\ExamDetailPage.jsx frontend\src\features\assignments\components\AssignmentSection.jsx` ΓÇö passed.
- `npm.cmd --prefix frontend run build` ΓÇö passed.
- `sqlcmd -S "HOANGZIN72\MSSQLSERVER01" -d "EduGuardExam" -E -Q "SELECT TOP 20 c.Id AS ClassroomId, c.Name AS ClassroomName, COUNT(a.Id) AS AssignmentCount FROM Classrooms c LEFT JOIN Assignments a ON a.ClassroomId = c.Id GROUP BY c.Id, c.Name ORDER BY c.Id DESC; SELECT TOP 20 a.Id, a.ClassroomId, a.Title, a.CreatedAt FROM Assignments a ORDER BY a.CreatedAt DESC;"` ΓÇö local backend database returned `0` assignment rows during verification.

Unresolved questions:

- In this local environment, the backend database currently has no assignment records, so the original ΓÇ£assignment exists but classroom detail shows noneΓÇ¥ report could not be reproduced as a data/API mismatch here.
- If the missing assignments were created in another database or an older mock/local-only flow, that source still needs to be identified before a deeper backend fix can be confirmed.
## Feature: Teacher one-shot exam save with local draft questions and import preview

Date: 2026-06-20

Branch/source: `devH`

Description:

- Reworked the teacher create-exam flow so exam metadata and questions can now be composed together locally on `ExamListPage`, then persisted with one final save instead of forcing an initial `L╞░u ─æß╗ü thi` just to unlock question input.
- Extended the backend create contract to accept the full draft question list in the first exam-create request, so the initial save now materializes the exam and its questions in one pass.
- Added a teacher import-preview API plus frontend draft-import flow, allowing teachers to review a supported question file and merge it into the local draft before any `examId` exists.

Changed files:

- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `backend/EduGuard.Api/EduGuard.Api.csproj`
- `backend/EduGuard.Api/Resources/QuestionImportTemplates/`
- `backend/EduGuard.Application/DTOs/Exams/question-import-template-dto.cs`
- `backend/EduGuard.Infrastructure/Exams/question-import-parser.cs`
- `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md`
- `docs/README.md`
- `docs/apiList.md`
- `docs/features.md`
- `backend/EduGuard.Application/DTOs/Exams/create-exam-request.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `frontend/src/api/examApi.js`
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/QuestionCard.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/QuestionImportPanel.jsx`
- `frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx`
- `frontend/src/features/exams/pages/exam-create-draft-helpers.js`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Added 20 import template files under API resources: 4 question types by 5 supported formats (`.csv`, `.xlsx`, `.txt`, `.docx`, `.pdf`).
- Added `QuestionImportTemplateDto` and two Teacher/Admin-only endpoints: `GET /api/exams/question-import/templates` for metadata and `GET /api/exams/question-import/templates/{fileName}` for download.
- Bug fix: changed the question import upload action from direct `[FromForm] IFormFile` binding to a multipart form model so Swashbuckle can generate `swagger/v1/swagger.json` without a 500 error.
- Bug fix: updated tabular import parsing to find the real header row in XLSX/CSV files with title/instruction rows before the columns, and to ignore trailing template note rows such as `Ghi chu`.
- Implemented download via a fixed whitelist generated from known question types/formats, plus file-name validation and full-path containment checks to avoid arbitrary file access.
- Updated the API project file so template resources are copied to build and publish output with `PreserveNewest`.
- Copied `EduGuard_Import_Templates_4x5_Index.md` into `docs/10_QUESTION_BANK_IMPORT_TEMPLATES.md` as the canonical template guide.

Validation:

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore -o temp\backend-template-download-build` passed with 0 warnings and 0 errors.
- Verified `temp\backend-template-download-build\Resources\QuestionImportTemplates` contains 20 template files after build.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore -o temp\backend-swagger-fix-build` passed with 0 warnings and 0 errors.
- Verified `http://localhost:5157/swagger/v1/swagger.json`, `http://localhost:5157/swagger/index.html`, and `http://localhost:5157/api/test` return 200 after restarting the backend.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore -o temp\backend-import-header-build` passed with 0 warnings and 0 errors.
- Smoke-tested `EduGuard_XLSX_Mau_01_single_choice_Toan_Ly_Hoa_Sinh_Full.xlsx`: parser result was `TOTAL_ROWS=8`, `QUESTIONS=8`, `ERRORS=0`.

Known risks / rollback / follow-up:

- The new endpoints are backend-only; frontend buttons for browsing/downloading templates remain a separate pending task.
- Template downloads require Teacher/Admin JWT, matching the import endpoint authorization.
- Rollback is straightforward: remove the two endpoints, DTO, project resource copy rule, and the `Resources/QuestionImportTemplates` folder.


## Feature: Backend short-answer question import

Date: 2026-06-19

Branch/source: `devB`

Description:

- Feature or fix name: Backend short-answer question import.
- Purpose and user/business impact: Teachers/Admins can import auto-graded short-answer questions through the existing standard question import endpoint instead of adding those questions manually after import.
- Files or modules changed: exam question import parser, question import standard docs, API/feature tracking, Todo List, and project changelog.

Changed files:

- `backend/EduGuard.Infrastructure/Exams/question-import-parser.cs`
- `docs/09_QUESTION_BANK_FILE_IMPORT_STANDARD.md`
- `docs/features.md`
- `docs/apiList.md`
- `CreateExamRequest` now carries `Questions`, and `ExamService.CreateAsync()` validates, normalizes, resequences, and persists the full draft question set when the teacher performs the first real save.
- Added `POST /api/questions/import/preview`, which runs the existing import parser/validation stack without touching an exam record, then returns normalized questions for the frontend draft workspace.
- `ExamListPage` now keeps exam metadata in page-level draft state and keeps question drafts in local state, so the create form can be hidden/reopened without losing the already staged exam/question content.
- The shared teacher workspace now supports a draft-authoring mode with different labels, local question add/update/delete, draft import preview messaging, and one-shot final save semantics, while the existing persisted exam edit flow still reuses the same workspace after the first save.
- Removed the previous create-flow auto-publish behavior so teachers explicitly decide when to publish later, instead of publishing implicitly after the first successful question mutation.

Validation:

- `frontend\node_modules\.bin\eslint.cmd frontend/src/api/examApi.js frontend/src/features/exams/components/ExamForm.jsx frontend/src/features/exams/components/QuestionCard.jsx frontend/src/features/exams/components/QuestionForm.jsx frontend/src/features/exams/components/QuestionImportPanel.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/pages/exam-create-draft-helpers.js frontend/src/features/exams/pages/ExamListPage.jsx` - passed.
- `npm.cmd --prefix frontend run build` - passed.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -c Debug -o .\temp-build-exam-draft` - blocked in this sandbox by NuGet/network access (`NU1301` against `https://api.nuget.org/v3/index.json`), so backend compile verification could not be completed here.

Unresolved questions:

- The backend changes were reviewed and wired end-to-end in code, but a clean local `dotnet build` still needs to be rerun in an environment with NuGet access or existing package assets available.
- The new import preview step confirms parsed questions before they enter the local draft, but the UI still shows a file-level review summary rather than a richer per-question preview table.

## Feature: Student exam room UX, anti-cheat enforcement, and wider teacher question review

Date: 2026-06-19

Branch/source: `devH`

Description:

- Widened the teacher exam detail question-management area by moving the question workspace into its own full-width section, so `Danh s├ích c├óu hß╗Åi` is no longer squeezed inside the metadata column.
- Redesigned the student exam-taking page so the room now reflects teacher settings more clearly: fullscreen enforcement, random-order-friendly numbering, cleaner answer cards, stronger right-rail navigation, and clearer post-submit result handling.
- Tightened the attempt save contract so clearing an answer from the UI now really clears the saved server state instead of silently leaving stale data behind.

Changed files:

- `backend/EduGuard.Application/Validators/save-student-answer-request-validator.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx`
- `frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Moved `TeacherQuestionWorkspace` out of the left metadata column on `ExamDetailPage` and narrowed the composer rail inside the shared workspace component, giving the teacher question list a much wider reading area while keeping the manual/import tools compact.
- Reordered the `ExamAttemptPage` callbacks so effects no longer reference `const` handlers before declaration, removing a likely runtime failure path that lint/build would not catch.
- Rebuilt the student attempt UI around the actual attempt order returned by the backend, so shuffled questions now display with stable `1..n` numbering, cleaner progress/navigation, a fullscreen gate when required, and a result screen that preserves the student-facing attempt order after submit.
- Wired `WINDOW_BLUR` logging, kept fullscreen exit / tab switch / clipboard / disconnect / reload logs flowing through `antiCheatApi.log()`, and retained the existing SignalR teacher monitoring path.
- Updated backend save-answer behavior to allow empty payloads as intentional clears: the API now removes previous answers when a student clears a question, instead of forcing stale answers to remain saved.

Validation:

- `frontend\node_modules\.bin\eslint.cmd frontend/src/features/exam-attempts/pages/ExamAttemptPage.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/pages/ExamDetailPage.jsx` - passed.
- `npm.cmd --prefix frontend run build` - passed.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -c Debug -o .\temp-backend-build-student-attempt-ui` - passed.

Unresolved questions:

- A normal `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -c Debug` currently fails in this workspace because Visual Studio is holding `EduGuard.Api` debug output DLLs open; building to a temp output folder verifies the code successfully.
- Frontend build still emits the existing `@microsoft/signalr` PURE annotation warning and the large chunk-size warning; this change did not introduce new build failures.

## Feature: Teacher question workspace, create-flow authoring and staged import review

Date: 2026-06-19

Branch/source: `devH`

Description:

- Redesigned the teacher question authoring area in exam detail into a calmer two-column workspace: a narrower composer on the left and a management list on the right.
- Moved the teacher create-exam flow onto the exam list page so teachers can save exam metadata, then continue writing or importing questions immediately without detouring into the detail screen.
- Added a staged import flow for teachers so file uploads are reviewed before commit, instead of pushing questions into the exam immediately when a file is selected.
- Tightened the teacher UX around question save/update actions so the screen no longer flashes into full-page loading during every question mutation, and new exams now auto-publish after the first successful question is added in the create flow.

Changed files:

- `frontend/src/api/examApi.js`
- `frontend/src/components/common/Input.jsx`
- `frontend/src/components/forms/TextInput.jsx`
- `frontend/src/features/exams/components/QuestionImportPanel.jsx`
- `frontend/src/features/exams/components/QuestionCard.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx`
- `frontend/src/features/exams/components/question-form-answers-section.jsx`
- `frontend/src/features/exams/components/teacher-question-workspace-helpers.js`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/index.css`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Extended `QuestionImportQuestionBuilder` so `short_answer`, `shortanswer`, `short`, `text_answer`, and `textanswer` map to `QuestionType.ShortAnswer`.
- Added short-answer import answer construction: `correct_answer` becomes one accepted sample answer with `IsCorrect = true`, then existing backend normalization/validation handles persistence and grading rules.
- Kept `essay` rejected because the domain model currently has `ShortAnswer` only, not a separate long-form manually graded essay type.
- Updated import documentation/tracking to distinguish supported `short_answer` from deferred `essay` and frontend upload UI work.

Validation:

- `dotnet build backend\EduGuard.slnx --no-restore` failed because the running `EduGuard.Api` process PID 19800 locked Debug output DLLs; Domain/Application/Infrastructure compiled before the copy step failed.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore -o temp\backend-short-answer-import-build` passed with 0 warnings and 0 errors.

Known risks / rollback / follow-up:

- Import supports one sample answer per `short_answer` row from `correct_answer`; additional accepted answers still need manual editing after import.
- Structured TXT/DOCX/PDF text imports require explicit `question_type: short_answer`; rows without that marker still follow the existing objective-question inference rules.
- Frontend upload/import UI remains out of scope for this change and is still tracked separately.

- Extracted the teacher question workspace into a shared UI block used by both `ExamDetailPage` and `ExamListPage`, keeping the same manual/import modes, filter chips, sort control, and left-composer/right-list layout in both places.
- Reworked the teacher create-exam flow on `ExamListPage` so saving exam metadata keeps the teacher on the same page, unlocks the question workspace immediately, and silently refreshes the list/detail state without a full screen reset.
- Added create-flow auto-publish logic: if a teacher adds questions while creating a new exam, the frontend now calls `publish` automatically after the first successful create/import; if the teacher stops with no questions, the exam remains a draft.
- Replaced the previous inline-per-card edit form with one dedicated composer, added dirty-state guarding when switching authoring context, and kept create/update refreshes silent so saves no longer trigger the page skeleton.
- Added `QuestionImportPanel` plus `examApi.importQuestionFile()` so teachers can stage a supported file, review it before commit, and see backend import failures grouped by row and field directly in the UI.
- Simplified copy in the teacher flow by removing extra descriptive text, simplifying import review panels, and removing the quick-links block from exam detail.

Validation:

- `frontend\node_modules\.bin\eslint.cmd frontend/src/api/examApi.js frontend/src/components/common/Input.jsx frontend/src/components/forms/TextInput.jsx frontend/src/features/exams/components/QuestionImportPanel.jsx frontend/src/features/exams/components/QuestionCard.jsx frontend/src/features/exams/components/QuestionForm.jsx frontend/src/features/exams/components/TeacherQuestionWorkspace.jsx frontend/src/features/exams/components/question-form-answers-section.jsx frontend/src/features/exams/components/teacher-question-workspace-helpers.js frontend/src/features/exams/pages/ExamDetailPage.jsx frontend/src/features/exams/pages/ExamListPage.jsx` - passed.
- `npm.cmd --prefix frontend run build` - passed.

Unresolved questions:

- The current import review step is staged and teacher-safe, but it still relies on backend validation at commit time; a richer parsed preview of imported questions before commit would need a dedicated preview contract later.
- Downloadable teacher template files are still backlog work for the import flow.

## Bug fix: Swagger 500 on exam import endpoint metadata

Date: 2026-06-19

Branch/source: `devH`

Description:

- Fixed backend Swagger generation failure where `/swagger/v1/swagger.json` returned HTTP 500 after the exam question import endpoint was added.
- Kept the import API contract as `multipart/form-data` while switching the action signature to a Swagger-compatible request model.

Changed files:

- `backend/EduGuard.Api/Controllers/exams-controller.cs`
- `backend/EduGuard.Api/Contracts/Exams/import-questions-form-request.cs`
- `docs/project-changelog.md`

Technical summary:

- Replaced the controller signature `([FromForm] IFormFile? file, CancellationToken ct)` with `([FromForm] ImportQuestionsFormRequest request, CancellationToken ct)` because Swashbuckle 6.6.2 fails operation generation for the direct `[FromForm] IFormFile` pattern used here.
- Preserved the existing form field name and runtime behavior by reading `request.File` inside the action, so frontend upload code does not need a contract change.

Validation:

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -c Debug -o .\temp-swagger-debug` - passed.
- Ran the built API on `http://127.0.0.1:5061` and `/swagger/v1/swagger.json` returned HTTP 200 after the fix.

Unresolved questions:

- Local startup still logs existing Data Protection warnings related to old DPAPI keys under the current Windows profile; those warnings are separate from the Swagger 500 root cause.

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
## Feature: Admin real-data sync for dashboard, classrooms, and exams

Date: 2026-06-18

Branch/source: `devH`

Description:

- Sß╗¡a lß╗çch dß╗» liß╗çu ß╗ƒ cß╗Ñm Admin khi `Dashboard`, `Quß║ún l├¡ lß╗¢p hß╗ìc` v├á `Quß║ún l├¡ b├ái kiß╗âm tra` ch╞░a khß╗¢p vß╗¢i database thß║¡t.
- Mß╗ƒ quyß╗ün backend ─æß╗â Admin ─æß╗ìc to├án bß╗Ö lß╗¢p hß╗ìc, danh s├ích th├ánh vi├¬n lß╗¢p, l╞░ß╗út l├ám b├ái thi v├á dß╗» liß╗çu anti-cheat cß║ºn thiß║┐t cho tß╗òng hß╗úp quß║ún trß╗ï.
- Chuyß╗ân `Dashboard` admin tß╗½ nguß╗ôn mock sang tß╗òng hß╗úp bß║▒ng API thß║¡t hiß╗çn c├│, giß╗» nguy├¬n layout/title-only nh╞░ng thay to├án bß╗Ö sß╗æ liß╗çu ch├¡nh bß║▒ng dß╗» liß╗çu backend.

Changed files:

- `backend/EduGuard.Application/Repositories/Interfaces/i-classroom-repository.cs`
- `backend/EduGuard.Infrastructure/Repositories/classroom-repository.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-classroom-service.cs`
- `backend/EduGuard.Infrastructure/Classrooms/classroom-service.cs`
- `backend/EduGuard.Api/Controllers/classrooms-controller.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-exam-attempt-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `backend/EduGuard.Api/Controllers/exam-attempts-controller.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-anti-cheat-service.cs`
- `backend/EduGuard.Infrastructure/AntiCheat/anti-cheat-service.cs`
- `backend/EduGuard.Api/Controllers/anti-cheat-controller.cs`
- `frontend/src/api/classroomApi.js`
- `frontend/src/api/dashboardApi.js`
- `frontend/src/features/classrooms/pages/ClassroomDetailPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Th├¬m nh├ính admin cho classroom backend: `/api/classrooms` giß╗¥ trß║ú to├án bß╗Ö classroom cho Admin, v├á `/api/classrooms/{id}/members` c┼⌐ng cho ph├⌐p Admin ─æß╗ìc member list ─æß╗â FE suy ra `memberCount` thß║¡t thay v├¼ ─æß╗â trß╗æng hoß║╖c lß╗çch sß╗æ liß╗çu.
- Mß╗ƒ quyß╗ün admin cho `GET /api/exams/{id}/attempts` v├á c├íc endpoint anti-cheat xem log/score/summary; phß║ºn service vß║½n giß╗» rule c┼⌐ cho Teacher nh╞░ng bß╗ò sung allow-list r├╡ r├áng cho Admin thay v├¼ tß║ío endpoint song song.
- `classroomApi` ph├¡a frontend kh├┤ng c├▓n bß╗Å qua member fetch ß╗ƒ role Admin; `ClassroomDetailPage` c┼⌐ng hiß╗ân thß╗ï member list thß║¡t cho admin ─æß╗â phß║ºn quß║ún l├¡ lß╗¢p nhß║Ñt qu├ín vß╗¢i database.
- `dashboardApi.getAdminDashboard()` kh├┤ng c├▓n ─æß╗ìc mock database/localStorage; thay v├áo ─æ├│ FE tß╗òng hß╗úp dß╗» liß╗çu thß║¡t tß╗½ `userApi`, `classroomApi`, `examApi`, `examAttemptApi`, `antiCheatApi`, n├¬n c├íc chß╗ë sß╗æ ng╞░ß╗¥i d├╣ng/lß╗¢p hß╗ìc/b├ái kiß╗âm tra/l╞░ß╗út l├ám nghi ngß╗¥ phß║ún ├ính trß╗▒c tiß║┐p tß╗½ backend hiß╗çn tß║íi.
- Kh├┤ng th├¬m backend endpoint dashboard admin ri├¬ng trong thay ─æß╗òi n├áy; mß╗Ñc ti├¬u l├á sß╗¡a lß╗çch dß╗» liß╗çu vß╗¢i mß╗⌐c x├óm lß║Ñn thß║Ñp nhß║Ñt l├¬n UI v├á giß╗» t╞░╞íng th├¡ch vß╗¢i cß║Ñu tr├║c route/page ─æ├ú c├│.

Validation:

- `npx eslint src/api/classroomApi.js src/api/dashboardApi.js src/features/classrooms/pages/ClassroomDetailPage.jsx` ΓÇö passed.
- `dotnet build ..\backend\EduGuard.Api\EduGuard.Api.csproj -o .\temp-backend-build-admin-real-data` ΓÇö passed.
- `npm run build -- --outDir temp-build-admin-real-data-sync` ΓÇö passed.

Unresolved questions:

- `AdminMonitoringPage` hiß╗çn vß║½n d├╣ng nguß╗ôn tß╗òng hß╗úp mock ri├¬ng; thay ─æß╗òi n├áy mß╗¢i ─æ╞░a `Dashboard`, `Lß╗¢p hß╗ìc` v├á `B├ái kiß╗âm tra` cß╗ºa admin vß╗ü dß╗» liß╗çu thß║¡t nh╞░ y├¬u cß║ºu.
- Build frontend vß║½n c├▓n warning sß║╡n c├│ tß╗½ `@microsoft/signalr` PURE annotation v├á cß║únh b├ío chunk lß╗¢n; thay ─æß╗òi n├áy kh├┤ng l├ám ph├ít sinh lß╗ùi build mß╗¢i.

## Feature: Modern in-app submit validation for frontend forms

Date: 2026-06-18

Branch/source: `devH`

Description:

- Loß║íi bß╗Å trß║úi nghiß╗çm validate submit mß║╖c ─æß╗ïnh cß╗ºa tr├¼nh duyß╗çt tr├¬n c├íc form ch├¡nh ─æß╗â giao diß╗çn nhß║¡p liß╗çu ─æß╗ông nhß║Ñt, hiß╗çn ─æß║íi h╞ín v├á kh├┤ng c├▓n popup native g├óy lß╗çch style.
- Chuyß╗ân c├íc form ─æ─âng nhß║¡p, ─æ─âng k├╜, tß║ío/join lß╗¢p, b├ái tß║¡p, hß╗ô s╞í, quß║ún l├¡ ng╞░ß╗¥i d├╣ng, ─æß╗ü thi v├á c├óu hß╗Åi sang c╞í chß║┐ validation nß╗Öi bß╗Ö vß╗¢i lß╗ùi hiß╗ân thß╗ï ngay trong UI.
- Giß╗» nguy├¬n flow submit v├á API hiß╗çn c├│; thay ─æß╗òi tß║¡p trung v├áo UX form, c├ích b├ío lß╗ùi v├á t├¡nh nhß║Ñt qu├ín cß╗ºa trß║úi nghiß╗çm ng╞░ß╗¥i d├╣ng.

Changed files:

- `frontend/src/components/forms/FormErrorSummary.jsx`
- `frontend/src/utils/formValidation.js`
- `frontend/src/index.css`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/features/auth/pages/RegisterPage.jsx`
- `frontend/src/features/classrooms/components/CreateClassroomForm.jsx`
- `frontend/src/features/classrooms/components/JoinClassroomForm.jsx`
- `frontend/src/features/assignments/components/AssignmentForm.jsx`
- `frontend/src/features/users/components/AdminUserForm.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/question-form-answers-section.jsx`
- `docs/project-changelog.md`

Technical summary:

- Tß║ío bß╗Ö helper validation d├╣ng chung trong `formValidation.js` ─æß╗â kiß╗âm tra text bß║»t buß╗Öc, email, ─æß╗Ö d├ái tß╗æi thiß╗âu, sß╗æ hß╗úp lß╗ç v├á lß║Ñy lß╗ùi ─æß║ºu ti├¬n cho banner tß╗òng hß╗úp.
- Th├¬m `FormErrorSummary` v├á style ─æi k├¿m trong `index.css` ─æß╗â tß║Ñt cß║ú form c├│ c├╣ng c├ích hiß╗ân thß╗ï lß╗ùi submit thay v├¼ phß╗Ñ thuß╗Öc v├áo tooltip/native prompt cß╗ºa browser.
- C├íc form auth/classroom/assignment/admin user/profile ─æ├ú ─æ╞░ß╗úc chuyß╗ân sang `noValidate`, clear lß╗ùi theo field khi ng╞░ß╗¥i d├╣ng sß╗¡a dß╗» liß╗çu v├á giß╗» lß╗ùi hiß╗ân thß╗ï inline ß╗ƒ tß╗½ng input.
- Ho├án tß║Ñt phß║ºn c├▓n s├│t ß╗ƒ `ExamForm` v├á `QuestionForm`: th├¬m `noValidate`, banner lß╗ùi tß╗òng hß╗úp, validate ri├¬ng cho ─æiß╗âm, thß╗⌐ tß╗▒, nß╗Öi dung c├óu hß╗Åi, tß╗½ng ─æ├íp ├ín v├á rule chß╗ìn ─æ├íp ├ín ─æ├║ng theo loß║íi c├óu hß╗Åi.

Validation:

- `npx eslint src/utils/formValidation.js src/components/forms/FormErrorSummary.jsx src/features/auth/pages/LoginPage.jsx src/features/auth/pages/RegisterPage.jsx src/features/classrooms/components/CreateClassroomForm.jsx src/features/classrooms/components/JoinClassroomForm.jsx src/features/assignments/components/AssignmentForm.jsx src/features/users/components/AdminUserForm.jsx src/features/users/pages/ProfilePage.jsx src/features/exams/components/QuestionForm.jsx src/features/exams/components/question-form-answers-section.jsx src/features/exams/components/ExamForm.jsx` ΓÇö passed.
- `npm run build -- --outDir temp-build-form-validation-refresh` ΓÇö passed.

Unresolved questions:

- Mß╗Öt sß╗æ trang vß║½n c├▓n d├╣ng `window.confirm` cho thao t├íc xo├í; nß║┐u muß╗æn ─æß╗ông bß╗Ö ho├án to├án UX popup vß╗¢i form mß╗¢i, n├¬n thay c├íc confirm native n├áy bß║▒ng modal nß╗Öi bß╗Ö ß╗ƒ b╞░ß╗¢c tiß║┐p theo.
- Build vß║½n c├▓n warning sß║╡n c├│ tß╗½ `@microsoft/signalr` PURE annotation v├á cß║únh b├ío bundle size lß╗¢n; thay ─æß╗òi n├áy kh├┤ng l├ám ph├ít sinh lß╗ùi build mß╗¢i.

## Feature: Admin user management real API and CRUD

Date: 2026-06-18

Branch/source: `devH`

Description:

- Bß╗Å mock data cho m├án `Quß║ún l├¡ ng╞░ß╗¥i d├╣ng` cß╗ºa Admin v├á chuyß╗ân sang dß╗» liß╗çu backend thß║¡t qua `GET /api/users`.
- Bß╗ò sung ─æß║ºy ─æß╗º thao t├íc `Th├¬m`, `Sß╗¡a`, `X├│a` ng╞░ß╗¥i d├╣ng ngay trong m├án `Ng╞░ß╗¥i d├╣ng` hiß╗çn c├│, giß╗» bß╗æ cß╗Ñc title-only theo h╞░ß╗¢ng filter + danh s├ích + chi tiß║┐t thay v├¼ t├ích page mß╗¢i.
- Backend chß║╖n c├íc thao t├íc nguy hiß╗âm nh╞░ tß╗▒ x├│a t├ái khoß║ún, tß╗▒ bß╗Å quyß╗ün Admin, tß╗▒ kh├│a ch├¡nh m├¼nh, ─æß╗ông thß╗¥i chß║╖n x├│a cß╗⌐ng user ─æ├ú c├│ dß╗» liß╗çu li├¬n quan ─æß╗â kh├┤ng ph├í vß╗í quan hß╗ç lß╗¢p hß╗ìc/b├ái thi/b├ái nß╗Öp.

Changed files:

- `backend/EduGuard.Api/Controllers/users-controller.cs`
- `backend/EduGuard.Application/DTOs/Auth/user-dto.cs`
- `backend/EduGuard.Application/DTOs/Users/create-user-request.cs`
- `backend/EduGuard.Application/DTOs/Users/update-user-request.cs`
- `backend/EduGuard.Application/Services/Interfaces/i-user-service.cs`
- `backend/EduGuard.Application/Validators/create-user-request-validator.cs`
- `backend/EduGuard.Application/Validators/update-user-request-validator.cs`
- `backend/EduGuard.Infrastructure/Auth/auth-service.cs`
- `backend/EduGuard.Infrastructure/Users/user-service.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `frontend/src/api/authApi.js`
- `frontend/src/api/userApi.js`
- `frontend/src/hooks/useAuth.jsx`
- `frontend/src/features/users/components/AdminUserForm.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Th├¬m backend admin users API mß╗¢i dß╗▒a tr├¬n ASP.NET Identity: `UsersController`, `IUserService`, `UserService`, DTO create/update v├á FluentValidation; giß╗» nguy├¬n `AuthController` v├á flow ─æ─âng nhß║¡p hiß╗çn c├│.
- Mß╗ƒ rß╗Öng `UserDto` ─æß╗â trß║ú th├¬m `avatarUrl`, `isActive`, `createdAt`, `updatedAt`; `authApi` v├á `userApi` ph├¡a frontend normalize lß║íi theo shape user hiß╗çn ß╗⌐ng dß╗Ñng ─æang d├╣ng.
- `UserService` d├╣ng `UserManager` + `RoleManager` ─æß╗â tß║ío/cß║¡p nhß║¡t role user, revoke refresh token khi email/role/trß║íng th├íi ─æß╗òi, v├á chß║╖n x├│a cß╗⌐ng nß║┐u user ─æ├ú c├│ dß╗» liß╗çu li├¬n quan trong classroom/assignment/exam/submission.
- `UserManagementPage` giß╗» layout quß║ún trß╗ï ─æang c├│, th├¬m `AdminUserForm`, action `Th├¬m/Sß╗¡a/X├│a`, reload dß╗» liß╗çu sau mutation v├á kh├┤ng ─æß╗Ñng luß╗ông profile hiß╗çn c├▓n mock.

Validation:

- `npx eslint src/api/userApi.js src/api/authApi.js src/hooks/useAuth.jsx src/features/users/components/AdminUserForm.jsx src/features/users/pages/UserManagementPage.jsx` ΓÇö passed.
- `npm run build -- --outDir temp-build-admin-users` ΓÇö passed.
- `dotnet build ..\backend\EduGuard.Api\EduGuard.Api.csproj -o .\temp-backend-build-admin-users` ΓÇö passed.

Unresolved questions:

- `npm run lint` to├án frontend hiß╗çn vß║½n c├│ thß╗â fail v├¼ script ─æang qu├⌐t cß║ú c├íc th╞░ mß╗Ñc artifact nh╞░ `temp-build-ui/**`, l├ám formatter ESLint v─âng `RangeError: Invalid string length`; thay ─æß╗òi n├áy ─æ╞░ß╗úc verify bß║▒ng targeted eslint cho ─æ├║ng c├íc file ─æ├ú sß╗¡a.
- `npm run build` mß║╖c ─æß╗ïnh ra `dist` c├│ thß╗â gß║╖p `EPERM` nß║┐u file build c┼⌐ ─æang bß╗ï process kh├íc giß╗»; build ra th╞░ mß╗Ñc tß║ím ri├¬ng vß║½n pass v├á kh├┤ng ph├ít sinh lß╗ùi tß╗½ code mß╗¢i.

## Feature: Admin MVP navigation, monitoring center, and title-only management UI

Date: 2026-06-18

Branch/source: `devH`

Description:

- Ho├án thiß╗çn cß╗Ñm t├¡nh n─âng `Admin` theo sitemap MVP ─æ├ú chß╗æt: `Dashboard`, `Quß║ún l├¡ lß╗¢p hß╗ìc`, `Quß║ún l├¡ b├ái kiß╗âm tra`, `Gi├ím s├ít`, `Quß║ún l├¡ ng╞░ß╗¥i d├╣ng`, `Hß╗ô s╞í c├í nh├ón`.
- Th├¬m trang `Gi├ím s├ít` ri├¬ng cho Admin ─æß╗â theo d├╡i anti-cheat thay v├¼ chß╗ë nh├¼n sß╗æ liß╗çu trong dashboard: c├│ bß╗Ö lß╗ìc theo tß╗½ kh├│a, mß╗⌐c ─æß╗Ö, loß║íi vi phß║ím; c├│ danh s├ích ─æß╗ü thi rß╗ºi ro, sinh vi├¬n cß║ºn ch├║ ├╜ v├á sß╗▒ kiß╗çn gß║ºn ─æ├óy.
- N├óng giao diß╗çn admin theo h╞░ß╗¢ng `title-only`: c├íc block chß╗ë c├▓n ti├¬u ─æß╗ü, bß╗Å m├┤ tß║ú thß╗½a ß╗ƒ phß║ºn header admin v├á c├íc m├án shared nh╞░ `Lß╗¢p hß╗ìc` / `B├ái kiß╗âm tra` khi truy cß║¡p bß║▒ng role Admin.
- L├ám lß║íi trang `Ng╞░ß╗¥i d├╣ng` th├ánh bß╗æ cß╗Ñc quß║ún trß╗ï r├╡ h╞ín vß╗¢i bß╗Ö lß╗ìc, danh s├ích chß╗ìn nhanh v├á panel chi tiß║┐t ng╞░ß╗¥i d├╣ng.

Changed files:

- `frontend/src/routes/routeConfig.js`
- `frontend/src/routes/roleRoutes.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/api/dashboardApi.js`
- `frontend/src/features/admin/admin-monitoring-helpers.js`
- `frontend/src/features/admin/pages/AdminMonitoringPage.jsx`
- `frontend/src/features/dashboard/pages/AdminDashboardPage.jsx`
- `frontend/src/features/users/pages/UserManagementPage.jsx`
- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Added `VITE_DEV_API_TARGET` support in Vite config and defaulted the dev proxy target to `http://127.0.0.1:5157`.
- Kept `secure: false` for `/api` and `/hubs` proxy entries so developers can still override the target to the HTTPS dev profile with self-signed certs.
- Updated frontend README local-run instructions to match the backend `http` launch profile.

Validation:

- `dotnet restore backend\EduGuard.slnx` ΓÇö succeeded.
- `dotnet build backend\EduGuard.slnx --no-restore` ΓÇö succeeded, 0 warnings, 0 errors.
- `npm.cmd run build` ΓÇö succeeded; Vite emitted existing dependency/chunk-size warnings only.
- `curl http://127.0.0.1:5157/swagger/index.html` ΓÇö returned HTTP 200.
- `curl http://127.0.0.1:5173` ΓÇö returned HTTP 200.
- `curl http://127.0.0.1:5173/api/Test` ΓÇö returned HTTP 200 with backend JSON `{ "message": "EduGuard API is running" }`.

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
- Bß╗ò sung route `routeConfig.adminMonitoring`, th├¬m menu `Gi├ím s├ít` cho Admin, gß║»n breadcrumb label v├á icon ri├¬ng trong `TopBar` / `Sidebar`, ─æß╗ông thß╗¥i mount route mß╗¢i trong `AppRoutes`.
- Mß╗ƒ rß╗Öng `dashboardApi` cho Admin vß╗¢i dß╗» liß╗çu trß║íng th├íi ─æß╗ü thi, l╞░ß╗út l├ám rß╗ºi ro cao, breakdown vi phß║ím, bß║úng xß║┐p hß║íng ─æß╗ü thi rß╗ºi ro, bß║úng xß║┐p hß║íng sinh vi├¬n cß║ºn ch├║ ├╜ v├á sß╗▒ kiß╗çn anti-cheat gß║ºn ─æ├óy.
- Tß║ío `AdminMonitoringPage` vß╗¢i bß╗Ö lß╗ìc client-side theo tß╗½ kh├│a, severity v├á loß║íi vi phß║ím; dß╗» liß╗çu hiß╗ân thß╗ï ß╗ƒ dß║íng summary cards, metric bar v├á danh s├ích thao t├íc nhanh, kh├┤ng d├╣ng phß║ºn m├┤ tß║ú phß╗Ñ.
- Dß╗▒ng lß║íi `AdminDashboardPage` ─æß╗â hiß╗ân thß╗ï c├íc khß╗æi ch├¡nh x├íc h╞ín cho vß║¡n h├ánh: vai tr├▓, trß║íng th├íi b├ái kiß╗âm tra, lß╗¢p hß╗ìc, l╞░ß╗út l├ám cß║ºn ch├║ ├╜, hoß║ít ─æß╗Öng gß║ºn ─æ├óy v├á h├ánh vi anti-cheat.
- Dß╗▒ng lß║íi `UserManagementPage` vß╗¢i filter bar, danh s├ích chß╗ìn user, panel chi tiß║┐t v├á lß╗¢p hß╗ìc do giß║úng vi├¬n quß║ún l├╜; kh├┤ng th├¬m text m├┤ tß║ú ß╗ƒ ─æß║ºu khß╗æi.
- Chß╗ënh `ClassroomListPage` v├á `ExamListPage` ─æß╗â role Admin chß╗ë hiß╗ân thß╗ï header/title v├á empty state ngß║»n gß╗ìn, kh├┤ng c├▓n eyebrow hoß║╖c m├┤ tß║ú phß╗Ñ.

Validation:

- `npx eslint src/routes/routeConfig.js src/routes/roleRoutes.js src/routes/AppRoutes.jsx src/components/layout/TopBar.jsx src/components/layout/Sidebar.jsx src/api/dashboardApi.js src/features/admin/admin-monitoring-helpers.js src/features/admin/pages/AdminMonitoringPage.jsx src/features/dashboard/pages/AdminDashboardPage.jsx src/features/users/pages/UserManagementPage.jsx src/features/classrooms/pages/ClassroomListPage.jsx src/features/exams/pages/ExamListPage.jsx` ΓÇö passed.
- `npm run build -- --outDir temp-build-admin-mvp-final` ΓÇö passed.

Unresolved questions:

- Dß╗» liß╗çu `Gi├ím s├ít` cß╗ºa Admin hiß╗çn ─æang tß╗òng hß╗úp tß╗½ nguß╗ôn mock admin dashboard v├¼ backend ch╞░a c├│ bß╗Ö endpoint admin anti-cheat ri├¬ng; khi BE mß╗ƒ API ph├╣ hß╗úp, n├¬n thay dß║ºn phß║ºn tß╗òng hß╗úp FE n├áy bß║▒ng nguß╗ôn thß║¡t.
- Build vß║½n c├▓n warning sß║╡n c├│ tß╗½ `@microsoft/signalr` PURE annotation v├á cß║únh b├ío chunk lß╗¢n cß╗ºa Rolldown; thay ─æß╗òi n├áy kh├┤ng l├ám ph├ít sinh lß╗ùi build mß╗¢i.

## Feature: Student profile UX refresh and dashboard removal

Date: 2026-06-18

Branch/source: `devH`

Description:

- Gß╗í `Dashboard` khß╗Åi ─æiß╗üu h╞░ß╗¢ng Student v├¼ kh├┤ng c├▓n cß║ºn thiß║┐t trong flow hiß╗çn tß║íi; Student v├áo app sß║╜ ─æi thß║│ng tß╗¢i `Lß╗¢p cß╗ºa t├┤i` v├á route c┼⌐ `/student/dashboard` ─æ╞░ß╗úc giß╗» d╞░ß╗¢i dß║íng redirect ─æß╗â kh├┤ng l├ám hß╗Ång bookmark c┼⌐.
- L├ám mß╗¢i ho├án to├án trang `Hß╗ô s╞í` cß╗ºa Student theo h╞░ß╗¢ng nß╗òi bß║¡t h╞ín v├á dß╗à thao t├íc h╞ín: ─æß║ºu trang c├│ hero nhß║¡n diß╗çn r├╡ ngß╗» cß║únh, c├íc khß╗æi chß╗ë giß╗» title, khu avatar t├ích ri├¬ng, form cß║¡p nhß║¡t gß╗ìn h╞ín v├á c├│ trß║íng th├íi `─É├ú ─æß╗ông bß╗Ö` / `Ch╞░a l╞░u` c├╣ng n├║t `Ho├án t├íc`.
- Sß╗¡a breadcrumb `Trang chß╗º` cho Student ─æß╗â kh├┤ng c├▓n trß╗Å vß╗ü dashboard ─æ├ú bß╗ï gß╗í khß╗Åi UI.

Changed files:

- `frontend/src/routes/roleRoutes.js`
- `frontend/src/routes/AppRoutes.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/features/users/pages/ProfilePage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Added `POST /api/exams/{id}/questions/import` as a Teacher/Admin multipart endpoint using form field `file`.
- Import validates supported extensions, accepted MIME types, 5 MB max size, required headers/templates, question type, score, answer options, and correct-answer references before saving.
- CSV/XLSX rows and TXT/DOCX/PDF text blocks are parsed into the existing `Question` / `Answer` model and reuse existing exam question validation before appending imported questions to the target exam.
- Import is all-or-nothing: if any row has an error, the response includes row-level errors and no database changes are saved.

Validation:

- `dotnet build backend\EduGuard.slnx` ΓÇö blocked at API output copy because running `EduGuard.Api` / Visual Studio locked DLLs.
- Backend build with isolated output path ΓÇö succeeded, 0 warnings, 0 errors.
- Backend test with isolated output path ΓÇö succeeded with exit code 0.
- Parser smoke checks ΓÇö passed for `.csv`, `.xlsx`, `.txt`, `.docx`, and text-based `.pdf`.
- Backend API E2E import check ΓÇö passed: imported a standard CSV with 3 objective rows into an exam, verified saved question types `single_choice`, `multiple_choice`, `true_false`, and verified correct-answer counts.

Unresolved questions:

- Frontend upload UI, template download, and row-level/case-level error display are still pending.
- Images/media, ZIP import, OCR for scanned PDFs, short-answer, essay, persistent import batches, and duplicate detection remain later phases.

- `getNavigationItemsByRole` kh├┤ng c├▓n trß║ú menu `Dashboard` cho Student v├á `getDefaultPathByRole` nay trß║ú `routeConfig.studentClassrooms` ─æß╗â login/root redirect ─æ╞░a Student vß╗ü danh s├ích lß╗¢p thay v├¼ dashboard.
- `AppRoutes` kh├┤ng c├▓n mount `StudentDashboardPage` cho route c├┤ng khai cß╗ºa Student; `routeConfig.studentDashboard` giß╗¥ render `Navigate` sang `studentClassrooms` ─æß╗â giß╗» t╞░╞íng th├¡ch vß╗¢i link c┼⌐.
- `TopBar.buildBreadcrumbTrail` chuyß╗ân `Trang chß╗º` cß╗ºa Student sang `routeConfig.studentClassrooms` thay v├¼ hard-code `/${rolePrefix}/dashboard`.
- `ProfilePage` ─æ╞░ß╗úc dß╗▒ng lß║íi vß╗¢i hero profile nß╗òi bß║¡t, card th├┤ng tin theo bß╗æ cß╗Ñc mß╗¢i, dirty-state detection cho form, n├║t `Ho├án t├íc`, khu avatar ─æß╗Öc lß║¡p v├á submit payload ─æ├ú ─æ╞░ß╗úc normalize tr╞░ß╗¢c khi l╞░u.

Validation:

- `npx eslint src/routes/roleRoutes.js src/routes/AppRoutes.jsx src/components/layout/TopBar.jsx src/features/users/pages/ProfilePage.jsx` ΓÇö passed.
- `npm run build -- --outDir temp-build-student-profile-refresh` ΓÇö passed.

Unresolved questions:

- Build vß║½n c├▓n warning sß║╡n c├│ tß╗½ `@microsoft/signalr` PURE annotation v├á cß║únh b├ío chunk lß╗¢n cß╗ºa Rolldown; thay ─æß╗òi n├áy kh├┤ng l├ám ph├ít sinh lß╗ùi build mß╗¢i.

## Feature: Student classroom navigation active-state fix

Date: 2026-06-18

Branch/source: `devH`

Description:

- Bug fix: sß╗¡a lß╗ùi ß╗ƒ role Student khi mß╗ƒ `Tham gia lß╗¢p` th├¼ sidebar c┼⌐ng t├┤ s├íng `Lß╗¢p cß╗ºa t├┤i`, g├óy cß║úm gi├íc nh╞░ ng╞░ß╗¥i d├╣ng ─æang ─æß╗⌐ng ß╗ƒ hai mß╗Ñc ─æiß╗üu h╞░ß╗¢ng c├╣ng l├║c.
- Giß╗» nguy├¬n routing v├á flow tham gia lß╗¢p hiß╗çn tß║íi; thay ─æß╗òi chß╗ë giß╗¢i hß║ín ß╗ƒ logic x├íc ─æß╗ïnh menu active n├¬n kh├┤ng ß║únh h╞░ß╗ƒng render trang hoß║╖c API join classroom.

Changed files:

- `frontend/src/components/layout/Sidebar.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- `getNavigationItemIsActive` tr╞░ß╗¢c ─æ├│ d├╣ng `matchPath(routeConfig.studentClassroomDetail, pathname)` cho mß╗Ñc `Lß╗¢p cß╗ºa t├┤i`; pattern `/student/classrooms/:classroomId` match lu├┤n `/student/classrooms/join`, n├¬n cß║ú `Lß╗¢p cß╗ºa t├┤i` v├á `Tham gia lß╗¢p` c├╣ng ─æ╞░ß╗úc ─æ├ính dß║Ñu active.
- Th├¬m ─æiß╗üu kiß╗çn loß║íi trß╗½ r├╡ r├áng `routeConfig.studentJoinClassroom` tr╞░ß╗¢c khi match route detail cß╗ºa classroom ─æß╗â trang `/student/classrooms/join` chß╗ë k├¡ch hoß║ít ─æ├║ng menu `Tham gia lß╗¢p`.

Validation:

- `npx eslint src/components/layout/Sidebar.jsx` ΓÇö passed.
- `npm run build -- --outDir temp-build-student-join-active-fix` ΓÇö passed.
- `npm run lint` ΓÇö failed do script hiß╗çn qu├⌐t cß║ú c├íc th╞░ mß╗Ñc build tß║ím nh╞░ `frontend/temp-build-ui/**`; ESLint formatter ─æß╗Ñng `RangeError: Invalid string length` tr├¬n artifact sinh sß║╡n n├áy, kh├┤ng phß║úi do thay ─æß╗òi ß╗ƒ `Sidebar.jsx`.

Unresolved questions:

- N├¬n loß║íi trß╗½ hoß║╖c dß╗ìn c├íc th╞░ mß╗Ñc `temp-build-*` khß╗Åi phß║ím vi lint ─æß╗â `npm run lint` tiß║┐p tß╗Ñc l├á b╞░ß╗¢c verify to├án dß╗▒ ├ín ─æ├íng tin cß║¡y.

## Feature: Auth UI refinement with centered two-column login experience

Date: 2026-06-17

Branch/source: `devH`

Description:

- Thiß║┐t kß║┐ lß║íi giao diß╗çn ─æ─âng nhß║¡p theo layout 2 cß╗Öt c├ón giß╗»a m├án h├¼nh: brand panel navy gradient b├¬n tr├íi v├á login card trß║»ng b├¬n phß║úi, kh├┤ng c├▓n t├¼nh trß║íng form k├⌐o full width nh╞░ tr╞░ß╗¢c.
- T─âng khoß║úng trß║»ng, giß╗¢i hß║ín chiß╗üu rß╗Öng tß╗òng thß╗â, l├ám lß║íi hierarchy chß╗», input, checkbox row v├á n├║t CTA ─æß╗â khu vß╗▒c x├íc thß╗▒c nh├¼n r├╡ r├áng v├á chuy├¬n nghiß╗çp h╞ín tr├¬n desktop lß║½n mobile.
- Giß╗» nguy├¬n to├án bß╗Ö logic ─æ─âng nhß║¡p hiß╗çn tß║íi; chß╗ë thay ─æß╗òi UI/CSS/layout v├á l├ám mß╗¢i skin cß╗ºa toast ─æß╗â popup lß╗ùi/th├┤ng b├ío ─æß╗ông bß╗Ö h╞ín vß╗¢i m├án x├íc thß╗▒c.

Changed files:

- `frontend/src/features/auth/components/AuthLayout.jsx`
- `frontend/src/features/auth/pages/LoginPage.jsx`
- `frontend/src/index.css`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Rebuilt `AuthLayout` into a true two-column auth shell with a centered brand panel, a fixed-width form card, and responsive breakpoints that collapse cleanly to one column on smaller screens.
- Replaced the previous auth styling with dedicated `eg-auth-*` CSS for spacing, card radius, panel shadows, input height/focus state, CTA sizing, checkbox row alignment, and mobile behavior.
- Shortened the login copy to keep the card visually clean and moved the inline credential error into a dedicated auth alert style without touching submit/auth state handling.
- Tuned global toast presentation so danger/info/success toasts match the requested lighter card treatment and close button layout.

Validation:

- `npm run lint` ΓÇö passed.
- `npm run build -- --outDir temp-build-auth-ui` ΓÇö passed.

Unresolved questions:

- Vite/Rolldown still emits the existing non-blocking `@microsoft/signalr` PURE annotation warnings and large chunk warning during build; this change does not alter that behavior.

## Feature: Frontend dependency baseline for stable devH/release merges

Date: 2026-06-17

Branch/source: `devH`

Description:

- ß╗ön ─æß╗ïnh bß╗Ö dependency frontend giß╗»a `devH` v├á `release` bß║▒ng c├ích kh├│a exact version cho React, React Router, Vite, Tailwind v├á c├íc package trß╗▒c tiß║┐p kh├íc thay v├¼ tiß║┐p tß╗Ñc ─æß╗â semver range tr├┤i theo `^`.
- Bß╗ò sung metadata/cß║Ñu h├¼nh npm ─æß╗â nhß╗»ng lß║ºn `npm install` sau kh├┤ng tß╗▒ ghi th├¬m range mß╗¢i v├áo manifest, tß╗½ ─æ├│ giß║úm diff `package-lock.json` v├┤ ngh─⌐a khi sync hoß║╖c merge nh├ính.
- ─Éß╗ông bß╗Ö lß║íi lockfile theo bß╗Ö version ─æ├ú chß╗æt v├á kiß╗âm tra lß║íi build frontend tr├¬n codebase hiß╗çn tß║íi ─æß╗â tr├ính t├íi ph├ít lß╗ùi th╞░ viß╗çn Vite do drift dependency sau merge.

Changed files:

- `frontend/.npmrc`
- `frontend/package.json`
- `frontend/package-lock.json`
- `Todo List.md`
- `docs/project-changelog.md`

Technical summary:

- Th├¬m `packageManager: npm@11.6.2` v├á `.npmrc` vß╗¢i `save-exact=true` ─æß╗â chuß║⌐n h├│a c├┤ng cß╗Ñ c├ái package ß╗ƒ frontend.
- ─Éß╗òi to├án bß╗Ö direct dependency/devDependency tß╗½ semver range sang exact version khß╗¢p vß╗¢i bß╗Ö ─æ├ú verify: React `19.2.7`, React Router `7.18.0`, Vite `8.0.16`, `@tailwindcss/vite`/`tailwindcss` `4.3.1`, `axios` `1.18.0`, `lucide-react` `1.20.0`, c├╣ng c├íc package lint/type li├¬n quan.
- Re-sync `frontend/package-lock.json` ─æß╗â metadata ß╗ƒ root khß╗¢p manifest mß╗¢i v├á bß╗Å c├íc entry stale kh├┤ng c├▓n n├¬n ─æ╞░ß╗úc track sau nhß╗»ng lß║ºn c├ái ─æß║╖t tr├┤i version tr╞░ß╗¢c ─æ├│.
- Giß╗» nguy├¬n `vite.config.js`; sau r├á so├ít, kh├íc biß╗çt g├óy merge noise nß║▒m ß╗ƒ dependency resolution chß╗⌐ kh├┤ng phß║úi cß║Ñu h├¼nh proxy/alias cß╗ºa Vite.

Validation:

- `npm install --package-lock-only` ΓÇö passed.
- `npm run build -- --outDir temp-build-verify-pinned` ΓÇö passed.
- `git merge-tree $(git merge-base origin/release devH) origin/release devH` ΓÇö inspected; kh├┤ng xuß║Ñt hiß╗çn textual conflict marker ß╗ƒ `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.js`.

Unresolved questions:

- `npm ls --depth=0` vß║½n b├ío mß╗Öt sß╗æ package WASM helper ß╗ƒ `node_modules` l├á extraneous tß╗½ lß║ºn c├ái tr╞░ß╗¢c; build hiß╗çn kh├┤ng bß╗ï ß║únh h╞░ß╗ƒng, nh╞░ng n├¬n chß║íy `npm prune` hoß║╖c `npm ci` khi workspace kh├┤ng c├▓n process `node` giß╗» file.
- Vite/Rolldown vß║½n in warning kh├┤ng chß║╖n build tß╗½ `@microsoft/signalr` PURE annotation v├á cß║únh b├ío chunk size lß╗¢n mß║╖c ─æß╗ïnh.

## Feature: Frontend exam publish readiness and Vietnam timezone workflow

Date: 2026-06-17

Branch/source: `devH`

Description:

- Resolved the local `devH` pull conflict from `release` by keeping the release-side merge result, then continued implementation on top of that baseline.
- Synced Exam Management frontend with the backend exam validation/publish flow: teacher now configures schedule in Vietnam time (`UTC+7`), saves drafts explicitly, sees publish-readiness issues on exam detail, and can call the real `POST /api/exams/{id}/publish` action only when the draft is valid.
- Audited the current backend exam/question API surface against frontend flows and confirmed there is no remaining user-facing gap beyond the publish readiness workflow and question-management polish completed in this sync.
- Reworked the exam form layout into clearer UI groups that match the project design docs: basic information, schedule, exam behavior, and monitoring.
- Added frontend validation for duration, max attempts, and exam window consistency before request submission; backend publish errors are now surfaced as teacher-readable issue lists.

Changed files:

- `frontend/src/features/exams/components/ExamForm.jsx`
- `frontend/src/features/exams/components/exam-form-basic-section.jsx`
- `frontend/src/features/exams/components/exam-form-config-section.jsx`
- `frontend/src/features/exams/components/exam-form-helpers.js`
- `frontend/src/features/exams/components/exam-form-schedule-section.jsx`
- `frontend/src/features/exams/components/exam-form-monitoring-section.jsx`
- `frontend/src/features/exams/components/QuestionForm.jsx`
- `frontend/src/features/exams/components/question-form-helpers.js`
- `frontend/src/features/exams/examHelpers.js`
- `frontend/src/features/exams/pages/ExamListPage.jsx`
- `frontend/src/features/exams/pages/ExamDetailPage.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/package-lock.json`
- `Todo List.md`
- `docs/project-changelog.md`
- `CHANGELOG.md`

Technical summary:

- Reused the existing timezone helpers so `datetime-local` inputs round-trip as Vietnam local time in the UI while still sending UTC to the backend.
- Removed the ambiguous publish checkbox from the exam form; create/update now stay draft-oriented in the UI, while publish is handled from the exam detail screen with a dedicated action and readiness card.
- Mirrored the backend publish checks in frontend helpers to show actionable issues for missing/invalid question content, answer correctness, score, duration, max attempts, and exam window rules.
- Added question-type guidance inside the teacher question form and surfaced full question-type statistics, including short-answer coverage already supported by the backend exam model.
- Cleaned a few unused layout imports/props from release-side files so frontend lint could be used as a real verification step after the merge.
- Ran `npm install` inside `frontend/` to restore the missing `tw-animate-css` dependency referenced by the merged release stylesheet.

Validation:

- `npm.cmd --prefix frontend run lint` ΓÇö passed.
- `npm.cmd --prefix frontend install` ΓÇö succeeded, restored missing frontend dependency state after merge.
- `npm.cmd --prefix frontend run build` ΓÇö passed.

Unresolved questions:

- Vite/Rolldown still reports non-blocking warnings from `@microsoft/signalr` PURE annotations and the main bundle size remains above the default 500 kB warning threshold.
- `Todo List.md` still contains older historical notes from other branches/releases outside the scope of this focused frontend sync.
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

- `npm run build` ΓÇö succeeded.
- `npm test` (pre-commit) ΓÇö passed.

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
- T├íi cß║Ñu tr├║c lß║íi giao diß╗çn Teacher tß╗½ dß║íng Floating Header c┼⌐ sang Nav bar chuy├¬n nghiß╗çp, tß║ío kh├┤ng gian l├ám viß╗çc ─æß╗ông bß╗Ö, cß╗æ ─æß╗ïnh v├á tß╗æi ╞░u trß║úi nghiß╗çm sß╗¡ dß╗Ñng (ergonomics) cho giß║úng vi├¬n.
- T├¡ch hß╗úp th╞░ viß╗çn Recharts ─æß╗â trß╗▒c quan h├│a dß╗» liß╗çu thß╗æng k├¬ lß╗¢p hß╗ìc sinh ─æß╗Öng, bao gß╗ôm biß╗âu ─æß╗ô kß║┐t hß╗úp (Classroom Performance: Submission Rate vs. Average Score) v├á biß╗âu ─æß╗ô tr├▓n (Anti-cheat Incidents breakdown) c├│ ch├║ th├¡ch chi tiß║┐t.
- Bß╗ò sung panel gi├ím s├ít ph├▓ng thi realtime d╞░ß╗¢i dß║íng Proctoring Streams Placeholder c├│ overlay "Coming Soon", ─æß╗ïnh h├¼nh lß╗Ö tr├¼nh ph├ít triß╗ân t├¡ch hß╗úp WebRTC v├á SignalR Hub trong t╞░╞íng lai.

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
- Thay thß║┐ to├án bß╗Ö layout thß║╗ nß╗òi c┼⌐ bß║▒ng khung dashboard l╞░ß╗¢i (grid) linh hoß║ít, tu├ón thß╗º bß║úng m├áu Institutional Slate v1.1.
- Sß╗¡ dß╗Ñng `<ComposedChart>` hiß╗ân thß╗ï ─æß╗ông thß╗¥i tß╗ë lß╗ç nß╗Öp b├ái (Bar) v├á ─æiß╗âm trung b├¼nh (Line) cß╗ºa c├íc lß╗¢p hß╗ìc, c├╣ng ch├║ giß║úi (Tooltip) t├╣y biß║┐n cao.
- Thiß║┐t kß║┐ biß╗âu ─æß╗ô `<PieChart>` vß╗¢i g├│c bo nhß║╣ cho tß╗½ng phß║ºn, tß╗▒ ─æß╗Öng ├ính xß║í m├áu sß║»c theo mß╗⌐c ─æß╗Ö rß╗ºi ro (High/Medium/Low) cß╗ºa cheat log, ─æi k├¿m Custom Legend dß║íng n├║t tr├▓n ─æß╗ông bß╗Ö.
- X├óy dß╗▒ng component `ProctoringStreamsPlaceholder` sß╗¡ dß╗Ñng c├íc thß║╗ stream m├┤ phß╗Ång hoß║ít ─æß╗Öng camera gi├ím s├ít, bß╗ìc bß╗ƒi filter glassmorphic mß╗¥ v├á biß╗âu t╞░ß╗úng kh├│a/th├┤ng tin t├¡nh n─âng ─æang ph├ít triß╗ân.

Validation:
- `npm install react-is` ΓÇö ─É├ú c├ái ─æß║╖t dependency bß╗ò sung ─æß╗â giß║úi quyß║┐t vß║Ñn ─æß╗ü import cß╗ºa Recharts tr├¬n m├┤i tr╞░ß╗¥ng Vite/Rolldown.
- `npm run build` ΓÇö Bi├¬n dß╗ïch th├ánh c├┤ng dß╗▒ ├ín frontend, m├ú nguß╗ôn tß╗æi ╞░u h├│a kh├┤ng c├│ lß╗ùi c├║ ph├íp hay import.
- Kiß╗âm tra trß╗▒c quan cß║Ñu tr├║c giao diß╗çn tr├¬n tr├¼nh duyß╗çt ─æß║úm bß║úo responsive ─æß║ºy ─æß╗º ß╗ƒ c├íc ─æß╗Ö ph├ón giß║úi m├án h├¼nh.

Unresolved questions:
- Proctoring streams hiß╗çn tß║íi mß╗¢i l├á mock placeholder; cß║ºn kß║┐t nß╗æi vß╗¢i camera student th├┤ng qua WebRTC v├á SignalR hub gi├ím s├ít trong c├íc phase sau.
- T├¡ch hß╗úp dashboard API thß║¡t tß╗½ backend khi endpoints cho vai tr├▓ Teacher ─æ╞░ß╗úc ho├án thiß╗çn ─æß║ºy ─æß╗º tr├¬n service layer.

## Feature: Backend exam configuration validation

Date: 2026-06-15

Branch/source: `devB`

Description:

- Chuß║⌐n h├│a backend cho cß║Ñu h├¼nh b├ái kiß╗âm tra tr╞░ß╗¢c khi l├ám tiß║┐p frontend: thß╗¥i gian mß╗ƒ/─æ├│ng ─æß╗ü ─æ╞░ß╗úc l╞░u v├á trß║ú vß╗ü theo UTC r├╡ r├áng ─æß╗â frontend c├│ thß╗â hiß╗ân thß╗ï ─æ├║ng giß╗¥ Viß╗çt Nam.
- Siß║┐t validation cß║Ñu h├¼nh exam ß╗ƒ tß║ºng request/service: duration, max attempts v├á cß╗¡a sß╗ò mß╗ƒ/─æ├│ng ─æß╗ü phß║úi hß╗úp lß╗ç.
- Siß║┐t ─æiß╗üu kiß╗çn publish ─æß╗â ─æß╗ü chß╗ë ─æ╞░ß╗úc publish khi c├│ c├óu hß╗Åi hß╗úp lß╗ç; lß╗ùi publish trß║ú vß╗ü message r├╡ theo tß╗½ng c├óu/cß║Ñu h├¼nh ─æß╗â frontend hiß╗ân thß╗ï cho teacher.
- Bß╗ò sung validation publish cho trß║»c nghiß╗çm MVP: `SingleChoice`, `MultipleChoice`, `TrueFalse`; giß╗» m├┤ h├¼nh `Question` / `Answer` gß║»n trß╗▒c tiß║┐p vß╗¢i `Exam`, ch╞░a triß╗ân khai `QuestionBank` hoß║╖c import file trong b╞░ß╗¢c n├áy.

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

- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj -o temp\backend-exam-config-build` ΓÇö succeeded, 0 warnings, 0 errors. Used separate output because a running `EduGuard.Api` process locked the default build DLLs.
- `npm.cmd test` ΓÇö passed; current script runs `dotnet test backend/EduGuard.Api/EduGuard.Api.slnx` and the solution currently has no test project output.
- `git diff --check` ΓÇö passed; only existing LF/CRLF conversion warnings were reported.

Unresolved questions:

- Frontend still needs the matching timezone helper and UI changes so `datetime-local` inputs show `Asia/Ho_Chi_Minh` consistently.
- Manual Swagger/browser publish tests should cover invalid no-question exam, invalid answer counts, invalid correct-answer counts and valid trß║»c nghiß╗çm exam before commit.
- Question bank/import file remains a later feature; this change keeps questions attached directly to exams for MVP.

## Feature: SignalR realtime monitoring

Date: 2026-06-15

Branch/source: `devB`

Description:

- Ho├án thiß╗çn Phase 8 SignalR realtime ─æß╗â teacher nhß║¡n cß║únh b├ío anti-cheat ngay khi student ph├ít sinh log hß╗úp lß╗ç trong l├║c l├ám b├ái.
- Bß╗ò sung `NotificationHub` v├á `ExamMonitoringHub`; hub d├╣ng JWT Bearer qua query `access_token`, join group theo exam v├á chß╗ë teacher sß╗ƒ hß╗»u ─æß╗ü mß╗¢i ─æ╞░ß╗úc monitor.
- Th├¬m abstraction notifier trong Application ─æß╗â `AntiCheatService` gß╗¡i realtime warning sau khi l╞░u `CheatingLog` th├ánh c├┤ng m├á kh├┤ng phß╗Ñ thuß╗Öc trß╗▒c tiß║┐p v├áo API/Hub.
- Frontend c├ái `@microsoft/signalr`, th├¬m connection factory cho notification/exam monitoring, listener notification to├án app v├á cß║¡p nhß║¡t `AttemptMonitorPanel` ─æß╗â nhß║¡n `ReceiveAntiCheatWarning`, cß║¡p nhß║¡t score/log realtime v├á hiß╗ân thß╗ï toast cho teacher.
- Cß║¡p nhß║¡t registry/todo feature SignalR; notification realtime hiß╗çn c├│ hub/notifier/listener, c├▓n entity/API l╞░u notification vß║½n thuß╗Öc Notification System ri├¬ng.

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

- `npm.cmd --prefix frontend install @microsoft/signalr` ΓÇö installed `@microsoft/signalr@10.0.0`, audit found 0 vulnerabilities.
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj` ΓÇö succeeded, 0 warnings, 0 errors.
- `npm.cmd --prefix frontend run lint` ΓÇö passed.
- `npm.cmd --prefix frontend run build` ΓÇö passed; Vite/Rolldown emitted non-blocking warnings from `@microsoft/signalr` pure annotations and bundle size.
- `npm.cmd test` ΓÇö passed (`dotnet test backend/EduGuard.Api/EduGuard.Api.slnx`).

Unresolved questions:

- Browser E2E with two logged-in users was not run in this environment; verify manually with teacher exam detail open and student triggering anti-cheat events.
- Notification persistence/list/read APIs are still not implemented; current Phase 8 covers realtime hub/notifier/listener only.
- Frontend production bundle now crosses Vite's default 500 kB chunk warning after adding SignalR; consider route-based code splitting later if bundle size becomes a release concern.

## Feature: Identity keys ΓÇö int ΓåÆ string (GUID)

Date: 2026-06-13

Branch/source: local workspace

Description:

- Chuyß╗ân ASP.NET Core Identity sang mß║╖c ─æß╗ïnh Microsoft: `IdentityUser` / `IdentityRole` vß╗¢i kh├│a `string` (GUID).
- C├íc FK li├¬n quan user (`TeacherId`, `StudentId`, `UserId` tr├¬n Classroom, Assignment, Exam, ΓÇª) ─æß╗òi sang `string`.
- Role seed d├╣ng GUID cß╗æ ─æß╗ïnh (`RoleIds.Admin/Teacher/Student`).
- JWT `NameIdentifier` v├á API DTO `UserDto.Id` trß║ú GUID string.
- Migration `20260613065925_ConvertIdentityKeysToString` d├╣ng raw SQL (drop/recreate PK + indexes) v├¼ SQL Server kh├┤ng cho `AlterColumn` tr├¬n cß╗Öt IDENTITY.
- **Breaking:** DB dev ─æ├ú drop/recreate; user c┼⌐ (id int) kh├┤ng migrate ─æ╞░ß╗úc ΓÇö cß║ºn ─æ─âng k├╜ lß║íi.

Changed files:

- `backend/EduGuard.Domain/Entities/ApplicationUser.cs`, `Constants/role-ids.cs`, entity FK fields
- `backend/EduGuard.Infrastructure/Data/app-db-context.cs`, `dependency-injection.cs`, Auth services, repositories, services
- `backend/EduGuard.Application/DTOs/**`, service/repository interfaces
- `backend/EduGuard.Api/Controllers/*.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/20260613065925_ConvertIdentityKeysToString.cs`
- `docs/04_DATABASE_ENTITIES.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` ΓÇö 0 errors
- `dotnet ef database drop --force` + `dotnet ef database update` ΓÇö applied all migrations including `ConvertIdentityKeysToString`

Unresolved questions:

- Production DB c├│ dß╗» liß╗çu thß║¡t cß║ºn script migrate intΓåÆGUID ri├¬ng (kh├┤ng d├╣ng migration dev hiß╗çn tß║íi).

## Feature: Teacher exam publish and schedule defaults

Date: 2026-06-13

Branch/source: `devH`

Description:

- Sß╗¡a luß╗ông tß║ío b├ái kiß╗âm tra cho Teacher ─æß╗â c├│ thß╗â chß╗ìn publish ngay khi tß║ío, thay v├¼ lu├┤n tß║ío ß╗ƒ trß║íng th├íi nh├íp.
- Cho ph├⌐p backend publish metadata ─æß╗ü thi tr╞░ß╗¢c khi c├│ c├óu hß╗Åi, nh╞░ng chß║╖n Student bß║»t ─æß║ºu l├ám b├ái nß║┐u ─æß╗ü ch╞░a c├│ c├óu hß╗Åi ─æß╗â kh├┤ng tß║ío attempt rß╗ùng.
- Tß╗æi ╞░u form lß╗ïch thi: khi nhß║¡p thß╗¥i gian l├ám b├ái v├á chß╗ìn thß╗¥i gian mß╗ƒ ─æß╗ü, frontend tß╗▒ set thß╗¥i gian ─æ├│ng ─æß╗ü bß║▒ng `startTime + durationMinutes`; field ─æ├│ng ─æß╗ü vß║½n l├á input th╞░ß╗¥ng ─æß╗â giß║úng vi├¬n chß╗ënh tay khi cß║ºn.
- ─Éß╗ông bß╗Ö lß║íi t├ái liß╗çu API/test guide ─æß╗â kh├┤ng c├▓n m├┤ tß║ú publish bß║»t buß╗Öc phß║úi c├│ c├óu hß╗Åi.

Changed files:

- `frontend/src/features/exams/components/ExamForm.jsx`
- `backend/EduGuard.Infrastructure/Exams/exam-service.cs`
- `backend/EduGuard.Infrastructure/Exams/exam-attempt-service.cs`
- `docs/apiList.md`
- `docs/swagger-api-testing-guide.md`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint` ΓÇö passed
- `npm --prefix frontend run build` ΓÇö passed
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore --configuration Release` ΓÇö 0 warnings, 0 errors
- `dotnet build backend\EduGuard.Api\EduGuard.Api.csproj --no-restore` ΓÇö blocked by local Debug output lock from running Visual Studio / `EduGuard.Api` process

Unresolved questions:

- Publish hiß╗çn c├┤ng khai metadata ─æß╗ü thi; ─æß╗ü ch╞░a c├│ c├óu hß╗Åi vß║½n kh├┤ng cho Student bß║»t ─æß║ºu l├ám b├ái.

## Feature: Frontend assignment, exam attempt, and anti-cheat REST workflows

Date: 2026-06-11

Branch/source: `devH`

Description:

- Ho├án thiß╗çn 3 luß╗ông frontend c├▓n thiß║┐u nh╞░ng backend ─æ├ú sß║╡n s├áng: `Assignment Management`, `Online Testing / Exam Attempt`, v├á `Anti-cheat Monitoring` bß║ún REST c╞í bß║ún.
- Gß║»n `assignment` trß╗▒c tiß║┐p v├áo `ClassroomDetailPage`: teacher c├│ thß╗â tß║ío/sß╗¡a/x├│a b├ái tß║¡p, mß╗ƒ danh s├ích b├ái nß╗Öp v├á chß║Ñm ─æiß╗âm; student c├│ thß╗â nß╗Öp b├ái ngay trong lß╗¢p hß╗ìc theo ─æ├║ng palette/token hiß╗çn tß║íi.
- Th├¬m route l├ám b├ái ri├¬ng cho student tß║íi `student/attempts/:attemptId`: start/resume tß╗½ exam detail, timer cß╗æ ─æß╗ïnh, auto-save, ─æiß╗üu h╞░ß╗¢ng c├óu hß╗Åi desktop/mobile, x├íc nhß║¡n nß╗Öp b├ái, auto submit khi hß║┐t giß╗¥ v├á m├án kß║┐t quß║ú sau nß╗Öp.
- Bß╗ò sung hook anti-cheat REST c╞í bß║ún trong l├║c l├ám b├ái: ghi `TAB_SWITCH`, `COPY_PASTE`, `EXIT_FULLSCREEN`, `PAGE_RELOAD`, `DISCONNECTED`; ─æß╗ông thß╗¥i mß╗ƒ `AttemptMonitorPanel` ß╗ƒ exam detail cho teacher ─æß╗â xem suspicion score, log count v├á timeline theo tß╗½ng l╞░ß╗út l├ám.
- Giß╗» ─æ├║ng design direction trong `docs/design-guidelines.md` v├á token m├áu trong `docs/eduguard-design-tokens-preview.html`: flat surfaces, mß╗Öt primary CTA mß╗ùi v├╣ng, kh├┤ng th├¬m gradient/shadow mß╗¢i.

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

- Backend hiß╗çn ch╞░a c├│ endpoint ─æß╗â student lß║Ñy lß║íi b├ái nß╗Öp cß╗ºa ch├¡nh m├¼nh, n├¬n trß║íng th├íi `─É├ú nß╗Öp` cß╗ºa assignment ─æang ─æ╞░ß╗úc giß╗» ß╗òn ─æß╗ïnh tr├¬n FE bß║▒ng local cache sau khi submit; teacher vß║½n xem/chß║Ñm qua API thß║¡t b├¼nh th╞░ß╗¥ng.

## Fix: Refresh JWT claims when backend role changes

Date: 2026-06-11

Branch/source: `devH`

Description:

- X├íc ─æß╗ïnh lß╗ùi 403 ß╗ƒ c├íc API chß╗ë cho `Teacher` nh╞░ `POST /api/classrooms`: frontend c├│ thß╗â ─æ├ú ─æß╗ìc role mß╗¢i tß╗½ `GET /api/auth/me`, nh╞░ng access token c┼⌐ vß║½n giß╗» claim `Student`.
- Nguy├¬n nh├ón xß║úy ra khi quyß╗ün ─æ╞░ß╗úc ─æß╗òi trong database sau lß║ºn ─æ─âng nhß║¡p tr╞░ß╗¢c ─æ├│; UI route guard nh├¼n theo `user.roles` mß╗¢i n├¬n cho v├áo m├án Teacher, c├▓n backend authorize vß║½n ─æß╗ìc claim role c┼⌐ trong JWT.
- V├í `AuthProvider` ─æß╗â trong l├║c hydrate session, nß║┐u role tß╗½ `/api/auth/me` kh├íc role ─æang l╞░u, app tß╗▒ gß╗ìi `POST /api/auth/refresh-token` v├á l╞░u lß║íi access token/refresh token mß╗¢i tr╞░ß╗¢c khi tiß║┐p tß╗Ñc d├╣ng session.
- Nhß╗¥ ─æ├│ c├íc m├án Teacher nh╞░ tß║ío lß╗¢p hß╗ìc, tß║ío ─æß╗ü thi, xem endpoint `teacher-only` kh├┤ng c├▓n bß╗ï lß╗çch giß╗»a role hiß╗ân thß╗ï ß╗ƒ UI v├á quyß╗ün thß║¡t trong token.

Changed files:

- `frontend/src/hooks/useAuth.jsx`
- `docs/project-changelog.md`
- `Todo List.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Nß║┐u t├ái khoß║ún thß╗▒c tß║┐ ch╞░a ─æ╞░ß╗úc g├ín role `Teacher` trong database th├¼ backend vß║½n sß║╜ trß║ú `403` ─æ├║ng thiß║┐t kß║┐; fix n├áy chß╗ë xß╗¡ l├╜ tr╞░ß╗¥ng hß╗úp role ─æ├ú ─æß╗òi nh╞░ng token ch╞░a ─æ╞░ß╗úc l├ám mß╗¢i.

## Feature: Role UI simplification and design-token color alignment

Date: 2026-06-11

Branch/source: `devH`

Description:

- R├á lß║íi c├íc m├án ch├¡nh cß╗ºa `Admin`, `Teacher`, `Student` v├á bß╗Å phß║ºn m├┤ tß║ú phß╗Ñ ß╗ƒ cß║Ñp page header, section block, stat card, list card, form intro v├á note panel; UI giß╗» lß║íi title, sß╗æ liß╗çu v├á dß╗» liß╗çu nghiß╗çp vß╗Ñ cß║ºn ─æß╗ìc.
- Tinh gß╗ìn dashboard components d├╣ng chung: `StatCard`, `MetricBarList`, `TimelineList` kh├┤ng c├▓n render helper/subtitle/description mß║╖c ─æß╗ïnh; dß╗» liß╗çu cß║ºn thiß║┐t ─æ╞░ß╗úc dß╗ôn vß╗ü title hoß║╖c meta ngß║»n.
- Dß╗ìn c├íc m├án classroom, exam, dashboard, user/profile theo h╞░ß╗¢ng title-first: card lß╗¢p hß╗ìc v├á b├ái kiß╗âm tra kh├┤ng c├▓n ─æoß║ín m├┤ tß║ú d├ái; form tß║ío/join/chß╗ënh sß╗¡a giß║úm helper copy kh├┤ng cß║ºn thiß║┐t.
- Chuß║⌐n h├│a m├áu ß╗ƒ workspace ─æ├ú ─æ─âng nhß║¡p theo token trong `docs/eduguard-design-tokens-preview.html`: badge, toast, sidebar active state, user trigger, avatar fallback v├á shell surface chuyß╗ân vß╗ü palette phß║│ng, bß╗Å gradient/tone xanh ri├¬ng ß╗ƒ c├íc th├ánh phß║ºn n├áy.

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

- Auth screens v├á c├íc th├ánh phß║ºn ngo├ái workspace role-based ch╞░a ─æ╞░ß╗úc re-theme trong thay ─æß╗òi n├áy; nß║┐u muß╗æn to├án bß╗Ö frontend d├╣ng c├╣ng hß╗ç m├áu token, cß║ºn th├¬m mß╗Öt l╞░ß╗út cleanup ri├¬ng.

## Feature: Frontend integration for classroom, exam, attempt, and anti-cheat APIs

Date: 2026-06-11

Branch/source: `devH`

Description:

- Chuyß╗ân c├íc m├án frontend lß╗¢p hß╗ìc v├á b├ái kiß╗âm tra tß╗½ `mockDatabase/localStorage` sang gß╗ìi backend thß║¡t qua `axiosClient`, b├ím theo c├íc endpoint ─æ├ú c├│ trong `docs/apiList.md`.
- Th├¬m lß╗¢p adapter ß╗ƒ FE ─æß╗â chuß║⌐n h├│a DTO backend vß╗ü shape UI hiß╗çn tß║íi: classroom c├│ `memberCount` khi role ─æ╞░ß╗úc ph├⌐p xem th├ánh vi├¬n; exam c├│ `statusLabel`, `canEdit`, `canViewQuestionBank`, v├á tß╗▒ suy ra `totalQuestionScore`.
- Sß╗¡a c├íc form ─æß╗â khß╗¢p contract backend thß║¡t: tß║ío lß╗¢p kh├┤ng c├▓n nhß║¡p `joinCode` thß╗º c├┤ng; ─æß╗ü thi kh├┤ng ─æß╗òi ─æ╞░ß╗úc classroom sau khi tß║ío; publish d├╣ng endpoint ri├¬ng v├á chß╗ë xuß║Ñt hiß╗çn ß╗ƒ ngß╗» cß║únh ph├╣ hß╗úp.
- Bß╗ò sung API client cho `assignment`, `exam attempt`, `anti-cheat`; ─æß╗ông thß╗¥i tß║¡n dß╗Ñng `exam attempt` + `anti-cheat summary` ngay tr├¬n trang chi tiß║┐t ─æß╗ü thi ─æß╗â teacher xem ─æiß╗âm trung b├¼nh v├á sß╗æ liß╗çu gi├ím s├ít thß║¡t.
- Giß╗» r├╡ trß║íng th├íi mock cho c├íc phß║ºn backend ch╞░a c├│ endpoint t╞░╞íng ß╗⌐ng nh╞░ `user/profile` v├á `dashboard`, ─æß╗ông thß╗¥i cß║¡p nhß║¡t todo/docs ─æß╗â nh├│m nh├¼n ─æ├║ng tiß║┐n ─æß╗Ö t├¡ch hß╗úp.

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

- Backend hiß╗çn ch╞░a c├│ user/profile CRUD, dashboard, notification v├á admin classroom aggregation t╞░╞íng ß╗⌐ng vß╗¢i to├án bß╗Ö m├án FE hiß╗çn c├│, n├¬n c├íc khu vß╗▒c ─æ├│ vß║½n ─æang mock hoß║╖c chß╗ë hiß╗ân thß╗ï dß╗» liß╗çu giß╗¢i hß║ín theo quyß╗ün endpoint thß║¡t.

## Feature: Backend Phase 7 ΓÇö Anti-cheat Monitoring APIs

Date: 2026-06-11

Branch/source: local workspace (`release`)

Description:

- Th├¬m entity `CheatingLog`, bß║úng `CheatingLogs` (gß╗Öp trong migration `AddAssignmentsExamsAndAttempts` sau regenerate).
- `AntiCheatController` + `AntiCheatService` + `CheatingLogRepository`: ghi log h├ánh vi, xem log/score theo attempt, tß╗òng hß╗úp theo ─æß╗ü thi.
- Student chß╗ë ghi log khi attempt **InProgress** v├á exam **EnableAntiCheat**; cß╗Öng dß╗ôn `SuspicionScore` tr├¬n `ExamAttempt`.
- Loß║íi h├ánh vi API: `TAB_SWITCH`, `WINDOW_BLUR`, `COPY_PASTE`, `EXIT_FULLSCREEN`, `PAGE_RELOAD`, `DISCONNECTED`, `WEBCAM_OFF`.

Changed files:

- `backend/EduGuard.Domain/Entities/CheatingLog.cs`, `Enums/CheatingType.cs`
- `backend/EduGuard.Application/DTOs/AntiCheat/*`, validators, service/repository interfaces
- `backend/EduGuard.Infrastructure/AntiCheat/*`, `Repositories/cheating-log-repository.cs`
- `backend/EduGuard.Infrastructure/Data/Configurations/cheating-log-configuration.cs`
- `backend/EduGuard.Api/Controllers/anti-cheat-controller.cs`
- `backend/EduGuard.Infrastructure/Data/Migrations/20260611090709_AddAssignmentsExamsAndAttempts.*`
- `docs/apiList.md`, `docs/swagger-api-testing-guide.md`, `Todo List.md`

Validation:

- `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` ΓÇö 0 errors
- `dotnet ef database update` ΓÇö applied `20260611090709_AddAssignmentsExamsAndAttempts` (includes `CheatingLogs` table)

Unresolved questions:

- SignalR realtime warning (Phase 8) ch╞░a implement.
- Frontend monitor hook/dashboard ch╞░a l├ám (ngo├ái scope backend-only).

## Feature: PATCH endpoints (partial update)

Date: 2026-06-11

Branch/source: local workspace

Description:

- Th├¬m **PATCH** cho cß║¡p nhß║¡t mß╗Öt phß║ºn: Classroom, Assignment, Exam, Question, Answer.
- D├╣ng `Optional<T>` ΓÇö field kh├┤ng c├│ trong JSON body ─æ╞░ß╗úc giß╗» nguy├¬n; PUT vß║½n thay thß║┐ ─æß║ºy ─æß╗º.
- V├¡ dß╗Ñ: `PATCH /api/classrooms/1` body `{"name":"..."}` ΓÇö kh├┤ng ─æß╗òi `description`.

Changed files:

- `backend/EduGuard.Application/DTOs/Common/optional*.cs`
- `backend/EduGuard.Application/DTOs/**/patch-*-request.cs`
- `backend/EduGuard.Application/Validators/patch-*-validator.cs`
- `backend/EduGuard.Infrastructure/**` services (PatchAsync)
- `backend/EduGuard.Api/Controllers/*.cs`, `Program.cs`
- `docs/apiList.md`, `docs/swagger-api-testing-guide.md`

Validation: `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj` ΓÇö 0 errors.

## Fix: JSON response cho 401/403 (Authorize / JWT)

Date: 2026-06-11

Branch/source: local workspace

Description:

- **Bug:** Student gß╗ìi API Teacher (vd. `PUT /api/classrooms/{id}`) trß║ú 403 vß╗¢i body rß╗ùng (`content-length: 0`).
- **Fix:** Handler to├án cß╗Ñc `ApiAuthorizationMiddlewareResultHandler` + `JwtBearerEvents` trß║ú `ApiResponse<object>` JSON cho 401/403 tr├¬n mß╗ìi API c├│ `[Authorize]`.
- Lß╗ùi nghiß╗çp vß╗Ñ trong controller (`UnauthorizedAccessException`) vß║½n trß║ú message chi tiß║┐t nh╞░ tr╞░ß╗¢c.

Changed files:

- `backend/EduGuard.Api/Authorization/api-authorization-middleware-result-handler.cs`
- `backend/EduGuard.Api/Authorization/auth-api-response-writer.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Infrastructure/dependency-injection.cs`
- `docs/swagger-api-testing-guide.md`
- `docs/project-changelog.md`

Validation:

- `dotnet build` (cß║ºn restart/stop `EduGuard.Api` nß║┐u process ─æang lock DLL)

## Feature: Swagger API testing guide

Date: 2026-06-11

Branch/source: local workspace

Description:

- Th├¬m `docs/swagger-api-testing-guide.md`: h╞░ß╗¢ng dß║½n mß╗ƒ Swagger, Authorize JWT, g├ín role Teacher qua SQL, luß╗ông test Phase 2ΓÇô6 v├á checklist E2E.
- Sß╗¡a URL Swagger c┼⌐ (`7234`) trong `05_API_FRONTEND_INTEGRATION.md` ΓåÆ `7168`.
- Li├¬n kß║┐t tß╗½ `apiList.md`, `07_DEVELOPMENT_RULES.md`.

Changed files:

- `docs/swagger-api-testing-guide.md` (mß╗¢i)
- `docs/05_API_FRONTEND_INTEGRATION.md`
- `docs/07_DEVELOPMENT_RULES.md`
- `docs/apiList.md`
- `docs/project-changelog.md`

Validation:

- Nß╗Öi dung ─æß╗æi chiß║┐u `launchSettings.json`, controllers v├á DTO hiß╗çn tß║íi.

## Feature: Backend Phase 3ΓÇô6 ΓÇö Classroom, Assignment, Exam, Exam Attempt APIs

Date: 2026-06-11

Branch/source: `release` (local workspace)

Description:

- Ho├án thiß╗çn **Phase 3** Classroom: GET/PUT/DELETE lß╗¢p, x├│a th├ánh vi├¬n (8/8 API).
- Triß╗ân khai **Phase 4** Assignment: entity `Assignment`/`Submission`, 8 API (CRUD, submit, grade).
- Triß╗ân khai **Phase 5** Exam: entity `Exam`/`ExamSetting`/`Question`/`Answer`, 11 API + question bank cho teacher.
- Triß╗ân khai **Phase 6** Exam Attempt: start (shuffle + resume), save answer, submit (auto-grade), result, list attempts.
- Migration EF `20260611022446_AddAssignmentsExamsAndAttempts` ─æ├ú apply l├¬n `EduGuardExam`.
- Frontend vß║½n d├╣ng mock; t├¡ch hß╗úp API thß║¡t l├á b╞░ß╗¢c ri├¬ng.

Changed files:

- `backend/EduGuard.Domain/**` (entities, enums)
- `backend/EduGuard.Application/**` (DTOs, interfaces, validators)
- `backend/EduGuard.Infrastructure/**` (repositories, services, EF configs, migration)
- `backend/EduGuard.Api/Controllers/**` (classrooms, assignments, exams, exam-attempts)
- `Todo List.md`, `docs/apiList.md`, `docs/project-changelog.md`

Validation:

- `dotnet build` (backend) ΓÇö 0 errors
- `dotnet ef database update` ΓÇö migration applied successfully

Unresolved questions:

- Ch╞░a chß║íy Swagger E2E ─æß║ºy ─æß╗º classroom ΓåÆ assignment ΓåÆ exam ΓåÆ attempt tr├¬n m├┤i tr╞░ß╗¥ng dev.
- Anti-cheat (Phase 7) ch╞░a ghi log suspicion khi l├ám b├ái.

## Feature: Design tokens v1.1 ΓÇö Institutional Slate palette

Date: 2026-06-11

Branch/source: local workspace (`design.md` + preview + frontend tokens)

Description:

- N├óng cß║Ñp bß╗Ö m├áu EduGuard tß╗½ Apple Gray sang **Institutional Slate**: slate authority cho text, blue s├óu h╞ín cho CTA, neutral/border tinh chß╗ënh cho cß║úm gi├íc B2B education SaaS premium.
- Giß╗» nguy├¬n quy tß║»c flat: mß╗Öt accent `tertiary` cho CTA, link ri├¬ng, kh├┤ng gradient/shadow tr├¬n card.
- Th├¬m token `tertiary-hover`, `surface-sunken`, `border-subtle`, v├á `*-muted` cho badge/alert surface.
- ─Éß╗ông bß╗Ö `design.md`, preview HTML, `frontend/src/index.css`, `docs/design-guidelines.md`, v├á rule files.

Changed files:

- `design.md`
- `plans/visuals/eduguard-design-tokens-preview.html`
- `frontend/src/index.css`
- `docs/design-guidelines.md`
- `.cursor/rules/design-guidelines.mdc`
- `.agents/rules/design-guidelines.mdc`
- `docs/project-changelog.md`

Validation:

- Grep repo: kh├┤ng c├▓n `#0071E3`, `#0066CC`, `#1D1D1F` trong `frontend/`
- Preview: mß╗ƒ `plans/visuals/eduguard-design-tokens-preview.html` trong browser

Unresolved questions:

- Dark mode pairing ch╞░a ─æß╗ïnh ngh─⌐a trong v1.1 (chß╗ë light theme).

## Feature: Dark theme toggle and mock status mapping

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bß║¡t thß║¡t chß╗⌐c n─âng ─æß╗òi theme tß╗½ dropdown th├┤ng tin c├í nh├ón tr├¬n top bar: ng╞░ß╗¥i d├╣ng c├│ thß╗â chuyß╗ân qua lß║íi giß╗»a giao diß╗çn s├íng v├á tß╗æi ngay trong khu vß╗▒c ─æ├ú ─æ─âng nhß║¡p.
- Thiß║┐t lß║¡p `ThemeProvider` v├á bß╗Ö biß║┐n m├áu to├án cß╗Ñc ─æß╗â header, sidebar, card, button, input v├á dropdown ─æß╗ông loß║ít chuyß╗ân sang nß╗ün tß╗æi/chß╗» s├íng thay v├¼ chß╗ë ─æß╗òi m├áu cß╗Ñc bß╗Ö ß╗ƒ mß╗Öt v├ái component.
- Tinh chß╗ënh nhß║¡n diß╗çn th╞░╞íng hiß╗çu ß╗ƒ dark mode: logo tr├¬n top bar ─æ╞░ß╗úc ─æß║╖t trong khung bo g├│c ri├¬ng ─æß╗â nß╗òi bß║¡t h╞ín tr├¬n nß╗ün ─æen.
- Gß║»n th├¬m c├íc khß╗æi comment `MOCK STATUS` / `INTEGRATION STATUS` ß╗ƒ c├íc module dß╗» liß╗çu ch├¡nh ─æß╗â nh├¼n nhanh phß║ºn n├áo ─æ├ú nß╗æi backend thß║¡t, phß║ºn n├áo vß║½n ─æang chß║íy bß║▒ng `mockDatabase` v├á `localStorage`.

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

- Theme tß╗æi hiß╗çn ─æ├ú ├íp v├áo khu vß╗▒c app ─æ├ú ─æ─âng nhß║¡p; nß║┐u muß╗æn ─æß╗ông bß╗Ö cß║ú login/register theo theme n├áy th├¼ c├│ thß╗â l├ám tiß║┐p ß╗ƒ nhß╗ïp UI sau.

## Feature: Auth page redesign and top bar logo scaling

Date: 2026-06-11

Branch/source: `devH`

Description:

- Thiß║┐t kß║┐ lß║íi giao diß╗çn x├íc thß╗▒c EduGuard theo h╞░ß╗¢ng tß╗æi giß║ún, hiß╗çn ─æß║íi: bß╗æ cß╗Ñc 2 cß╗Öt vß╗¢i panel giß╗¢i thiß╗çu nß╗ün navy gradient ß╗ƒ b├¬n tr├íi v├á form trß║»ng nhiß╗üu khoß║úng thß╗ƒ ß╗ƒ b├¬n phß║úi.
- Panel giß╗¢i thiß╗çu ─æ╞░ß╗úc tinh chß╗ënh tiß║┐p theo g├│p ├╜ UI: logo d├╣ng bß║ún nß╗ün trong suß╗æt, ph├│ng lß╗¢n h╞ín, th├¬m wordmark `EduGuard` ngay d╞░ß╗¢i logo v├á chuyß╗ân th├┤ng ─æiß╗çp th├ánh 2 d├▓ng chß╗» ri├¬ng `Hß╗ìc tß║¡p an to├án.` / `Thi trß╗▒c tuyß║┐n minh bß║ích.` ─æß╗â kh├┤ng bß╗ï xuß╗æng h├áng.
- M├án ─æ─âng nhß║¡p ─æ╞░ß╗úc bß╗ò sung ─æ├║ng c├íc th├ánh phß║ºn UI y├¬u cß║ºu: nh├ún `X├üC THß╗░C T├ÇI KHOß║óN`, ti├¬u ─æß╗ü `─É─âng nhß║¡p EduGuard`, checkbox `Ghi nhß╗¢ ─æ─âng nhß║¡p`, link `Qu├¬n mß║¡t khß║⌐u?` v├á CTA ch├¡nh m├áu xanh.
- ─Éß╗ông bß╗Ö lß║íi register page ─æß╗â d├╣ng c├╣ng ng├┤n ngß╗» thiß║┐t kß║┐ mß╗¢i cß╗ºa khu x├íc thß╗▒c thay v├¼ giß╗» layout c┼⌐ lß╗çch t├┤ng.
- Chß╗ënh logo tr├¬n top bar: d├╣ng bß║ún logo nß╗ün trong suß╗æt, bß╗Å lß╗¢p nß╗ün trß║»ng bao quanh v├á ph├│ng logo lß╗¢n l├¬n ─æß╗â c├ón bß║▒ng vß╗¢i chiß╗üu cao chß╗» `EduGuard Workspace`.

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

- Link `Qu├¬n mß║¡t khß║⌐u?` hiß╗çn mß╗¢i l├á placeholder UI c├│ toast v├¼ backend ch╞░a c├│ luß╗ông kh├┤i phß╗Ñc mß║¡t khß║⌐u t╞░╞íng ß╗⌐ng.

## Feature: Top bar cue cleanup for header actions

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bß╗Å n├║t 3 gß║ích ─æß╗⌐ng tr╞░ß╗¢c logo trong header workspace ─æß╗â phß║ºn th╞░╞íng hiß╗çu b├¬n tr├íi gß╗ìn h╞ín ─æ├║ng theo y├¬u cß║ºu UI mß╗¢i.
- Th├¬m lß║íi dß║Ñu `v` ß╗ƒ cuß╗æi khß╗æi th├┤ng tin c├í nh├ón ─æß╗â ng╞░ß╗¥i d├╣ng dß╗à nhß║¡n ra card n├áy c├│ thß╗â bß║Ñm mß╗ƒ dropdown thao t├íc.

Changed files:

- `frontend/src/components/layout/TopBar.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Sau thay ─æß╗òi n├áy, header kh├┤ng c├▓n ─æiß╗âm mß╗ƒ sidebar tß╗½ ch├¡nh top bar nß╗»a; nß║┐u sau n├áy cß║ºn hß╗ù trß╗ú mobile r├╡ h╞ín c├│ thß╗â c├ón nhß║»c ─æß║╖t trigger ß╗ƒ vß╗ï tr├¡ kh├íc.

## Feature: Admin classroom list filters and simplified overview

Date: 2026-06-11

Branch/source: `devH`

Description:

- Tinh chß╗ënh m├án `admin/classrooms` ─æß╗â bß╗Å 3 ├┤ tß╗òng hß╗úp ph├¡a tr├¬n danh s├ích lß╗¢p hß╗ìc, giß╗» trß╗ìng t├óm v├áo viß╗çc duyß╗çt danh s├ích lß╗¢p thay v├¼ overview ngß║»n.
- Th├¬m khß╗æi `Bß╗Ö lß╗ìc lß╗¢p hß╗ìc` cho Admin vß╗¢i t├¼m kiß║┐m theo `t├¬n lß╗¢p hß╗ìc` hoß║╖c `t├¬n giß║úng vi├¬n`.
- Bß╗ò sung sß║»p xß║┐p danh s├ích lß╗¢p theo `t├¬n lß╗¢p hß╗ìc` v├á `sß╗æ l╞░ß╗úng th├ánh vi├¬n`, ─æß╗ông thß╗¥i th├¬m trß║íng th├íi rß╗ùng ri├¬ng khi bß╗Ö lß╗ìc kh├┤ng khß╗¢p lß╗¢p n├áo.
- Giß╗» nguy├¬n flow hiß╗çn tß║íi cß╗ºa Teacher v├á Student ─æß╗â kh├┤ng l├ám lß╗çch trß║úi nghiß╗çm ß╗ƒ c├íc vai tr├▓ c├▓n lß║íi.

Changed files:

- `frontend/src/features/classrooms/pages/ClassroomListPage.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- M├án Admin hiß╗çn vß║½n ─æß╗ìc dß╗» liß╗çu lß╗¢p hß╗ìc tß╗½ mock API; khi nß╗æi backend thß║¡t c├│ thß╗â ─æß║⌐y phß║ºn sß║»p xß║┐p/t├¼m kiß║┐m n├áy xuß╗æng query server nß║┐u sß╗æ l╞░ß╗úng lß╗¢p t─âng lß╗¢n.

## Feature: Profile avatar upload and local session hydration

Date: 2026-06-11

Branch/source: `devH`

Description:

- Bß╗ò sung khß║ú n─âng tß║úi ß║únh ─æß║íi diß╗çn tß╗½ m├íy ß╗ƒ trang hß╗ô s╞í thay cho viß╗çc chß╗ë nhß║¡p `Avatar URL`; ng╞░ß╗¥i d├╣ng c├│ thß╗â xem tr╞░ß╗¢c ß║únh, d├╣ng lß║íi avatar mß║╖c ─æß╗ïnh v├á chß╗ë cß║¡p nhß║¡t thß║¡t sau khi bß║Ñm l╞░u.
- Th├¬m kiß╗âm tra ─æß╗ïnh dß║íng ß║únh `PNG/JPG/WEBP` v├á giß╗¢i hß║ín dung l╞░ß╗úng `700 KB` ─æß╗â tr├ính ph├¼nh `localStorage` trong mock app hiß╗çn tß║íi.
- V├í luß╗ông hydrate auth khi tß║úi lß║íi trang: sau khi x├íc thß╗▒c token bß║▒ng backend `me`, app sß║╜ trß╗Ön lß║íi profile mock cß╗Ñc bß╗Ö ─æß╗â avatar v├á th├┤ng tin c├í nh├ón vß╗½a cß║¡p nhß║¡t kh├┤ng bß╗ï mß║Ñt khß╗Åi session frontend.

Changed files:

- `frontend/src/features/users/pages/ProfilePage.jsx`
- `frontend/src/hooks/useAuth.jsx`
- `Todo List.md`
- `docs/project-changelog.md`

Validation:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- ß║ónh ─æß║íi diß╗çn hiß╗çn ─æ╞░ß╗úc l╞░u cß╗Ñc bß╗Ö d╞░ß╗¢i dß║íng data URL trong tr├¼nh duyß╗çt; khi nß╗æi backend thß║¡t n├¬n chuyß╗ân sang upload file l├¬n server hoß║╖c object storage.

## Feature: Admin dashboard navigation cleanup and role stats

Date: 2026-06-11

Branch/source: `devH`

Description:

- Tinh gß╗ìn lß║íi phß║ºn ─æiß╗üu h╞░ß╗¢ng cß╗ºa m├án `admin/dashboard`: bß╗Å icon-only ß╗ƒ cß║ính phß║úi thß║╗ th├┤ng tin c├í nh├ón tr├¬n header ─æß╗â khß╗æi user gß╗ìn h╞ín nh╞░ng vß║½n giß╗» dropdown thao t├íc.
- ─Éß╗ông bß╗Ö menu Admin ß╗ƒ sidebar theo nh├ún mß╗¢i: `Dashboard`, `Quß║ún l├¡ lß╗¢p hß╗ìc`, `Quß║ún l├¡ b├ái kiß╗âm tra`, `Quß║ún l├¡ ng╞░ß╗¥i d├╣ng`, `Hß╗ô s╞í c├í nh├ón`.
- Dß╗ìn sidebar ─æß╗â chß╗ë c├▓n ti├¬u ─æß╗ü v├á danh s├ích route, bß╗Å hai khß╗æi m├┤ tß║ú `EduGuard ─æiß╗üu h╞░ß╗¢ng nhanh...` v├á `Sidebar hiß╗çn chß╗ë giß╗»...` theo y├¬u cß║ºu UI.
- Bß╗ò sung thß╗æng k├¬ t├ích ri├¬ng `Giß║úng vi├¬n` v├á `Sinh vi├¬n` tr├¬n dashboard Admin thay v├¼ chß╗ë ─æß╗â trong helper text cß╗ºa thß║╗ `Ng╞░ß╗¥i d├╣ng`.

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

- Dashboard Admin hiß╗çn vß║½n ─æß╗ìc mock API, n├¬n sß╗æ liß╗çu giß║úng vi├¬n v├á sinh vi├¬n ─æang phß║ún ├ính dß╗» liß╗çu mock/session hiß╗çn c├│ cß╗ºa frontend.

## Feature: Workspace header layout and simplified role sidebar

Date: 2026-06-11

Branch/source: `devH`

Description:

- Thay khung layout chung cß╗ºa to├án bß╗Ö vai tr├▓ ─æß╗â b├ím giao diß╗çn EduGuard hiß╗çn tß║íi: bß╗Å `BrandNavbar` c┼⌐ ß╗ƒ ph├¡a tr├¬n, ─æ╞░a khß╗æi workspace l├¬n l├ám header ch├¡nh, giß╗» nß╗ün s├íng, card trß║»ng, bo g├│c lß╗¢n v├á t├┤ng xanh navy/xanh nhß║ít.
- Header ─æ╞░ß╗úc tinh chß╗ënh tiß║┐p theo phß║ún hß╗ôi UI: b├¬n tr├íi thay khß╗æi `EG` bß║▒ng ß║únh thß║¡t `public/logo.png`, bß╗Å chß╗» `Mß╗ƒ menu` v├á `Khu l├ám viß╗çc`, ß╗ƒ giß╗»a bß╗Å hß║│n khß╗æi cß╗¥ Viß╗çt Nam ─æß╗â tß╗òng thß╗â gß╗ìn h╞ín.
- Khß╗æi th├┤ng tin ng╞░ß╗¥i d├╣ng b├¬n phß║úi giß╗» badge vai tr├▓ v├á dropdown c├í nh├ón; n├║t `─É─âng xuß║Ñt` ─æ╞░ß╗úc chuyß╗ân v├áo trong dropdown thay v├¼ ─æß╗⌐ng ri├¬ng b├¬n ngo├ái. C├íc mß╗Ñc `Th├┤ng tin`, `─Éß╗òi mß║¡t khß║⌐u`, `Chß║┐ ─æß╗Ö tß╗æi`, `EduGuard Premium` vß║½n giß╗» nguy├¬n; chß╗ë `Th├┤ng tin` ─æiß╗üu h╞░ß╗¢ng sang hß╗ô s╞í, c├íc mß╗Ñc c├▓n lß║íi hiß╗çn l├á placeholder UI ─æß╗â kh├┤ng ─æß╗Ñng logic trang.
- Tß╗æi giß║ún lß║íi sidebar ─æß╗â chß╗ë giß╗» ─æiß╗üu h╞░ß╗¢ng, bß╗Å phß║ºn lß║╖p th├┤ng tin ng╞░ß╗¥i d├╣ng; ─æß╗ông thß╗¥i chß╗ënh active state v├á spacing ─æß╗â nh├¼n sß║ích h╞ín tr├¬n desktop lß║½n mobile.

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

- `─Éß╗òi mß║¡t khß║⌐u`, `Chß║┐ ─æß╗Ö tß╗æi`, `EduGuard Premium` hiß╗çn mß╗¢i l├á mß╗Ñc dropdown ß╗ƒ mß╗⌐c giao diß╗çn; nß║┐u muß╗æn d├╣ng thß║¡t sß║╜ cß║ºn nß╗æi th├¬m logic ri├¬ng sau.

## Feature: Frontend role sync for protected routes and mock dashboards

Date: 2026-06-11

Branch/source: `devH`

Description:

- V├í frontend auth mapping ─æß╗â kh├┤ng c├▓n lß║Ñy bß╗½a `roles[0]` tß╗½ backend. App giß╗¥ chß╗ìn role ch├¡nh theo ╞░u ti├¬n `Admin -> Teacher -> Student`, n├¬n redirect v├á route guard kh├┤ng bß╗ï lß╗çch khi user c├│ nhiß╗üu quyß╗ün.
- Sß╗¡a bridge giß╗»a backend session v├á mock database: nß║┐u user ─æ├ú tß╗ôn tß║íi trong mock DB theo `id` hoß║╖c `email`, frontend sß║╜ cß║¡p nhß║¡t lß║íi `role`, `email`, `fullName`, trß║íng th├íi v├á timestamp tß╗½ session backend thay v├¼ giß╗» role mock c┼⌐.
- Nhß╗¥ ─æ├│ c├íc m├án dashboard mock cho `Admin` v├á `Teacher` sß║╜ ─æß╗ìc ─æ├║ng vai tr├▓ mß╗¢i sau khi ─æß╗òi quyß╗ün trong database v├á tß║úi lß║íi phi├¬n ─æ─âng nhß║¡p.

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

- Nß║┐u user ─æang giß╗» access token/session c┼⌐ tß╗½ tr╞░ß╗¢c khi ─æß╗òi role trong DB, vß║½n n├¬n tß║úi lß║íi trang hoß║╖c ─æ─âng xuß║Ñt rß╗ôi ─æ─âng nhß║¡p lß║íi ─æß╗â frontend hydrate lß║íi th├┤ng tin quyß╗ün mß╗¢i.

## Feature: Frontend auth integration with backend API

Date: 2026-06-11

Branch/source: `devH`

Description:

- Chuyß╗ân `LoginPage` v├á `RegisterPage` sang gß╗ìi backend auth thß║¡t theo ─æ├║ng docs v├á controller hiß╗çn tß║íi: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Giß╗» nguy├¬n trß║úi nghiß╗çm hiß╗çn c├│ cß╗ºa frontend bß║▒ng c├ích map `UserDto.Roles` tß╗½ backend vß╗ü shape `user.role` m├á app ─æang d├╣ng, n├¬n route guard, sidebar v├á redirect theo role kh├┤ng phß║úi sß╗¡a lan rß╗Öng.
- V├¼ dashboard/classroom/exam vß║½n ─æang ─æß╗ìc mock API, th├¬m mß╗Öt lß╗¢p bridge trong `mockDatabase` ─æß╗â user ─æ─âng nhß║¡p tß╗½ backend thß║¡t vß║½n ─æ╞░ß╗úc ─æß╗ông bß╗Ö v├áo mock DB khi cß║ºn, tr├ính vß╗í flow sau l├║c login.
- Gß╗í luß╗ông Google/demo auth khß╗Åi UI ─æ─âng nhß║¡p v├á ─æ─âng k├╜ ─æß╗â b├ím s├ít y├¬u cß║ºu hß╗ç thß╗æng trong `docs/` v├á tr├ính tß║ío session mock kh├┤ng khß╗¢p backend.

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

- `users`, `classrooms`, `dashboard`, `exams` tr├¬n frontend vß║½n c├▓n d├╣ng mock API; b╞░ß╗¢c tiß║┐p theo n├¬n nß╗æi dß║ºn c├íc module n├áy vß╗¢i backend thß║¡t ─æß╗â bß╗Å bridge tß║ím.

## Feature: Release integration ΓÇö backend phases 1-3 with frontend mock MVP

Date: 2026-06-11

Branch/source: `release` (merge `devD` backend line with `devH` frontend line)

Description:

- Gß╗Öp nh├ính `devH` v├áo `release` ─æß╗â nh├ính t├¡ch hß╗úp chß╗⌐a ─æß╗ông thß╗¥i backend Phase 1-3 v├á frontend mock cho auth, classroom, exam, dashboard.
- ─Éß╗ông bß╗Ö `Todo List.md` ─æß╗â trß║íng th├íi dß╗▒ ├ín phß║ún ├ính ─æ├║ng: backend auth/classroom ─æ├ú xong, frontend mock ─æ├ú c├│ nh╞░ng ch╞░a nß╗æi API thß║¡t.
- Giß╗» `release` l├á nh├ính t├¡ch hß╗úp nß╗Öi bß╗Ö, ch╞░a tß║ío th├¬m production release hay PR mß╗¢i v├áo `main` trong thay ─æß╗òi n├áy.

Changed files:

- `Todo List.md`
- `docs/project-changelog.md`
- `frontend/**`

Validation:

- `npm test`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run build`

Unresolved questions:

- Frontend hiß╗çn vß║½n d├╣ng mock/localStorage cho auth, classroom, dashboard v├á exam; cß║ºn b╞░ß╗¢c t├¡ch hß╗úp vß╗¢i backend thß║¡t ß╗ƒ nhß╗ïp tiß║┐p theo.

## Release: v1.1.0 (stable) ΓÇö promote from v1.1.0-rc.1

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

- Bß╗ò sung mock social auth bß║▒ng Google tr├¬n frontend: `LoginPage` v├á `RegisterPage` ─æß╗üu c├│ n├║t Google, d├╣ng profile Google demo ─æß╗â m├┤ phß╗Ång OAuth tr╞░ß╗¢c khi c├│ backend thß║¡t.
- Luß╗ông ─æ─âng k├╜ th╞░ß╗¥ng giß╗¥ gß║»n sß║╡n avatar capybara mß║╖c ─æß╗ïnh; luß╗ông Google mock sß║╜ d├╣ng ß║únh tß╗½ profile Google demo. ─Éß╗ông thß╗¥i th├¬m component `Avatar` d├╣ng chung cho top bar, sidebar v├á hß╗ô s╞í c├í nh├ón.
- Dß╗▒ng th├¬m `BrandNavbar` ngang tr├¬n c├╣ng ─æß╗â chß╗½a kh├┤ng gian cho logo/th╞░╞íng hiß╗çu; tß╗½ ─æ├│ hß║í sidebar xuß╗æng d╞░ß╗¢i, k├⌐o v├╣ng nß╗Öi dung ch├¡nh tho├íng h╞ín v├á th├¬m quick links theo role.
- ─Éß╗òi thß╗⌐ tß╗▒ menu cß╗ºa `Teacher` v├á `Student` ─æß╗â `Dashboard` nß║▒m gß║ºn cuß╗æi danh s├ích chß╗⌐c n─âng nh╞░ y├¬u cß║ºu; ─æß╗ông thß╗¥i giß╗» `Hß╗ô s╞í` ß╗ƒ cuß╗æi.
- Tinh gß╗ìn dashboard giß║úng vi├¬n v├á sinh vi├¬n: bß╗Å thß║╗ ΓÇ£─æiß╗âm trung b├¼nhΓÇ¥ khß╗Åi phß║ºn tß╗òng quan, sß╗¡a helper text ─æß╗â dashboard chß╗ë tß║¡p trung v├áo tiß║┐n ─æß╗Ö, cß║únh b├ío v├á viß╗çc sß║»p tß╗¢i.
- Chuyß╗ân trang lß╗¢p hß╗ìc cß╗ºa giß║úng vi├¬n sang flow thß╗▒c tß║┐ h╞ín: chß╗ë hiß╗çn button `Tß║ío lß╗¢p hß╗ìc`, bß║Ñm v├áo mß╗¢i mß╗ƒ form.
- N├óng cß║Ñp UI toast: nß╗ün dß╗ïu h╞ín, chß╗» trß║»ng, hiß╗çu ß╗⌐ng nß╗òi r├╡ h╞ín; ─æß╗ông thß╗¥i th├¬m th├┤ng b├ío khi ─æ─âng nhß║¡p th├ánh c├┤ng v├á khi ─æ─âng xuß║Ñt.

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

- Google auth hiß╗çn l├á mock frontend ─æß╗â test UX; khi backend sß║╡n s├áng sß║╜ cß║ºn thay bß║▒ng OAuth thß║¡t hoß║╖c Google Identity Services.

## Feature: Exam question bank and answer management on mock frontend

Date: 2026-06-10

Branch/source: `devH`

Description:

- Mß╗ƒ rß╗Öng `examApi` ─æß╗â quß║ún l├╜ dß╗» liß╗çu `Question` v├á `Answer` theo kiß╗âu database thß║¡t: lß║Ñy danh s├ích c├óu hß╗Åi theo ─æß╗ü, th├¬m c├óu hß╗Åi, cß║¡p nhß║¡t c├óu hß╗Åi, x├│a c├óu hß╗Åi v├á ─æß╗ông bß╗Ö lß║íi `orderIndex`.
- Th├¬m validate cho tß╗½ng loß║íi c├óu hß╗Åi `SingleChoice / MultipleChoice / TrueFalse / ShortAnswer`, bao gß╗ôm sß╗æ l╞░ß╗úng ─æ├íp ├ín tß╗æi thiß╗âu, sß╗æ ─æ├íp ├ín ─æ├║ng hß╗úp lß╗ç v├á bß╗Ö ─æ├íp ├ín cß╗æ ─æß╗ïnh cho c├óu ─æ├║ng/sai.
- Dß╗▒ng `QuestionForm` v├á `QuestionCard` trong trang chi tiß║┐t ─æß╗ü thi ─æß╗â giß║úng vi├¬n th├¬m/sß╗¡a/x├│a c├óu hß╗Åi c├╣ng ─æ├íp ├ín ngay tß║íi chß╗ù; phß║ºn chß╗ënh sß╗¡a d├╣ng chung mß╗Öt form ─æß╗Öng ─æß╗â giß║úm lß║╖p UI.
- Bß╗ò sung question summary trong `ExamDetailPage`: tß╗òng c├óu hß╗Åi, tß╗òng ─æiß╗âm, sß╗æ c├óu mß╗Öt ─æ├íp ├ín, nhiß╗üu ─æ├íp ├ín v├á tß╗▒ luß║¡n; sau mß╗ùi thao t├íc CRUD sß║╜ reload lß║íi dß╗» liß╗çu ─æß╗â summary lu├┤n khß╗¢p mock DB.
- Giß╗» quyß╗ün truy cß║¡p an to├án h╞ín ß╗ƒ mß╗⌐c frontend mock: `Admin` xem ─æ╞░ß╗úc question bank, `Teacher` chß╗ë quß║ún l├╜ ─æß╗ü cß╗ºa m├¼nh, `Student` kh├┤ng xem ─æ╞░ß╗úc nß╗Öi dung c├óu hß╗Åi/─æ├íp ├ín ß╗ƒ trang detail ─æß╗â tr├ính lß╗Ö ─æ├íp ├ín.

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

- Ch╞░a c├│ m├án h├¼nh l├ám b├ái v├á chß║Ñm ─æiß╗âm thß║¡t, n├¬n phß║ºn `ShortAnswer` hiß╗çn mß╗¢i l╞░u c├íc ─æ├íp ├ín mß║½u chß║Ñp nhß║¡n ─æß╗â chuß║⌐n bß╗ï cho b╞░ß╗¢c exam attempt sau.

## Feature: Global toast notifications for frontend feedback

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bß╗ò sung hß╗ç thß╗æng toast d├╣ng chung cho to├án frontend ─æß╗â c├íc th├┤ng b├ío th├ánh c├┤ng/thß║Ñt bß║íi hiß╗çn ß╗ƒ g├│c tr├¬n b├¬n phß║úi m├án h├¼nh v├á tß╗▒ ß║⌐n sau 3 gi├óy.
- Thay c├íc banner th├┤ng b├ío tß║ím thß╗¥i trong login, register, classroom, exam, profile, user management v├á dashboard bß║▒ng popup toast ─æß╗â giao diß╗çn gß╗ìn h╞ín, thß╗æng nhß║Ñt h╞ín.
- Giß╗» `EmptyState` cho c├íc tr╞░ß╗¥ng hß╗úp tß║úi dß╗» liß╗çu thß║Ñt bß║íi nghi├¬m trß╗ìng ─æß╗â ng╞░ß╗¥i d├╣ng vß║½n c├│ ngß╗» cß║únh m├án h├¼nh, c├▓n c├íc phß║ún hß╗ôi thao t├íc nhanh sß║╜ ─æi qua toast.
- R├á lß║íi dependency cß╗ºa c├íc `useEffect` li├¬n quan ─æß║┐n `showToast` v├á dß╗ìn timer cleanup trong provider ─æß╗â tr├ính warning lint.

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

- Khi nß╗æi backend thß║¡t hoß║╖c th├¬m realtime sau n├áy, c├│ thß╗â cß║ºn mß╗ƒ rß╗Öng toast th├ánh nhiß╗üu mß╗⌐c ╞░u ti├¬n h╞ín nh╞░ queue, action button hoß║╖c cß║únh b├ío kh├┤ng tß╗▒ ß║⌐n.

## Feature: Exam CRUD on role-based mock API

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bß╗ò sung `examApi` cho CRUD b├ái kiß╗âm tra theo mock database: danh s├ích, chi tiß║┐t, tß║ío, cß║¡p nhß║¡t, x├│a; quyß╗ün ─æ╞░ß╗úc t├ích r├╡ cho `Admin / Teacher / Student`.
- Mß╗ƒ rß╗Öng route v├á navigation vß╗¢i khu vß╗▒c `B├ái kiß╗âm tra` cho cß║ú 3 role; sau ─æ├│ dß╗▒ng `ExamListPage`, `ExamDetailPage`, `ExamForm`, `ExamCard`.
- Teacher hiß╗çn c├│ thß╗â tß║ío/sß╗¡a/x├│a/publish-unpublish ─æß╗ü thi ß╗ƒ mß╗⌐c metadata + settings: lß╗¢p hß╗ìc, thß╗¥i l╞░ß╗úng, lß╗ïch mß╗ƒ-─æ├│ng, anti-cheat, fullscreen, random c├óu hß╗Åi/─æ├íp ├ín, max attempts, show result.
- Student chß╗ë nh├¼n thß║Ñy ─æß╗ü ─æ├ú publish trong c├íc lß╗¢p ─æ├ú tham gia; Admin c├│ thß╗â xem to├án bß╗Ö ─æß╗ü thi trong hß╗ç thß╗æng mock.
- Mß╗ƒ rß╗Öng mock database vß╗¢i `examSettings`, `questions`, `answers` ─æß╗â b├ím s├ít t├ái liß╗çu entity v├á chuß║⌐n bß╗ï cho b╞░ß╗¢c question editor sau.
- V├í logic x├│a lß╗¢p hß╗ìc ─æß╗â cascade lu├┤n `assignments`, `submissions`, `exams`, `examSettings`, `questions`, `answers`, `examAttempts`, `cheatingLogs`, tr├ính dashboard ─æß║┐m sai dß╗» liß╗çu mß╗ô c├┤i.

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

- Ch╞░a triß╗ân khai editor c├óu hß╗Åi/─æ├íp ├ín tr├¬n UI, mß╗¢i dß╗½ng ß╗ƒ CRUD ─æß╗ü thi v├á settings.
- Ch╞░a c├│ backend thß║¡t; to├án bß╗Ö exam CRUD hiß╗çn chß║íy tr├¬n localStorage theo mock API.

## Feature: Role-based dashboards on mock API

Date: 2026-06-10

Branch/source: `devH`

Description:

- Bß╗ò sung `dashboardApi` chß║íy tr├¬n mock database ─æß╗â m├┤ phß╗Ång 3 endpoint `GET /api/dashboard/admin`, `GET /api/dashboard/teacher`, `GET /api/dashboard/student`.
- Mß╗ƒ rß╗Öng mock database vß╗¢i c├íc bß║úng dß╗» liß╗çu phß╗Ñc vß╗Ñ thß╗æng k├¬: `assignments`, `submissions`, `exams`, `examAttempts`, `cheatingLogs`, `notifications`; d├╣ng c╞í chß║┐ bß╗ò sung schema mß╗üm ─æß╗â kh├┤ng phß║úi reset dß╗» liß╗çu classroom c┼⌐ trong localStorage.
- Th├¬m dashboard ri├¬ng cho `Admin`, `Teacher`, `Student`; mß╗ùi role c├│ nß╗Öi dung kh├íc nhau: admin xem user/classroom/activity, teacher xem hiß╗çu suß║Ñt lß╗¢p/rß╗ºi ro anti-cheat/lß╗ïch thi, student xem tiß║┐n ─æß╗Ö c├í nh├ón/viß╗çc sß║»p tß╗¢i/kß║┐t quß║ú.
- Th├¬m c├íc component dashboard d├╣ng chung nh╞░ `StatCard`, `MetricBarList`, `TimelineList` ─æß╗â giß╗» UI thß╗æng nhß║Ñt v├á b├ím theo design guideline phß║ºn dashboard.
- ─Éß╗òi luß╗ông ─æ─âng nhß║¡p mß║╖c ─æß╗ïnh sang dashboard theo role thay v├¼ v├áo thß║│ng trang classroom.

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

- Dashboard hiß╗çn d├╣ng mock data trong localStorage, ch╞░a lß║Ñy tß╗½ backend thß║¡t.
- Ch╞░a c├│ chart library, n├¬n biß╗âu ─æß╗ô ─æang ß╗ƒ mß╗⌐c progress bar v├á timeline c╞í bß║ún.

## Feature: Role-based mock API, classroom CRUD, and profile management

Date: 2026-06-10

Branch/source: `devH`

Description:

- Chuyß╗ân frontend tß╗½ mß╗⌐c UI skeleton sang mock logic gß║ºn giß╗æng backend thß║¡t: dß╗» liß╗çu l╞░u trong localStorage theo c├íc bß║úng `users`, `classrooms`, `classroomMembers`, `refreshTokens`, `activityLogs`.
- ─Éß╗òi `authApi`, `classroomApi`, th├¬m `userApi` ─æß╗â response c├│ dß║íng `success/message/data`, gß║ºn vß╗¢i t├ái liß╗çu API integration v├á dß╗à thay bß║▒ng backend ASP.NET Core sau n├áy.
- T├ích route theo role `Admin / Teacher / Student`; mß╗ùi role c├│ luß╗ông classroom ri├¬ng, teacher c├│ CRUD lß╗¢p hß╗ìc, student join lß╗¢p bß║▒ng m├ú, admin xem ng╞░ß╗¥i d├╣ng v├á lß╗¢p hß╗ìc tß╗òng quan.
- Bß╗ò sung trang hß╗ô s╞í c├í nh├ón cho mß╗ìi role; ng╞░ß╗¥i d├╣ng c├│ thß╗â xem v├á sß╗¡a `fullName`, `email`, `avatarUrl`, ─æß╗ông thß╗¥i ─æß╗ông bß╗Ö lß║íi session ─æang ─æ─âng nhß║¡p.
- R├á lß║íi logic truy cß║¡p classroom: teacher chß╗ë quß║ún l├╜ lß╗¢p m├¼nh tß║ío, student chß╗ë xem lß╗¢p ─æ├ú tham gia, admin xem to├án hß╗ç thß╗æng.

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

- Ch╞░a c├│ backend thß║¡t, n├¬n to├án bß╗Ö auth/classroom/profile hiß╗çn vß║½n l├á mock API chß║íy tr├¬n localStorage.
- Ch╞░a triß╗ân khai dashboard, assignment, exam CRUD v├á c├íc luß╗ông thi/anti-cheat.

## Feature: Frontend demo polish and classroom state persistence

Date: 2026-06-10

Branch/source: `devH`

Description:

- R├á lß║íi logic demo frontend v├á sß╗¡a lß╗ùi classroom state: lß╗¢p mß╗¢i tß║ío giß╗¥ d├╣ng chung qua provider + local storage, kh├┤ng c├▓n mß║Ñt khi ─æß╗òi route hoß║╖c mß╗ƒ trang chi tiß║┐t.
- Sß╗¡a h├ánh vi mobile sidebar ─æß╗â bß║Ñm menu item l├á ─æ├│ng sidebar lu├┤n, tr├ính cß║úm gi├íc route ─æ├ú ─æß╗òi m├á panel vß║½n che m├án h├¼nh.
- Tinh gß╗ìn lß║íi giao diß╗çn auth, top bar, sidebar v├á classroom theo h╞░ß╗¢ng ├¡t chß╗» h╞ín, r├╡ h├ánh ─æß╗Öng h╞ín, b├ím s├ít design guideline Apple-inspired v├á quy tß║»c Vietnamese-first.
- Giß╗» nguy├¬n chß║┐ ─æß╗Ö test/mock khi ch╞░a c├│ backend: auth vß║½n ─æ─âng nhß║¡p demo, classroom vß║½n chß║íy bß║▒ng dß╗» liß╗çu m├┤ phß╗Ång.

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

- Ch╞░a c├│ backend thß║¡t, n├¬n auth/classroom vß║½n chß╗ë kiß╗âm thß╗¡ bß║▒ng dß╗» liß╗çu demo v├á local storage.

## Feature: Frontend foundation, auth routing skeleton, and classroom skeleton

Date: 2026-06-10

Branch/source: `devH`

Description:

- Dß╗▒ng lß║íi nß╗ün giao diß╗çn frontend theo token trong `design.md`: bß╗Å template Vite demo, thay bß║▒ng palette phß║│ng, surface/card, button/input/badge d├╣ng chung v├á layout Apple-inspired.
- Th├¬m `react-router-dom`, dß╗▒ng `AppRoutes`, `PublicRoute`, `ProtectedRoute`, `AppShell`, `Sidebar`, `TopBar` ─æß╗â kh├│a sß╗¢m luß╗ông route theo role.
- Tß║ío auth skeleton chß║íy bß║▒ng local storage m├┤ phß╗Ång: login, register, session tß║ím, logout, role-based redirect; mß╗Ñc ti├¬u l├á test UI v├á flow tr╞░ß╗¢c khi backend auth sß║╡n s├áng.
- Tß║ío classroom skeleton vß╗¢i mock data: danh s├ích lß╗¢p, form tß║ío lß╗¢p cho Teacher, form nhß║¡p m├ú cho Student, classroom detail + th├ánh vi├¬n.
- Bß╗ò sung comment tiß║┐ng Viß╗çt trong tß╗½ng component/h├ám ─æß╗â dß╗à ─æß╗ìc lß║íi khi hß╗ìc hoß║╖c tiß║┐p tß╗Ñc ph├ít triß╗ân.

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

- Auth v├á classroom hiß╗çn mß╗¢i l├á skeleton UI d├╣ng local storage + mock data; cß║ºn nß╗æi `authApi` v├á `classroomApi` khi backend phase 2 v├á 3 sß║╡n s├áng.

## Feature: Phase 3 ΓÇö Classroom Management API (backend)

Date: 2026-06-10

Branch/source: `devD`

Description:

- Ho├án th├ánh backend Giai ─æoß║ín 3 (phß║ím vi MVP): Teacher tß║ío lß╗¢p, Student join bß║▒ng m├ú, danh s├ích lß╗¢p, danh s├ích th├ánh vi├¬n.
- Application: DTOs (`CreateClassroomRequest`, `ClassroomDto`, `JoinClassroomRequest`, `ClassroomMemberDto`), `IClassroomRepository`, `IClassroomService`, FluentValidation.
- Infrastructure: `ClassroomRepository`, `ClassroomService` (sinh `JoinCode` 6 k├╜ tß╗▒, rejoin sau Removed), DI registration.
- Api: `ClassroomsController` vß╗¢i `[Authorize]`, role Teacher/Student cho create/join.

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

- `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx` ΓÇö 0 errors, 0 warnings.

Unresolved questions:

- `GET /api/classrooms/{id}` (F-CLS-03) ch╞░a trong checklist Giai ─æoß║ín 3 ΓÇö ─æß╗â phase sau hoß║╖c khi FE cß║ºn.

## Feature: Phase 2 ΓÇö Authentication API (backend)

Date: 2026-06-10

Branch/source: `devD`

Description:

- Ho├án th├ánh backend Giai ─æoß║ín 2: ─æ─âng k├╜, ─æ─âng nhß║¡p, refresh/logout token, profile `me`.
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

- `dotnet build backend/EduGuard.Api/EduGuard.Api.slnx` ΓÇö 0 errors, 0 warnings.
- Manual Swagger E2E: register, login, me, refresh-token, logout, `GET /api/Test`, `teacher-only` ΓÇö ─æ├ú verify 2026-06-10.

## Feature: Docs ΓÇö Auth DI trong AddInfrastructure

Date: 2026-06-10

Branch/source: `devD`

Description:

- L├ám r├╡ quy ╞░ß╗¢c Giai ─æoß║ín 2: `AddIdentity`, JwtBearer, `AddAuthorization`, auth services ─æ─âng k├╜ trong `dependency-injection.cs` (`AddInfrastructure`); `Program.cs` chß╗ë middleware `UseAuthentication` / `UseAuthorization`.
- Bß╗Å wording m╞í hß╗ô "AddInfrastructure hoß║╖c Program.cs" cho ─æ─âng k├╜ DI.
- Cß║¡p nhß║¡t `docs/02_SETUP_AND_PROJECT_STRUCTURE.md` ┬º7.2 (v├¡ dß╗Ñ ─æß║ºy ─æß╗º) v├á `docs/03_BACKEND_ARCHITECTURE.md` ┬º6.

Changed files:

- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- `docs/03_BACKEND_ARCHITECTURE.md`
- `docs/project-changelog.md`

Validation:

- ─Éß╗æi chiß║┐u quy ╞░ß╗¢c DI Giai ─æoß║ín 1 (`AddDbContext` ─æ├ú trong `AddInfrastructure`).

Unresolved questions:

- None.

## Feature: Docs sync ΓÇö Program.cs & AddInfrastructure

Date: 2026-06-10

Branch/source: `devD`

Description:

- ─Éß╗ông bß╗Ö `docs/02_SETUP_AND_PROJECT_STRUCTURE.md` vß╗¢i code Giai ─æoß║ín 1: `Program.cs` d├╣ng `AddInfrastructure`, t├ích mß╗Ñc hiß╗çn tß║íi (┬º7.1) vs mß╗Ñc ti├¬u Auth/JWT (┬º7.2).
- Cß║¡p nhß║¡t cß║Ñu tr├║c Infrastructure: t├¬n file kebab-case thß╗▒c tß║┐ (`app-db-context.cs`, `dependency-injection.cs`, configs) vs th╞░ mß╗Ñc kß║┐ hoß║ích.
- Cß║¡p nhß║¡t `docs/03_BACKEND_ARCHITECTURE.md` ┬º6: ph├ón biß╗çt DI hiß╗çn tß║íi v├á ─æ─âng k├╜ repository/service t╞░╞íng lai.

Changed files:

- `docs/02_SETUP_AND_PROJECT_STRUCTURE.md`
- `docs/03_BACKEND_ARCHITECTURE.md`
- `docs/project-changelog.md`

Validation:

- ─Éß╗æi chiß║┐u vß╗¢i `backend/EduGuard.Api/Program.cs` v├á `backend/EduGuard.Infrastructure/dependency-injection.cs`.

Unresolved questions:

- None.

## Feature: Phase 1 ΓÇö Database + Foundation Entities

Date: 2026-06-10

Branch/source: `devD`

Description:

- Ho├án th├ánh Giai ─æoß║ín 1: EF Core + SQL Server database `EduGuardExam` vß╗¢i Identity schema v├á entity nß╗ün tß║úng.
- Domain: `ApplicationUser`, `RefreshToken`, `Classroom`, `ClassroomMember`, `ClassroomMemberStatus`.
- Infrastructure: `AppDbContext`, Fluent API configs, `DependencyInjection.AddInfrastructure`, role seed (Admin/Teacher/Student).
- Migration `InitialIdentityAndClassroom` tß║ío bß║úng Users, Roles, UserRoles, RefreshTokens, Classrooms, ClassroomMembers.
- Api: ─æ─âng k├╜ `AddInfrastructure` trong `Program.cs`; th├¬m `Microsoft.EntityFrameworkCore.Design`.

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

- `dotnet build` ΓÇö 0 errors.
- `dotnet ef migrations add InitialIdentityAndClassroom` ΓÇö success.
- `dotnet ef database update` ΓÇö created `EduGuardExam`, applied migration, seeded 3 roles.

Unresolved questions:

- None.

## Feature: Phase 0 ΓÇö Frontend/Backend API connectivity

Date: 2026-06-10

Branch/source: `devD`

Description:

- Ho├án th├ánh Giai ─æoß║ín 0: React (Vite, port 5173) gß╗ìi `GET /api/Test`, hiß╗ân thß╗ï JSON tß╗½ ASP.NET Core API (HTTPS 7168).
- Backend: `TestController`, CORS `FrontendPolicy` (`Cors:AllowedOrigins` ΓåÆ `http://localhost:5173`).
- Frontend: `axiosClient`, `.env` (`VITE_API_BASE_URL`), `App.jsx` smoke test; Tailwind deps + `index.css` import.
- Cß║¡p nhß║¡t tiß║┐n ─æß╗Ö: `Todo List.md`, `README.md`, roadmap, `features.md`, `apiList.md`.

Changed files:

- `backend/EduGuard.Api/Controllers/TestController.cs`
- `backend/EduGuard.Api/Program.cs`
- `backend/EduGuard.Api/appsettings.json`
- `frontend/` (Vite, axios, App, env, proxy t├╣y chß╗ìn)
- `Todo List.md`
- `README.md`
- `docs/06_DEVELOPMENT_ROADMAP.md`
- `docs/features.md`
- `docs/apiList.md`
- `docs/project-changelog.md`

Validation:

- `dotnet run` (profile https) + `npm run dev`; trang React hiß╗ân thß╗ï `{ "message": "EduGuard API is running" }`.

Unresolved questions:

- Gß║»n `@tailwindcss/vite` v├áo `vite.config.js` khi bß║»t ─æß║ºu d├╣ng utility classes trong component (hiß╗çn UI smoke test d├╣ng inline style).

## Feature: Auth stack ΓÇö Identity + JWT

Date: 2026-06-10

Branch/source: `devD` (documentation only)

Description:

- Chuyß╗ân thiß║┐t kß║┐ auth tß╗½ POCO User/Role/UserRole + hash thß╗º c├┤ng sang **ASP.NET Core Identity** + **JWT Bearer** + **RefreshToken** custom.
- `ApplicationUser : IdentityUser<int>`, `IdentityDbContext`, seed Admin/Teacher/Student.
- Cß║¡p nhß║¡t Todo List Phase 1ΓÇô2, roadmap, entity docs, backend architecture, setup guide, overview, README, API integration notes.
- Connection string dev mß║½u: `DefaultConnection` ΓåÆ `EduGuardExam` tr├¬n `WPC-ADMIN\SQLEXPRESS`.
- Migration ─æß╗ü xuß║Ñt: `InitialIdentityAndClassroom`.

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



