# Cross-cutting — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§X Cross-cutting**  
> Phạm vi: Security hệ thống · NFR · E2E journeys · Regression · Exploratory · Concurrency

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Build / branch | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Security (system) | 12 | | | | | |
| 2. Non-functional | 10 | | | | | |
| 3. E2E journeys | 10 | | | | | |
| 4. Regression | 10 | | | | | |
| 5. Exploratory | 6 | | | | | |
| 6. Error handling | 6 | | | | | |
| 7. Concurrency | 6 | | | | | |
| 8. API (cross-module) | 5 | | | | | |
| 9. Database (integrity) | 5 | | | | | |
| 10. Positive smoke | 5 | | | | | |
| **Tổng** | **80** | | | | | |

---

## 1. Security Testing (hệ thống)

- [ ] **X-SEC-001** · P1 · Auto · SQL injection: login email, join code, search fields
- [ ] **X-SEC-002** · P1 · XSS stored: classroom name, exam title, assignment, feedback
- [ ] **X-SEC-003** · P1 · CORS chỉ allow origin cấu hình (`5173`)
- [ ] **X-SEC-004** · P1 · `.env` / secrets không trong git (`git grep` scan)
- [ ] **X-SEC-005** · P2 · HTTPS local `7168` — cert warning handled FE
- [ ] **X-SEC-006** · P2 · SignalR + REST cùng JWT validation rules
- [ ] **X-SEC-007** · P2 · CSRF: state-changing API requires Bearer not cookie-only
- [ ] **X-SEC-008** · P2 · IDOR sweep: random GUIDs across modules
- [ ] **X-SEC-009** · P3 · Security headers (nếu nginx/prod): X-Content-Type-Options
- [ ] **X-SEC-010** · P3 · Dependency audit `npm audit` / `dotnet list` review
- [ ] **X-SEC-011** · P2 · Role escalation via API body tampering
- [ ] **X-SEC-012** · P3 · Mass assignment on PUT/PATCH DTOs

---

## 2. Non-functional Testing

- [ ] **X-NFR-001** · P2 · Auto · `npm run build` FE pass
- [ ] **X-NFR-002** · P2 · Auto · `dotnet build` + `dotnet test` pass
- [ ] **X-NFR-003** · P2 · Responsive smoke: login, classroom, exam @ 375px
- [ ] **X-NFR-004** · P2 · Accessibility: login form labels, focus, axe scan critical pages
- [ ] **X-NFR-005** · P3 · Dark mode — main pages readable
- [ ] **X-NFR-006** · P3 · Chrome / Edge / Firefox critical path smoke
- [ ] **X-NFR-007** · P3 · Lighthouse performance login + dashboard baseline
- [ ] **X-NFR-008** · P3 · Bundle size không tăng vọt sau feature merge
- [ ] **X-NFR-009** · P3 · API p95 classroom list < 800ms local dataset
- [ ] **X-NFR-010** · P3 · Memory FE no leak after 30 min navigation

---

## 3. End-to-End Journeys (hệ thống)

- [ ] **X-E2E-001** · P1 · **Journey A:** Register → login student → join lớp → xem assignment
- [ ] **X-E2E-002** · P1 · **Journey B:** Teacher tạo lớp → exam → publish → SV thi → kết quả
- [ ] **X-E2E-003** · P1 · **Journey C:** Journey B + anti-cheat + teacher monitor realtime
- [ ] **X-E2E-004** · P2 · **Journey D:** Teacher giao bài → SV nộp → chấm → dashboard teacher
- [ ] **X-E2E-005** · P2 · **Journey E:** Admin dashboard tổng quan sau Journey B/C
- [ ] **X-E2E-006** · P2 · Logout → protected routes blocked
- [ ] **X-E2E-007** · P2 · Teacher multi-class: 2 lớp, 2 exams, 2 students isolated
- [ ] **X-E2E-008** · P3 · Student maxAttempts=2 — two full attempts journey
- [ ] **X-E2E-009** · P3 · Assignment deadline journey timezone VN
- [ ] **X-E2E-010** · P3 · New teacher onboarding end-to-end 30 min charter

---

## 4. Regression Testing (sau merge lớn)

- [ ] **X-REG-001** · P1 · Auth + classroom + exam start smoke
- [ ] **X-REG-002** · P1 · Attempt submit + result
- [ ] **X-REG-003** · P1 · Anti-cheat log + score
- [ ] **X-REG-004** · P1 · SignalR warning path
- [ ] **X-REG-005** · P2 · Assignment submit + grade
- [ ] **X-REG-006** · P2 · Role route guards toàn app
- [ ] **X-REG-007** · P2 · Swagger all implemented controllers respond
- [ ] **X-REG-008** · P2 · FE routing deep links refresh OK
- [ ] **X-REG-009** · P3 · Husky hooks still pass
- [ ] **X-REG-010** · P3 · Mock dashboard still loads if BE dashboard absent

---

## 5. Exploratory Testing (charter hệ thống)

- [ ] **X-EXP-001** · P2 · Charter: Giáo viên mới — lớp + đề + giám sát 30 phút không doc
- [ ] **X-EXP-002** · P2 · Charter: Sinh viên mobile + chuyển tab — hiểu hậu quả
- [ ] **X-EXP-003** · P3 · Charter: Admin đánh giá sức khỏe từ dashboard
- [ ] **X-EXP-004** · P2 · Session timeout / refresh — không mất attempt đang làm
- [ ] **X-EXP-005** · P3 · Charter: Concurrent exams 2 lớp cùng teacher
- [ ] **X-EXP-006** · P3 · Charter: Error message clarity tiếng Việt

**Ghi chú exploratory:**

```
-
-
```

---

## 6. Error Handling (cross-module)

- [ ] **X-ERR-001** · P1 · BE tắt đột ngột — FE message thân thiện
- [ ] **X-ERR-002** · P2 · SQL timeout — không corrupt attempt/submission
- [ ] **X-ERR-003** · P2 · 401 global — redirect login, clear stale token
- [ ] **X-ERR-004** · P2 · 403 — không expose internal ids in message
- [ ] **X-ERR-005** · P3 · Partial outage: BE up DB down — consistent errors
- [ ] **X-ERR-006** · P3 · FE error boundary không white screen

---

## 7. Concurrency & Load

- [ ] **X-CON-001** · P2 · 10 SV cùng start exam — no deadlock
- [ ] **X-CON-002** · P3 · Teacher + SV thao tác cùng classroom đồng thời
- [ ] **X-CON-003** · P3 · 5 teachers parallel CRUD different classrooms
- [ ] **X-CON-004** · P3 · Burst anti-cheat logs 50/s — system stable
- [ ] **X-CON-005** · P3 · Parallel assignment submits same deadline second
- [ ] **X-CON-006** · P3 · Hub + REST load combined smoke

---

## 8. API Testing (cross-module contracts)

- [ ] **X-API-001** · P2 · OpenAPI/Swagger matches implemented routes (`apiList.md`)
- [ ] **X-API-002** · P2 · Consistent error JSON shape all controllers
- [ ] **X-API-003** · P2 · Pagination pattern consistent (users, notifications future)
- [ ] **X-API-004** · P3 · DateTime fields ISO 8601 UTC
- [ ] **X-API-005** · P3 · Versioning header (nếu có) backward compatible

---

## 9. Database Integrity (cross-module)

- [ ] **X-DB-001** · P2 · No orphan ExamAttempts without Exam
- [ ] **X-DB-002** · P2 · No orphan Submissions without Assignment
- [ ] **X-DB-003** · P2 · Classroom delete consistency across modules
- [ ] **X-DB-004** · P3 · CheatingLogs always link valid Attempt
- [ ] **X-DB-005** · P3 · User delete impact documented / blocked

---

## 10. Positive Smoke (integration)

- [ ] **X-SMOKE-001** · P1 · `/api/test` + login 3 roles
- [ ] **X-SMOKE-002** · P1 · Classroom create + join
- [ ] **X-SMOKE-003** · P1 · Exam publish + start
- [ ] **X-SMOKE-004** · P1 · Submit + result
- [ ] **X-SMOKE-005** · P1 · Anti-cheat + hub warning

---

## Smoke hệ thống 15 phút (master)

Chạy trước mỗi build — đồng bộ với master checklist:

- [ ] SYS-FUNC-001
- [ ] AUTH-FUNC-002 · Login 3 role
- [ ] AUTH-FUNC-007 · Route guard
- [ ] CLS-E2E-001
- [ ] EXM-E2E-001
- [ ] ATT-E2E-001
- [ ] AC-E2E-001
- [ ] SR-E2E-001
- [ ] X-REG-001

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|
| | | | | Open | |

---

## Sign-off

| Vai trò | Tên | Ngày | Kết luận |
|---------|-----|------|----------|
| QA | | | ⬜ Pass · ⬜ Pass w/ issues · ⬜ Fail |

---

## Liên kết module chi tiết

| Module | File |
|--------|------|
| System | [`system-infrastructure-system-test-checklist.md`](system-infrastructure-system-test-checklist.md) |
| Auth | [`authentication-system-test-checklist.md`](authentication-system-test-checklist.md) |
| Classroom | [`classroom-system-test-checklist.md`](classroom-system-test-checklist.md) |
| Exam + Attempt | [`exam-management-system-test-checklist.md`](exam-management-system-test-checklist.md) · [`exam-attempt-system-test-checklist.md`](exam-attempt-system-test-checklist.md) |
| Anti-cheat + SR | [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md) · [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md) |
| Dashboard | [`dashboard-reporting-system-test-checklist.md`](dashboard-reporting-system-test-checklist.md) |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
- [`README.md`](README.md)
