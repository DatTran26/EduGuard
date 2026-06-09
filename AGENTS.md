# AGENTS.md - Project Rules

## Git Branch Policy

- Project branches: `release`, `devD`, `devH`, `devB`.
- Do not push code directly to `main` under any circumstance.
- All implementation work must happen on a non-main branch before any reviewed integration flow.
- Keep branch changes focused. Do not mix unrelated feature, fix, refactor, or documentation work in one change set.

## Husky Hook Guard

- This project uses Husky hooks in `.husky/`.
- `.husky/pre-push` blocks any push that updates `refs/heads/main`.
- Keep local Git config `core.hooksPath` set to `.husky/_` so Husky stays active.
- `.husky/pre-commit` runs `npm test` before commits.
- `.husky/commit-msg` blocks non-conventional commit messages, leading or trailing spaces, and AI/tool references.
- If the hook blocks a push, switch to `release`, `devD`, `devH`, `devB`, or another approved non-main branch.

## Commit Message Policy

- Use conventional commit format: `type(scope): description` or `type: description`.
- Allowed types: `feat`, `fix`, `build`, `ci`, `perf`, `refactor`, `test`, `style`, `docs`, `revert`.
- Do not start or end commit messages with whitespace.
- Do not include AI/tool references in commit messages.

## Detailed Change Description Requirement

Every meaningful project change must include a detailed description before it is considered complete.

Required description fields:

- Feature or fix name.
- Purpose and user/business impact.
- Files or modules changed.
- Technical summary of what changed.
- Validation performed, including commands run and relevant results.
- Known risks, limitations, rollback notes, or follow-up work if any.

## Feature Changelog Requirement

- Update `docs/project-changelog.md` for every feature-level change.
- Changelog entries must be grouped by feature, not only by date.
- Each feature changelog entry must include date, branch/source, description, changed files, validation, and unresolved questions if any.
- Bug fixes, security changes, and breaking changes must be explicitly labeled in the related feature entry.

## Development Rules & Workflows

Full rules (implementation order, push vs ship, Todo List maintenance): **`docs/07_DEVELOPMENT_RULES.md`**

| User says | Purpose | Skill |
|-----------|---------|--------|
| **push code**, đẩy code, lưu lên repo | Backup / sync dev branch | `.agents/skills/push-code/SKILL.md` |
| **ship**, ship code, **release** | Version cut → production | `.agents/skills/ship-code/SKILL.md` |

- `Todo List.md` (root): live checklist only — update per `docs/07_DEVELOPMENT_RULES.md`.
- Do not push to `main` in either workflow.
