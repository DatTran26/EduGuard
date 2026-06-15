# Exam Management — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§6 Exam**  
> Module: **Phase 6** · `F-EXM-*`  
> API: exams · questions · answers · publish (`docs/apiList.md` API-EXM-*)

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
| 1. Functional | 14 | | | | | |
| 2. Positive | 6 | | | | | |
| 3. Negative | 10 | | | | | |
| 4. BVA | 6 | | | | | |
| 5. Equivalence | 5 | | | | | |
| 6. Edge cases | 6 | | | | | |
| 7. Security | 6 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 7 | | | | | |
| 10. Database | 5 | | | | | |
| 11. E2E | 5 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 4 | | | | | |
| 14. Exploratory | 3 | | | | | |
| 15. Concurrency | 3 | | | | | |
| **Tổng** | **88** | | | | | |

---

## 1. Functional Testing

- [ ] **EXM-FUNC-001** · P1 · Auto · Teacher tạo exam trong lớp
- [ ] **EXM-FUNC-002** · P1 · Auto · CRUD câu hỏi + đáp án (single/multiple/true-false)
- [ ] **EXM-FUNC-003** · P1 · Auto · Publish exam khi đủ điều kiện
- [ ] **EXM-FUNC-004** · P1 · Auto · Cấu hình duration, start/end, maxAttempts, shuffle
- [ ] **EXM-FUNC-005** · P1 · Auto · Bật/tắt anti-cheat trên đề
- [ ] **EXM-FUNC-006** · P2 · PUT/PATCH/DELETE exam, question, answer
- [ ] **EXM-FUNC-007** · P1 · FE exam builder — draft vs publish
- [ ] **EXM-FUNC-008** · P2 · FE nhãn giờ Việt Nam (UTC+7)
- [ ] **EXM-FUNC-009** · P2 · List exams theo classroom teacher/student
- [ ] **EXM-FUNC-010** · P2 · Add answer to question
- [ ] **EXM-FUNC-011** · P2 · Delete question removes answers cascade
- [ ] **EXM-FUNC-012** · P2 · Exam detail shows settings summary
- [ ] **EXM-FUNC-013** · P3 · Duplicate question (nếu có)
- [ ] **EXM-FUNC-014** · P3 · Reorder questions (nếu có)

---

## 2. Positive Testing

- [ ] **EXM-POS-001** · P1 · Auto · Create exam → draft unpublished
- [ ] **EXM-POS-002** · P1 · Auto · Publish → isPublished true
- [ ] **EXM-POS-003** · P1 · Auto · Student list chỉ published
- [ ] **EXM-POS-004** · P2 · PATCH exam title partial
- [ ] **EXM-POS-005** · P2 · Multiple choice nhiều đáp án đúng
- [ ] **EXM-POS-006** · P2 · True/false một đáp án đúng

---

## 3. Negative Testing

- [ ] **EXM-NEG-001** · P1 · Publish thiếu câu / không đủ đáp án đúng → 400
- [ ] **EXM-NEG-002** · P1 · Student tạo/sửa exam → 403
- [ ] **EXM-NEG-003** · P1 · `endTime < startTime` → 400
- [ ] **EXM-NEG-004** · P2 · Sửa exam in-progress attempts — rule đúng
- [ ] **EXM-NEG-005** · P2 · Xóa câu đang referenced by active attempt
- [ ] **EXM-NEG-006** · P2 · Publish twice idempotent hoặc 400
- [ ] **EXM-NEG-007** · P2 · Question without correct answer publish block
- [ ] **EXM-NEG-008** · P2 · Teacher B edit exam Teacher A → 403
- [ ] **EXM-NEG-009** · P3 · duration = 0 → 400
- [ ] **EXM-NEG-010** · P3 · Invalid question type enum → 400

---

## 4. Boundary Value Analysis (BVA)

- [ ] **EXM-BVA-001** · P1 · duration = 1 phút, maxAttempts = 1
- [ ] **EXM-BVA-002** · P2 · Question 0 đáp án vs 1 vs nhiều đáp án đúng
- [ ] **EXM-BVA-003** · P2 · startTime = endTime boundary
- [ ] **EXM-BVA-004** · P3 · Title max length
- [ ] **EXM-BVA-005** · P3 · 100 questions per exam perf
- [ ] **EXM-BVA-006** · P3 · maxAttempts very large

---

## 5. Equivalence Partitioning

- [ ] **EXM-EQ-001** · P2 · Partition draft vs published visibility
- [ ] **EXM-EQ-002** · P2 · Partition single vs multiple choice grading
- [ ] **EXM-EQ-003** · P2 · Partition shuffle on vs off
- [ ] **EXM-EQ-004** · P2 · Partition anti-cheat enabled vs disabled
- [ ] **EXM-EQ-005** · P3 · Partition true-false vs MCQ

---

## 6. Edge Cases

- [ ] **EXM-EDGE-001** · P2 · Unpublish exam (nếu có) — student visibility
- [ ] **EXM-EDGE-002** · P2 · Edit question after publish — invalidate cache future
- [ ] **EXM-EDGE-003** · P2 · Timezone VN display vs UTC storage
- [ ] **EXM-EDGE-004** · P3 · Exam spanning midnight boundary
- [ ] **EXM-EDGE-005** · P3 · Empty classroom — exam list empty
- [ ] **EXM-EDGE-006** · P3 · Copy exam between classes (nếu có)

---

## 7. Security Testing

- [ ] **EXM-SEC-001** · P1 · Student API không leak `isCorrect` trước submit
- [ ] **EXM-SEC-002** · P1 · GET questions for attempt vs teacher builder separation
- [ ] **EXM-SEC-003** · P2 · IDOR exam id other classroom
- [ ] **EXM-SEC-004** · P2 · XSS exam title/instruction
- [ ] **EXM-SEC-005** · P2 · Mass assignment isPublished via student token
- [ ] **EXM-SEC-006** · P3 · Answer key in network tab during attempt

---

## 8. Error Handling

- [ ] **EXM-ERR-001** · P2 · Publish validation errors — field-level messages
- [ ] **EXM-ERR-002** · P2 · FE builder save fail — không mất draft local
- [ ] **EXM-ERR-003** · P2 · Delete exam fail — list unchanged
- [ ] **EXM-ERR-004** · P3 · Partial save question answers fail mid-batch

---

## 9. API Testing

- [ ] **EXM-API-001** · P1 · Auto · Contract exam detail teacher view
- [ ] **EXM-API-002** · P1 · Auto · Contract student exam list (no answers)
- [ ] **EXM-API-003** · P2 · Auto · Publish endpoint response
- [ ] **EXM-API-004** · P2 · Question CRUD roundtrip
- [ ] **EXM-API-005** · P2 · Answer PATCH partial
- [ ] **EXM-API-006** · P2 · p95 get exam with 50 questions
- [ ] **EXM-API-007** · P3 · DELETE idempotent

---

## 10. Database Validation

- [ ] **EXM-DB-001** · P2 · Question count sau CRUD khớp API
- [ ] **EXM-DB-002** · P2 · isPublished flag persisted
- [ ] **EXM-DB-003** · P2 · Cascade delete answers with question
- [ ] **EXM-DB-004** · P3 · Exam settings JSON columns valid
- [ ] **EXM-DB-005** · P3 · FK exam → classroom

---

## 11. End-to-End Testing

- [ ] **EXM-E2E-001** · P1 · Teacher tạo → thêm câu → publish → SV thấy
- [ ] **EXM-E2E-002** · P2 · Edit settings → student start respects new duration
- [ ] **EXM-E2E-003** · P2 · Enable anti-cheat → attempt logging works
- [ ] **EXM-E2E-004** · P2 · Delete draft exam — no student visibility
- [ ] **EXM-E2E-005** · P3 · Full builder 10 questions E2E

---

## 12. Non-functional Testing

- [ ] **EXM-NFR-001** · P2 · Exam builder perf with 30 questions
- [ ] **EXM-NFR-002** · P2 · Mobile exam list readable
- [ ] **EXM-NFR-003** · P3 · Keyboard nav in builder
- [ ] **EXM-NFR-004** · P3 · Large instruction HTML render safe

---

## 13. Regression Testing

- [ ] **EXM-REG-001** · P1 · Attempt start after exam publish change
- [ ] **EXM-REG-002** · P2 · Classroom module intact after exam edits
- [ ] **EXM-REG-003** · P2 · Redis invalidate when Phase 9 (future)
- [ ] **EXM-REG-004** · P2 · UTC+7 label regression

---

## 14. Exploratory Testing

- [ ] **EXM-EXP-001** · P2 · Charter: Teacher tạo đề 15 phút không doc
- [ ] **EXM-EXP-002** · P2 · Charter: Publish fail — hiểu thiếu gì
- [ ] **EXM-EXP-003** · P3 · Charter: Student đọc lịch thi upcoming

---

## 15. Concurrency & Exception

- [ ] **EXM-CON-001** · P2 · Teacher publish + student list simultaneous
- [ ] **EXM-CON-002** · P2 · Two teachers edit same exam (deny second)
- [ ] **EXM-CON-003** · P3 · Bulk add answers parallel

---

## Smoke tối thiểu

- [ ] EXM-FUNC-001 · Create
- [ ] EXM-FUNC-003 · Publish
- [ ] EXM-NEG-001 · Publish validation
- [ ] EXM-SEC-001 · No answer leak
- [ ] EXM-E2E-001 · E2E

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
