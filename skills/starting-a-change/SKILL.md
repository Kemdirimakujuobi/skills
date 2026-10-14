---
name: starting-a-change
description: >-
  Run this BEFORE creating a branch or starting any new unit of work that will become a PR —
  whenever the user says "let's start X", "new branch", "let's build the Y page", "let's do the Z
  component", "fix this bug", or otherwise kicks off a change. It names the branch `<area>/<slug>`
  at creation time, branches off a fresh base (never another feature branch), and surfaces the
  latest RETRO.md lessons so known traps are designed out before the first commit. Skip it and the
  branch name gets rejected at the very end of review, a stacked PR can silently lose its work on
  merge, and last week's trap bites again.
---

# Starting a change

A branch name is a **gate**. It is invisible while you work and only rejected at review — one
change shipped on a branch named after its author and didn't learn the name was wrong until
review round nine. This skill makes the name, the base, and the known traps a decision you make
in the first 30 seconds, not a blocker at the end.

A unit of work should already have a **PRD/spec** before you branch. If it doesn't and the change
is a real feature, `authoring-a-prd` is the upstream gate that produces one first.

## Configure for your repo

This skill expects, and falls back to a default when one is missing:

- **`RETRO.md`** at the repo root — newest-first lessons. Missing? Skip Step 1 and suggest starting one.
- **`AGENTS.md`** — names the **base branch** and the **area prefixes**. Missing? Base is the
  repo's default branch (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`), and
  the areas are the default set in Step 2.
- **`docs/standards/STANDARDS.md`** — the review rubric (HYG-06 branch naming, HYG-07 no stacked
  PRs). Missing? The rules below still apply; they are just not numbered.
- **`WORKING_AGREEMENTS.md`** — the discipline (no push to the base, one concern per PR). Read it
  once if it exists.

## Step 1 — Read the retro first

Open `RETRO.md` and read the **most recent entry** (top of file). It is the running list of what
bit the team last time. Two minutes here saves review rounds. Note anything that applies to the
change you are about to start — you will carry it into the plan in Step 5.

The *rules* live in `docs/standards/STANDARDS.md`; component build order lives in
`building-components`. This skill is only the gate you pass through before either.

## Step 2 — Pick the area

Every branch and PR title starts with an **area prefix** so a human reads the kind of change at a
glance. Use the list in `AGENTS.md` if the repo declares one. Otherwise pick exactly one of:

| Area | Use it for |
|---|---|
| `feat/` | Product features and pages |
| `fix/` | Bug fix |
| `ui/` | Components and styling |
| `docs/` | Documentation, decisions, process, skills |
| `ci/` | Pipeline, CI, tooling, infra |
| `chore/` | Dependencies, cleanup, maintenance |

Unsure between two? Pick by **blast radius**: a change to a shared component is `ui/` even if it
is "for one page"; a backend change is its backend area even if a page needs it.

## Step 3 — Name it `<area>/<short-slug>` (HYG-06)

- **Format:** `<area>/<short-slug>` — lowercase, hyphenated, imperative. The PR title mirrors it:
  `<area>: <imperative summary>`.
- **Never** a personal name, an issue number, a date, or a random word. The prefix must let a
  human read the kind of change at a glance.
- Examples: `feat/dashboard-overview` · `ui/sidebar-collapse` · `fix/widget-total-mismatch` ·
  `docs/ship-discipline-skills`.

Sanity-check before you create it (swap in your repo's area list):

```sh
echo "ui/sidebar-collapse" | command grep -Eq '^(feat|fix|ui|docs|ci|chore)/[a-z0-9]+(-[a-z0-9]+)*$' \
  && echo "OK" || echo "REJECT — fix the name before branching"
```

`command grep` bypasses any shell function or alias wrapping `grep`; see `pre-push-review` for
why that matters.

Then check the name can actually be pushed. **A remote branch named exactly like an area (`docs`)
blocks every branch under it (`docs/*`)** — git cannot hold both refs, and the push fails with a
directory/file conflict:

```sh
git ls-remote --heads origin "<area>"   # any output means <area>/* cannot be pushed
```

If it hits, tell the user (renaming that branch is its owner's call) and use another area with a
note in the PR body.

## Step 4 — Branch off a fresh base

Work branches off the **base branch** and merges back into it via PR. Never push directly to the
base. Update it first:

```sh
BASE=main   # or whatever AGENTS.md names
git fetch origin && git checkout "$BASE" && git pull --ff-only origin "$BASE"
git checkout -b <area>/<short-slug>
```

**Never branch off another feature branch (HYG-07).** Not because stacks are noisy — because they
**lose work**. A stacked PR must land in its parent *before* the parent merges into the base. Get
that order wrong and the child merges into a branch that has already been merged away. Nothing
errors. Both PRs show "Merged", the host warns you about nothing, and the base never receives a
line of the child — usually discovered much later, when a fix appears to have reverted itself.

This has happened with two PRs merged 21 seconds apart, and again with a stack whose merge order
was **declared** in the PR body. Declaring a stack does not protect it: the person merging is
often not the author, works on their own schedule, and may merge both in one sitting. Any plan
phrased as "after you merge X, I will..." cannot execute.

If a stack is genuinely unavoidable:
- Say so in the child's PR body, with the retarget command as the **first** line of the merge
  instructions — `gh pr edit <child> --base <base>`, run the moment the parent merges and before
  its branch is deleted. The merger should be able to act without reading.
- After merging, verify the landing, don't read the badge:
  `git merge-base --is-ancestor <child-head-sha> origin/<base> && echo landed`.

Prefer the alternative: open PRs sequentially against the base and cut the next one after the
previous lands.

> If the base branch in `AGENTS.md` looks stale (it names a branch that has merged or no longer
> exists), confirm the current base with the user before branching.

## Step 5 — Carry the traps into the plan

From the retro and the standards, the recurring ones to design out from commit 1:

- Any **visible** UI change? You will owe **light + dark** screenshots — before AND after for
  existing UI, after only for net-new — for every state, in the PR body (HYG-02). Plan to capture
  them.
- New page, panel, dialog or layout? If the product is used on phones, it must work at phone width
  without changing desktop. Design it responsive from the start; `mobile-responsive-review`
  checks it before push.
- Building a component? Follow `building-components`. Touching tokens? `design-tokens`.
- Touching a **shared** generated asset (an icon set, a token output)? Add a new name; never
  repurpose one that other code imports — every consumer changes with it.
- New runtime dependency or other non-trivial call? It needs a decision file in
  `docs/decisions/YYYY-MM-DD-slug.md` in the **same** PR (HYG-04).
- New env var or secret? It goes in the env files, the deploy env and the setup docs in the same
  PR — never a literal in source (HYG-05).
- Changing a design-system component's behaviour from a consuming app? That change belongs in the
  design-system repo, not as a local override.
- Decide what the PR **must** contain (changeset, docs, decision file, evidence) before you start.
  A size-capped PR that defers a mandatory item to "a follow-up" usually never adds it.

## Definition of done

- [ ] Read the latest `RETRO.md` entry (or noted that the repo has none)
- [ ] Area chosen; branch named `<area>/<slug>`, no personal name; the regex passes
- [ ] No remote branch named exactly like the area
- [ ] Branched off an up-to-date base, not another feature branch — or the stack is declared
      with its retarget command
- [ ] Known traps for this change type noted before the first commit
- [ ] Test layer decided (`testing-a-change`); for a bug fix, the failing test comes first

When the work is built and you are ready to push, `pre-push-review` is the matching exit gate —
run it before `git push`.
