# Exam Attempt (Online Testing) — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§7 Exam Attempt**  
> Module: **Phase 7** · `F-ATT-*`  
> API: start · answers · submit · result (`docs/apiList.md` API-ATT-*)

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Published exam | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 14 | | | | | |
| 2. Positive | 6 | | | | | |
| 3. Negative | 10 | | | | | |
| 4. BVA | 6 | | | | | |
| 5. Equivalence | 5 | | | | | |
| 6. Edge cases | 7 | | | | | |
| 7. Security | 6 | | | | | |
| 8. Error handling | 5 | | | | | |
| 9. API | 7 | | | | | |
| 10. Database | 5 | | | | | |
| 11. E2E | 6 | | | | | |
| 12. Non-functional | 5 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 4 | | | | | |
| 15. Concurrency | 5 | | | | | |
| **Tổng** | **95** | | | | | |

---

## 1. Functional Testing

- [ ] **ATT-FUNC-001** · P1 · Auto · `POST .../start` trong khung giờ mở đề
- [ ] **ATT-FUNC-002** · P1 · Auto · Resume attempt InProgress — không duplicate
- [ ] **ATT-FUNC-003** · P1 · Auto · Shuffle câu/đáp án theo ExamSetting
- [ ] **ATT-FUNC-004** · P1 · Auto · `POST .../answers` lưu từng câu
- [ ] **ATT-FUNC-005** · P1 · Auto · `POST .../submit` chấm + điểm
- [ ] **ATT-FUNC-006** · P1 · Auto · `GET .../result` sau nộp
- [ ] **ATT-FUNC-007** · P1 · Auto · Teacher `GET /api/exams/{id}/attempts`
- [ ] **ATT-FUNC-008** · P1 · FE timer countdown + cảnh báo sắp hết giờ
- [ ] **ATT-FUNC-009** · P1 · FE auto-submit khi timer = 0
- [ ] **ATT-FUNC-010** · P2 · FE autosave đáp án (debounce)
- [ ] **ATT-FUNC-011** · P2 · FE navigation giữa câu hỏi
- [ ] **ATT-FUNC-012** · P2 · FE hiển thị kết quả / điểm sau submit
- [ ] **ATT-FUNC-013** · P2 · `GET /api/attempts/{id}` trạng thái
- [ ] **ATT-FUNC-014** · P3 · Review answers sau submit (nếu allowed)

---

## 2. Positive Testing

- [ ] **ATT-POS-001** · P1 · Auto · Start → attemptId + questions without correct flags
- [ ] **ATT-POS-002** · P1 · Auto · Save single choice answer → 200
- [ ] **ATT-POS-003** · P1 · Auto · Save multiple choice partial → 200
- [ ] **ATT-POS-004** · P1 · Auto · Submit all correct → score 100%
- [ ] **ATT-POS-005** · P2 · Submit partial answers — score proportional
- [ ] **ATT-POS-006** · P2 · Teacher attempts list includes student name

---

## 3. Negative Testing

- [ ] **ATT-NEG-001** · P1 · Start trước `startTime` / sau `endTime` → 400
- [ ] **ATT-NEG-002** · P1 · Vượt `maxAttempts` → 400
- [ ] **ATT-NEG-003** · P1 · Save/submit attempt đã Submitted → 400
- [ ] **ATT-NEG-004** · P1 · Student truy cập attempt SV khác → 403
- [ ] **ATT-NEG-005** · P1 · Teacher start exam thay student → 403
- [ ] **ATT-NEG-006** · P2 · Start unpublished exam → 400
- [ ] **ATT-NEG-007** · P2 · Answer questionId không thuộc attempt → 400
- [ ] **ATT-NEG-008** · P2 · Submit empty attempt — score 0 rule
- [ ] **ATT-NEG-009** · P2 · Student not in classroom → 403 start
- [ ] **ATT-NEG-010** · P3 · Invalid answer payload → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **ATT-BVA-001** · P1 · Nộp đúng khi timer = 0
- [ ] **ATT-BVA-002** · P2 · maxAttempts đã đạt — start lần n+1
- [ ] **ATT-BVA-003** · P2 · Start đúng `startTime` second boundary
- [ ] **ATT-BVA-004** · P2 · Duration 1 phút — auto submit boundary
- [ ] **ATT-BVA-005** · P3 · 0 câu trả lời submit
- [ ] **ATT-BVA-006** · P3 · All questions answered vs one missing

---

## 5. Equivalence Partitioning

- [ ] **ATT-EQ-001** · P2 · Partition InProgress vs Submitted operations
- [ ] **ATT-EQ-002** · P2 · Partition shuffle on/off question order differs
- [ ] **ATT-EQ-003** · P2 · Partition single vs multiple grading rules
- [ ] **ATT-EQ-004** · P2 · Partition first attempt vs retry attempt
- [ ] **ATT-EQ-005** · P3 · Partition anti-cheat on/off during attempt

---

## 6. Edge Cases

- [ ] **ATT-EDGE-001** · P1 · Reload trang giữa attempt — resume đúng
- [ ] **ATT-EDGE-002** · P2 · Mất mạng khi save — retry thành công
- [ ] **ATT-EDGE-003** · P2 · Browser back button during exam
- [ ] **ATT-EDGE-004** · P2 · Session refresh mid-exam — attempt continues
- [ ] **ATT-EDGE-005** · P2 · Teacher changes exam while attempt open
- [ ] **ATT-EDGE-006** · P3 · Clock skew client vs server timer
- [ ] **ATT-EDGE-007** · P3 · Fullscreen exit during attempt (anti-cheat link)

---

## 7. Security Testing

- [ ] **ATT-SEC-001** · P1 · Cannot GET other student attempt result
- [ ] **ATT-SEC-002** · P1 · Response không chứa isCorrect during attempt
- [ ] **ATT-SEC-003** · P2 · Tamper attemptId in URL → 403
- [ ] **ATT-SEC-004** · P2 · Replay submit request — idempotent reject
- [ ] **ATT-SEC-005** · P2 · DevTools modify local answers — server authoritative on submit
- [ ] **ATT-SEC-006** · P3 · Teacher attempts list no student PII leak

---

## 8. Error Handling

- [ ] **ATT-ERR-001** · P1 · Save fail — FE warn, không mất selection
- [ ] **ATT-ERR-002** · P1 · Submit fail — allow retry, không double grade
- [ ] **ATT-ERR-003** · P2 · Start fail — không tạo orphan attempt UI
- [ ] **ATT-ERR-004** · P2 · Timer sync fail — fallback server time
- [ ] **ATT-ERR-005** · P3 · 500 during save — exponential backoff

---

## 9. API Testing

- [ ] **ATT-API-001** · P1 · Auto · Contract start response
- [ ] **ATT-API-002** · P1 · Auto · Contract result after submit
- [ ] **ATT-API-003** · P2 · Auto · Save answer upsert semantics
- [ ] **ATT-API-004** · P2 · Teacher attempts list pagination
- [ ] **ATT-API-005** · P2 · p95 submit latency
- [ ] **ATT-API-006** · P3 · GET attempt idempotent
- [ ] **ATT-API-007** · P3 · UTF-8 answer text

---

## 10. Database Validation

- [ ] **ATT-DB-001** · P1 · Score sau submit khớp tính tay MCQ
- [ ] **ATT-DB-002** · P1 · StudentAnswers rows per question
- [ ] **ATT-DB-003** · P2 · Attempt status transition InProgress → Submitted
- [ ] **ATT-DB-004** · P2 · SubmittedAt timestamp set
- [ ] **ATT-DB-005** · P3 · Attempt count per student per exam

---

## 11. End-to-End Testing

- [ ] **ATT-E2E-001** · P1 · start → trả lời → submit → xem kết quả
- [ ] **ATT-E2E-002** · P1 · Timer auto-submit E2E
- [ ] **ATT-E2E-003** · P2 · Resume after reload E2E
- [ ] **ATT-E2E-004** · P2 · Second attempt after maxAttempts=2
- [ ] **ATT-E2E-005** · P2 · Teacher monitors attempts list live update
- [ ] **ATT-E2E-006** · P3 · Wrong answers — score reflects

---

## 12. Non-functional Testing

- [ ] **ATT-NFR-001** · P2 · Exam UI responsive 375px
- [ ] **ATT-NFR-002** · P2 · Autosave không block UI (debounce)
- [ ] **ATT-NFR-003** · P2 · 50 question exam scroll perf
- [ ] **ATT-NFR-004** · P3 · Timer drift < 2s over 30 min
- [ ] **ATT-NFR-005** · P3 · a11y: radio groups labeled

---

## 13. Regression Testing

- [ ] **ATT-REG-001** · P1 · Anti-cheat still logs during attempt
- [ ] **ATT-REG-002** · P1 · Exam publish changes don't break in-flight
- [ ] **ATT-REG-003** · P2 · SignalR unrelated — attempt REST OK
- [ ] **ATT-REG-004** · P2 · Grading after question type change

---

## 14. Exploratory Testing

- [ ] **ATT-EXP-001** · P2 · Charter: SV hiểu còn bao nhiêu phút
- [ ] **ATT-EXP-002** · P2 · Charter: SV panic reload — recovery
- [ ] **ATT-EXP-003** · P2 · Charter: SV thử submit sớm
- [ ] **ATT-EXP-004** · P3 · Charter: Teacher đọc attempts list during exam

---

## 15. Concurrency & Exception

- [ ] **ATT-CON-001** · P2 · 2 tab cùng attempt — không corrupt answers
- [ ] **ATT-CON-002** · P2 · Double submit click — một graded result
- [ ] **ATT-CON-003** · P2 · 10 SV start cùng exam — no deadlock
- [ ] **ATT-CON-004** · P3 · Save + submit race
- [ ] **ATT-CON-005** · P3 · SQL timeout mid-submit — consistent state

---

## Smoke tối thiểu

- [ ] ATT-FUNC-001 · Start
- [ ] ATT-FUNC-005 · Submit
- [ ] ATT-E2E-001 · Full flow
- [ ] ATT-NEG-004 · IDOR
- [ ] ATT-SEC-002 · No answer leak

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Pass · ⬜ Fail |

---

## Liên kết

- [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md)
- [`anti-cheat-system-test-checklist.md`](anti-cheat-system-test-checklist.md)
