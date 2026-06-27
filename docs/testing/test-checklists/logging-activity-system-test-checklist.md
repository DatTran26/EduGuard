# Logging & Activity — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§13 Logging**  
> Module: **Phase 13** · Serilog · Activity log · Exception middleware  
> Trạng thái: ⬜ Chưa triển khai đầy đủ

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Log sink | Console / File |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 6 | | | | | |
| 2. Positive | 4 | | | | | |
| 3. Negative | 4 | | | | | |
| 4. BVA | 2 | | | | | |
| 5. Equivalence | 2 | | | | | |
| 6. Edge cases | 3 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 3 | | | | | |
| 10. Database | 3 | | | | | |
| 11. E2E | 3 | | | | | |
| 12. Non-functional | 3 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **49** | | | | | |

---

## 1. Functional Testing

- [ ] **LOG-FUNC-001** · P3 · ⬜ Serilog ghi console/file structured
- [ ] **LOG-FUNC-002** · P3 · ⬜ Login success/fail ghi activity
- [ ] **LOG-FUNC-003** · P3 · ⬜ Logout ghi activity
- [ ] **LOG-FUNC-004** · P3 · ⬜ Admin `GET /api/activity` list
- [ ] **LOG-FUNC-005** · P2 · Exception middleware — 500 JSON chuẩn
- [ ] **LOG-FUNC-006** · P3 · ⬜ Exam submit / grade ghi activity (nếu scope)

---

## 2. Positive Testing

- [ ] **LOG-POS-001** · P3 · ⬜ Activity log có actor, action, timestamp UTC
- [ ] **LOG-POS-002** · P2 · 500 response có traceId/correlationId (nếu có)
- [ ] **LOG-POS-003** · P3 · ⬜ Filter activity by date range admin
- [ ] **LOG-POS-004** · P3 · Log level Information vs Error routing

---

## 3. Negative Testing

- [ ] **LOG-NEG-001** · P3 · Student `GET /api/activity` system-wide → 403
- [ ] **LOG-NEG-002** · P3 · ⬜ Invalid pagination activity → 400
- [ ] **LOG-NEG-003** · P3 · Teacher không xem activity admin-only
- [ ] **LOG-NEG-004** · P3 · Unauthenticated activity API → 401

---

## 4. Boundary Value Analysis (BVA)

- [ ] **LOG-BVA-001** · P3 · Activity list page size max
- [ ] **LOG-BVA-002** · P3 · Log message max length không truncate corrupt

---

## 5. Equivalence Partitioning

- [ ] **LOG-EQ-001** · P3 · Partition Admin vs non-admin activity access
- [ ] **LOG-EQ-002** · P3 · Partition log levels Error vs Warning vs Info

---

## 6. Edge Cases

- [ ] **LOG-EDGE-001** · P3 · High volume login burst — log không crash
- [ ] **LOG-EDGE-002** · P3 · Disk full file sink — degrade
- [ ] **LOG-EDGE-003** · P3 · Activity for deleted user — display fallback

---

## 7. Security Testing

- [ ] **LOG-SEC-001** · P1 · Log không chứa password/token plaintext
- [ ] **LOG-SEC-002** · P1 · API 500 response prod không stack trace
- [ ] **LOG-SEC-003** · P2 · Activity log không lộ PII không cần thiết
- [ ] **LOG-SEC-004** · P3 · Log file permissions restricted
- [ ] **LOG-SEC-005** · P3 · JWT không ghi full vào access log

---

## 8. Error Handling

- [ ] **LOG-ERR-001** · P2 · Unhandled exception → middleware JSON + log Error
- [ ] **LOG-ERR-002** · P3 · Validation exception → 400 không log Error noise
- [ ] **LOG-ERR-003** · P3 · Logging sink failure — app continues
- [ ] **LOG-ERR-004** · P3 · FE nhận correlation id hiển thị support ref

---

## 9. API Testing

- [ ] **LOG-API-001** · P3 · ⬜ Activity list contract schema
- [ ] **LOG-API-002** · P2 · ProblemDetails shape 400/401/403/404/500
- [ ] **LOG-API-003** · P3 · ⬜ Activity filter query params

---

## 10. Database Validation

- [ ] **LOG-DB-001** · P3 · ⬜ ActivityLog table rows match API
- [ ] **LOG-DB-002** · P3 · ⬜ Retention policy / archive (nếu có)
- [ ] **LOG-DB-003** · P3 · Index CreatedAt for admin queries

---

## 11. End-to-End Testing

- [ ] **LOG-E2E-001** · P3 · ⬜ Login → activity row → admin sees
- [ ] **LOG-E2E-002** · P2 · Trigger 500 → user message + server log
- [ ] **LOG-E2E-003** · P3 · ⬜ Admin audit trail exam publish

---

## 12. Non-functional Testing

- [ ] **LOG-NFR-001** · P3 · Logging overhead < 5% request latency
- [ ] **LOG-NFR-002** · P3 · Log rotation file size config
- [ ] **LOG-NFR-003** · P3 · Structured JSON parseable by log aggregator

---

## 13. Regression Testing

- [ ] **LOG-REG-001** · P2 · Lỗi API vẫn được log sau deploy
- [ ] **LOG-REG-002** · P3 · ⬜ Activity không break auth perf
- [ ] **LOG-REG-003** · P3 · Middleware order regression

---

## 14. Exploratory Testing

- [ ] **LOG-EXP-001** · P3 · Charter: Admin điều tra sự cố từ activity 10 phút
- [ ] **LOG-EXP-002** · P3 · Charter: Dev đọc log local reproduce bug

---

## 15. Concurrency & Exception

- [ ] **LOG-CON-001** · P3 · Parallel requests — unique correlation ids
- [ ] **LOG-CON-002** · P3 · Activity insert race — no duplicate PK

---

## Smoke tối thiểu (hiện tại)

- [ ] LOG-FUNC-005 · Exception middleware JSON
- [ ] LOG-SEC-001 · No secrets in logs
- [ ] LOG-SEC-002 · No stack in prod response

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Blocked · ⬜ Pass · ⬜ Fail |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
