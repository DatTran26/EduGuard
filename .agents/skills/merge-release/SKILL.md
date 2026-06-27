---
name: merge-release
description: >
  Integrate dev branch into release and sync back — commit WIP first, merge dev→release,
  push release, then merge origin/release into dev. NOT ship (no version cut, no PR main).
  Trigger when user says merge to release, merge vào release, đưa code lên release,
  or lấy code mới nhất từ release về nhánh hiện tại (full sync flow).
compatibility: "requires: git, Windows PowerShell"
---

# Merge to Release (tích hợp release)

Human-readable rules: `docs/development/development-rules.md` → Workflow merge to release.  
Shell: **`.agents/references/powershell-windows.md`** (PowerShell 5.x — không `&&`, HEREDOC bash).

Dùng khi user muốn **đưa công việc trên nhánh dev vào `release`** và **đồng bộ lại nhánh dev**
với `origin/release`. Đây là tích hợp trước production — **không** cắt version, **không** PR `main`.

**Không** kích hoạt skill này nếu user nói `ship`, `ship code`, `cut version`, `PR main` —
dùng `.agents/skills/ship-code/SKILL.md`.

## When to Use

- `merge to release` / `merge vào release` / `đưa code lên release`
- `lấy code mới nhất từ release về` / `sync release về dev` (khi ngữ cảnh là tích hợp sau khi merge dev)
- User vừa xong feature trên `devD` / `devH` / `devB` và muốn cập nhật nhánh `release`

## When NOT to Use

| User nói | Dùng skill |
|----------|------------|
| Chỉ `push code`, `lưu repo`, backup nhánh dev | `push-code` |
| `ship`, `release` (production), tag, PR `main` | `ship-code` |
| Chỉ pull `release` để đọc/merge vào dev **không** có WIP cần đưa lên release | Có thể chỉ `git fetch` + merge — nhưng nếu có WIP chưa commit, vẫn commit hoặc hỏi user trước |

## Critical order (bắt buộc)

**Không** merge `origin/release` vào dev trước khi commit WIP và merge dev → release,
trừ khi user **chỉ** muốn sync từ release (không có thay đổi local cần đưa lên release).

Thứ tự đúng:

```txt
dev (WIP)  →  build/verify  →  commit trên dev  →  release  →  push origin/release
           →  quay lại dev  →  merge origin/release  →  push origin/dev
```

### Anti-pattern (tránh)

| Sai | Đúng |
|-----|------|
| `git merge origin/release` vào dev khi còn WIP chưa commit | Commit (hoặc stash có chủ đích) trước |
| Hiểu "merge to release xong lấy code từ release về" = chỉ pull release | Cả hai: đưa dev lên release **và** sync release về dev |
| Merge dev → release nhưng quên push `origin/release` | Push release, rồi sync dev từ `origin/release` |

---

## Steps

Giả sử nhánh dev đang làm việc là `devD` (thay bằng `devH` / `devB` nếu đúng context).

### 1. Kiểm tra trạng thái

```powershell
Set-Location D:\Projects\EduGuard
git status
git branch -vv
```

- Không làm việc trên `main`.
- Ghi nhận nhánh dev hiện tại (`DEV_BRANCH`).

### 2. Verify trước commit

- Backend: `dotnet build backend/EduGuard.Api/EduGuard.Api.csproj`
- Sửa lỗi build trước khi commit.

### 3. Commit WIP trên nhánh dev (nếu có)

- Commit theo cụm chức năng; conventional commit; không `chore:`; không tham chiếu AI/tool.
- Husky chạy test trước commit.

```powershell
git add <paths>
git commit -m "type(scope): subject" -m "Optional body."
```

Nếu user **không** muốn commit (chỉ sync từ release): hỏi rõ hoặc stash — không tự ý bỏ WIP.

### 4. Merge dev → release và push

```powershell
git fetch origin release
git checkout release
git pull origin release
git merge DEV_BRANCH -m "build(release): merge DEV_BRANCH short description"
git push origin release
```

- Resolve conflict trên `release` nếu có; không force-push.

### 5. Sync release về nhánh dev

```powershell
git checkout DEV_BRANCH
git fetch origin release
git merge origin/release
git push origin DEV_BRANCH
```

Sau bước này, `dev` và `origin/release` thường cùng HEAD (hoặc dev chứa release).

### 6. Báo cáo cho user

- Commit(s) mới trên dev
- Hash `release` sau push
- Xác nhận dev đã sync với `origin/release`
- Working tree sạch hay còn WIP

---

## Error handling

| Lỗi | Xử lý |
|-----|--------|
| Merge blocked vì local changes | Commit hoặc stash có message rõ, rồi merge lại |
| Conflict trên `release` | Resolve trên `release`, commit merge, push |
| Conflict khi sync về dev | Resolve trên dev, push dev |
| `pre-push` chặn `main` | Đúng policy — chỉ push `release` / dev |
| Stash pop conflict (changelog, v.v.) | Merge nội dung cả hai phía; giữ entry mới nhất trước trong changelog |
