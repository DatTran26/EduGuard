# Dashboard & Reporting — System Test Checklist

> Module: **Dashboard & Reporting** (Phase 10 · `F-DASH-01` → `F-DASH-10`)  
> Cập nhật: 2026-06-15  
> Tham chiếu API: `GET /api/dashboard/admin` · `/teacher` · `/student` (`docs/apiList.md`)  
> Trạng thái triển khai: FE + mock API ✓ · BE `DashboardController` ⬜

**Cách dùng:** Đánh dấu `[x]` khi pass. Ghi **Fail** + Test ID vào bảng Defects bên dưới. Chạy P1 trước release.

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Môi trường | ⬜ Local · ⬜ Staging · ⬜ Production-like |
| Branch / build | |
| Ngày bắt đầu | |
| Ngày kết thúc | |
| BE dashboard API | ⬜ Chưa có · ⬜ Đã deploy |
| Ghi chú | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 10 | | | | | |
| 2. Positive | 4 | | | | | |
| 3. Negative | 6 | | | | | |
| 4. BVA | 6 | | | | | |
| 5. Equivalence | 6 | | | | | |
| 6. Edge cases | 6 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 5 | | | | | |
| 9. API | 6 | | | | | |
| 10. Database | 6 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 6 | | | | | |
| 13. Regression | 5 | | | | | |
| 14. Exploratory | 4 | | | | | |
| 15. Concurrency / Exception | 3 | | | | | |
| **Tổng** | **78** | | | | | |

**Quy ước:** P1 = bắt buộc trước release · Auto = có thể tự động hóa

---

## 1. Functional Testing

- [ ] **DASH-FUNC-001** · P1 · Admin xem tổng quan hệ thống (stat cards khớp DB)
- [ ] **DASH-FUNC-002** · P1 · Teacher xem dashboard lớp quản lý
- [ ] **DASH-FUNC-003** · P1 · Student xem tiến độ cá nhân
- [ ] **DASH-FUNC-004** · P1 · Teacher — danh sách sinh viên rủi ro cao (top 5, sort suspicion)
- [ ] **DASH-FUNC-005** · P2 · Teacher — lịch thi sắp tới (chỉ `startTime > now`, max 5)
- [ ] **DASH-FUNC-006** · P2 · Student — việc sắp tới (assignment + exam published)
- [ ] **DASH-FUNC-007** · P2 · Admin — phân bố vai trò (role distribution)
- [ ] **DASH-FUNC-008** · P2 · Admin — activity log gần đây (6 mục mới nhất)
- [ ] **DASH-FUNC-009** · P2 · Cheating type breakdown (TAB_SWITCH, COPY_PASTE, …)
- [ ] **DASH-FUNC-010** · P1 · Teacher — hiệu suất theo lớp (submissionRate, averageScore, riskCount)

---

## 2. Positive Testing

- [ ] **DASH-POS-001** · P1 · Auto · `GET /api/dashboard/admin` → 200 + schema đầy đủ
- [ ] **DASH-POS-002** · P1 · Auto · `GET /api/dashboard/teacher` → 200, scoped teacher
- [ ] **DASH-POS-003** · P1 · Auto · `GET /api/dashboard/student` → 200, scoped student
- [ ] **DASH-POS-004** · P1 · Auto · Login → redirect dashboard role, load thành công

---

## 3. Negative Testing

- [ ] **DASH-NEG-001** · P1 · Auto · Student truy cập Admin dashboard → chặn / 403
- [ ] **DASH-NEG-002** · P1 · Auto · Teacher truy cập Student dashboard → chặn / 403
- [ ] **DASH-NEG-003** · P1 · Auto · Gọi dashboard API không token → 401
- [ ] **DASH-NEG-004** · P1 · Auto · Token hết hạn → 401 + refresh hoặc login
- [ ] **DASH-NEG-005** · P1 · Auto · Teacher gọi `/api/dashboard/admin` → 403
- [ ] **DASH-NEG-006** · P1 · Auto · Chưa login truy cập URL dashboard → redirect login

---

## 4. Boundary Value Analysis (BVA)

- [ ] **DASH-BVA-001** · P1 · Auto · Teacher 0 lớp → counters 0, empty state, không crash
- [ ] **DASH-BVA-002** · P1 · Auto · Student 0 lớp → empty state hợp lệ
- [ ] **DASH-BVA-003** · P2 · Auto · Suspicion 0 / 9 / 10 / 11 → ngưỡng risk/warning đúng
- [ ] **DASH-BVA-004** · P2 · Auto · Submission rate 0% và 100%, clamp ≤ 100%
- [ ] **DASH-BVA-005** · P3 · Auto · High-risk: 6 SV → chỉ hiển thị top 5
- [ ] **DASH-BVA-006** · P2 · Exam `startTime = now` → quy tắc upcoming nhất quán

---

## 5. Equivalence Partitioning

- [ ] **DASH-EQ-001** · P1 · Auto · Partition Admin → dashboard admin OK
- [ ] **DASH-EQ-002** · P1 · Auto · Partition Teacher → dashboard teacher OK
- [ ] **DASH-EQ-003** · P1 · Auto · Partition Student → dashboard student OK
- [ ] **DASH-EQ-004** · P2 · Auto · Student upcoming: chỉ exam `isPublished`
- [ ] **DASH-EQ-005** · P1 · Auto · Chỉ member `Active` được tính vào `totalStudents`
- [ ] **DASH-EQ-006** · P2 · Auto · `averageExamScore` chỉ từ attempt có score numeric

---

## 6. Edge Cases

- [ ] **DASH-EDGE-001** · P1 · Auto · DB rỗng → counters 0, không NaN/undefined
- [ ] **DASH-EDGE-002** · P2 · Auto · Activity log orphan userId → fallback actor name
- [ ] **DASH-EDGE-003** · P2 · Auto · Exam/classroom đã xóa → title fallback
- [ ] **DASH-EDGE-004** · P1 · Đổi role trong DB → session sync qua `/me` / refresh token
- [ ] **DASH-EDGE-005** · P1 · Timezone UTC → hiển thị giờ Việt Nam (UTC+7)
- [ ] **DASH-EDGE-006** · P2 · SV nộp bài khi teacher đang xem → refresh cập nhật số liệu

---

## 7. Security Testing

- [ ] **DASH-SEC-001** · P1 · Auto · Teacher A không thấy metrics lớp Teacher B (IDOR)
- [ ] **DASH-SEC-002** · P1 · Auto · Student A không thấy điểm/suspicion Student B
- [ ] **DASH-SEC-003** · P1 · Auto · JWT tampering → 401/403, không escalate role
- [ ] **DASH-SEC-004** · P1 · Auto · XSS trong tên lớp/đề → escaped, không execute
- [ ] **DASH-SEC-005** · P3 · Rate limit / burst GET dashboard → không 500 hàng loạt

---

## 8. Error Handling

- [ ] **DASH-ERR-001** · P1 · Auto · API 500 → toast + EmptyState, không white screen
- [ ] **DASH-ERR-002** · P2 · Network offline → thông báo lỗi rõ ràng
- [ ] **DASH-ERR-003** · P2 · Auto · Unmount khi fetch chậm → không setState warning
- [ ] **DASH-ERR-004** · P1 · Auto · DB down → 503/500 generic, không leak secrets
- [ ] **DASH-ERR-005** · P2 · Partial aggregate fail → không trả số liệu sai lẫn

---

## 9. API Testing

- [ ] **DASH-API-001** · P1 · Auto · Contract admin response schema
- [ ] **DASH-API-002** · P1 · Auto · Contract teacher response schema
- [ ] **DASH-API-003** · P1 · Auto · Contract student response schema
- [ ] **DASH-API-004** · P2 · Auto · p95 latency < 800ms (dataset ~1k users)
- [ ] **DASH-API-005** · P3 · Auto · JSON UTF-8, tiếng Việt không lỗi encoding
- [ ] **DASH-API-006** · P2 · Auto · GET idempotent — 2 lần gọi cùng kết quả

---

## 10. Database Validation

- [ ] **DASH-DB-001** · P1 · Auto · `totalUsers` = `COUNT(Users)`
- [ ] **DASH-DB-002** · P1 · Auto · `totalStudents` = count role Student
- [ ] **DASH-DB-003** · P1 · Auto · Teacher `totalStudents` = unique active members scoped
- [ ] **DASH-DB-004** · P2 · Auto · `averageExamScore` khớp manual average (1 chữ số thập phân)
- [ ] **DASH-DB-005** · P2 · Auto · `totalSuspicionPoints` = SUM suspicionScore
- [ ] **DASH-DB-006** · P2 · Auto · Soft-delete attempt → counter theo business rule

---

## 11. End-to-End Testing

- [ ] **DASH-E2E-001** · P1 · Teacher tạo lớp + assignment → dashboard cập nhật
- [ ] **DASH-E2E-002** · P1 · Student nộp bài → `pendingAssignments` / progress đổi
- [ ] **DASH-E2E-003** · P1 · Attempt + anti-cheat TAB → teacher high-risk + breakdown
- [ ] **DASH-E2E-004** · P2 · Register student mới → admin counters +1
- [ ] **DASH-E2E-005** · P1 · Auto · Chuyển mock → real API, smoke 3 roles khớp DB

---

## 12. Non-functional Testing

- [ ] **DASH-NFR-001** · P2 · Performance LCP / load dashboard (Lighthouse)
- [ ] **DASH-NFR-002** · P2 · Responsive 375 / 768 / 1280px
- [ ] **DASH-NFR-003** · P2 · Accessibility WCAG 2.2 AA (keyboard, contrast, axe)
- [ ] **DASH-NFR-004** · P3 · Dark mode — cards/charts đọc được
- [ ] **DASH-NFR-005** · P2 · Auto · Redis cache dashboard (Phase 9) — hit/miss/TTL
- [ ] **DASH-NFR-006** · P3 · Chrome / Edge / Firefox smoke

---

## 13. Regression Testing

- [ ] **DASH-REG-001** · P1 · Auto · Sau SignalR Phase 8 — teacher dashboard vẫn load
- [ ] **DASH-REG-002** · P1 · Auto · Sau thay đổi auth interceptor — không 401 loop
- [ ] **DASH-REG-003** · P2 · Auto · UI không còn field đã remove (averageScore overview)
- [ ] **DASH-REG-004** · P2 · Auto · Husky pre-commit / `npm test` pass
- [ ] **DASH-REG-005** · P1 · Auto · Full smoke 3 roles post-release

---

## 14. Exploratory Testing

- [ ] **DASH-EXP-001** · P2 · Charter: Teacher nhận diện lớp cần can thiệp < 30s
- [ ] **DASH-EXP-002** · P2 · Charter: Student biết việc gấp nhất hôm nay
- [ ] **DASH-EXP-003** · P3 · Charter: Admin phát hiện spike cheating
- [ ] **DASH-EXP-004** · P1 · So sánh số dashboard vs exam detail / monitor — không lệch

**Ghi chú exploratory (findings):**

```
-
-
```

---

## 15. Concurrency & Exception

- [ ] **DASH-CON-001** · P2 · Auto · 10 concurrent GET dashboard — không deadlock
- [ ] **DASH-CON-002** · P3 · Admin dashboard khi bulk insert users
- [ ] **DASH-EXC-001** · P2 · Auto · `suspicionScore` null → treat as 0, sort OK

---

## Smoke tối thiểu (trước mỗi build)

Chạy nhanh ~15 phút nếu không đủ thời gian full suite:

- [ ] DASH-POS-004 · Login 3 role → dashboard load
- [ ] DASH-NEG-001 / 002 / 006 · Route guard
- [ ] DASH-FUNC-001 / 002 / 003 · Core functional 3 role
- [ ] DASH-SEC-001 / 002 · Data scoping
- [ ] DASH-ERR-001 · API lỗi → UI không crash
- [ ] DASH-REG-005 · Smoke post-merge

---

## Defect log

| Test ID | Severity | Mô tả lỗi | Steps reproduce | Trạng thái | Ticket |
|---------|----------|-----------|-----------------|------------|--------|
| | | | | Open / Fixed / Won't fix | |
| | | | | | |
| | | | | | |

---

## Sign-off

| Vai trò | Tên | Ngày | Kết luận |
|---------|-----|------|----------|
| QA | | | ⬜ Pass · ⬜ Pass with issues · ⬜ Fail |
| Dev | | | |
| PO / Lead | | | |

**Điều kiện Pass release (đề xuất):** 100% P1 pass · 0 Critical/Major open · P2 pass ≥ 90%

---

## Liên kết

- `docs/apiList.md` — §10 Dashboard
- `docs/features.md` — F-DASH-*
- `frontend/src/api/dashboardApi.js` — mock aggregation (hiện tại)
- `Todo List.md` — Giai đoạn 10 Dashboard & Reporting
