# SignalR Realtime — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§11 SignalR**  
> Module: **Phase 8** · Hubs: `/hubs/notifications` · `/hubs/exam-monitoring`

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Browser | Chrome / Edge |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 10 | | | | | |
| 2. Positive | 5 | | | | | |
| 3. Negative | 6 | | | | | |
| 4. BVA | 3 | | | | | |
| 5. Equivalence | 3 | | | | | |
| 6. Edge cases | 5 | | | | | |
| 7. Security | 6 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 3 | | | | | |
| 10. Database | 2 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 4 | | | | | |
| **Tổng** | **67** | | | | | |

---

## 1. Functional Testing

- [ ] **SR-FUNC-001** · P1 · Auto · Connect `/hubs/notifications` JWT `access_token` query
- [ ] **SR-FUNC-002** · P1 · Auto · Connect `/hubs/exam-monitoring` Teacher
- [ ] **SR-FUNC-003** · P1 · Teacher join monitor group exam owned
- [ ] **SR-FUNC-004** · P1 · `ReceiveAntiCheatWarning` updates monitor UI + toast
- [ ] **SR-FUNC-005** · P2 · `ReceiveNotification` app-wide listener
- [ ] **SR-FUNC-006** · P2 · Automatic reconnect after brief disconnect
- [ ] **SR-FUNC-007** · P2 · Leave group on navigate away monitor page
- [ ] **SR-FUNC-008** · P3 · Connection state indicator UI (nếu có)
- [ ] **SR-FUNC-009** · P3 · Hub handshake completes < 3s local
- [ ] **SR-FUNC-010** · P3 · Multiple exam monitor switch — correct groups

---

## 2. Positive Testing

- [ ] **SR-POS-001** · P1 · Teacher connected + student logs → warning received
- [ ] **SR-POS-002** · P2 · Notification hub delivers test payload
- [ ] **SR-POS-003** · P2 · Reconnect resumes group membership
- [ ] **SR-POS-004** · P3 · Valid JWT in query — connection accepted
- [ ] **SR-POS-005** · P3 · UTF-8 message payload displays

---

## 3. Negative Testing

- [ ] **SR-NEG-001** · P1 · Connect hub không token → rejected
- [ ] **SR-NEG-002** · P1 · Teacher monitor exam không sở hữu → no events
- [ ] **SR-NEG-003** · P1 · Student connect exam-monitoring → rejected
- [ ] **SR-NEG-004** · P2 · Expired token connect → fail
- [ ] **SR-NEG-005** · P2 · Invalid examId join group → error
- [ ] **SR-NEG-006** · P3 · Malformed hub URL → fail gracefully

---

## 4. Boundary Value Analysis (BVA)

- [ ] **SR-BVA-001** · P3 · Payload warning max length — UI không vỡ
- [ ] **SR-BVA-002** · P3 · 0 teachers in group — student log no error
- [ ] **SR-BVA-003** · P3 · Token expires 1s after connect — behavior

---

## 5. Equivalence Partitioning

- [ ] **SR-EQ-001** · P1 · Partition Teacher vs Student hub access
- [ ] **SR-EQ-002** · P2 · Partition notifications vs exam-monitoring hubs
- [ ] **SR-EQ-003** · P3 · Partition connected vs disconnected client

---

## 6. Edge Cases

- [ ] **SR-EDGE-001** · P2 · Nhiều teacher cùng monitor 1 exam
- [ ] **SR-EDGE-002** · P2 · Đóng tab teacher — disconnect clean
- [ ] **SR-EDGE-003** · P2 · Sleep laptop — reconnect on wake
- [ ] **SR-EDGE-004** · P3 · Rapid connect/disconnect stress
- [ ] **SR-EDGE-005** · P3 · Hub up REST down — partial degrade

---

## 7. Security Testing

- [ ] **SR-SEC-001** · P1 · Warning không broadcast teacher ngoài group
- [ ] **SR-SEC-002** · P2 · Token hết hạn — connection drop
- [ ] **SR-SEC-003** · P2 · Student không subscribe exam group via devtools
- [ ] **SR-SEC-004** · P2 · CORS + WebSocket same origin policy
- [ ] **SR-SEC-005** · P3 · JWT in query not logged server plaintext
- [ ] **SR-SEC-006** · P3 · No hub method allows privilege escalation

---

## 8. Error Handling

- [ ] **SR-ERR-001** · P2 · Hub unreachable — FE degrade (REST fallback)
- [ ] **SR-ERR-002** · P2 · Reconnect fail after N tries — user message
- [ ] **SR-ERR-003** · P3 · Parse error payload — no crash
- [ ] **SR-ERR-004** · P3 · Server hub exception — client onclose

---

## 9. API Testing

- [ ] **SR-API-001** · P2 · Negotiate endpoint returns valid connection info
- [ ] **SR-API-002** · P3 · WebSocket upgrade headers correct
- [ ] **SR-API-003** · P3 · Long polling fallback (if enabled)

---

## 10. Database Validation

- [ ] **SR-DB-001** · P2 · Hub events correlate with CheatingLogs rows
- [ ] **SR-DB-002** · P3 · No orphan hub state in DB (stateless)

---

## 11. End-to-End Testing

- [ ] **SR-E2E-001** · P1 · SV gian lận → log API → hub warning < 3s teacher UI
- [ ] **SR-E2E-002** · P2 · Teacher opens monitor before student starts
- [ ] **SR-E2E-003** · P2 · Notification toast E2E dev trigger
- [ ] **SR-E2E-004** · P3 · Full exam + monitor + multiple warnings
- [ ] **SR-E2E-005** · P3 · Logout — no events after disconnect

---

## 12. Non-functional Testing

- [ ] **SR-NFR-001** · P2 · 20 concurrent hub connections stable local
- [ ] **SR-NFR-002** · P3 · Latency warning delivery p95 < 2s LAN
- [ ] **SR-NFR-003** · P3 · Memory FE hub client no leak 1h
- [ ] **SR-NFR-004** · P3 · Mobile browser websocket support

---

## 13. Regression Testing

- [ ] **SR-REG-001** · P1 · Anti-cheat REST vẫn OK nếu hub down
- [ ] **SR-REG-002** · P1 · Attempt flow không phụ thuộc hub
- [ ] **SR-REG-003** · P2 · Auth token refresh reconnect
- [ ] **SR-REG-004** · P2 · CORS change không break websocket

---

## 14. Exploratory Testing

- [ ] **SR-EXP-001** · P2 · Charter: teacher không refresh để thấy cảnh báo
- [ ] **SR-EXP-002** · P3 · Charter: mất wifi 10s — recovery UX
- [ ] **SR-EXP-003** · P3 · Charter: 2 teacher cùng monitor coordination

---

## 15. Concurrency & Exception

- [ ] **SR-CON-001** · P2 · 10 students log events — teacher receives all
- [ ] **SR-CON-002** · P2 · Teacher join/leave group race
- [ ] **SR-CON-003** · P3 · Server restart — clients reconnect
- [ ] **SR-CON-004** · P3 · Burst 50 warnings/sec UI throttle

---

## Smoke tối thiểu

- [ ] SR-FUNC-001 · Notifications hub connect
- [ ] SR-FUNC-002 · Exam monitoring connect
- [ ] SR-E2E-001 · Warning path
- [ ] SR-NEG-001 · No token reject
- [ ] SR-REG-001 · REST fallback

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail |

---

## Liên kết

- [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md)
- [`notification-system-test-checklist.md`](notification-system-test-checklist.md)
