# AGENTS.md

Instructions for AI agents (Claude Code, Codex, Cursor and others) and a fast orientation for
humans. `CLAUDE.md` should contain one line, `@AGENTS.md`, so every tool reads the same file.

## What this repo is

<!-- One paragraph. What it is, what it is NOT (no production data? not published?), who reviews. -->

## The rules that don't bend

Read [`WORKING_AGREEMENTS.md`](WORKING_AGREEMENTS.md). The short version:

- **The base branch is `main`.** Branch off it, PR back into it.
- **Agents may push branches and open draft PRs. Agents never merge, deploy, or push to `main`.**
  A human pulls the trigger. Approval in one message does not carry to the next.
- **One concern per PR. No stacked PRs.**
- **Green `npm run preflight` before opening a PR.**
- **Secrets come from the environment**, never a literal in source.

## Start and finish a change (use the skills)

- **Writing a spec:** `authoring-a-prd`.
- **Before branching:** `starting-a-change` (branch naming, fresh base, latest `RETRO.md` traps).
- **Building UI:** `figma-import` → `building-components` → `figma-build`. Tokens: `design-tokens`.
- **Before pushing:** `pre-push-review` (self-review against
  [`docs/standards/STANDARDS.md`](docs/standards/STANDARDS.md), then the local gates). It calls
  `updating-the-changelog`, `docs-sync-review` and `mobile-responsive-review` where they apply.
- **After a design-system merge:** `landing-a-design-system-change`. A merge is not delivery.

## Configuration the skills read

| Key | Value |
|---|---|
| Base branch | `main` |
| Branch areas | `feat` `fix` `ui` `docs` `ci` `chore` |
| Preflight | `npm run preflight` |
| Changelog | `CHANGELOG.md` |
| In-app docs map | `docs/docs-map.md` |
| Product truth for PRDs | <!-- e.g. docs/prd/_features.md --> |
| Exemplar component | <!-- e.g. src/ui/button.tsx --> |

## Where things live

<!-- app/, components/, lib/, docs/decisions/, docs/standards/ … -->

## Known traps

See the newest entries in [`RETRO.md`](RETRO.md).
