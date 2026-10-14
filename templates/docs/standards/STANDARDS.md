# Standards: the review rubric

> The rules every PR is reviewed against, by the review bot, by `pre-push-review`, and by humans.
> One rulebook, three readers. Trim the rules you don't need; keep the mechanics.

## How this file works

**Severity.** MUST and SHOULD as in RFC 2119, defined by review behaviour:

- **MUST**: a violation is a **BLOCKER**. The bot's verdict is FAIL and the PR cannot merge until
  it is fixed, suppressed with a reason, or waived.
- **SHOULD**: a violation is a **WARN**. The author fixes it or replies why not. Never blocks alone.
- Anything not covered by a numbered rule: the bot stays silent. **No rule ID, no comment.**

**Inheritance.** Every rule in `WORKING_AGREEMENTS.md` is a MUST, citable as `WA-§n`. This file only
adds rules, or sharpens a working agreement into something mechanically checkable.

**Enforced-by tiers.** Every rule says who can actually check it:

| Tier | Meaning |
|---|---|
| `lint` / `CI` | A deterministic check. Prefer this wherever a rule can be expressed as one. |
| `bot` | Judgeable from the diff. The review bot enforces it fully. |
| `evidence` | The bot checks the evidence exists (screenshot, link, decision file). A human judges it. |
| `human` | Reviewer only. The bot may remind, never block. |

**Scope.** Rules bind the lines a PR changes. Pre-existing violations elsewhere get one WARN note in
the summary at most, never inline, never blocking.

**Rule IDs are immutable.** Never renumbered, never reused. A retired rule stays as a tombstone.

**Suppression.** A justified one-off: `std-ignore <RULE-ID>: <reason>` in an adjacent comment. A
suppression without a reason is itself a violation.

**Waiver.** When a rule is right in general but wrong for one finding, the non-author reviewer
replies `WAIVED: <reason>` on the finding and adds a file in `docs/decisions/`. Never quietly
un-require a check.

**Amendment.** Changing this file is a PR plus a decision file. Fix the standard, don't fight the
bot: when the bot is right but the rule has a gap, refine the rule.

**New checks ship with a ratchet, not a cliff.** Record existing violations in a baseline file. A
listed violation passes, a new one fails, a fixed one is pruned. A gate that can never pass is worse
than no gate.

## Code

| ID | Severity | Enforced | Rule |
|---|---|---|---|
| CODE-01 | MUST | lint | Strict TypeScript. No `any`, no `as any`, no double casts. `!` needs a justification comment. |
| CODE-02 | MUST | lint | No `@ts-ignore`. `@ts-expect-error` only with a same-line reason. |
| CODE-03 | MUST | lint + bot | Colour only through semantic tokens (`var(--text-*)`, `--border-*`, `--surface-*`…). No hex/rgb/hsl literals, no palette utilities (`bg-blue-500`), no arbitrary pixel values where a token exists. Allowed: `transparent`, `currentColor`, `inherit`. |
| CODE-04 | MUST | lint + bot | Engine isolation: the headless primitive library is imported only inside its component file, and no exported type references it. |
| CODE-05 | MUST | bot | A new runtime dependency comes with a decision file in the same PR. |
| CODE-06 | MUST | bot | No commented-out code, no unreachable branches. |
| CODE-07 | SHOULD | bot | Variants through the variant API (e.g. `cva`), never conditional class-string concatenation. `className` merged once, last. |

## Components

| ID | Severity | Enforced | Rule |
|---|---|---|---|
| COMP-01 | MUST | evidence + human | The PR links the component's design node, and the code's variants, sizes and states use the same names as the design. |
| COMP-02 | MUST | bot | Interaction states are complete: `hover`, `focus-visible` (tokenised ring), `active`, `disabled`, and loading where the design has it. |
| COMP-03 | MUST | bot + CI (axe) | Accessibility: keyboard behaviour per the component's WAI-ARIA pattern, every primitive part present (title, description, portal, overlay…), accessible names on icon-only controls. |
| COMP-04 | MUST | bot | Props contract: exported `<Name>Props`, `className` passthrough, `data-slot` on rendered parts, `asChild` where composition is expected, ref as a prop. |
| COMP-05 | MUST | lint | Native `<button>` defaults to `type="button"`. |
| COMP-06 | MUST | bot | Every variant and size appears in a story, and stories render in light and dark. |
| COMP-07 | SHOULD | bot | No outer margins in component classes. Layout belongs to the parent. |
| COMP-08 | SHOULD | bot | `prefers-reduced-motion` honoured. Animate `transform` and `opacity` only. |

## Docs

| ID | Severity | Enforced | Rule |
|---|---|---|---|
| DOCS-01 | MUST | evidence + CI | The component doc contract: when to use, **when not to use (linking the alternative)**, variants and states, do/don't, accessibility, token bindings, and a machine-readable entry (`registry.json`, `llms.txt`) an agent can read without opening source. |
| DOCS-02 | MUST | bot | Docs the PR makes stale are updated in the same PR. |

## Tests

| ID | Severity | Enforced | Rule |
|---|---|---|---|
| TEST-01 | MUST | evidence | A bug fix adds the test that would have caught it, or the PR body says why no test fits. |
| TEST-02 | MUST | bot | A test's expected value comes from an independent oracle (a fixture, real-world input, or a stated derivation), never a value captured from the code under test. |
| TEST-03 | MUST | CI | Unit tests run on every PR as a required check. |
| TEST-04 | SHOULD | evidence | A change to a user flow extends or adds an integration test that drives the rendered app. The suite skips with a reason when its environment is missing; it never fails for setup. |
| TEST-05 | SHOULD | bot | A convention you want kept (a value that must match in two places, a rule over every table or seed) is enforced by a test that fails without it, not only by a doc. |
| TEST-06 | MUST | bot | No test is deleted, skipped or loosened to get a PR green without a decision file. |
| TEST-07 | MUST | evidence | The PR body carries a `Tests:` line: what was tested at which layer, or `none — <reason>`. |

## Hygiene

| ID | Severity | Enforced | Rule |
|---|---|---|---|
| HYG-01 | MUST | CI | Size circuit breaker: more than about 25 files or 1,500 changed lines fails with "split this PR". Generated files and lockfiles are excluded. No partial reviews. |
| HYG-02 | MUST | evidence | Any visible change carries screenshots in light and dark: before and after for changed UI, after for new UI. |
| HYG-03 | MUST | bot | One concern per PR. |
| HYG-04 | MUST | bot | Gate changes (anything under `.github/**` or `docs/standards/**`) are declared in the PR and reviewed line by line by someone other than the author. |
| HYG-05 | MUST | bot + CI | No secrets in source and no committed `.env*` or build output. |
| HYG-06 | MUST | bot | Branch `<area>/<slug>` and PR title `<area>: <summary>`. No personal names, no numbers, no random words. |
| HYG-07 | MUST | bot | No stacked PRs. Every PR targets the base branch. |
