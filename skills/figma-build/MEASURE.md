# Measuring the diff

Referenced by [SKILL.md](./SKILL.md) step 3. "Looks right" is not a measurement. Every value
below is read numerically from the rendered DOM and compared against the Figma token.

## Read every box in one pass

Run this in the page (browser devtools console, Playwright `page.evaluate`, or your agent's
JS-execution tool) against the root of the component:

```js
const report = (sel) =>
  [...document.querySelectorAll(sel)].map((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      el: el.tagName.toLowerCase() + (el.className ? '.' + [...el.classList].join('.') : ''),
      box: { w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
      pad: s.padding,
      gap: s.gap,
      color: s.color,
      bg: s.backgroundColor,
      border: `${s.borderWidth} ${s.borderStyle} ${s.borderColor}`,
      radius: s.borderRadius,
      shadow: s.boxShadow,
      font: `${s.fontSize}/${s.lineHeight} ${s.fontWeight} ${s.letterSpacing} ${s.fontFamily.split(',')[0]}`,
    };
  });

copy(JSON.stringify(report('[data-measure] *'), null, 2)); // or return it
```

Diff that JSON against the token-binding table from `figma-import`, field by field.

## The values that actually catch bugs

| Property | Read it as | Common failure |
|---|---|---|
| Gap | `getComputedStyle(el).gap` | Margin on children faking a gap — the number matches, the wrapping doesn't |
| Padding | `s.padding` (all four) | Figma's shorthand hides an asymmetric inset |
| Height | `getBoundingClientRect().height` | Line-height, not padding, is setting row height |
| Colour | `s.color` / `s.backgroundColor` as `rgb()` | Compare resolved rgb, not the token name |
| Border | `s.borderWidth` + `borderColor` | Figma's 1px inside-stroke ≠ CSS 1px border on box-sizing: content-box |
| Radius | `s.borderRadius` | A single corner overridden in Figma |
| Shadow | `s.boxShadow` | Figma layer blur ≠ CSS blur radius; they differ by ~2× |
| Type | `fontSize` / `lineHeight` / `letterSpacing` | `letterSpacing: normal` where Figma has -0.01em |

`getBoundingClientRect()` returns fractional pixels. A width of `199.98` against Figma's `200`
is a real defect — usually a `border` inside a `width`, or a flex child that can't reach its
basis.

## Both themes, numerically

Never assume the dark values inherit. Force each theme and re-read:

```js
document.documentElement.setAttribute('data-theme', 'dark'); // or .classList.add('dark')
// re-run report() and diff against the dark column of the token table
```

Compare against the token's **dark** resolved value from `figma-import`, not against the light
one. The flips are where 1:1 silently breaks.

## Driving states

Hover, focus, and active can't be read from a static render. Playwright is the reliable capture —
it drives real states and writes PNGs to a path:

```js
await page.setViewportSize({ width: 1440, height: 900 }); // match the Figma frame
await page.locator('[data-measure]').hover();
await page.screenshot({ path: 'out/hover.png' });

await page.locator('button').first().focus();             // focus-visible
await page.screenshot({ path: 'out/focus.png' });
```

For `:disabled` and `:selected`, render the component in that prop state rather than simulating it.

## Overlay check

Per-element measuring misses a whole-block offset. Export the Figma frame at 1×, drop your
screenshot over it at 50% opacity at the same pixel dimensions, and look for doubling at the
edges. Anything that doubles is a position defect — go back and find which container's padding
or gap is responsible.
