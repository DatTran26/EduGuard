# PowerShell trên Windows (EduGuard)

Repo phát triển trên **Windows PowerShell 5.x**. Agent phải dùng cú pháp dưới đây — **không** copy lệnh Bash (`&&`, `$(cat <<'EOF')`, `$VAR=$(...)`) trừ khi có block PowerShell tương ứng.

## Chạy nhiều lệnh

| ❌ Không dùng (PS 5.x) | ✅ Dùng |
|------------------------|---------|
| `git status && git push` | Chạy từng lệnh, hoặc `git status; git push` |
| `cmd1 && cmd2` | `cmd1; if ($?) { cmd2 }` khi cần dừng nếu lệnh trước fail |

PowerShell 7+ hỗ trợ `&&` — môi trường mặc định của dự án vẫn là PS 5.x.

## Commit message

| ❌ Không dùng | ✅ Dùng |
|---------------|---------|
| `git commit -m "$(cat <<'EOF'..."` | Hai cờ `-m` |
| HEREDOC bash | Nội dung ngắn một dòng, hoặc `-m` thứ hai cho body |

```powershell
git add <paths>
git commit -m "docs: add development rules" -m "Move workflow rules out of Todo List into docs/07."
```

EduGuard: **không** dùng `chore:` (Husky chặn). Dùng `docs:`, `build:`, `feat:`, …

## Biến cho git range

```powershell
# Sau khi có tag (Step 2 github-release)
$prevTag = git tag --sort='-version:refname' |
  Select-String '^[vV]?\d+\.\d+\.\d+' |
  Select-Object -First 1 -ExpandProperty Line

if ($prevTag) {
  $prevSha = git rev-list -n 1 $prevTag
} else {
  $prevSha = git rev-list --max-parents=0 HEAD
}

git log "${prevSha}..HEAD" --oneline --no-merges
git diff "${prevSha}..HEAD" --stat
```

## `gh pr create` — PR body

**Không** dùng `--body` với chuỗi dài hoặc `\n` trên PowerShell — hiển thị literal.

```powershell
# Cách 1: file đã soạn sẵn (khuyến nghị)
gh pr create --base main --head release --title "Release v1.0.0" --body-file release_pr_body.md

# Cách 2: here-string → file
@'
## Release v1.0.0
...
'@ | Set-Content -Path release_pr_body.md -Encoding utf8

gh pr create --base main --head release --title "Release v1.0.0" --body-file release_pr_body.md
```

## Preflight (push / ship)

```powershell
Set-Location D:\Projects\EduGuard
git status
git branch -vv
npm test
gh auth status
```

Chạy **từng dòng** hoặc nối bằng `;` — không dùng `&&`.

## Tag sau merge

```powershell
git checkout main
git pull origin main
git tag v1.0.0 <merge-commit-sha>
git push origin v1.0.0
```
