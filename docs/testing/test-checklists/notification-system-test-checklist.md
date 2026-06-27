# Notification System — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§9 Notification**  
> Module: **Phase 12** · `F-NOT-*`  
> Trạng thái: ⬜ REST API · ✓ SignalR push (`ReceiveNotification`)

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 8 | | | | | |
| 2. Positive | 5 | | | | | |
| 3. Negative | 6 | | | | | |
| 4. BVA | 3 | | | | | |
| 5. Equivalence | 3 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 4 | | | | | |
| 8. Error handling | 3 | | | | | |
| 9. API | 4 | | | | | |
| 10. Database | 3 | | | | | |
| 11. E2E | 4 | | | | | |
| 12. Non-functional | 3 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 2 | | | | | |
| **Tổng** | **58** | | | | | |

---

## 1. Functional Testing

- [ ] **NOT-FUNC-001** · P2 · ⬜ BE · `GET /api/notifications` list + pagination
- [ ] **NOT-FUNC-002** · P2 · ⬜ BE · `PATCH .../{id}/read`
- [ ] **NOT-FUNC-003** · P2 · ⬜ BE · `PATCH .../read-all`
- [ ] **NOT-FUNC-004** · P2 · FE danh sách + badge unread (khi có API)
- [ ] **NOT-FUNC-005** · P2 · SignalR `ReceiveNotification` toast (hiện tại)
- [ ] **NOT-FUNC-006** · P2 · ⬜ Push deadline assignment trigger
- [ ] **NOT-FUNC-007** · P3 · ⬜ Push exam published trigger
- [ ] **NOT-FUNC-008** · P3 · ⬜ Push grade available trigger

---

## 2. Positive Testing

- [ ] **NOT-POS-001** · P2 · ⬜ List returns only current user notifications
- [ ] **NOT-POS-002** · P2 · ⬜ Mark read → isRead true
- [ ] **NOT-POS-003** · P2 · ⬜ Read-all → all unread cleared
- [ ] **NOT-POS-004** · P2 · Hub push received within 3s
- [ ] **NOT-POS-005** · P3 · Notification title/message unicode VN

---

## 3. Negative Testing

- [ ] **NOT-NEG-001** · P1 · User A mark read notification of B → 403
- [ ] **NOT-NEG-002** · P2 · ⬜ GET without auth → 401
- [ ] **NOT-NEG-003** · P2 · Mark read invalid id → 404
- [ ] **NOT-NEG-004** · P3 · Mark read already read — idempotent
- [ ] **NOT-NEG-005** · P3 · Student call admin broadcast API → 403
- [ ] **NOT-NEG-006** · P3 · Malformed notification id → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **NOT-BVA-001** · P3 · 0 notifications — empty state
- [ ] **NOT-BVA-002** · P3 · 1000 unread — badge cap display
- [ ] **NOT-BVA-003** · P3 · Message max length truncation UI

---

## 5. Equivalence Partitioning

- [ ] **NOT-EQ-001** · P2 · Partition read vs unread filter
- [ ] **NOT-EQ-002** · P2 · Partition notification types (assignment, exam, system)
- [ ] **NOT-EQ-003** · P3 · Partition hub connected vs disconnected delivery

---

## 6. Edge Cases

- [ ] **NOT-EDGE-001** · P3 · Mark read idempotent twice
- [ ] **NOT-EDGE-002** · P2 · Logout — hub disconnect, no ghost toasts
- [ ] **NOT-EDGE-003** · P3 · Notification for deleted entity — graceful message
- [ ] **NOT-EDGE-004** · P3 · Clock skew createdAt display

---

## 7. Security Testing

- [ ] **NOT-SEC-001** · P2 · Notification không leak cross-user data
- [ ] **NOT-SEC-002** · P2 · XSS in notification body escaped
- [ ] **NOT-SEC-003** · P3 · Hub group per user — no broadcast bleed
- [ ] **NOT-SEC-004** · P3 · PII minimization in payload

---

## 8. Error Handling

- [ ] **NOT-ERR-001** · P2 · Hub fail — app still usable
- [ ] **NOT-ERR-002** · P2 · ⬜ List API 500 — FE fallback
- [ ] **NOT-ERR-003** · P3 · Mark read fail — optimistic rollback

---

## 9. API Testing

- [ ] **NOT-API-001** · P2 · ⬜ Contract list schema
- [ ] **NOT-API-002** · P2 · ⬜ Contract mark read response
- [ ] **NOT-API-003** · P3 · Pagination meta correct
- [ ] **NOT-API-004** · P3 · Sort by createdAt desc

---

## 10. Database Validation

- [ ] **NOT-DB-001** · P2 · ⬜ Notifications.UserId FK scoped
- [ ] **NOT-DB-002** · P3 · ⬜ isRead index for unread count
- [ ] **NOT-DB-003** · P3 · ⬜ Cascade delete user notifications

---

## 11. End-to-End Testing

- [ ] **NOT-E2E-001** · P2 · SignalR toast on test event (dev trigger)
- [ ] **NOT-E2E-002** · P2 · ⬜ Create assignment → notification appears
- [ ] **NOT-E2E-003** · P3 · ⬜ Mark read → badge decrements
- [ ] **NOT-E2E-004** · P3 · Reconnect hub — missed notifications sync (if implemented)

---

## 12. Non-functional Testing

- [ ] **NOT-NFR-001** · P3 · Toast stack 5 rapid notifications
- [ ] **NOT-NFR-002** · P3 · Mobile notification drawer UX
- [ ] **NOT-NFR-003** · P3 · a11y: toast aria-live

---

## 13. Regression Testing

- [ ] **NOT-REG-001** · P2 · Realtime listener không leak sau logout
- [ ] **NOT-REG-002** · P2 · Auth refresh — hub reconnect
- [ ] **NOT-REG-003** · P3 · Exam flow unaffected when NOT blocked

---

## 14. Exploratory Testing

- [ ] **NOT-EXP-001** · P3 · Charter: user nhận biết thông báo quan trọng trong 5s
- [ ] **NOT-EXP-002** · P3 · Charter: dismiss vs mark read clarity
- [ ] **NOT-EXP-003** · P3 · Charter: notification noise during exam

---

## 15. Concurrency & Exception

- [ ] **NOT-CON-001** · P3 · Parallel mark read same notification
- [ ] **NOT-CON-002** · P3 · Burst 50 hub messages — UI stable

---

## Smoke tối thiểu (hiện tại — hub only)

- [ ] NOT-FUNC-005 · ReceiveNotification toast
- [ ] NOT-REG-001 · Logout disconnect
- [ ] NOT-SEC-001 · No cross-user (when API exists)

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail · ⬜ Blocked (REST pending) |

---

## Liên kết

- [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md)
