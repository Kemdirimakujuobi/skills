---
name: landing-a-design-system-change
description: >-
  Run this AFTER a design-system PR merges, whenever the user says "it's merged", "I
  merged it", "did it land?", "make sure it reaches the app", or you have just watched a
  PR touching published components, tokens or icons go green and merge. A merge is NOT
  delivery: the change must be declared (changeset), published to the registry, bumped
  in the consuming app, and verified in the installed build. Every one of those hops can
  fail silently, and a green check proves only that a request was sent. This skill drives
  the change to actually landed, checking each hop against the registry and the
  installed bytes rather than a version number. Do not stop at "merged".
---

# Landing a design-system change

`pre-push-review` is the gate *before* a PR. This is the gate *after* it. Between "merged" and "a
user of the app sees it" there are several hops, and in one bad stretch **every one of them failed
silently at least once**: a merge with no changeset published nothing; a receiving workflow with a
one-character expression error swallowed every dispatch for two days while the sender logged
"success"; three bumps had to be hand-rolled. Nothing alerted. A human noticed each time.

So: a merge is a *promise*. This skill collects on it.

## Configure for your repo

The skill expects these, normally declared in `AGENTS.md`:

- **Package name(s) and registry**: what publishes and where (npm, GitHub Packages, a private
  registry). Read from the design-system repo's `package.json` files.
- **Release mechanism**: Changesets by default (`.changeset/`, a release workflow, a "Version
  Packages" PR). If the repo uses another tool (semantic-release, manual tags), map each step to it.
- **Consumer repo and branch**: which app consumes the package and **which branch** consumes it.
  Verify it rather than assuming; consumers move.
- **Bump automation**: a cross-repo trigger (for example `repository_dispatch` into a bump workflow
  in the consumer). If there is none, Step 3 (bump by hand, in a worktree) is the normal route.
- **Consumer preflight**: `npm run preflight` in the consumer; if missing, run typecheck, lint
  and build.
- **Guardrail**: you may push branches and open PRs. You never merge, deploy, or push to a base
  branch, and you never perform repo-admin actions. Approval in one message does not carry to the
  next.

## Step 0 — Did it even declare a release?

A merge without a changeset publishes **nothing**, silently. A package can sit unreleased across
half a dozen merged PRs this way.

```sh
git checkout <base> && git pull --ff-only
git log --oneline -3
ls .changeset/*.md 2>/dev/null || echo "no pending changesets"
```

- **The merged PR had a changeset**: continue.
- **No changeset and the PR touched published code** (components, tokens, icons): STOP. Nothing
  will publish. Open a follow-up changeset PR before going further. Docs-only or stories-only
  changes legitimately need none, but say so out loud (`Changeset: none — <reason>`) rather than
  assuming.

## Step 1 — Confirm it actually published

Do **not** trust the base branch's `package.json` version. That is what the release tool *wants*;
the registry is what consumers *get*.

```sh
npm view <package> versions --registry=<registry-url> | tail -2
gh run list --workflow=<release-workflow> -L 3
```

If the "Version Packages" PR is open and unmerged, the release hasn't happened. A human merges it;
you may not. Re-check after.

## Step 2 — Did the bump reach the consumer?

If the repo has bump automation, this is the hop that breaks invisibly. A sender that logs
"notify: success" is telling you the API call returned, i.e. the request was *sent*, not that
anything *ran*.

```sh
gh run list -R <owner>/<consumer> --workflow=<bump-workflow> -L 5
gh run list -R <owner>/<consumer> -L 30 --json event \
  --jq '[.[]|select(.event=="repository_dispatch")]|length'
```

- **A dispatch run exists and opened a bump PR**: skip to Step 5.
- **Zero dispatch runs, or runs that fail in seconds**: the workflow on the consumer's **default
  branch** is not parsing or not firing (dispatch events only run the default branch's copy).
  Diagnose it with `actionlint`, not a YAML parser: YAML parses fine while an Actions expression
  is invalid. A pinned action SHA that doesn't resolve also kills runs in seconds at download.
  Then use Step 2b.

## Step 2b — Trigger the bump manually (preferred over hand-rolling)

If the bump workflow supports `workflow_dispatch`, run it on a ref where it actually works:

```sh
gh workflow run <bump-workflow> -R <owner>/<consumer> --ref <working-ref> -f <inputs>
```

`<working-ref>` is the default branch if its copy is healthy, otherwise a branch carrying the
one-line fix (confirm it exists with `git ls-remote`). Getting the fix onto the default branch may
need an admin. **Never block on an admin action and never attempt one**; this route needs neither.

This is **strictly better than a hand-rolled bump**, not merely more convenient: the workflow runs
on Linux, so the lockfile resolves the way CI needs and the cross-platform trap in Step 3 never
arises. It opens a PR with the lockfile correct by construction. Skip to Step 5 and verify it.

Fall through to Step 3 only if the dispatch itself fails.

## Step 3 — Bump the consumer by hand (last resort)

**Never work in the user's main checkout of the consumer.** It may be shared with another agent or
running a dev server, and switching its branch or running `npm ci` there has broken it before. Use
a worktree:

```sh
git -C <consumer-checkout> worktree add <tmp-path> -b chore/bump-<pkg>-<version> origin/<consumer-branch>
```

Do **not** hardlink-copy `node_modules` into the worktree; hardlinks share inodes with the live
checkout and can corrupt it. Let `npm ci` build its own.

Edit the version range in `package.json`, then **graft the lockfile entry instead of re-resolving**:

> Running `npm install` on macOS can strip the `libc` constraints from Linux-only optional native
> deps (rollup, napi and similar) that Linux CI needs. Confirmed on several consecutive bumps:
> every one of them, every time. Re-resolving the whole lockfile on a Mac is never correct here.

```sh
npm install --package-lock-only --silent
# save the changed package's entry, `git checkout -- package-lock.json`, re-apply just that entry
```

Verify before trusting it:

```sh
git show HEAD:package-lock.json | grep -c '"libc"'   # must equal...
grep -c '"libc"' package-lock.json                    # ...this
git diff package-lock.json | grep -c '^[-+]'          # small: a handful of lines
npm ci                                                # the real proof the lockfile is valid
```

## Step 4 — Verify the installed build, not the version number

A version number says what npm resolved. Grep the actual bytes for the thing you shipped:

```sh
grep -o '<a class, token or string your change introduced>' node_modules/<package>/dist/*.js | head
```

If your change *removed* something, assert it is gone (count `0`). This is the step that catches a
stale cache, a bad publish, or a bump that resolved to the wrong version.

## Step 5 — Gates, evidence, PR

Run the **full** preflight. `typecheck` alone is not enough: a bump PR has been rejected
specifically for skipping `build`, and a dependency bump is the likeliest place a build breaks.

```sh
npm run preflight
```

**Evidence** (HYG-02). A bump that changes visible UI owes Before **and** After in light **and**
dark. A cross-repo link to the design-system PR is *not* evidence; that has been rejected
explicitly. If the affected surface is behind auth, render it from a temporary preview route
outside the protected path, capture, then delete the route and commit only the images.

Three traps, all hit for real:

- **Tokens may not be global in the consumer.** If design-system CSS is imported by one layout,
  a preview route outside it renders unstyled fallbacks unless it imports that file itself. Root
  providers may also need env vars; copy the gitignored env file into the worktree.
- **Drive the theme explicitly.** If the app stamps a theme class on `<html>`, a query-param
  wrapper won't undo it. One pass produced two dark images labelled light and dark.
- **Verify state before shooting.** Poll the rendered DOM until it reflects the expected state.
  A fixed `sleep` captured the *after* state twice because hot reload hadn't rebuilt. Hash-check
  that each Before/After pair differs.

Then `pre-push-review`, and open the PR into **the consuming branch** (verified, not assumed). Use
the repo's configured git identity; overriding `user.email` can make deploy previews fail to
verify the commit author.

## Step 6 — Babysit to green, then confirm landed

Poll until every check settles. When the review bot fails, read the findings and fix them. They
have been right essentially every time, including on rules it is tempting to argue past:

- **Evidence (HYG-02)**: a waiver argument is not a waiver. Capture the screenshots.
- **Generated files**: if CI regenerates manifests (`registry.json`, `llms.txt`), they must not be
  in your diff. Update the source record instead.
- **Figma links**: link the node as a URL, not a bare node id.

You may **not** merge. Hand back with the PR green and say plainly what remains. Once a human
merges, confirm the end state rather than assuming:

```sh
git -C <consumer-checkout> fetch origin <consumer-branch>
git show origin/<consumer-branch>:package.json | grep <package>
```

## Definition of done

- [ ] Changeset existed, or its absence was justified out loud
- [ ] New version confirmed **on the registry**, not just in the base branch's `package.json`
- [ ] Bump outcome established: a real dispatch run, or a diagnosed reason it fired into nothing
- [ ] Bump raised via automation or manual dispatch where possible; hand-rolled only if that failed
- [ ] If hand-rolled: in a worktree, main checkout untouched, `libc` count unchanged, `npm ci` clean
- [ ] The change verified **in `node_modules`**, not inferred from the version
- [ ] Consumer preflight green, including `build`
- [ ] Light + dark, Before + After evidence, state-verified and hash-checked
- [ ] PR green, targeting the verified consuming branch, handed back unmerged
- [ ] Landed state confirmed on the consuming branch after a human merges

## How this goes wrong

- **Stopping at "merged".** The most common failure. Merged is not published; published is not
  consumed.
- **Trusting a green "notify" step.** It reports the request was sent. The receiver can drop every
  dispatch for days.
- **Validating a workflow with a YAML parser.** It passes an invalid Actions expression happily.
  Use `actionlint`.
- **Re-resolving the lockfile on a Mac.** Strips the Linux `libc` constraints CI needs, which is
  why a Linux-run bump beats hand-rolling rather than merely saving effort.
- **Waiting on an admin.** Manual dispatch on a working ref needs none.
- **Working in the shared checkout.** Live dev server, maybe another agent. Use a worktree.
- **Arguing with the evidence rule.** Three attempts, three rejections. Capture the screenshots;
  it is faster.
