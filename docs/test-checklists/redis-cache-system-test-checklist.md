# Redis Cache — System Test Checklist

> **Submodule** của [`eduguard-system-test-checklist.md`](eduguard-system-test-checklist.md) — Mục **§12 Redis**  
> Module: **Phase 9** · Keys: `eduguard:exam:*` · `eduguard:attempt:*`  
> Trạng thái: ⬜ Chưa triển khai — đánh dấu Blocked cho đến khi Phase 9 xong

---

## Thông tin phiên kiểm thử

| Field | Giá trị |
|-------|---------|
| Tester | |
| Redis URL | |
| Ngày | |

---

## Tiến độ tổng hợp

| Nhóm | Tổng | Pass | Fail | Skip | Blocked | % |
|------|------|------|------|------|---------|---|
| 1. Functional | 8 | | | | | |
| 2. Positive | 4 | | | | | |
| 3. Negative | 5 | | | | | |
| 4. BVA | 4 | | | | | |
| 5. Equivalence | 3 | | | | | |
| 6. Edge cases | 4 | | | | | |
| 7. Security | 4 | | | | | |
| 8. Error handling | 4 | | | | | |
| 9. API | 4 | | | | | |
| 10. Database | 4 | | | | | |
| 11. E2E | 4 | | | | | |
| 12. Non-functional | 4 | | | | | |
| 13. Regression | 3 | | | | | |
| 14. Exploratory | 2 | | | | | |
| 15. Concurrency | 3 | | | | | |
| **Tổng** | **60** | | | | | |

---

## 1. Functional Testing

- [ ] **REDIS-FUNC-001** · P1 · ⬜ Redis PING từ API health
- [ ] **REDIS-FUNC-002** · P1 · ⬜ Cache-aside `eduguard:exam:{id}:questions` hit/miss
- [ ] **REDIS-FUNC-003** · P2 · ⬜ Cache `eduguard:exam:{id}:anticheat:summary` TTL ~45s
- [ ] **REDIS-FUNC-004** · P2 · ⬜ Attempt presence hash + EXPIRE 120s sliding
- [ ] **REDIS-FUNC-005** · P2 · ⬜ Set `eduguard:exam:{id}:presence:attempts` index
- [ ] **REDIS-FUNC-006** · P2 · ⬜ Invalidate questions cache on publish
- [ ] **REDIS-FUNC-007** · P2 · ⬜ Invalidate on question CRUD (ma trận Todo List)
- [ ] **REDIS-FUNC-008** · P3 · ⬜ Dashboard cache (nếu có) TTL

---

## 2. Positive Testing

- [ ] **REDIS-POS-001** · P1 · ⬜ First GET questions — miss → DB → set cache
- [ ] **REDIS-POS-002** · P1 · ⬜ Second GET — hit, latency giảm
- [ ] **REDIS-POS-003** · P2 · ⬜ Heartbeat refresh EXPIRE attempt presence
- [ ] **REDIS-POS-004** · P2 · ⬜ Summary cache returns JSON valid DTO

---

## 3. Negative Testing

- [ ] **REDIS-NEG-001** · P1 · ⬜ Redis down — API fallback DB, không 500 hàng loạt
- [ ] **REDIS-NEG-002** · P2 · ⬜ Corrupt cache value — treat miss, reload DB
- [ ] **REDIS-NEG-003** · P2 · ⬜ Wrong key namespace — no collision
- [ ] **REDIS-NEG-004** · P3 · ⬜ AUTH fail redis — fail fast config
- [ ] **REDIS-NEG-005** · P3 · ⬜ Memory max — eviction policy OK

---

## 4. Boundary Value Analysis (BVA)

- [ ] **REDIS-BVA-001** · P2 · ⬜ TTL = 0 / key expiry boundary
- [ ] **REDIS-BVA-002** · P2 · ⬜ TTL 30m questions vs invalidate early
- [ ] **REDIS-BVA-003** · P3 · ⬜ Presence 119s vs 121s without heartbeat
- [ ] **REDIS-BVA-004** · P3 · ⬜ Summary TTL 44s vs 46s refresh

---

## 5. Equivalence Partitioning

- [ ] **REDIS-EQ-001** · P2 · ⬜ Partition cache hit vs miss behavior
- [ ] **REDIS-EQ-002** · P2 · ⬜ Partition read path vs write invalidate path
- [ ] **REDIS-EQ-003** · P3 · ⬜ Partition teacher vs student — no answer leak in cache

---

## 6. Edge Cases

- [ ] **REDIS-EDGE-001** · P2 · ⬜ Publish during active attempts — invalidate + resume
- [ ] **REDIS-EDGE-002** · P2 · ⬜ Delete exam — keys removed
- [ ] **REDIS-EDGE-003** · P3 · ⬜ Large question set JSON size
- [ ] **REDIS-EDGE-004** · P3 · ⬜ Redis flushall dev — app recovers

---

## 7. Security Testing

- [ ] **REDIS-SEC-001** · P2 · ⬜ Redis không bind public internet
- [ ] **REDIS-SEC-002** · P2 · ⬜ requirepass / ACL enabled
- [ ] **REDIS-SEC-003** · P2 · ⬜ Cached questions chứa isCorrect — chỉ teacher path
- [ ] **REDIS-SEC-004** · P3 · ⬜ TLS redis connection (prod)

---

## 8. Error Handling

- [ ] **REDIS-ERR-001** · P1 · ⬜ Timeout connect — degrade không crash
- [ ] **REDIS-ERR-002** · P2 · ⬜ Partial invalidate fail — log + retry
- [ ] **REDIS-ERR-003** · P3 · ⬜ Serialization error — skip cache
- [ ] **REDIS-ERR-004** · P3 · ⬜ Circuit breaker pattern (nếu có)

---

## 9. API Testing

- [ ] **REDIS-API-001** · P2 · ⬜ GET questions latency hit vs miss measurable
- [ ] **REDIS-API-002** · P2 · ⬜ Summary endpoint uses cache 2nd call faster
- [ ] **REDIS-API-003** · P3 · ⬜ Presence API reflects online attempts
- [ ] **REDIS-API-004** · P3 · ⬜ Health endpoint reports redis status

---

## 10. Database Validation

- [ ] **REDIS-DB-001** · P2 · ⬜ Sau invalidate — cache matches DB
- [ ] **REDIS-DB-002** · P2 · ⬜ Stale cache không tồn tại sau publish
- [ ] **REDIS-DB-003** · P3 · ⬜ Score summary matches SQL aggregate
- [ ] **REDIS-DB-004** · P3 · ⬜ Presence matches active InProgress attempts

---

## 11. End-to-End Testing

- [ ] **REDIS-E2E-001** · P2 · ⬜ Publish → invalidate → student start thấy câu mới
- [ ] **REDIS-E2E-002** · P2 · ⬜ Teacher monitor presence online/offline
- [ ] **REDIS-E2E-003** · P3 · ⬜ Anti-cheat summary dashboard E2E cached
- [ ] **REDIS-E2E-004** · P3 · ⬜ Redis restart mid-exam — fallback

---

## 12. Non-functional Testing

- [ ] **REDIS-NFR-001** · P2 · ⬜ Cache hit giảm p95 GET questions ≥ 30%
- [ ] **REDIS-NFR-002** · P3 · ⬜ 100 concurrent reads — no timeout
- [ ] **REDIS-NFR-003** · P3 · ⬜ Memory usage bounded per exam key
- [ ] **REDIS-NFR-004** · P3 · ⬜ Connection pool multiplexing (StackExchange)

---

## 13. Regression Testing

- [ ] **REDIS-REG-001** · P2 · ⬜ Disable redis flag — app full DB mode
- [ ] **REDIS-REG-002** · P2 · ⬜ Exam attempt grading unchanged with cache
- [ ] **REDIS-REG-003** · P3 · ⬜ Invalidate matrix all service methods covered

---

## 14. Exploratory Testing

- [ ] **REDIS-EXP-001** · P3 · ⬜ Charter: stale question after edit — user impact
- [ ] **REDIS-EXP-002** · P3 · ⬜ Charter: redis outage during exam hour

---

## 15. Concurrency & Exception

- [ ] **REDIS-CON-001** · P2 · ⬜ Concurrent publish + read — no stale serve
- [ ] **REDIS-CON-002** · P2 · ⬜ Parallel invalidate same key
- [ ] **REDIS-CON-003** · P3 · ⬜ Race heartbeat presence TTL

---

## Smoke tối thiểu (khi Phase 9 ready)

- [ ] REDIS-FUNC-001 · PING
- [ ] REDIS-FUNC-002 · Questions cache
- [ ] REDIS-NEG-001 · Fallback
- [ ] REDIS-E2E-001 · Invalidate flow

---

## Defect log

| Test ID | Severity | Mô tả | Repro | Status | Ticket |
|---------|----------|-------|-------|--------|--------|

---

## Sign-off

| QA | | | ⬜ Blocked until Phase 9 · ⬜ Pass · ⬜ Fail |

---

## Liên kết

- `Todo List.md` — Giai đoạn 9 Redis · ma trận invalidate
- [`exam-management-system-test-checklist.md`](exam-management-system-test-checklist.md)
