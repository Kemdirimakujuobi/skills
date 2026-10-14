---
name: pre-push-review
description: >-
  Run this BEFORE every `git push` or opening a PR — whenever the user says "push this", "open a
  PR", "ready to ship", "let's get this reviewed", or you are about to push a branch. It
  self-reviews the diff against docs/standards/STANDARDS.md, runs the local gates, and makes the
  PR body carry its evidence and its explicit opt-outs (changelog, docs, mobile). Reviewer
  findings are knowable before you push; every one caught here is a review round you don't pay
  for. Skip it and the same dozen findings arrive one round at a time. Do not skip to `git push`.
---

# Pre-push review

Review findings are knowable before you push — they are the rules in
`docs/standards/STANDARDS.md`. One change hit the *same* dozen findings across **nine** review
rounds. This skill runs them locally first, so the reviewer (human or bot) becomes a fast
confirmation, not a multi-round negotiation. Where nothing enforces the standards automatically,
this skill is the enforcement.

> **The gate fails only on blockers.** Fix every **blocker** before pushing. For **WARNs**, decide
> fix-now vs decline — both leave the gate green. Don't burn rounds polishing WARNs.

> **Never `git stash` when other agents or worktrees share this clone.** The stash stack is
> repository-wide, not worktree-local. Two parallel agents stashed to build a base-state preview
> for before/after shots, and each one's `pop` restored a *sibling's* work into its own tree and
> dropped its own. Set work aside with a temporary WIP commit; for a before/after capture, check
> `origin/<base>` out into a second worktree.

## Configure for your repo

- **`AGENTS.md`** — base branch, area prefixes, and the `preflight` script. Missing? Base is the
  default branch; areas are `feat|fix|ui|docs|ci|chore`.
- **`docs/standards/STANDARDS.md`** — the numbered rubric (CODE-, COMP-, DOCS-, HYG-). Missing?
  Use the rules named below in words.
- **`npm run preflight`** — one command for every local gate. Missing? Run the repo's typecheck,
  lint and build scripts (names read from `package.json`), plus tests if they are fast.
- **`WORKING_AGREEMENTS.md`** — PR size, one concern per PR, decision files.
- **Optional sibling skills**, each run only if installed and the repo has the thing it checks:
  `updating-the-changelog` (a public changelog), `docs-sync-review` (in-app or user-facing docs),
  `mobile-responsive-review` (UI used on phones).

## Step 0 — Branch name and base (last line of defense)

If `starting-a-change` was skipped, catch it now — a bad name blocks the PR at the very end
(HYG-06), and a stacked branch can lose its work on merge (HYG-07):

```sh
BASE=main   # or whatever AGENTS.md names
git rev-parse --abbrev-ref HEAD | command grep -Eq '^(feat|fix|ui|docs|ci|chore)/[a-z0-9]+(-[a-z0-9]+)*$' \
  && echo "branch OK" || echo "RENAME before pushing (git branch -m <area>/<slug>)"
git fetch origin && git log --oneline "origin/$BASE..HEAD"   # every commit listed should be yours
```

If the log shows another branch's commits, you are stacked. Re-cut onto the base, or declare the
stack in the PR body with `gh pr edit <this> --base <base>` as the first merge instruction.

## Step 1 — Mechanical self-pass (grep the diff)

Run against the actual diff vs the base. A hit isn't always a violation — read it — but each one
is a thing the reviewer *will* flag. Adapt the patterns to your stack; these are the ones that
recur in TypeScript/React/Tailwind repos.

> **Use `command grep`, not `grep`.** On some machines `grep` is a shell function wrapping another
> tool, and on piped or here-string input **it silently prints nothing** while `command grep`
> finds the matches. No error, no exit code: the self-pass just comes back clean. On one 26 KB
> diff `grep -c` printed nothing and `command grep -c` printed 26, and two agents lost review
> rounds to findings their own self-pass had "passed". **A checker that cannot fail is worse than
> no checker.** If this block reports zero hits on a large diff, prove the checker works before
> believing it.

```sh
DIFF=$(git diff "origin/$BASE...HEAD")
# Type escapes — `any`, double casts, ts-ignore:
command grep -nE ': any\b|as any\b|as unknown as|@ts-ignore' <<<"$DIFF"
# CODE-03 — raw colour literals instead of semantic tokens:
command grep -nE '^\+.*#[0-9a-fA-F]{3,8}\b|rgba?\(' <<<"$DIFF"
# COMP-03 — focus outline removed without a focus-visible replacement on the same element:
command grep -n 'outline-none' <<<"$DIFF"
# Inline conditional class strings (prefer variants / data-* attributes):
command grep -nE '\? "[^"]*(text-|bg-|p[xy]?-|m[xy]?-|w-|hidden)|&& "' <<<"$DIFF"
# HYG-05 — a secret literal instead of an env var (eyeball every hit):
command grep -nEi '(api[_-]?key|secret|token|password)\s*[:=]\s*["'\''][A-Za-z0-9_\-]{12,}' <<<"$DIFF"
```

If a rule is already a lint error, don't grep for it — the lint gate in Step 5 catches it.

Also confirm by eye:
- **HYG-04** — a new runtime dependency, or any decision the diff or PR body cites, has a
  `docs/decisions/YYYY-MM-DD-slug.md` **in this PR**.
- **HYG-05** — any new env var is in the env template, the deploy env and the setup docs.
- **Shared generated assets** (icon sets, token output) — the diff only **adds** names, never
  modifies one that other code imports. A modified shared asset changes every consumer.
- **Generated aggregates** the CI rebuilds are not committed by hand.
- **Published packages** — if the repo releases through changesets (or similar) and the diff
  touches a published package, a release note exists. Without one the PR merges, every check stays
  green, and the change reaches nobody.
- **DOCS-01** — new or changed component props are documented and exercised by a story/example.

## Step 2 — Visible-change evidence (HYG-02)

If the diff changes visible UI, you owe **light + dark** screenshots of **every** affected state —
**before AND after** for changes to existing UI, **after** only for net-new — embedded in the PR
body. Drive interactive states (hover, open, focus) with a browser automation tool and save under
`docs/evidence/<feature>/`.

- **Prove the pair differs.** Byte-compare each light/dark pair; identical files mean the theme
  toggle didn't take (or a stale server on a shared port answered). Wait for animations to settle
  before capturing.
- A hash can prove a pair differs; it cannot prove a before/after is unchanged where a canvas or
  chart antialiases. Say parity was checked by eye rather than claiming byte-equality.

## Step 3 — Code review on the diff

Two passes, because they catch different things:

1. **Correctness and efficiency** — run your code-review skill (e.g. `/code-review high`) on the
   working diff. It hunts logic bugs and reuse/simplification issues grep cannot see.
2. **Standards compliance** — a generic code review does *not* check your numbered rules, so spawn
   a review subagent for those:

   > Review `git diff origin/<base>...HEAD` against `docs/standards/STANDARDS.md`. For each finding
   > give rule id, file:line, severity (blocker/warn), and the fix. Check especially CODE-03,
   > COMP-01..06, DOCS-01, HYG-01..07. Return a structured list, nothing else.

Fix every **blocker** from either pass. Triage **WARNs** (fix-now or note-and-decline). Re-run the
relevant grep to confirm.

## Step 4 — Optional sub-steps (blockers when they apply)

Each runs **only if the skill is installed and the repo has the thing it checks**. When it
applies, it is a blocker with one explicit escape hatch in the PR body. Declining is fine;
**declining silently** is what leaves the product and its docs out of step.

- **Changelog** — if the repo has a public changelog and `updating-the-changelog` is installed,
  run it. It decides whether the change is customer-visible and writes the entry in this branch.
  PR body: `Changelog: added — "<title>"` or `Changelog: none — <reason>` (internal tooling,
  refactors, anything not live yet).
- **Docs sync** — if the repo has in-app or user-facing docs and `docs-sync-review` is installed,
  run it whenever the diff changes what a user can see or do. It maps changed paths to the
  affected page and drafts the fix in this branch. PR body: the updated pages, or
  `Docs impact: none — <reason>`.
- **Mobile** — if the repo has UI used on phones and `mobile-responsive-review` is installed, run
  it whenever the diff changes layout-bearing markup or styles. A new surface that only works on a
  laptop quietly undoes everyone else's mobile work. PR body: `Mobile: checked — <what adapts>`,
  `Mobile impact: none — <reason>`, or `Mobile: desktop-only — <reason>`.

## Step 5 — Green gates

```sh
npm run preflight
```

Missing? Run typecheck, lint and build from `package.json` in that order. All must be green.

- **A gate that can never pass is worse than no gate.** If the whole-repo lint has a large
  pre-existing baseline, lint only the files your branch changed against the merge-base. Your diff
  must be clean; the baseline's debt is not yours to pay here. Run that check with no merge in
  progress — mid-merge it attributes the base's errors to your branch.
- **Don't run a production build while the dev server is live** if they share an output directory;
  the build overwrites it and the dev server serves stale module errors. Stop it first.
- If a gate cannot run in your environment (some test runners fail inside agent worktrees), say
  so in the PR body and let CI prove it. Don't report it green.

## Step 6 — Size, then push

- **HYG-01** — the reviewable diff is about ≤ 25 files / ≤ 1500 lines (lockfiles and generated
  output excluded). Over? Split by concern. Decide what the PR **must** contain first, then cut
  scope to fit — never defer a mandatory changeset, doc or decision file to "a follow-up".
- **HYG-03 — one concern per PR.** Dev tooling, unrelated refactors and drive-by fixes go on their
  own branch.
- Push the branch and open the PR (draft is fine) **into the base**, with a `<area>: <summary>`
  title that mirrors the branch.

**Agents push branches and open PRs. Agents never merge, never deploy, never push to the base — a
human pulls the trigger.** Approval to push in one message does not carry to the next push.

## Definition of done

- [ ] Branch name passes the area regex; branch cut from the base, or the stack is declared with
      its retarget command
- [ ] Mechanical self-pass run with `command grep`; hits triaged
- [ ] Light + dark before/after evidence for every visible state in the PR body, pairs proven
      different
- [ ] Both review passes run; blockers fixed, WARNs triaged
- [ ] Changelog / docs / mobile sub-steps run where they apply, or an explicit `none — <reason>`
      line in the PR body for each
- [ ] `npm run preflight` (or typecheck + lint + build) green
- [ ] A decision file exists IN THIS PR for any decision the diff cites; a release note exists if
      a published package changed
- [ ] Within HYG-01; one concern; PR title mirrors the branch; targets the base; not merged by you

## How this goes wrong

- The self-pass "passes" because the checker silently printed nothing.
- A stacked child merges into a parent that already merged; both say "Merged", the base has none
  of it. Verify with `git merge-base --is-ancestor <child-head> origin/<base>`.
- A mandatory item is deferred to stay under the size cap and never lands.
- Light and dark screenshots are byte-identical because the toggle never fired.
