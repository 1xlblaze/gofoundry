import { expect, test } from "@playwright/test";
import { allLessons, tracks } from "../src/content";

const corePaths = [
  "/",
  "/learn",
  "/lab",
  "/heat",
  "/problems",
  "/pricing",
  "/progress",
  "/login",
  "/diagnostic",
];

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 2,
  );
  expect(overflow, "page should not scroll horizontally").toBe(false);
}

test.describe("UI quality — navigation & hero", () => {
  test("desktop HEAT nav is visible and ordered", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: /HEAT learning path/i });
    await expect(nav.getByRole("link", { name: "Hear" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Etch" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Anchor" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Temper" })).toBeVisible();
  });

  test("homepage primary CTA and interactive lab are visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Hear — start curriculum/i })).toBeVisible();
    await expect(page.locator(".hero-lab-editor")).toBeVisible();
    await expect(page.locator(".hero-lab-editor")).toContainText("package main");
    const labWidth = await page.locator(".hero-lab-card").evaluate((el) => el.clientWidth);
    expect(labWidth).toBeGreaterThan(300);
  });

  test("homepage track map shows styled curriculum cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Eight tracks/i })).toBeVisible();
    const cards = page.locator(".home-track-card");
    await expect(cards).toHaveCount(8);
    await expect(cards.first()).toContainText(/lessons/i);
    await expect(page.locator(".home-tracks-grid")).toBeVisible();
  });

  test("mobile menu exposes HEAT steps with descriptions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /Open menu/i }).click();
    const menu = page.locator(".mobile-nav");
    await expect(menu.getByRole("link", { name: /Hear/i })).toBeVisible();
    await expect(menu.getByText("HEAT canvas")).toBeVisible();
    await expect(menu.getByText("Sign in to sync progress")).toBeVisible();
  });
});

test.describe("UI quality — layout stability", () => {
  for (const viewport of viewports) {
    for (const path of corePaths) {
      test(`no horizontal overflow ${path} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path);
        await page.waitForTimeout(1000);
        if (path !== "/heat") {
          await assertNoHorizontalOverflow(page);
        }
      });
    }
  }
});

test.describe("UI quality — curriculum & pricing", () => {
  test("curriculum filters reduce results", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("search", { name: /Filter lessons/i })).toBeVisible();
    await page.getByPlaceholder("Search lessons…").fill("goroutine");
    await expect(page.getByText(/Showing/i)).toBeVisible();
    await page.getByRole("button", { name: "Completed" }).click();
    await expect(page.getByText(/Showing/i)).toBeVisible();
  });

  test("pricing has a single merged waitlist form", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Team & lifetime waitlist/i })).toBeVisible();
    await expect(page.locator(".price-waitlist-form")).toHaveCount(1);
    await expect(page.locator(".price-waitlist-tier-select")).toBeVisible();
  });
});

test.describe("UI quality — lesson content", () => {
  test("sample lesson renders roadmap and body", async ({ page }) => {
    const lesson = allLessons.find((item) => item.track === "lld") ?? allLessons[0];
    await page.goto(`/lesson/${lesson.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: lesson.title })).toBeVisible();
    await expect(page.getByLabel("Lesson roadmap")).toBeVisible();
    await expect(page.locator(".content-stack").first()).toBeVisible();
  });

  test("mobile lesson uses collapsible section navigator", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/lesson/embed-fs-templates");
    const toggle = page.getByRole("button", { name: /Section \d+ of/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("#lesson-toc-panel.is-open")).toBeVisible();
    await expect(page.getByLabel("Lesson roadmap")).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});

test.describe("UI quality — auth session health", () => {
  test("session endpoint does not 500 during browse", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const failedRequests: string[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/auth/session") && response.status() >= 500) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto("/");
    await page.goto("/learn");
    await page.goto("/pricing");
    await page.waitForTimeout(800);

    expect(failedRequests).toEqual([]);
    expect(errors.filter((line) => line.includes("MissingSecret"))).toEqual([]);
  });
});

test.describe("UI quality — tracks", () => {
  for (const track of tracks) {
    test(`/track/${track.id} lists lessons`, async ({ page }) => {
      await page.goto(`/track/${track.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("a[href^='/lesson/']").first()).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }
});
