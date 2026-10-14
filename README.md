# Skills

[![skills.sh](https://skills.sh/b/Kemdirimakujuobi/skills)](https://skills.sh/Kemdirimakujuobi/skills)

Agent skills for designers who ship production code. They are the guardrails I use to ship with
Claude Code as a founding designer: build a Figma design exactly, keep the design system honest,
and get every change from idea to merged without an agent ever pulling a trigger a human should.

Agents write code quickly. What makes that code mergeable is structure: a fixed order of
operations, a written rulebook, and checks that don't trust the agent or the author. These skills
are that structure, with the company-specific parts removed.

## Install

```bash
npx skills@latest add Kemdirimakujuobi/skills
```

Then copy what you need from [`templates/`](./templates) into your repo and fill in the
configuration table in `AGENTS.md`. The skills read your base branch, preflight script, changelog
and docs locations from there, and fall back to sensible defaults when something is missing.

## The rules underneath

- **Agents may push branches and open draft PRs. Agents never merge, deploy, or push to the base
  branch.** A human pulls the trigger. Approval in one message does not carry to the next.
- **One rulebook, three readers.** `STANDARDS.md` is read by the pre-push skill, the review bot and
  the human reviewer. Every rule has an ID, so every finding cites one. No rule ID, no comment.
- **The model finds problems; a deterministic check decides whether they block.** Fail closed.
- **The design file is the source of truth.** No agent is ever in the token value path.
- **Every mistake becomes a rule.** `RETRO.md` → a skill step → a STANDARDS rule → a CI check.
  `starting-a-change` reads the latest retro before every branch, so a lesson reaches every
  session after it.

## The life of a change

```
idea
 └─ authoring-a-prd
     └─ starting-a-change
         ├─ figma-import
         ├─ building-components / design-tokens
         ├─ figma-build
         └─ testing-a-change
             └─ pre-push-review          runs preflight + unit + integration tests
                 ├─ updating-the-changelog
                 ├─ announcing-a-feature
                 ├─ docs-sync-review
                 └─ mobile-responsive-review
                     └─ PR → CI (typecheck, lint, test, integration) + review bot → a human merges
                         └─ landing-a-design-system-change
```

## Reference

**Workflow**

- **[authoring-a-prd](./skills/authoring-a-prd/SKILL.md)**: turns a brief into a PRD with user
  stories, fields, analytics events and numbered acceptance criteria. Every product claim traces
  to a source; anything unconfirmed becomes an open question. Seeding an issue tracker needs
  explicit confirmation. Ships with [TEMPLATE.md](./skills/authoring-a-prd/TEMPLATE.md).
- **[starting-a-change](./skills/starting-a-change/SKILL.md)**: runs before any branch exists.
  Names it `<area>/<slug>`, cuts it from a fresh base, refuses to stack, and carries the latest
  retro's traps into the plan.
- **[testing-a-change](./skills/testing-a-change/SKILL.md)**: picks the right layer for each
  behaviour change (unit, parity, invariant, integration, component accessibility), takes expected
  values from an independent source rather than the code under test, and runs unit and integration
  suites before the push. Integration suites skip with a reason when their environment is missing,
  never fail for setup. Ships with an example Playwright test.
- **[pre-push-review](./skills/pre-push-review/SKILL.md)**: runs before every push. Greps the diff
  against the rulebook, runs two review passes, the local gates and the test suites, checks size
  and evidence, then calls the four sub-reviews below where they apply.
- **[updating-the-changelog](./skills/updating-the-changelog/SKILL.md)**: every PR adds a
  customer-facing changelog entry or records `Changelog: none — <reason>`.
- **[announcing-a-feature](./skills/announcing-a-feature/SKILL.md)**: decides, rarely, whether a
  change earns an in-app "what's new" modal, writes it with a real graphic, prunes entries past
  the retention window, or records `Feature modal: none — <reason>`.
- **[docs-sync-review](./skills/docs-sync-review/SKILL.md)**: maps the diff to the help pages it
  makes wrong and drafts the fix in the same PR.
- **[mobile-responsive-review](./skills/mobile-responsive-review/SKILL.md)**: scans added markup
  for what breaks at 360–430px and drafts `max-md:` fixes that leave desktop unchanged. Ships with
  a scanner script.

**Design system**

- **[building-components](./skills/building-components/SKILL.md)**: a headless primitive with
  every part is the base, your semantic tokens are the only paint, and the doc contract is the
  finish line.
- **[design-tokens](./skills/design-tokens/SKILL.md)**: tokens travel from the design file through
  a Git sync and a deterministic CI transform. Agents explain and review token diffs; they never
  produce a value.
- **[landing-a-design-system-change](./skills/landing-a-design-system-change/SKILL.md)**: a merge
  is not delivery. Checks the release was declared, the package published, the product bumped,
  and the installed build actually contains the change.

**Figma fidelity**

- **[figma-import](./skills/figma-import/SKILL.md)**: enforces the extraction order. Full node
  first, then spacing, colour, type, radii and every state. The screenshot comes last, only to
  verify against.
- **[figma-build](./skills/figma-build/SKILL.md)**: the 1:1 round-trip. Build, render, measure,
  diff, fix, repeat until the measured difference is zero in every state and both themes. Ships
  with [MEASURE.md](./skills/figma-build/MEASURE.md).

## Skills I pair with

Other people's skills I use alongside these, installed from their own repos so they stay current.
Usage is from my own Claude Code and Codex history.

| Skill | From | What I use it for |
|---|---|---|
| `emil-design-eng` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | The taste layer: UI polish, component design and the invisible details that make an interface feel right where the design file is silent. |
| `apple-design` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Fluid, physical motion for the web: gestures, springs, sheets, interruptible transitions. |
| `animate`, `animation-vocabulary` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Building an animation in the right order (should it animate at all, then purpose, curve, duration, exit), and finding the exact name for a motion I can only describe. |
| `find-animation-opportunities`, `improve-animations`, `review-animations` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Read-only motion passes: where motion would help, a prioritised audit of existing motion, and a strict review where approval is earned. |
| `baseline-ui`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance` | [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | A baseline against generic AI-generated UI, plus focused fix passes. |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | A review against Vercel's web interface guidelines. |
| `agentation` | [benjitaylor/agentation](https://github.com/benjitaylor/agentation) | Pointing at the exact element in the running app when giving an agent visual feedback. |
| `brainstorming`, `systematic-debugging` | [obra/superpowers](https://github.com/obra/superpowers) | Thinking a feature through before building, and debugging by hypothesis instead of guessing. |

```bash
npx skills@latest add emilkowalski/skills
npx skills@latest add ibelick/ui-skills
npx skills@latest add vercel-labs/agent-skills
npx skills@latest add benjitaylor/agentation
```

Superpowers installs as a Claude Code plugin; see its README.

The motion and taste skills sit alongside `building-components` and `figma-build`. The Figma skills
make a build exact; Emil's make it feel right where the design file is silent, and motion is rarely
fully specified in Figma.

## Templates

| File | What it is |
|---|---|
| [`AGENTS.md`](./templates/AGENTS.md) | Agent onboarding plus the configuration table the skills read. |
| [`WORKING_AGREEMENTS.md`](./templates/WORKING_AGREEMENTS.md) | The discipline, for people and agents alike. |
| [`docs/standards/STANDARDS.md`](./templates/docs/standards/STANDARDS.md) | The numbered review rubric, with severity, enforcement tiers, suppressions, waivers and ratchets. |
| [`RETRO.md`](./templates/RETRO.md) | The memory `starting-a-change` reads before every branch. |
| [`docs/decisions/_template.md`](./templates/docs/decisions/_template.md) | One decision per file. |
| [`.github/workflows/ci.yml`](./templates/.github/workflows/ci.yml) | Typecheck, lint on changed files and unit tests as required checks, plus integration tests against this PR's own preview deployment (informational). |
| [`.github/workflows/bug-bot.yml`](./templates/.github/workflows/bug-bot.yml) + [`bug-bot-prompt.md`](./templates/.github/bug-bot-prompt.md) | A two-job Claude review gate: the model posts findings, a shell step computes the verdict, the rubric is read from the base branch, and it fails closed. |

The story of how this setup grew, and what each piece has prevented, is in the release note on my
portfolio: *Shipping with guardrails*.

## License

MIT
