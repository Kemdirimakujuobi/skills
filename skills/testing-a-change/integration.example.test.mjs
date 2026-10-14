/**
 * Example integration test (node:test + Playwright). Copy it to tests/integration/ and adapt.
 *
 * It drives the REAL rendered app and asserts behaviour (a row is hidden, a button is disabled,
 * an error page replaced the step), not pixels. Locally it needs `npm run dev`; in CI, set
 * E2E_BASE_URL to this commit's preview deployment.
 *
 * When the environment can't run it (no server, no browser binary), every test SKIPS with the
 * reason instead of failing. A suite that fails for setup reasons trains people to ignore it.
 */
import assert from "node:assert/strict"
import test, { after, before } from "node:test"
import { chromium } from "playwright"

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const PAGE = `${BASE}/settings` // the surface under test

let browser
let unavailable = null

before(async () => {
  const probe = await fetch(PAGE).catch(() => null)
  if (!probe || !probe.ok) {
    unavailable = `app not reachable at ${BASE}, run \`npm run dev\` first`
    return
  }
  try {
    browser = await chromium.launch()
  } catch (error) {
    unavailable = `chromium not installed, run \`npx playwright install chromium\` (${
      error instanceof Error ? error.message.split("\n")[0] : error
    })`
  }
})

after(async () => {
  await browser?.close()
})

test("Save stays disabled until a field changes", async (t) => {
  if (unavailable) return t.skip(unavailable)
  const page = await browser.newPage()
  await page.goto(PAGE)

  const save = page.getByRole("button", { name: "Save" })
  assert.equal(await save.isDisabled(), true, "Save should start disabled")

  await page.getByLabel("Display name").fill("Ada")
  assert.equal(await save.isDisabled(), false, "Save should enable after an edit")

  await page.close()
})
