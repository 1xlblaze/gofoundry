import { expect, test } from "@playwright/test";
import { allLessons, tracks } from "../src/content";

const staticPages = [
  { path: "/", heading: /From Go foundations|GoFoundry/i },
  { path: "/learn", title: /Curriculum/i, heading: /Curriculum|Learn/i },
  { path: "/lab", title: /Go Lab/i, heading: /Go Lab/i },
  { path: "/heat", title: /HEAT Canvas/i, heading: /HEAT Canvas/i },
  { path: "/problems", title: /Practice problems/i, heading: /Practice Sheet/i },
  { path: "/pricing", title: /Pricing/i, heading: /Curriculum free|staff problems/i },
  { path: "/sandbox", title: /Sandbox/i, heading: /Sandbox|diagnostic/i },
  { path: "/search", title: /Search lessons/i, heading: /Search/i },
  { path: "/progress", title: /Your progress/i, heading: /Progress/i },
  { path: "/cheatsheets", title: /Cheat Sheet/i, heading: /cheat sheets/i },
  { path: "/blog", title: /Articles/i, heading: /under the hood/i },
  { path: "/diagnostic", title: /Self-assessment/i, heading: /Find the gaps|readiness/i },
  { path: "/login", title: /Sign in/i, heading: /Sign in|Google/i },
  { path: "/privacy", title: /Privacy/i, heading: /Privacy Policy/i },
  { path: "/terms", title: /Terms/i, heading: /Terms of Service/i },
];

test.describe("Core pages smoke", () => {
  test("homepage exposes HEAT primary CTA and nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Choose your path/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /HEAT learning path/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Skip to content/i })).toHaveCount(1);
  });

  for (const pageInfo of staticPages) {
    test(`${pageInfo.path} renders`, async ({ page }) => {
      const response = await page.goto(pageInfo.path);
      expect(response?.ok()).toBeTruthy();
      if (pageInfo.title) {
        await expect(page).toHaveTitle(pageInfo.title);
      }
      await expect(page.getByRole("heading", { level: 1 })).toContainText(pageInfo.heading);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});

test.describe("Track and lesson content", () => {
  for (const track of tracks) {
    test(`/track/${track.id} lists lessons`, async ({ page }) => {
      await page.goto(`/track/${track.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("a[href^='/lesson/']").first()).toBeVisible();
    });
  }

  test("sample lesson has roadmap and content blocks", async ({ page }) => {
    const lesson = allLessons.find((item) => item.track === "lld") ?? allLessons[0];
    await page.goto(`/lesson/${lesson.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: lesson.title })).toBeVisible();
    await expect(page.locator(".lesson-chrome")).toBeVisible();
    await expect(page.locator(".content-stack").first()).toBeVisible();
  });

  test("HLD lesson offers sketch pad", async ({ page }) => {
    const lesson = allLessons.find((item) => item.track === "hld");
    test.skip(!lesson, "No HLD lesson found");
    await page.goto(`/lesson/${lesson!.slug}`);
    await expect(page.getByRole("button", { name: /Split view/i })).toBeVisible();
  });

  test("HLD track cards are fully visible after motion reveal", async ({ page }) => {
    await page.goto("/track/hld");
    await page.waitForTimeout(2200);
    const cards = page.locator(".lesson-card");
    await expect(cards).not.toHaveCount(0);
    const lastCard = cards.last();
    await expect(lastCard).toBeVisible();
    const opacity = await lastCard.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.95);
  });

  test("LRU lesson shows stats and sticky TOC", async ({ page }) => {
    await page.goto("/lesson/lru-cache-lld");
    await expect(page.locator(".lesson-context-rail")).toBeVisible();
    await expect(page.getByLabel("Lesson sections")).toBeVisible();
    await expect(page.locator("#lesson-section-1")).toBeAttached();
  });
});

test.describe("Curriculum filters", () => {
  test("learn page exposes lesson filters", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("search", { name: /Filter lessons/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /All tracks/i })).toBeVisible();
    await page.getByPlaceholder("Search lessons…").fill("goroutine");
    await expect(page.getByText(/Showing/i)).toBeVisible();
  });
});

test.describe("Homepage hero lab", () => {
  test("mobile shows path picker and hides hero lab", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Can you spot the goroutine leak/i })).toBeHidden();
    await expect(page.getByRole("link", { name: /Start Foundations/i })).toBeVisible();
  });
});

test.describe("Interactive workspaces", () => {
  test("HEAT canvas exposes four stages", async ({ page }) => {
    await page.goto("/heat");
    await expect(page.getByRole("heading", { level: 1, name: /HEAT Canvas/i })).toBeVisible();
    await expect(page.getByText(/Make the constraints audible/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Draw the movement before the code/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Etch Architecture sketch/i })).toBeVisible();
  });

  test("DSA problem workspace navigates HEAT stages", async ({ page }) => {
    await page.goto("/problems/dsa-01-slice-headers");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/slice/i);
    await page.getByRole("button", { name: /Lock constraints & continue to Etch/i }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Topology designer/i })).toBeVisible();
    await expect(page.locator(".etch-canvas-root, .etch-canvas-loading").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("platform problems index links to staff problems", async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByRole("link", { name: /LRU|Sliding|slice/i }).first()).toBeVisible();
  });
});

test.describe("Health API", () => {
  test("health endpoint responds", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.overall).toBeTruthy();
  });
});

test.describe("SEO files", () => {
  test("robots.txt allows crawlers and points to sitemap", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/robots.txt`);
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toMatch(/User-Agent:\s*\*/i);
    expect(text).toMatch(/Allow:\s*\/\s*$/m);
    expect(text).toMatch(/Disallow:\s*\/api\//);
    expect(text).toMatch(/Sitemap:\s*https?:\/\/[^/]+\/sitemap\.xml/);
  });

  test("sitemap.xml lists core curriculum URLs", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/sitemap.xml`);
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain("<urlset");
    expect(text).toMatch(/<loc>[^<]+\/learn<\/loc>/);
    expect(text).toMatch(/<loc>[^<]+\/lesson\/[^<]+<\/loc>/);
    expect(text).toMatch(/<loc>[^<]+\/track\/method<\/loc>/);
    expect(text).toMatch(/<loc>[^<]+\/blog\/[^<]+<\/loc>/);
  });
});
