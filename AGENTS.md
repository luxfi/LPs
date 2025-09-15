# Repository Guidelines

## Project Structure & Module Organization
- `LPs/`: Canonical proposal Markdown files (`lp-<number>.md`), plus `TEMPLATE.md` and `lp-draft.md`.
- `docs/`: Generated indexes, status pages, and reference docs.
- `scripts/`: Helper tools for scaffolding, validation, link checks, and index updates.
- `Makefile`: Entry point for common tasks (create, validate, update, check).
- `assets/` and `phases/`: Images and roadmap materials used by LPs.

## Build, Test, and Development Commands
- `make new`: Interactive wizard to scaffold `LPs/lp-draft.md`.
- `make validate FILE=LPs/lp-20.md`: Validate a single LP (front‑matter, format).
- `make validate-all`: Validate all LPs under `LPs/`.
- `make check-links`: Verify hyperlinks across LP documents.
- `make update-index`: Refresh the LP index in `README.md`.
- `make pre-pr`: Run validate, link check, and index update before a PR.
- `make stats` | `make list` | `make recent`: Useful overview commands.

## Coding Style & Naming Conventions
- **Files**: `LPs/lp-<number>.md` (e.g., `LPs/lp-20.md`). Drafts use `lp-draft.md`.
- **Front‑matter**: Include `lp`, `title`, `description`, `author`, `status`, `type`, `category` (if Standards Track), `created`, `discussions-to`, `requires`, `replaces`.
- **Markdown**: Use ATX headings (`#`, `##`), hyphen bullets (`- `), fenced code blocks. Avoid special bullet characters; scripts normalize to `-`.
- **Language**: Clear, concise, specification‑first tone. Prefer active voice.

## Testing & Validation
- **Primary checks**: `make validate-all` and `make check-links` must pass.
- **Watch mode**: `make watch` (requires `entr`) to auto‑validate on save.
- **Coverage**: Not applicable; treat validation and link checks as the test suite.

## Commit & Pull Request Guidelines
- **Commits**: Concise, imperative subject; scope the change (e.g., `LP-20: refine abstract`).
- **PRs**: Include summary, affected LPs/paths, screenshots if formatting changes, and link to discussion (`discussions-to`). Run `make pre-pr` and attach output when relevant.
- **Numbering**: Submit drafts as `lp-draft.md`; maintainers assign numbers and rename to `lp-<number>.md`.

## Security & Configuration Tips
- No secrets in LPs or docs. Use placeholder URLs where needed.
- Run `make permissions` if scripts aren’t executable. Python 3 is required for `make update-index`.
- Optional: Use `scripts/create-lp-discussions.sh` with GitHub CLI to open discussion threads.

## Decision LPs (Informational)
- Use Informational LPs to record significant engineering decisions (what some teams call ADRs).
- Scaffold a draft: `make decision` (writes `LPs/lp-draft.md`).
- Include: Context, Decision, Consequences, Alternatives, References, Implementation Notes.
