# Anti-cheat Monitoring — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§8 Anti-cheat**  
> Module: **Phase 7b** · `F-AC-*`  
> API: logs · score · summary (`docs/api/api-list.md` API-AC-*) · SignalR §11

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Exam anti-cheat enabled | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 10 | | | | | |
| 2. Positive | 5 | | | | | |
| 3. Negative | 6 | | | | | |
| 4. BVA | 5 | | | | | |
| 5. Equivalence | 4 | | | | | |
| 6. Edge cases | 5 | | | | | |
| 7. Security | 5 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 5 | | | | | |
| 10. Database | 4 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 4 | | | | | |
| **Tổng** | **73** | | | | | |

---

## 1. Functional Testing

- [ ] **AC-FUNC-001** · P1 · Auto · `POST /api/anti-cheat/logs` — TAB_SWITCH, COPY_PASTE, EXIT_FULLSCREEN, PAGE_RELOAD, DISCONNECTED
- [ ] **AC-FUNC-002** · P1 · Auto · Teacher `GET .../attempts/{id}/logs`
- [ ] **AC-FUNC-003** · P1 · Auto · Suspicion score API
- [ ] **AC-FUNC-004** · P2 · ⬜ `GET .../exams/{id}/summary` (nếu chưa BE — blocked)
- [ ] **AC-FUNC-005** · P1 · FE detect tab switch khi làm bài
- [ ] **AC-FUNC-006** · P1 · FE detect copy/paste, fullscreen exit
- [ ] **AC-FUNC-007** · P2 · FE teacher attempt monitor + timeline
- [ ] **AC-FUNC-008** · P2 · FE student warning toast on violation
- [ ] **AC-FUNC-009** · P2 · Log metadata timestamp client/server
- [ ] **AC-FUNC-010** · P3 · Dashboard cheating breakdown (mock/real)

---

## 2. Positive Testing

- [ ] **AC-POS-001** · P1 · Auto · Log valid event → 201/200 + persisted
- [ ] **AC-POS-002** · P1 · Auto · Score increases after tab switch
- [ ] **AC-POS-003** · P1 · Teacher logs chronological order
- [ ] **AC-POS-004** · P2 · Multiple event types cumulative score
- [ ] **AC-POS-005** · P2 · Log during InProgress only

---

## 3. Negative Testing

- [ ] **AC-NEG-001** · P1 · Log attemptId không thuộc student → 403
- [ ] **AC-NEG-002** · P1 · Teacher xem log attempt lớp khác → 403
- [ ] **AC-NEG-003** · P2 · Log type invalid enum → 400
- [ ] **AC-NEG-004** · P2 · Log khi attempt Submitted — ignore/reject
- [ ] **AC-NEG-005** · P2 · Student GET score own attempt → 403
- [ ] **AC-NEG-006** · P3 · Empty body log → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **AC-BVA-001** · P2 · Spam 100 logs/phút — perf + score cap
- [ ] **AC-BVA-002** · P2 · Score threshold 9/10/11 risk bands (dashboard)
- [ ] **AC-BVA-003** · P3 · First log vs duplicate same type rapid
- [ ] **AC-BVA-004** · P3 · Summary FlaggedAttempts threshold = 10
- [ ] **AC-BVA-005** · P3 · Zero logs → score 0

---

## 5. Equivalence Partitioning

- [ ] **AC-EQ-001** · P2 · Partition each CheatingType weight
- [ ] **AC-EQ-002** · P2 · Partition exam anti-cheat off — no logs required
- [ ] **AC-EQ-003** · P2 · Partition teacher owner vs non-owner read
- [ ] **AC-EQ-004** · P3 · Partition DISCONNECTED vs TAB_SWITCH

---

## 6. Edge Cases

- [ ] **AC-EDGE-001** · P2 · Browser minimize vs tab switch detection
- [ ] **AC-EDGE-002** · P2 · Paste plain text vs image — both logged?
- [ ] **AC-EDGE-003** · P2 · Reload intentional vs crash
- [ ] **AC-EDGE-004** · P3 · Log batch offline queue (nếu có)
- [ ] **AC-EDGE-005** · P3 · Teacher opens monitor before any logs

---

## 7. Security Testing

- [ ] **AC-SEC-001** · P1 · Student không DELETE/PATCH logs
- [ ] **AC-SEC-002** · P1 · Forge log attemptId other user → 403
- [ ] **AC-SEC-003** · P2 · Log injection XSS in metadata
- [ ] **AC-SEC-004** · P2 · Rate limit log flood DoS
- [ ] **AC-SEC-005** · P3 · Teacher cannot inflate score via API tamper

---

## 8. Error Handling

- [ ] **AC-ERR-001** · P2 · Log API fail — FE queue/retry không crash exam
- [ ] **AC-ERR-002** · P2 · Monitor load logs fail — empty state
- [ ] **AC-ERR-003** · P2 · Hub down — REST logs still viewable
- [ ] **AC-ERR-004** · P3 · Partial log payload corrupt

---

## 9. API Testing

- [ ] **AC-API-001** · P1 · Auto · Contract log create request/response
- [ ] **AC-API-002** · P1 · Auto · Contract logs list schema
- [ ] **AC-API-003** · P1 · Auto · Contract score response
- [ ] **AC-API-004** · P2 · p95 log ingest under burst
- [ ] **AC-API-005** · P3 · Summary API contract (when implemented)

---

## 10. Database Validation

- [ ] **AC-DB-001** · P2 · Score API = aggregate from CheatingLogs
- [ ] **AC-DB-002** · P2 · Log FK attemptId
- [ ] **AC-DB-003** · P3 · Index attemptId for log queries
- [ ] **AC-DB-004** · P3 · Event type stored correctly enum int/string

---

## 11. End-to-End Testing

- [ ] **AC-E2E-001** · P1 · SV chuyển tab → log → teacher score ↑ (+ SR §11)
- [ ] **AC-E2E-002** · P1 · Copy paste during exam → log + warning
- [ ] **AC-E2E-003** · P2 · Fullscreen exit → log
- [ ] **AC-E2E-004** · P2 · Teacher monitor realtime timeline
- [ ] **AC-E2E-005** · P3 · Exam summary aggregates multiple attempts

---

## 12. Non-functional Testing

- [ ] **AC-NFR-001** · P2 · Log client overhead không lag exam UI
- [ ] **AC-NFR-002** · P2 · Monitor UI 100 logs scroll perf
- [ ] **AC-NFR-003** · P3 · Mobile tab switch detection
- [ ] **AC-NFR-004** · P3 · Memory leak long exam session listeners

---

## 13. Regression Testing

- [ ] **AC-REG-001** · P1 · Attempt submit still works with AC on
- [ ] **AC-REG-002** · P1 · SignalR Phase 8 không break REST log
- [ ] **AC-REG-003** · P2 · Dashboard suspicion metrics (when linked)
- [ ] **AC-REG-004** · P2 · Redis summary cache future Phase 9

---

## 14. Exploratory Testing

- [ ] **AC-EXP-001** · P2 · Charter: SV hiểu cảnh báo gian lận
- [ ] **AC-EXP-002** · P2 · Charter: Teacher phát hiện SV rủi ro < 1 phút
- [ ] **AC-EXP-003** · P3 · Charter: False positive alt-tab nhanh

---

## 15. Concurrency & Exception

- [ ] **AC-CON-001** · P2 · Parallel logs same attempt — all persisted
- [ ] **AC-CON-002** · P2 · Teacher monitor + student log simultaneous
- [ ] **AC-CON-003** · P3 · Score recalc concurrent reads
- [ ] **AC-CON-004** · P3 · DB slow — log endpoint timeout handling

---

## Smoke tối thiểu

- [ ] AC-FUNC-001 · Log TAB_SWITCH
- [ ] AC-FUNC-003 · Score API
- [ ] AC-E2E-001 · Tab → teacher sees
- [ ] AC-NEG-001 · Wrong attempt 403
- [ ] AC-SEC-001 · No delete logs

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail |

---

## Liên kết

- [`signalr-realtime-system-test-checklist.md`](signalr-realtime-system-test-checklist.md)
- [`exam-attempt-system-test-checklist.md`](exam-attempt-system-test-checklist.md)
