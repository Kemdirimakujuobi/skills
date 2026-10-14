---
name: building-components
description: >-
  The workflow for building, rebuilding, or restyling any design-system component
  (Button, Dialog, Select, Table, Tabs, Tooltip, and so on). Trigger whenever the user
  says "let's do the dialog", "restyle X", "bring in / pull in a component", "build the
  select", "rebuild this atom", or starts work on an item from the component inventory,
  even if they don't name the workflow. The base is the FULL headless primitive (Radix,
  React Aria, Base UI: every part, all the bundled a11y); your semantic tokens are the
  only paint (no hex, no guesses); the doc contract is the finish line. Skipping the
  primitive-completeness step or the Figma token pass is the most common way this goes
  wrong: the component looks done and is quietly inaccessible or off-brand.
---

# Building components

Every component is the same three things stacked, in this order. Get the order wrong and you
get an inaccessible or off-brand component that looks done but isn't.

1. **A headless primitive library is the base.** Behaviour, ARIA, focus management, keyboard
   support, all bundled, all from the full primitive (Radix, React Aria, Base UI, whichever
   your repo uses). You never hand-roll accessibility.
2. **Your semantic tokens are the only paint.** Headless primitives ship unstyled on purpose.
   You style them with semantic CSS variables and nothing else: no hex, no palette utilities,
   no eyeballed pixel values. The values come from the design file, read exactly.
3. **The doc contract is the finish line.** A component isn't done when it renders. It's done
   when it has the agent- and human-first docs.

This skill is the procedure. The *rules* live in `docs/standards/STANDARDS.md` (CODE-, COMP-,
DOCS-); this skill tells you the order to apply them in and why each step matters. Radix is the
worked example throughout; the same steps apply to any headless library.

## Configure for your repo

The skill expects to find, and falls back as noted:

- **Primitive library**: read `package.json` for `@radix-ui/*`, `react-aria-components`,
  `@base-ui-components/*` or similar. If none, propose one and log it as a decision before
  building.
- **Exemplar**: your repo's best-built component (its source, stories and doc page). `AGENTS.md`
  should name it; if not, pick the one with the most complete docs and ask the user to confirm.
  Copy its shape: variant helper, class-merge utility, file layout.
- **Token output**: where generated semantic tokens live (see `design-tokens`).
- **Staging vs library**: if the repo has a lint-ignored staging folder for work in progress and
  a lint-enforced library folder, `AGENTS.md` says where. If not, build straight in the library.
- **Component inventory**: a doc listing which components are greenlit. If none, the user's
  request is the scope.
- **Docs surface**: Storybook (MDX + stories) by default; plus any machine-readable manifest
  (`registry.json`, `llms.txt`) the repo publishes.
- **Scripts**: `npm run lint`, the docs build (`build-storybook`), the docs a11y test runner, and
  any barrel/index generator. Read names from `package.json`; if a script is missing, say so
  rather than skipping the check.

## Before you touch anything

- **Is it in scope?** Only build what the inventory greenlit. No speculative atoms; if a screen
  doesn't need it yet, it waits.
- **You need the Figma node.** No node, no restyle. The point is to reproduce the decisions the
  designer made (radii, colour, spacing, type, shadow), and those live in the design file, not
  in your judgement.

## Step 1 — Start from the full primitive

Install the primitive (for Radix, `@radix-ui/react-<name>`) and scaffold the component from
**every part it exports**: `Root`, `Trigger`, `Portal`, `Overlay`, `Content`, `Title`,
`Description`, `Close`, `Item`, `Viewport`, whatever the primitive defines.

Why every part, including the ones that look optional: the bundled accessibility only works when
the parts are present. Drop `Dialog.Title`/`Description` and the dialog is unlabelled to a screen
reader. Drop `Portal`/`Overlay` and the focus trap and stacking break. **Dropping parts to
"simplify" is the single most common failure.** It produces a component that looks right and is
quietly inaccessible.

If an older copy of the component exists elsewhere (a product app, a previous library), it is a
**reference, not the base.** Read it to see which parts were used and what the prop API looked
like, then build from the primitive fresh. Do not restyle its theme classes in place; they get
stripped entirely in Step 3.

Engine isolation (COMP-04): the primitive is imported only inside the component file, and **no
engine type appears in the exported props.** Consumers import your component, never the engine.

## Step 2 — The Figma pass (this is how "no guesses" becomes real)

Run `figma-import` on the component's node. Do not eyeball it. What you need out of it:

- **The exact variable bound to each property.** Figma tells you fill =
  `--actions-buttons-primary-default`, radius = `--radius-full`, gap = `--spacing-2`. You map that
  token 1:1 to your CSS variable. That mapping is the design; you are transcribing, not deciding.
- **A screenshot per state**: the visual truth to compare your build against.
- **Structure and layout**: the part anatomy.

Record what you read: every styled property to its token. That list becomes the token-bindings
table in the docs (Step 5) and the thing a reviewer diffs against Figma.

**If Figma binds a token you haven't generated: stop.** That's a token-pipeline gap. Add or fix it
in the design file and let it flow through the pipeline (`design-tokens`). **Never invent the
value in code.** A hardcoded value is a lie that drifts and breaks in the other theme.

**Map tokens by resolved value, not by layer name.** A bound variable can resolve to the wrong
thing: a `dividers/*` variable may be your `--border-*` family; a "primary hover" token may resolve
to near-black in light when the design wanted a subtle tint. Check the resolved value, and reuse
the sibling control's token when they should match.

## Step 3 — Paint with tokens

Rebuild the styling on semantic tokens only, following the exemplar's pattern (for example `cva`
for variants plus a `cn()` class merge):

- **Semantic variables only** (CODE-03): `bg-[var(--surfaces-…)]`, `text-[var(--text-…)]`,
  `rounded-[var(--radius-…)]`. No hex, no `bg-emerald-500`, no `p-[13px]`. Allowed escapes:
  `transparent`, `currentColor`, `inherit`.
- **Every state, bound to its token** (COMP-02): rest, hover, focus-visible (a tokenised ring,
  COMP-03), active, disabled, and loading where the design has it.
- **Both themes, every time** (COMP-06): verify light *and* dark. Tokens flip in dark, and that is
  exactly where bugs hide. A black-on-black switch thumb has shipped this way before.
- **API conventions** (COMP-04, COMP-05): exported `<Name>Props`; `className` merged last; a
  `data-slot` on each rendered part; `asChild` via Slot where composition is expected; default
  `type="button"` on native buttons; named exports.

## Step 4 — Motion, only if the design calls for it

Animation is **additive**. It never replaces the primitive's behaviour or a11y, and the component
must be fully usable with motion removed. When you add it:

- Honour `prefers-reduced-motion`; animate `transform`/`opacity` only; never `transition-all`.
- A new runtime dependency means a decision record in `docs/decisions/` in the same PR (HYG-04).

## Step 5 — The doc contract (the actual finish line)

Modelled on the exemplar (DOCS-01). Written so a person *and* an agent can both consume the
component correctly:

- **Doc page** (MDX): when to use and when NOT (link the alternative); variants, sizes and states
  canvases; props; do/don't; an **accessibility split**: *what the primitive guarantees*
  (keyboard, roles, focus) vs *what you must still wire* (an accessible name on icon-only
  triggers, `aria-label`s); and the **token-bindings table** from Step 2.
- **Machine-readable entry** (`registry.json` or equivalent): props, variants, tokens, a11y,
  examples. Skip only if the repo publishes none.
- **Agent TL;DR** (`llms.txt` or equivalent): import path, when to use, tokens.
- **Stories**: one per variant/state cluster, rendered in both themes.

Name the component's **WAI-ARIA APG pattern** in the doc and reproduce its keyboard table. That's
the spec your keyboard support is verified against.

## Step 6 — Verify (don't trust, check)

- Lint: 0 errors.
- Docs build succeeds.
- Run the docs locally, check **both themes**, keyboard-test against the APG pattern, and run the
  a11y test runner (axe on every story). Never mark a new story's a11y test as "todo" to get green.
- **Compare against the Figma screenshot**, state by state. For a 1:1 bar, run `figma-build`'s
  measured round-trip on top of this.

## Step 7 — Graduate and ship

- If you built in staging, move the file into the library folder, where it is lint-enforced.
- Regenerate any barrel/index file so the new export is picked up; CI should fail otherwise.
- **One component per PR** (HYG-03). The PR links the **Figma node** and embeds **light + dark
  screenshots** (HYG-02). Update the inventory.
- Then `pre-push-review`, and after merge, `landing-a-design-system-change`.

## Pre-PR gate checklist (build these in from day 0)

These are the review-bot findings one component family hit repeatedly: the same dozen rules, two
or three review rounds each. They're mechanical. Do them while building, not after the bot tells
you, and a PR converges in about one round instead of three. Self-check before pushing (`grep`
for `outline-none`, `text-left`, missing `type="button"`):

- [ ] **Public API is engine-free.** No exported `<Name>Props` references a primitive-library
  type. Extend the native element's props (`React.ComponentProps<"button">`) and spread `...rest`
  onto the trigger. Compound parts get explicit, engine-free prop types too.
- [ ] **`type="button"`** on every trigger that renders a `<button>`. Some primitive triggers
  default to `submit`.
- [ ] **Visible focus on every interactive element** (COMP-03). Any `outline-none` has a
  focus-visible replacement. Don't forget secondary controls: filter inputs, chip remove buttons,
  steppers, scroll buttons.
- [ ] **State via `data-*` attributes**, not conditional class strings.
- [ ] **Reduced-motion guard** on every transition and animation.
- [ ] **Logical properties**: `text-start`, `ms-`/`me-`; never physical left/right.
- [ ] **ARIA role required props**: `role="combobox"` needs `aria-expanded` + `aria-controls`;
  decorative icons `aria-hidden`; icon-only buttons get `aria-label`.
- [ ] **Clickable Figma URL in three places**: component doc comment, doc page, and PR body. A
  bare node id is not a link.
- [ ] **Light + dark screenshots embedded in the PR body** (HYG-02). Committing them to the repo
  is not enough; link them where the reviewer reads.
- [ ] **New dependency means a decision record in the same PR** (HYG-04), even if a base PR has
  one.
- [ ] **Composite trigger validity**: a trigger holding its own interactive children (chips with
  remove buttons) can't be a `<button>`; use a focusable `role="combobox"` element.
- [ ] **Tokens mapped by resolved value**, not layer name.
- [ ] **Land to the base branch before starting the next component** (HYG-07). Stacks trigger
  combined re-reviews and rebase churn.

## Definition of done

- [ ] Built from the full headless primitive; every semantic part kept; a11y comes from the
  primitive, not hand-rolled
- [ ] Engine isolated: no primitive-library type in the public props
- [ ] Styled with semantic tokens only; every property traced to a Figma binding
- [ ] All states covered, verified in light **and** dark
- [ ] Motion (if any) is additive and respects reduced motion
- [ ] Doc contract complete: doc page (with a11y split + token table), manifest entry, agent TL;DR
- [ ] Stories per state, both themes; a11y runner green with no new baseline entry; keyboard matches
  the named APG pattern
- [ ] In the library folder; one-component PR with Figma node + light/dark screenshots

## How this goes wrong

- **Partial primitive**: silently inaccessible. The "every part" rule exists because of this.
- **Guessed values or hardcoded hex**: drift from Figma, breaks in dark mode, fails CODE-03.
- **Restyling an old copy in place**: you inherit its theme and its decisions instead of
  reproducing the design on your tokens.
- **Skipping the dark-mode check**: token flips bite later, in a screenshot or a user's face.
- **Calling it done at "it renders"**: no docs means no contract; the agent and the next human
  can't use it correctly.
