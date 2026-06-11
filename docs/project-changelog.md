# Project Changelog

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
