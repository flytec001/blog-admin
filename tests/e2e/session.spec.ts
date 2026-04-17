import { expect, test } from "@playwright/test";

test("admin sidebar shows current access email", async ({ page }) => {
  await page.route("**/api/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        email: "allowed@example.com",
      }),
    });
  });

  await page.route("**/api/posts", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/posts");

  await expect(page.getByText("allowed@example.com")).toBeVisible();
});
