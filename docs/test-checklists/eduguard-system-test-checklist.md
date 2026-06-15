# EduGuard — System Test Checklist (Toàn hệ thống)

> **Master checklist** — áp dụng functional, negative, BVA, security, API, DB, E2E, NFR, regression, exploratory cho toàn bộ EduGuard.  
> Cập nhật: 2026-06-15 · Tham chiếu: `docs/apiList.md`, `docs/features.md`  
> **16 file chi tiết** (~1.116 TC): xem [`README.md`](README.md) — mỗi module có checklist riêng như Dashboard.

**Cách dùng:** Đánh dấu `[x]` khi pass · `[~]` blocked/skip · Ghi defect vào cuối file · Chạy **Smoke hệ thống** trước mỗi build, sau đó P1 từng module.

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Môi trường | ⬜ Local · ⬜ Staging · ⬜ Docker Compose |
| Branch / build | |
| Backend URL | `https://localhost:7168` |
| Frontend URL | `http://localhost:5173` |
| DB | `EduGuardExam` |
| Ngày bắt đầu / kết thúc | / |

---

## Tiến độ theo module

| # | Module | File chi tiết | TC | Pass | Fail | Skip | Blocked | % |
|---|--------|---------------|-----|------|------|------|---------|---|
| 0 | System / Infra | [`system-infrastructure-system-test-checklist.md`](system-infrastructure-system-test-checklist.md) | 50 | | | | | |
| 1 | Database | [`database-entity-system-test-checklist.md`](database-entity-system-test-checklist.md) | 56 | | | | | |
| 2 | Authentication | [`authentication-system-test-checklist.md`](authentication-system-test-checklist.md) | 85 | | | | | |
| 3 | User Management | [`user-management-system-test-checklist.md`](user-management-system-test-checklist.md) | 62 | | | | | |
| 4 | Classroom | [`classroom-system-test-checklist.md`](classroom-system-test-checklist.md) | 79 | | | | | |
| 5 | Assignment | [`assignment-system-test-checklist.md`](assignment-system-test-checklist.md) | 78 | | | | | |
| 6 | Exam Management | [`exam-management-system-test-checklist.md`](exam-management-system-test-checklist.md) | 88 | | | | | |
| 7 | Exam Attempt | [`exam-attempt-system-test-checklist.md`](exam-attempt-system-test-checklist.md) | 95 | | | | | |
| 8 | Anti-cheat | [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md) | 73 | | | | | |
| 9 | Notification | [`notification-system-test-checklist.md`](notification-system-test-checklist.md) | 58 | | | | | |
| 10 | Dashboard | [`dashboard-reporting-system-test-checklist.md`](dashboard-reporting-system-test-checklist.md) | 78 | | | | | |
| 11 | SignalR Realtime | [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md) | 67 | | | | | |
| 12 | Redis Cache | [`redis-cache-system-test-checklist.md`](redis-cache-system-test-checklist.md) | 60 | | | | | |
| 13 | Logging & Activity | [`logging-activity-system-test-checklist.md`](logging-activity-system-test-checklist.md) | 49 | | | | | |
| 14 | Docker / Deploy | [`docker-deploy-system-test-checklist.md`](docker-deploy-system-test-checklist.md) | 58 | | | | | |
| X | Cross-cutting | [`cross-cutting-system-test-checklist.md`](cross-cutting-system-test-checklist.md) | 80 | | | | | |
| **Tổng** | | **16 files** | **1116** | | | | | |

---

## 0. System / Infrastructure

**Trạng thái:** ✓ Phase 0

> **Chi tiết 50 test case:** [`system-infrastructure-system-test-checklist.md`](system-infrastructure-system-test-checklist.md)

### Tóm tắt — đánh dấu khi hoàn thành cả module
- [ ] **SYS-MOD-001** · P1 · Smoke `/api/test` + Swagger + CORS
- [ ] **SYS-MOD-002** · P1 · JWT role guard `teacher-only` (401/403)
- [ ] **SYS-MOD-003** · P2 · `dotnet test` + Husky pre-commit pass
- [ ] **SYS-MOD-004** · P2 · Toàn bộ 50 TC file con — Pass ≥ 95% P1

---

## 1. Database & Entity

**Trạng thái:** ✓ Phase 1 (+ migrations exam/assignment/attempt)

> **Chi tiết 56 test case:** [`database-entity-system-test-checklist.md`](database-entity-system-test-checklist.md)

### Tóm tắt
- [ ] **DB-MOD-001** · P1 · Migration applied, roles seeded, bảng domain đủ
- [ ] **DB-MOD-002** · P1 · FK / unique / cascade rules đúng
- [ ] **DB-MOD-003** · P2 · Index + migration rollback plan
- [ ] **DB-MOD-004** · P2 · Toàn bộ 56 TC file con — Pass ≥ 95% P1

---

## 2. Authentication & Authorization

**Trạng thái:** ✓ BE · ✓ FE core

> **Chi tiết 85 test case:** [`authentication-system-test-checklist.md`](authentication-system-test-checklist.md)

### Tóm tắt
- [ ] **AUTH-MOD-001** · P1 · Register / login / refresh / logout / `/me`
- [ ] **AUTH-MOD-002** · P1 · FE protected routes 3 role + JWT interceptor
- [ ] **AUTH-MOD-003** · P1 · Security: tampering, no password leak, refresh hash
- [ ] **AUTH-MOD-004** · P2 · BVA edge + error handling FE
- [ ] **AUTH-MOD-005** · P2 · Toàn bộ 85 TC file con — Pass ≥ 95% P1

---

## 3. User Management

**Trạng thái:** ⬜ BE Users API · FE profile mock/placeholder

> **Chi tiết 62 test case:** [`user-management-system-test-checklist.md`](user-management-system-test-checklist.md)

### Tóm tắt
- [ ] **USER-MOD-001** · P2 · ⬜ BE · CRUD users Admin + lock/unlock
- [ ] **USER-MOD-002** · P2 · FE profile từ `/api/auth/me`
- [ ] **USER-MOD-003** · P1 · IDOR / role guard — student không list users
- [ ] **USER-MOD-004** · P2 · Toàn bộ 62 TC (skip blocked ⬜ BE) — Pass ≥ 95% P1 implemented

---

## 4. Classroom Management

**Trạng thái:** ✓ BE 8/8 · ✓ FE core

> **Chi tiết 79 test case:** [`classroom-system-test-checklist.md`](classroom-system-test-checklist.md)

### Tóm tắt
- [ ] **CLS-MOD-001** · P1 · CRUD lớp + join code + members API
- [ ] **CLS-MOD-002** · P1 · FE tạo lớp / join / list
- [ ] **CLS-MOD-003** · P1 · IDOR + negative (mã sai, teacher cross-class)
- [ ] **CLS-MOD-004** · P1 · E2E teacher tạo → SV join
- [ ] **CLS-MOD-005** · P2 · Toàn bộ 79 TC file con — Pass ≥ 95% P1

---

## 5. Assignment Management

**Trạng thái:** ✓ BE 8/8 · ✓ FE core

> **Chi tiết 78 test case:** [`assignment-system-test-checklist.md`](assignment-system-test-checklist.md)

### Tóm tắt
- [ ] **ASG-MOD-001** · P1 · Teacher tạo / SV nộp / Teacher chấm
- [ ] **ASG-MOD-002** · P1 · Deadline + permission negative
- [ ] **ASG-MOD-003** · P2 · BVA điểm + resubmit edge
- [ ] **ASG-MOD-004** · P1 · E2E giao bài → nộp → chấm
- [ ] **ASG-MOD-005** · P2 · Toàn bộ 78 TC file con — Pass ≥ 95% P1

---

## 6. Exam Management

**Trạng thái:** ✓ BE · ✓ FE core · 🟡 timezone VN / publish validation MVP

> **Chi tiết 88 test case:** [`exam-management-system-test-checklist.md`](exam-management-system-test-checklist.md)

### Tóm tắt
- [ ] **EXM-MOD-001** · P1 · CRUD exam + questions + publish
- [ ] **EXM-MOD-002** · P1 · Publish validation + không leak đáp án
- [ ] **EXM-MOD-003** · P2 · Shuffle / anti-cheat flag / timezone VN
- [ ] **EXM-MOD-004** · P1 · E2E tạo đề → publish → SV thấy
- [ ] **EXM-MOD-005** · P2 · Toàn bộ 88 TC file con — Pass ≥ 95% P1

---

## 7. Exam Attempt (Online Testing)

**Trạng thái:** ✓ BE + FE core

> **Chi tiết 95 test case:** [`exam-attempt-system-test-checklist.md`](exam-attempt-system-test-checklist.md)

### Tóm tắt
- [ ] **ATT-MOD-001** · P1 · Start / resume / save / submit / result
- [ ] **ATT-MOD-002** · P1 · Timer FE + auto-submit + maxAttempts
- [ ] **ATT-MOD-003** · P1 · Negative: time window, submitted attempt, IDOR
- [ ] **ATT-MOD-004** · P2 · Concurrency 2 tab + reload resume
- [ ] **ATT-MOD-005** · P2 · Toàn bộ 95 TC file con — Pass ≥ 95% P1

---

## 8. Anti-cheat Monitoring

**Trạng thái:** ✓ BE REST · ✓ FE events · ✓ realtime (mục 11)

> **Chi tiết 73 test case:** [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md)

### Tóm tắt
- [ ] **AC-MOD-001** · P1 · Log events + suspicion score API
- [ ] **AC-MOD-002** · P1 · FE detect tab/copy/fullscreen + teacher monitor
- [ ] **AC-MOD-003** · P1 · Permission + không sửa log
- [ ] **AC-MOD-004** · P1 · E2E log → teacher score (+ SR mục 11)
- [ ] **AC-MOD-005** · P2 · Toàn bộ 73 TC file con — Pass ≥ 95% P1

---

## 9. Notification System

**Trạng thái:** ⬜ REST API · ✓ SignalR push (hub only)

> **Chi tiết 58 test case:** [`notification-system-test-checklist.md`](notification-system-test-checklist.md)

### Tóm tắt
- [ ] **NOT-MOD-001** · P2 · ⬜ BE · REST list / mark read
- [ ] **NOT-MOD-002** · P2 · SignalR `ReceiveNotification` + toast
- [ ] **NOT-MOD-003** · P1 · Cross-user isolation
- [ ] **NOT-MOD-004** · P2 · Toàn bộ 58 TC (skip blocked ⬜ BE) — Pass implemented P1

---

## 10. Dashboard & Reporting

**Trạng thái:** ✓ FE mock · ⬜ BE API

> **Chi tiết 78 test case:** [`dashboard-reporting-system-test-checklist.md`](dashboard-reporting-system-test-checklist.md)

### Tóm tắt
- [ ] **DASH-MOD-001** · P1 · Smoke 3 role dashboard load (mock hoặc real API)
- [ ] **DASH-MOD-002** · P1 · Role guard — không xem chéo dashboard
- [ ] **DASH-MOD-003** · P1 · ⬜ BE · 3 API dashboard contract + DB reconcile
- [ ] **DASH-MOD-004** · P2 · Số liệu khớp exam monitor / anti-cheat summary
- [ ] **DASH-MOD-005** · P2 · Toàn bộ 78 TC file con — Pass ≥ 95% P1

---

## 11. SignalR Realtime

**Trạng thái:** ✓ Phase 8

> **Chi tiết 67 test case:** [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md)

### Tóm tắt
- [ ] **SR-MOD-001** · P1 · Hub connect JWT + teacher monitor group
- [ ] **SR-MOD-002** · P1 · `ReceiveAntiCheatWarning` + notification listener
- [ ] **SR-MOD-003** · P1 · Negative: no token, wrong role, wrong exam
- [ ] **SR-MOD-004** · P1 · E2E cheat → warning < 3s teacher UI
- [ ] **SR-MOD-005** · P2 · Toàn bộ 67 TC file con — Pass ≥ 95% P1

---

## 12. Redis Cache

**Trạng thái:** ⬜ Phase 9 — chưa triển khai

> **Chi tiết 60 test case:** [`redis-cache-system-test-checklist.md`](redis-cache-system-test-checklist.md)

### Tóm tắt
- [ ] **REDIS-MOD-001** · P1 · ⬜ Connection + cache-aside exam questions
- [ ] **REDIS-MOD-002** · P1 · ⬜ Redis down — fallback DB
- [ ] **REDIS-MOD-003** · P2 · Invalidate on publish / TTL boundary
- [ ] **REDIS-MOD-004** · — · ⬜ Blocked until Phase 9 — skip hoặc chạy khi có Redis

---

## 13. Logging & Activity

**Trạng thái:** ⬜ Phase 13

> **Chi tiết 49 test case:** [`logging-activity-system-test-checklist.md`](logging-activity-system-test-checklist.md)

### Tóm tắt
- [ ] **LOG-MOD-001** · P2 · Exception middleware JSON chuẩn
- [ ] **LOG-MOD-002** · P1 · Log không chứa password/token plaintext
- [ ] **LOG-MOD-003** · P3 · ⬜ Serilog + activity log Admin
- [ ] **LOG-MOD-004** · — · ⬜ Blocked until Phase 13

---

## 14. Docker & Deployment

**Trạng thái:** ⬜ Phase 11

> **Chi tiết 58 test case:** [`docker-deploy-system-test-checklist.md`](docker-deploy-system-test-checklist.md)

### Tóm tắt
- [ ] **DOCKER-MOD-001** · P1 · ⬜ `docker compose up` full stack smoke
- [ ] **DOCKER-MOD-002** · P1 · ⬜ Secrets qua env, không trong image
- [ ] **DOCKER-MOD-003** · P1 · ⬜ E2E journey trên compose
- [ ] **DOCKER-MOD-004** · — · ⬜ Blocked until Phase 11

---

## X. Cross-cutting — Security, NFR, E2E, Regression

> **Chi tiết 80 test case:** [`cross-cutting-system-test-checklist.md`](cross-cutting-system-test-checklist.md)

### Tóm tắt
- [ ] **X-MOD-001** · P1 · Security sweep: SQLi, XSS, CORS, IDOR
- [ ] **X-MOD-002** · P1 · E2E Journey A/B/C (register → thi → anti-cheat)
- [ ] **X-MOD-003** · P1 · Regression smoke sau merge lớn
- [ ] **X-MOD-004** · P2 · NFR: build, responsive, a11y smoke
- [ ] **X-MOD-005** · P2 · Toàn bộ 80 TC file con — Pass ≥ 95% P1

---

## Smoke hệ thống (15 phút — mỗi build)

Chạy trước khi đi sâu module:

- [ ] SYS-FUNC-001 · `/api/test`
- [ ] AUTH-FUNC-002 · Login 3 role
- [ ] AUTH-FUNC-007 · Route guard
- [ ] CLS-E2E-001 · Tạo lớp + join
- [ ] EXM-E2E-001 · Tạo + publish đề
- [ ] ATT-E2E-001 · Làm bài + nộp + kết quả
- [ ] AC-E2E-001 · Anti-cheat log
- [ ] SR-E2E-001 · Realtime warning (teacher monitor mở)
- [ ] X-REG-001 · Regression smoke tổng

---

## Defect log (toàn hệ thống)

| Test ID | Module | Severity | Mô tả | Repro | Status | Ticket |
|---------|--------|----------|-------|-------|--------|--------|
| | | | | | Open | |
| | | | | | | |

---

## Sign-off release

| Tiêu chí | Đạt |
|----------|-----|
| 100% P1 Smoke + P1 module đã implement | ⬜ |
| 0 Critical/Major open | ⬜ |
| P2 pass ≥ 90% (module ✓) | ⬜ |
| Blocked modules (User REST, Dashboard BE, Redis, Docker, Logging) documented | ⬜ |
| Mỗi module: file chi tiết reviewed — Pass ≥ 95% P1 (implemented) | ⬜ |

| Vai trò | Tên | Ngày | Kết luận |
|---------|-----|------|----------|
| QA | | | ⬜ Pass · ⬜ Pass w/ issues · ⬜ Fail |
| Dev Lead | | | |
| PO | | | |

---

## Liên kết

- [`README.md`](README.md) — mục lục 16 file chi tiết
- [`cross-cutting-system-test-checklist.md`](cross-cutting-system-test-checklist.md)
- [`docs/apiList.md`](../apiList.md)
- [`docs/swagger-api-testing-guide.md`](../swagger-api-testing-guide.md)
- [`Todo List.md`](../../Todo%20List.md)
