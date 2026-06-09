---
name: push-code
description: >
  Push work to the remote repository for backup or collaboration — not a release.
  Trigger when the user asks to push code, save to repo, push lên remote, or sync branch.
compatibility: "requires: git"
---

# Push Code (lưu lên repo)

Human-readable rules: `docs/07_DEVELOPMENT_RULES.md` → Workflow push code.

Dùng khi bạn chỉ muốn **đẩy code lên GitHub để lưu / đồng bộ**, không cắt version,
không merge `release`, không mở PR `main`.

**Không** kích hoạt skill này nếu user nói `ship`, `release`, `cut version` — dùng
`.agents/skills/ship-code/SKILL.md` thay thế.

## When to Use

- `push code` / `đẩy code` / `push lên repo`
- `lưu code lên github` / `sync branch`
- `push` (khi ngữ cảnh là lưu công việc, không phải release)

## When NOT to Use

| User nói | Dùng skill |
|----------|------------|
| `ship` / `ship code` / `release` / `cut version` | `ship-code` |
| `push code` + "release" / "lên main" / "production" | Hỏi lại ý user |

---

## Branch policy

- Push lên nhánh hiện tại: `devD`, `devH`, `devB`, hoặc `release`.
- **Không** push trực tiếp lên `main` (Husky `pre-push` chặn).

---

## Steps

### 1. Kiểm tra trạng thái

```powershell
git status
git branch -vv
```

- Nếu đang trên `main` → dừng, chuyển sang `devD` (hoặc nhánh dev đang dùng).
- Nếu có thay đổi chưa commit → hỏi user: commit trước hay chỉ push commit sẵn có?

### 2. Commit (nếu cần)

Chỉ khi user đồng ý commit hoặc đã yêu cầu "commit và push":

- Gom commit theo **cụm chức năng / thư mục** (không gộp mọi thứ một commit).
- Conventional commit: `feat`, `fix`, `docs`, `build`, … — **không** `chore:`, **không** tham chiếu AI/tool.
- Husky chạy `npm test` trước mỗi commit.

### 3. Push

```powershell
git push -u origin HEAD
```

Hoặc nếu upstream đã có:

```powershell
git push origin <BRANCH>
```

### 4. Cập nhật tài liệu (nếu vừa hoàn thành task)

- `Todo List.md` — đánh dấu task xong (theo `AGENTS.md`).
- **Không** bắt buộc `CHANGELOG.md` hay PR khi chỉ push lưu repo.

### 5. Báo cáo cho user

- Nhánh đã push
- Commit(s) mới (hash + message ngắn)
- Link so sánh trên GitHub nếu có (`gh repo view --web` hoặc URL branch)

---

## Error handling

| Lỗi | Xử lý |
|-----|--------|
| `pre-push` chặn `main` | Đúng policy — đổi nhánh dev |
| `commit-msg` fail | Sửa message theo conventional format |
| `npm test` fail | Sửa test trước khi commit |
| `rejected` / non-fast-forward | `git pull --rebase` rồi push lại (hỏi user nếu conflict) |
