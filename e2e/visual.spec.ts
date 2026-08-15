import { expect, test } from "@playwright/test";
import { tracks } from "../src/content";

const corePaths = [
  "/",
  "/learn",
  "/lab",
  "/heat",
  "/problems",
  "/pricing",
  "/sandbox",
  "/search",
  "/progress",
  "/cheatsheets",
  "/blog",
  "/diagnostic",
  "/login",
];

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

const overflowRelaxedPaths = ["/heat", "/sandbox"];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 2,
  );
  expect(overflow, "page should not scroll horizontally").toBe(false);
}

test.describe("Visual layout — core pages", () => {
  for (const viewport of viewports) {
    for (const path of corePaths) {
      test(`${path} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(path);
        expect(response?.ok()).toBeTruthy();
        await page.waitForTimeout(1200);
        if (!overflowRelaxedPaths.includes(path)) {
          await assertNoHorizontalOverflow(page);
        }
        await expect(page.locator("body")).not.toBeEmpty();
        await page.screenshot({
          path: `test-results/visual/${viewport.name}${path.replace(/\//g, "_") || "_home"}.png`,
          fullPage: true,
        });
      });
    }
  }
});

test.describe("Visual layout — curriculum", () => {
  test("learn sidebar does not duplicate track orbit map", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/learn");
    await page.waitForTimeout(1200);
    await expect(page.getByRole("heading", { name: /Eight tracks, one path/i })).toHaveCount(0);
    await expect(page.getByLabel("Jump to track")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("learn track pills are readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/learn");
    await page.waitForTimeout(1200);
    const heatLink = page.getByLabel("Jump to track").getByRole("link", { name: /^HEAT/ });
    await expect(heatLink).toBeVisible();
    const box = await heatLink.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(40);
    expect(box?.width ?? 0).toBeLessThan(120);
    await assertNoHorizontalOverflow(page);
  });
});

test.describe("Visual layout — HEAT canvas", () => {
  test("etch canvas is interactive before constraints are locked", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/heat");
    await page.waitForTimeout(2000);
    await expect(page.locator(".heat-stage-locked")).toHaveCount(1);
    await expect(page.locator(".excalidraw")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#heat-diagram")).not.toHaveClass(/heat-stage-locked/);
  });

  test("mobile layout does not overflow after unlock", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/heat");
    await page.waitForTimeout(2000);
    await page.locator('input[placeholder="e.g. 100k QPS"]').fill("10k");
    await page.locator("select").nth(0).selectOption("single-buffer");
    await page.locator("select").nth(1).selectOption("mutex");
    await page.getByRole("button", { name: /Lock constraints/i }).click();
    await page.waitForTimeout(1500);
    await assertNoHorizontalOverflow(page);
    const monaco = await page.locator(".monaco-editor").count();
    expect(monaco).toBe(0);
  });
});

test.describe("Visual layout — tracks", () => {
  for (const track of tracks) {
    test(`/track/${track.id} desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`/track/${track.id}`);
      await page.waitForTimeout(1200);
      await assertNoHorizontalOverflow(page);
    });
  }
});
