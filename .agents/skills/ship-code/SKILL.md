---
name: ship-code
description: >
  End-to-end release workflow for EduGuard. Trigger when the user asks to ship,
  release, or cut a version — NOT for ordinary push code to save work on the repo.
  Runs github-release analysis, mandatory code-reviewer gate, merge to release,
  then opens a detailed PR to main.
compatibility: "requires: gh CLI, git, npm test"
---

# Ship Code Workflow (EduGuard)

Human-readable rules: `docs/07_DEVELOPMENT_RULES.md` → Workflow ship / release.

Orchestrates the full **ship / release → review → merge release → PR main** pipeline.
Do **not** push directly to `main` (blocked by Husky and `AGENTS.md`).

> **Khác với push code thường:** Nếu user chỉ muốn lưu code lên remote (không release),
> dùng `.agents/skills/push-code/SKILL.md` — trigger `push code`, `đẩy code`, `push lên repo`.

## When to Use

Activate this skill when the user says any of:

- `ship` / `ship code` / `ship release`
- `release` / `cut a version` / `publish version`
- `/ship-code`

## When NOT to Use

| User intent | Skill |
|-------------|--------|
| Lưu / backup / đồng bộ nhánh dev lên GitHub | `push-code` |
| `push code` (không nhắc release / main / version) | `push-code` |

## Branch Model (EduGuard)

```txt
devD | devH | devB   →  (ship workflow)  →  release  →  PR  →  main
```

| Branch | Role |
|--------|------|
| `devD`, `devH`, `devB` | Feature development (source) |
| `release` | Integration / staging line before production |
| `main` | Production (merge via PR only) |
| `release/vX.Y.Z` | Optional short-lived branch for changelog-only prep (from github-release skill) |

Default source branch: **current branch** if it is `devD`, `devH`, or `devB`. Ask if
unclear.

---

## Prerequisites (stop if any fail)

Run on PowerShell (Windows):

```powershell
gh auth status
gh repo view --json nameWithOwner
git status
npm test
```

| Check | On failure |
|-------|------------|
| `gh auth status` | Stop — user runs `gh auth login` |
| Inside GitHub repo | Stop — `cd` into repo root |
| Working tree clean | Warn — stash, commit, or abort |
| `npm test` passes | Stop — fix failures before shipping |

Ask once:

> *Which directories are public-facing source? (e.g. `backend/`, `frontend/`.
> Press Enter for repo root.)*

Store as `PUBLIC_PATH` (comma-separated or single path). Default: `backend/` and
`frontend/`.

---

## Pipeline Overview

```txt
Phase A  Pre-flight + github-release recon (Steps 1–4)     [read-only]
Phase B  code-reviewer gate                               [blocking]
Phase C  CHANGELOG + commit on source branch
Phase D  Merge source → release + push
Phase E  PR release → main (detailed description)
Phase F  Handoff + doc updates
```

---

## Phase A — Release reconnaissance (github-release Steps 1–4)

Read and follow `.agents/skills/github-release/SKILL.md` **Steps 1–4 only** with these
EduGuard adaptations:

1. **Do not checkout `main`** for daily dev. Use the **source branch** (e.g. `devD`):

   ```powershell
   git fetch origin
   git checkout <SOURCE_BRANCH>
   git pull origin <SOURCE_BRANCH>
   ```

2. **Step 2 — Tags:** `git fetch --tags`, find latest SemVer tag (same as github-release).

3. **Step 3 — Diff:** Compare `PREV_SHA..HEAD` on `PUBLIC_PATH`, exclude `docs/`,
   tests, lockfiles per github-release rules. Also run:

   ```powershell
   git log "$prevSha..HEAD" --oneline --no-merges
   git diff "$prevSha..HEAD" --stat
   ```

4. **Step 4 — Propose `NEXT_VERSION`** (e.g. `v1.0.0`). Present rationale from **code
   diff first**, commits second. **Wait for user confirmation** before any writes.

If no tags exist → default `v1.0.0`.

---

## Phase B — Code review gate (mandatory)

Launch the **code-reviewer** subagent (`.claude/agents/code-reviewer.md`) with:

```txt
Review all changes from <PREV_SHA> to HEAD on branch <SOURCE_BRANCH>.
PUBLIC_PATH: <paths>
Planned release version: <NEXT_VERSION>
Focus: production readiness, security, breaking changes, test gaps.
Return report in the agent's standard output format.
```

### Gate rules

| Review outcome | Action |
|----------------|--------|
| **Critical** findings | **STOP** — fix on source branch, re-run tests, re-review |
| **High** findings | **STOP** unless user explicitly waives with written acknowledgment |
| **Medium / Low** | Proceed — list in PR as non-blocking |
| Review passes | Continue to Phase C |

Save the review report text — it goes into the PR body in Phase E.

---

## Phase C — CHANGELOG and source commit

Follow github-release **Step 6** (CHANGELOG) on the **source branch**:

1. Create or update `CHANGELOG.md` (Keep a Changelog format).
2. Show proposed section to user; wait for approval.
3. Commit using **allowed Husky type** (do **not** use `chore:` — not allowed in
   EduGuard). Use:

   ```powershell
   git add CHANGELOG.md
   git commit -m "docs: prepare release vX.Y.Z"
   git push origin <SOURCE_BRANCH>
   ```

Also update if applicable in the same session:

- `docs/project-changelog.md` (per `AGENTS.md`)
- `Todo List.md` — mark completed items, update phase status and date

---

## Phase D — Merge to `release`

```powershell
git fetch origin
git checkout release
git pull origin release
git merge <SOURCE_BRANCH> --no-ff -m "build(release): merge <SOURCE_BRANCH> for vX.Y.Z"
git push origin release
```

If `release` does not exist on remote:

```powershell
git checkout -b release <SOURCE_BRANCH>
git push -u origin release
```

Resolve merge conflicts on `release` before continuing. Re-run `npm test` after merge if
conflicts touched code.

---

## Phase E — Pull Request `release` → `main`

Create a **detailed** PR using `gh` and `--body-file` (never inline `--body` on
PowerShell).

### PR title

```txt
Release vX.Y.Z
```

### PR body template

Write `release_pr_body.md` at repo root (add to `.gitignore` if needed; do not commit
the temp file):

```markdown
## Release vX.Y.Z

### Summary
<2–3 sentences: what this release delivers and why it matters>

### Branch flow
- **Source:** `<SOURCE_BRANCH>`
- **Integration:** `release`
- **Target:** `main`

### Version rationale (SemVer)
- **Previous tag:** `<PREV_TAG or none>`
- **Proposed:** `vX.Y.Z`
- **Bump reason:** <MAJOR|MINOR|PATCH with evidence from diff>

### What's included
<Paste Keep a Changelog section from CHANGELOG.md>

### Code review
| Severity | Count | Status |
|----------|-------|--------|
| Critical | N | Resolved / None |
| High | N | Resolved / Waived / None |
| Medium | N | Non-blocking |
| Low | N | Non-blocking |

**Reviewer summary:** <paste Overall Assessment from code-reviewer>

**Blocking issues resolved:** <list or "None">

### Changed scope
```
<paste git diff --stat PREV_SHA..HEAD>
```

### Validation
- [ ] `npm test` / `dotnet test` passed before merge to `release`
- [ ] Husky commit-msg conventions respected
- [ ] No secrets in diff
- [ ] `Todo List.md` updated
- [ ] `docs/project-changelog.md` updated

### Risks and rollback
- **Known risks:** <from review or "None identified">
- **Rollback:** Revert merge commit on `main` or reset `release` to previous SHA

### Post-merge checklist
- [ ] Create annotated tag on merge commit:
  ```bash
  git checkout main
  git pull origin main
  git tag vX.Y.Z <merge-commit-sha>
  git push origin vX.Y.Z
  ```
- [ ] Publish GitHub Release from tag (copy changelog into release notes)
- [ ] Deploy staging/production per tunnel workflow (if applicable)

### Unresolved questions
<from code-reviewer or "None">
```

### Create PR

```powershell
$prBody = Get-Content -Raw release_pr_body.md
$prBody | Out-File -FilePath release_pr_body.md -Encoding utf8
gh pr create --base main --head release --title "Release vX.Y.Z" --body-file release_pr_body.md
```

Return the PR URL to the user.

---

## Phase F — Handoff

Tell the user:

1. **PR URL** for `release` → `main`
2. **Version** `vX.Y.Z`
3. **Review status** (pass / waived items)
4. After merge: create tag + GitHub Release (commands above)
5. Optional RC flow: tag `vX.Y.Z-rc.N` from `release` before merging to `main` for
   staging deploy on local machine + Cloudflare tunnel

---

## Error handling

| Situation | Action |
|-----------|--------|
| User on `main` | Stop — checkout `devD` or approved dev branch |
| Push to `main` attempted | Husky blocks — use PR only |
| `chore:` in commit message | Rejected by Husky — use `docs:`, `build:`, `feat:`, etc. |
| AI/tool reference in commit | Rejected — rewrite message |
| Review critical issues | Stop pipeline until fixed |
| `gh pr create` fails | Report error; check if PR already exists |
| Merge conflict on `release` | Resolve manually, test, then push |

---

## Quick reference — user trigger phrase

```txt
ship
```

Agent executes: **github-release (analyze) → code-reviewer (gate) → merge release → PR main**.

For **push code** (lưu repo only): use `push-code` skill, not this one.
