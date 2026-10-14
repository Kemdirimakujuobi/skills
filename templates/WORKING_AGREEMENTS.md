# Working agreements

> The discipline. Applies to **everyone, humans and AI agents alike.** Every rule here is a MUST,
> citable in review as `WA-§n`.

## Git and review

1. **Nobody pushes to the base branch. Ever.** All changes (code, docs, config) arrive via PR.
2. **Every PR gets a human review.** AI review can assist; it never substitutes.
3. **One concern per PR.** A token change, a component, a doc. If a PR can't be reviewed in about
   15 minutes, split it.
4. **PRs are green before review is requested.** `npm run preflight` passes locally (typecheck,
   lint on changed files, build, plus whatever else the repo adds). CI enforces the same checks.
5. **No force-pushes to shared branches.** Feature branches you own are fine.
6. **No stacked PRs.** Branch off the base, PR back into the base. A child PR merged after its
   parent merges lands in a branch that no longer exists, and GitHub still says "Merged".

## Tests

7. **Behaviour changes ship with tests.** A bug fix brings the test that would have caught it.
   Unit tests are a required check; integration tests drive the real app for user flows.
8. **Never delete, skip or loosen a test to get green.** If a test is wrong, fix it in a PR that
   says so.

## Source of truth

9. **The design file is the source of truth for tokens.** Names transfer 1:1. Drift gets fixed in
   the design file, not patched in code.
10. **Components consume semantic tokens only.** Never a raw hex, never a primitive ramp directly.
11. **Every non-trivial decision is a file** in `docs/decisions/YYYY-MM-DD-slug.md`: date, the
   call, why. Re-opening a decision means a new file that supersedes the old one.

## Evidence

12. **Any visible change shows before and after, in light and dark,** in the PR description. A
   reviewer should never have to check out a branch to see what moved.

## For AI agents specifically

13. Read this file, `AGENTS.md` and the latest entry in `RETRO.md` before acting.
14. **Agents may push branches and open draft PRs. Agents never merge, deploy, publish, or push to
   the base branch.** Propose; a human pulls the trigger.
15. **Approval does not carry across messages.** "Push this" authorizes that push, once. It is not
   standing permission for the category.
16. **Flag experiments out loud.** A workaround must never look like the process.
