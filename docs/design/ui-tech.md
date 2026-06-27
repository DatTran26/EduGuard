Bạn là Senior Frontend Engineer + UI/UX Designer. Hãy thiết kế và triển khai bộ giao diện Teacher Dashboard thật chuyên nghiệp cho dự án EduGuard.

# 1. Bối cảnh dự án

EduGuard là hệ thống quản lý học tập và thi trực tuyến có giám sát chống gian lận.

- UI direction: Apple-inspired / Institutional Slate

Role Teacher dùng hệ thống để:

- Tạo và quản lý lớp học
- Quản lý học sinh trong lớp
- Tạo bài tập
- Chấm bài tập
- Tạo đề thi
- Quản lý câu hỏi và đáp án
- Theo dõi lượt làm bài
- Xem kết quả thi
- Xem cảnh báo anti-cheat
- Xem dashboard thống kê

Mục tiêu lần này: tạo bộ UI xịn, đồng bộ, rõ nghiệp vụ cho role Teacher. Không làm UI trang trí vô nghĩa. Mỗi màn hình phải trả lời được câu hỏi: “Giáo viên vào đây để làm gì?”

# 2. Nguyên tắc UI bắt buộc

Tuân thủ design system của EduGuard:

- Thiết kế Apple-inspired: nhiều white space, typography rõ, bố cục sạch.
- Không dùng gradient.
- Không dùng style màu mè kiểu purple-neon, glassmorphism quá đà, AI-template.
- Không hardcode màu hex trong JSX; ưu tiên Tailwind token / class đã có.
- Mỗi màn hình hoặc mỗi section chỉ có một primary CTA chính.
- Màu CTA chính dùng tertiary / blue system của EduGuard.
- Semantic color chỉ dùng cho status: success, caution, danger, info.
- UI phải tạo cảm giác tin cậy, nghiêm túc, phù hợp môi trường giáo dục.
- Copywriting mặc định tiếng Việt.
- Không hiển thị thuật ngữ kỹ thuật như JWT, SignalR cho người dùng cuối.
- Ngày giờ dùng định dạng Việt Nam: dd/MM/yyyy, HH:mm.
- Bảng dữ liệu phải có empty state, loading skeleton, error state.
- Không dùng alert() browser; dùng toast/modal.
- Responsive:
  - Desktop: sidebar + content grid/table.
  - Tablet: layout co lại hợp lý.
  - Mobile: drawer navigation, table chuyển thành card list.

# 3. Phạm vi cần làm

Tạo hoặc nâng cấp bộ UI Teacher gồm các màn hình sau:

1. Teacher Dashboard
2. Classroom List
3. Classroom Detail
4. Assignment List / Assignment Detail / Grading
5. Exam List
6. Exam Detail
7. Question Editor
8. Exam Attempt Monitor
9. Anti-cheat Monitor / Attempt Timeline
10. Result & Report
11. Notification UI cơ bản
12. Teacher Profile page nếu đã có route

Nếu project đã có file tương ứng thì refactor, không tạo trùng component. Nếu chưa có thì tạo mới theo cấu trúc hợp lý.

# 4. Cấu trúc layout Teacher

Tạo layout Teacher thống nhất:

## AppShell

Gồm:

- Sidebar cố định desktop
- TopBar
- Main content
- Breadcrumb cho flow sâu
- Responsive drawer trên mobile

## Sidebar Teacher

Menu đề xuất:

- Dashboard
- Lớp học
- Bài tập
- Đề thi
- Giám sát thi
- Kết quả
- Thông báo
- Hồ sơ

Không hiển thị menu Admin cho Teacher.

Active route:

- Font-semibold hoặc background subtle
- Không dùng quá nhiều màu
- Icon đơn giản, dễ hiểu

## TopBar

TopBar gồm:

- Search input: tìm lớp, bài tập, đề thi, học sinh
- Quick Create button/dropdown:
  - Tạo lớp học
  - Tạo bài tập
  - Tạo đề thi
- Notification bell
- Avatar + menu tài khoản

# 5. Teacher Dashboard

Màn hình Dashboard là trang đầu tiên sau khi Teacher đăng nhập.

Mục tiêu: giúp giáo viên biết hôm nay cần chú ý gì.

Các section cần có:

## 5.1 Header

Hiển thị:

- Xin chào, [Tên giáo viên]
- Mô tả ngắn: “Theo dõi lớp học, bài thi và cảnh báo trong hôm nay”
- Primary CTA: “Tạo đề thi”
- Secondary action: “Tạo lớp học” hoặc “Tạo bài tập”

## 5.2 Stat cards

Tạo 4–5 StatCard:

- Lớp đang dạy
- Tổng học sinh
- Bài tập cần chấm
- Bài thi sắp diễn ra
- Cảnh báo rủi ro cao

Mỗi card gồm:

- Label
- Value
- Delta hoặc mô tả phụ
- Icon
- Status nếu cần

## 5.3 Upcoming workload

Danh sách các việc sắp tới:

- Bài tập gần deadline
- Đề thi sắp mở
- Đề thi sắp đóng
- Bài cần chấm

Mỗi item gồm:

- Tên
- Loại: Assignment / Exam
- Lớp
- Thời gian
- Trạng thái

## 5.4 Classroom performance chart

Biểu đồ hiệu suất lớp:

- Tỷ lệ nộp bài
- Điểm trung bình
- Số học sinh
- Có tooltip
- Có empty state nếu chưa có dữ liệu

Nếu đã có Recharts thì dùng Recharts. Nếu chưa có, tạo component chart wrapper đơn giản.

## 5.5 Anti-cheat breakdown

Hiển thị:

- Tổng số cảnh báo
- Cảnh báo theo mức: Low / Medium / High
- Biểu đồ tròn hoặc list có thanh tỷ lệ
- Danh sách top exam có rủi ro cao

Không gọi đây là “AI proctoring” nếu chưa có AI/camera thật. Gọi là “Giám sát hành vi làm bài”.

## 5.6 Recent activity

Timeline hoạt động gần đây:

- Học sinh vừa nộp bài
- Học sinh vừa hoàn thành bài thi
- Có cảnh báo anti-cheat mới
- Giáo viên vừa tạo lớp/bài/đề

# 6. Classroom List

Màn hình danh sách lớp học của Teacher.

Hiển thị:

- Page header: “Lớp học của tôi”
- Primary CTA: “Tạo lớp học”
- Search
- Filter trạng thái nếu có
- Grid card lớp học

Mỗi ClassroomCard gồm:

- Tên lớp
- Mô tả ngắn
- Mã tham gia lớp, có nút copy
- Số học sinh
- Số bài tập
- Số bài thi
- Hoạt động gần nhất
- CTA: “Xem lớp”
- Menu phụ: sửa, xóa

Empty state:

- Icon
- Title: “Bạn chưa có lớp học nào”
- Description
- CTA: “Tạo lớp học đầu tiên”

# 7. Classroom Detail

Màn hình chi tiết lớp học.

Header gồm:

- Tên lớp
- Mã lớp + copy
- Số học sinh
- Số bài tập
- Số bài thi
- CTA chính theo ngữ cảnh: “Tạo bài tập” hoặc “Tạo đề thi”

Dùng tab:

1. Tổng quan
2. Học sinh
3. Bài tập
4. Bài thi
5. Kết quả
6. Hoạt động

## Tab Tổng quan

Hiển thị:

- Stat cards: học sinh, bài tập đang mở, bài thi đang mở, điểm trung bình
- Tỷ lệ nộp bài
- Bài gần deadline
- Cảnh báo mới nhất nếu có

## Tab Học sinh

Table:

- Họ tên
- Email
- Ngày tham gia
- Số bài đã nộp
- Điểm trung bình
- Trạng thái
- Action: xem tiến độ, xóa khỏi lớp nếu API có

Mobile: chuyển table thành card list.

## Tab Bài tập

Table/card:

- Tiêu đề
- Deadline
- Đã nộp / tổng học sinh
- Chưa chấm
- Trạng thái
- Action: xem bài nộp

## Tab Bài thi

Table/card:

- Tên đề
- Thời gian mở
- Thời gian đóng
- Thời lượng
- Số câu hỏi
- Trạng thái: Draft / Published / Closed
- Số lượt làm bài
- Số cảnh báo
- Action: xem chi tiết, giám sát

# 8. Assignment UI

Cần có:

## Assignment List

Hiển thị:

- Filter theo lớp
- Filter theo trạng thái: Draft / Open / Closed / Need grading
- Search
- Sort theo deadline

Mỗi item:

- Tên bài tập
- Lớp
- Deadline
- Đã nộp / tổng học sinh
- Chưa chấm
- Điểm trung bình nếu có
- Badge trạng thái

## Assignment Form

Field:

- Tiêu đề
- Mô tả
- Lớp áp dụng
- Deadline
- Điểm tối đa
- File đính kèm nếu project đã có
- Cho phép nộp trễ nếu có API

Validation:

- Label luôn hiển thị
- Required có dấu *
- Lỗi field hiển thị inline
- Submit disabled khi invalid/loading

## Grading UI

Màn chấm bài gồm:

- Danh sách bài nộp bên trái
- Nội dung bài nộp bên phải
- Form chấm điểm
- Nhận xét
- Trạng thái đã chấm/chưa chấm
- Nút “Lưu điểm” là primary CTA

# 9. Exam UI

Đây là phần quan trọng nhất, cần làm nổi bật.

## Exam List

Hiển thị:

- Page header: “Đề thi”
- Primary CTA: “Tạo đề thi”
- Filter:
  - Theo lớp
  - Draft / Published / Closed
  - Anti-cheat bật/tắt
  - Sắp diễn ra / Đang mở / Đã đóng
- Search theo tên đề

Mỗi ExamCard hoặc row:

- Tên đề
- Lớp
- Số câu hỏi
- Thời lượng
- Thời gian mở/đóng
- Trạng thái
- Số lượt làm bài
- Điểm trung bình
- Số cảnh báo anti-cheat
- CTA: “Xem chi tiết”

## Exam Detail

Header:

- Tên đề
- Lớp
- Status badge
- Publish state
- CTA chính:
  - Nếu Draft: “Publish đề”
  - Nếu Published: “Giám sát bài thi” hoặc “Xem kết quả”
- Secondary actions:
  - Sửa
  - Thêm câu hỏi
  - Duplicate nếu có
  - Delete trong menu danger

Sections:

1. Overview cards
   - Số câu hỏi
   - Thời lượng
   - Số lượt làm
   - Điểm trung bình
   - Suspicion score trung bình
2. Schedule
   - Mở đề
   - Đóng đề
   - Thời lượng
3. Settings
   - Random câu hỏi
   - Random đáp án
   - Cho xem kết quả
   - Bật anti-cheat
4. Questions preview
   - Danh sách câu hỏi
   - Số điểm
   - Số đáp án
   - Đáp án đúng được hiển thị rõ cho Teacher
5. Attempts
   - Học sinh
   - Trạng thái
   - Điểm
   - Thời gian nộp
   - Số cảnh báo
   - Suspicion score
6. Anti-cheat summary
   - Tổng cảnh báo
   - Top học sinh rủi ro cao
   - Timeline cảnh báo mới

## Exam Form

Field:

- Tên đề thi
- Mô tả
- Lớp áp dụng
- Thời lượng làm bài
- Thời gian mở đề
- Thời gian đóng đề
- Điểm tối đa nếu có
- Bật anti-cheat
- Random câu hỏi
- Random đáp án
- Cho xem kết quả sau khi nộp
- Publish ngay nếu project đã hỗ trợ

UX:

- Khi chọn thời gian mở + thời lượng, tự gợi ý thời gian đóng.
- Chỉ có một nút primary: “Lưu đề thi” hoặc “Tạo đề thi”.
- Các nút phụ dùng secondary/ghost.

# 10. Question Editor

Tạo UI quản lý câu hỏi chuyên nghiệp.

Layout đề xuất:

- Cột trái: danh sách câu hỏi
- Cột phải: editor câu hỏi đang chọn

Mỗi câu hỏi gồm:

- Nội dung câu hỏi
- Loại câu hỏi
- Điểm
- Danh sách đáp án
- Đánh dấu đáp án đúng
- Giải thích đáp án nếu có

Action:

- Thêm câu hỏi
- Nhân bản câu hỏi nếu dễ làm
- Xóa câu hỏi
- Thêm đáp án
- Xóa đáp án
- Lưu thay đổi

UX:

- Câu hỏi chưa hợp lệ phải có badge cảnh báo
- Trước khi publish đề, nếu đề chưa có câu hỏi thì hiển thị warning rõ
- Không cho student bắt đầu bài thi nếu đề chưa có câu hỏi, nhưng UI Teacher nên báo sớm

# 11. Exam Attempt Monitor / Anti-cheat Monitor

Đây là màn tạo điểm khác biệt của EduGuard.

Không thiết kế như camera proctoring thật nếu chưa có WebRTC. Nếu có placeholder camera thì phải ghi rõ “Đang phát triển” hoặc “Coming soon”.

## Monitor List

Hiển thị danh sách đề đang/sắp thi:

- Tên đề
- Lớp
- Đang làm / tổng học sinh
- Đã nộp
- Cảnh báo
- Học sinh rủi ro cao
- Trạng thái realtime

CTA:

- “Mở giám sát”

## Monitor Detail

Header:

- Tên đề
- Lớp
- Trạng thái
- Realtime connection badge: Đang kết nối / Mất kết nối / Đang kết nối lại

Cards:

- Đang làm
- Đã nộp
- Cảnh báo hôm nay
- Rủi ro cao

Main table:

- Học sinh
- Trạng thái attempt
- Thời gian còn lại
- Điểm hiện tại nếu có
- Số log
- Suspicion score
- Risk level
- Cảnh báo mới nhất
- Action: xem timeline

Risk level:

- 0–20: Bình thường
- 21–50: Nghi ngờ nhẹ
- 51–80: Nghi ngờ cao
- >80: Cần xem xét

Log type hiển thị tiếng Việt:

- TAB_SWITCH: Chuyển tab
- WINDOW_BLUR: Rời cửa sổ
- COPY_PASTE: Copy/Paste
- EXIT_FULLSCREEN: Thoát toàn màn hình
- PAGE_RELOAD: Tải lại trang
- DISCONNECTED: Mất kết nối
- WEBCAM_OFF: Webcam tắt

## Attempt Timeline

Chi tiết một lượt làm bài:

- Học sinh
- Email
- Exam
- Start time
- Submit time
- Score
- Suspicion score
- Danh sách event timeline

Mỗi timeline item:

- Thời gian
- Loại hành vi
- Mô tả
- Điểm cộng
- Metadata nếu có

# 12. Result & Report

Màn hình kết quả dành cho Teacher.

Filter:

- Lớp
- Đề thi
- Khoảng thời gian
- Risk level
- Trạng thái: đã nộp / chưa nộp / đang làm / quá hạn

Summary:

- Điểm trung bình
- Điểm cao nhất
- Điểm thấp nhất
- Tỷ lệ hoàn thành
- Số học sinh rủi ro cao

Table:

- Học sinh
- Email
- Lớp
- Điểm
- Thời gian nộp
- Số cảnh báo
- Suspicion score
- Risk level
- Action: xem chi tiết

Export CSV/PDF chỉ làm nếu API hoặc requirement đã có. Nếu chưa có thì để button disabled hoặc ghi “Sắp có”, không giả vờ đã hoàn thiện.

# 13. Notification UI

Hiện realtime notification có thể có, nhưng notification persistence/list/read API có thể chưa hoàn thiện. Vì vậy làm UI theo 2 mức:

MVP:

- Notification bell
- Toast realtime khi có cảnh báo anti-cheat
- Dropdown thông báo gần đây từ state frontend

Nếu API notifications chưa có:

- Không tạo màn notification quá lớn dựa trên dữ liệu giả mà không ghi rõ.
- Empty state: “Chưa có thông báo được lưu”
- Có thể ghi chú dev comment trong code: waiting for notifications API

Sau này:

- List notifications
- Mark as read
- Mark all as read
- Filter theo loại

# 14. API integration

Ưu tiên dùng API thật đã có.

Các nhóm API Teacher cần dùng:

- Classroom API
- Assignment API
- Exam API
- Exam Attempt API
- Anti-cheat API
- SignalR exam monitoring
- Notification realtime nếu đã có

Nếu API nào chưa có:

- Không phá build.
- Tạo adapter/mock fallback rõ ràng.
- Comment rõ khu vực nào đang chờ backend.
- UI phải có loading, error, empty state.

Không gọi trực tiếp SQL Server từ frontend.
Mọi request protected dùng Axios client có Authorization Bearer token.

# 15. Component dùng chung cần có

Nếu chưa có, tạo hoặc chuẩn hóa:

- Button
- Badge
- Card
- StatCard
- PageHeader
- DataTable
- EmptyState
- Skeleton
- Modal
- Toast
- FormField
- SelectField
- DateTimeField
- ConfirmDialog
- RiskBadge
- StatusBadge
- CopyButton
- Timeline
- MetricBarList
- ChartCard

Không duplicate Button/Input riêng trong từng feature.

# 16. Folder structure đề xuất

Tuân thủ cấu trúc:

frontend/src/components/
├── common/
├── layout/
├── forms/
└── dashboard/

Feature-specific:

frontend/src/features/dashboard/
frontend/src/features/classrooms/
frontend/src/features/assignments/
frontend/src/features/exams/
frontend/src/features/anti-cheat/
frontend/src/features/notifications/
frontend/src/features/results/

Mỗi feature có thể gồm:

- pages/
- components/
- hooks/
- utils/

# 17. UX state bắt buộc

Mỗi màn có dữ liệu phải xử lý đủ:

- Loading state
- Empty state
- Error state
- Success feedback
- Form validation
- Disabled state khi đang submit
- Confirm modal cho delete/publish/submit nguy hiểm
- Toast khi copy mã lớp, lưu form, chấm điểm, nhận warning

# 18. Accessibility cơ bản

- Button có text rõ hoặc aria-label nếu chỉ icon
- Form label luôn hiển thị
- Error field có aria-invalid
- Modal trap focus nếu component hỗ trợ
- Không dùng màu làm tín hiệu duy nhất; status phải có text
- Contrast đủ rõ

# 19. Những điều không được làm

- Không thiết kế UI Admin trong scope Teacher.
- Không đưa menu Admin vào Teacher.
- Không gọi anti-cheat là AI nếu chưa có AI.
- Không gọi camera proctoring là đã hoạt động nếu mới là placeholder.
- Không hardcode dữ liệu demo trong component chính nếu có API thật.
- Không tạo nhiều primary CTA trên cùng một section.
- Không tạo style mới phá design system.
- Không sửa backend nếu không cần cho UI.
- Không đổi route/API contract tùy tiện.
- Không làm UI toàn mock mà không ghi rõ phần nào đang chờ backend.

# 20. Thứ tự triển khai

Làm theo thứ tự sau để dễ review:

1. Kiểm tra cấu trúc frontend hiện tại, route hiện tại, component đã có.
2. Chuẩn hóa AppShell, Sidebar, TopBar cho Teacher.
3. Nâng cấp Teacher Dashboard.
4. Nâng cấp Classroom List + Classroom Detail.
5. Nâng cấp Exam List + Exam Detail.
6. Tạo hoặc nâng cấp Question Editor.
7. Tạo hoặc nâng cấp Attempt Monitor + Anti-cheat Timeline.
8. Nâng cấp Assignment + Grading UI.
9. Tạo Result & Report page.
10. Thêm Notification bell/toast/dropdown.
11. Kiểm tra responsive.
12. Chạy lint/build.
13. Cập nhật docs/Todo nếu có thay đổi trạng thái.

# 21. Tiêu chí nghiệm thu

Sau khi hoàn thành, dự án phải đạt:

- npm run lint pass
- npm run build pass
- Không lỗi import
- Không lỗi route
- Teacher đăng nhập thấy đúng dashboard Teacher
- Sidebar Teacher không có menu Admin
- Dashboard hiển thị được summary/card/chart/list
- Classroom list/detail dùng được
- Exam list/detail dùng được
- Form tạo/sửa đề thi không vỡ layout
- Question editor rõ ràng, dễ dùng
- Teacher xem được attempts/result nếu API có
- Anti-cheat monitor hiển thị score/log/risk rõ ràng
- Realtime warning nếu SignalR có dữ liệu
- Mobile không vỡ layout
- Empty/loading/error state đầy đủ
- UI đồng bộ với Institutional Slate
- Không gradient
- Không nhiều nút primary cùng vùng

# 22. Đầu ra mong muốn

Hãy thực hiện trực tiếp trên codebase.

Sau khi làm xong, báo cáo lại:

1. Các file đã tạo/sửa
2. Màn hình đã hoàn thành
3. API thật nào đang dùng
4. Phần nào còn mock/chờ backend
5. Lệnh đã chạy để kiểm tra
6. Rủi ro còn lại
7. Gợi ý bước tiếp theo

Ưu tiên chất lượng UI, tính nhất quán và đúng nghiệp vụ hơn là thêm nhiều hiệu ứng.
