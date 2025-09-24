# Repository Guidelines
# Repository Guidelines

## Project Structure & Module Organization
- `LPs/`: Canonical proposal Markdown files (`lp-<number>.md`), plus `TEMPLATE.md` and `lp-draft.md`.
- `docs/`: Generated indexes, status pages, and reference docs.
- `scripts/`: Helper tools for scaffolding, validation, link checks, and index updates.
- `assets/` and `phases/`: Images and roadmap materials used by LPs.
- `Makefile`: Entry point for common tasks; see commands below.

## Build, Test, and Development Commands
- `make new`: Interactive wizard to scaffold `LPs/lp-draft.md`.
- `make decision`: Scaffold a Decision LP draft in `LPs/lp-draft.md`.
- `make validate FILE=LPs/lp-20.md`: Validate a single LP (front‑matter, format).
- `make validate-all`: Validate all LPs under `LPs/`.
- `make check-links`: Verify links across LPs (set `SKIP_EXTERNAL=1` in restricted networks).
- `make update-index`: Refresh the LP index in `README.md` (requires Python 3).
- `make pre-pr`: Run validate, link check, and index update before a PR.
- `make watch`: Auto‑validate on save (requires `entr`).
- Helpful: `make stats` | `make list` | `make recent` for overviews.

## Coding Style & Naming Conventions
- Files: `LPs/lp-<number>.md` for numbered proposals; drafts use `lp-draft.md`.
- Front‑matter: `lp`, `title`, `description`, `author`, `status`, `type`, `category` (if Standards Track), `created`, `discussions-to`, `requires`, `replaces`.
- Markdown: Use ATX headings (`#`, `##`), hyphen bullets (`- `), fenced code blocks. Avoid special bullet characters; scripts normalize to `-`.
- Tone: Clear, concise, specification‑first, active voice.

## Testing Guidelines
- Primary checks act as the test suite: `make validate-all` and `make check-links` must pass. In restricted environments, run `SKIP_EXTERNAL=1 make check-links` to skip external URLs.
- Use `make watch` during edits for fast feedback. No coverage targets; prioritize validation cleanliness.

## Commit & Pull Request Guidelines
- Commits: Concise, imperative subject; scope the change (e.g., `LP-20: refine abstract`).
- PRs: Include summary, affected LPs/paths, screenshots if formatting changes, and link to discussion (`discussions-to`). Run `make pre-pr` and paste output when relevant.
- Numbering: Submit drafts as `lp-draft.md`; maintainers assign numbers and rename to `lp-<number>.md`.

## Security & Configuration Tips
- Do not include secrets or private data. Use placeholders if needed.
- If scripts aren’t executable, run `make permissions`.
- Optional: `scripts/create-lp-discussions.sh` (with GitHub CLI) can open discussion threads.
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
