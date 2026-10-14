---
name: testing-a-change
description: >-
  Run this while building any change that adds or alters behaviour, and again as a step of
  `pre-push-review` — whenever the user says "add tests", "is this tested?", "write a test for
  this", "run the tests", "run the integration tests", "e2e", "why is CI red on test", or fixes a
  bug, adds a calculation, a data mapping, a flow, or a rule you want to stay true. It picks the
  right layer (unit, integration, component accessibility), writes tests whose expected values come
  from an independent source rather than from the code under test, runs unit and integration
  suites locally before the push, and records what was tested in the PR body. A test that copies
  its answer from the code locks the bug in as "expected". Do not skip to `git push`.
---

# Testing a change

A green typecheck and a clean build say the code compiles. They say nothing about whether a number
is right, a flow completes, or a button is reachable by keyboard. Tests are the only gate that
checks behaviour, and they are the only kind of rule that keeps itself true: **a convention you
want kept needs a test that fails without it.** A rule that lives only in a spec or a doc is
invisible to the next agent.

This skill is the procedure. The rules live in `docs/standards/STANDARDS.md` (TEST-*).

## Configure for your repo

- **`AGENTS.md`**: the test commands. Expected keys, with the defaults used when missing:
  - Unit: `npm test` or `npm run test:unit`. Fast, no network, no browser.
  - Integration: `npm run test:integration` or `npm run test:e2e`. Drives the real rendered app.
  - Component accessibility: `npm run test:storybook` (or your docs tool's test runner).
  Read the real names from `package.json`. If a layer has no script, say so in the PR body; do not
  invent a harness in a feature PR.
- **Where tests live**: next to the code (`*.test.ts` beside the helper) or in `tests/unit/` and
  `tests/integration/`. Follow what the repo already does.
- **CI**: which test jobs are required checks and which are informational. Unit tests are usually
  required; integration tests against a live preview are often informational until they are stable.

## Step 1 — Pick the layer

| The change | Test it with |
|---|---|
| A pure function: a calculation, formatter, mapping, parser, classifier, date window | **Unit** test beside it |
| A value that must agree in two places (a card and its detail view, a list and its export) | **Unit** parity test that renders both from the same input and compares |
| A rule about the whole system (every table is in the deletion plan, every seed passes the engine, every exported prop is documented) | **Unit** invariant test that walks the system and fails on the first violation |
| A user flow: a step hides a row, an error page replaces the step, a disabled button is actually disabled, a layout sticks on scroll | **Integration** test that drives the real rendered app in a browser |
| A component's states, keyboard behaviour and accessible names | **Component** stories plus the accessibility runner (axe) on every story |
| A bug fix | The test at whichever layer would have caught it, written **first**, seen failing, then fixed |

Most changes need one or two of these, not all. A copy change or a token value needs none: say so.

## Step 2 — Get the expected value from somewhere else

The most expensive test is the one that passes on a bug. It happens when the expected value is
copied from the code's own output: the test then asserts that the code does what it does.

- **Use an independent oracle.** A fixture read at test time, a value worked out by hand and
  stated next to the assertion (`// 3 closed of 12 booked = 25%`), or real-world input.
- **Write fixtures from the wild, not from the implementation.** A form classifier that "looked
  right" passed by inspection. Tests built from markup that page builders actually emit found two
  real bugs at once: `first-?name` didn't match `first_name`, and a bare `name` rule ordered before
  `company` classified "Company name" as a person's name. Both would have shipped as "it fills
  forms wrong sometimes", the hardest kind of bug to trace.
- **Snapshots are not oracles.** A snapshot records whatever the code produced the first time.
  Use one only for output whose correctness a human has reviewed in that same PR.
- **Test the degenerate cases the data will actually produce**: zero, one item, missing source,
  empty range, a single-source chart, a divisor of zero. A ratio that can exceed 100% will.

## Step 3 — Write integration tests that tell the truth

Integration tests drive the real app through a browser (Playwright or similar). They catch what
unit tests can only assert in the abstract.

- **Assert behaviour, not pixels.** "The row is hidden", "the button is disabled", "the failure
  page replaced the step". Leave pixel fidelity to `figma-build`.
- **Skip honestly when the environment can't run them.** Probe the base URL and the browser binary
  in a `before` hook. If either is missing, skip every test with the reason (`dev server not
  reachable at …`, `run npx playwright install chromium`) instead of failing. A suite that fails
  for setup reasons trains everyone to ignore it.
- **Run files one at a time when each starts its own server.** Parallel files race for ports and
  starve each other. Set the runner's file parallelism off for the integration project and give
  hooks a generous timeout.
- **Point CI at the PR's own preview.** Resolve the preview URL for the head commit from the
  deployment statuses, and test that. A shared staging alias may be serving someone else's commit.
- **Don't assert on what the test environment can't reach** (third-party CDNs, logo images, paid
  APIs). Note it in the file header.

## Step 4 — Accessibility runs on every story

For UI components, the accessibility runner renders every story in a real browser with axe at
`error`. Never mark a new story's accessibility test as "todo" to get green. Existing violations
live in a baseline file: a listed violation passes, a new one fails, a fixed one is pruned. The
baseline only shrinks.

## Step 5 — Run them before the push

```sh
npm test                    # or test:unit — always
npm run test:integration    # or test:e2e — when the change touches a flow; needs the dev server
npm run test:storybook      # when the change touches a component
```

- Run integration tests against a **fresh** dev server on the current branch. A production build
  run while the dev server is live overwrites its output and serves errors from another branch.
- **A red test you didn't cause is still red.** Check it fails on the base branch too
  (`git stash` is unsafe when worktrees share a clone; check the base out in a second worktree).
  If it does, say so in the PR body with the failing test name. Never delete, skip or loosen a test
  to get green without a decision file.
- If a suite can't run in your environment, say exactly which and why. Never imply it passed.

## Step 6 — Record it in the PR body

One line per layer:

```
Tests: unit — added surface-parity case for the empty range; integration — onboarding connect
flow passes locally against the dev server; storybook — n/a (no component change).
```

or `Tests: none — <reason>` (copy change, token value, docs). The reviewer and the review bot read
this line; a missing one is a finding.

## Definition of done

- [ ] Each behaviour change has a test at the right layer, or a stated reason it doesn't
- [ ] Every expected value comes from a fixture, real-world input, or a stated derivation
- [ ] A bug fix's test was seen failing before the fix
- [ ] Unit tests pass; integration and component tests pass where the change touches them
- [ ] Nothing skipped, deleted or loosened to get green without a decision file
- [ ] A `Tests:` line is in the PR body

## How this goes wrong

- **The test copies its answer from the code.** It passes, forever, on the bug.
- **The convention lives in a doc.** Nothing fires when it's broken. Put it in an invariant test.
- **Two render paths, one tested.** A rule enforced in one of two code paths isn't enforced. Test
  the path users actually see, or collapse to one path.
- **The integration suite fails on setup.** People stop reading it. Skip with a reason instead.
- **"It's flaky, I'll re-run it."** Find out why once; record it in `RETRO.md` if it's the
  environment.
