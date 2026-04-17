import { expect, test } from "@playwright/test";

test("admin can create and save a draft post", async ({ page }) => {
  await page.route("**/api/posts/hello-world", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: "Hello World",
        slug: "hello-world",
        date: "2026-04-17T11:00:00+08:00",
        draft: true,
        description: "intro",
        tags: [],
        categories: [],
        cover: "",
        body: "Hello world",
        sha: "sha-1",
      }),
    });
  });

  await page.route("**/api/posts", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
      return;
    }

    const payload = await route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...payload,
        slug: "hello-world",
        tags: payload.tags ?? [],
        categories: payload.categories ?? [],
        cover: payload.cover ?? "",
        sha: "sha-1",
      }),
    });
  });

  await page.goto("/posts/new");
  await page.getByLabel("标题").fill("Hello World");
  await page.getByLabel("日期").fill("2026-04-17T11:00:00+08:00");
  await page.getByLabel("摘要").fill("intro");
  await page.getByLabel("正文").fill("Hello world");
  await page.getByLabel("草稿").check();
  await page.getByRole("button", { name: "保存文章" }).click();

  await expect(page.getByText("保存成功")).toBeVisible();
  await expect(page.getByLabel("Slug")).toHaveValue("hello-world");
});

test("editor restores autosaved local draft and shows markdown preview", async ({ page }) => {
  await page.route("**/api/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "allowed@example.com" }),
    });
  });

  await page.goto("/posts/new");
  await page.getByLabel("标题").fill("Local Draft");
  await page.getByLabel("正文").fill("# 标题\n\n这是一段正文");

  await expect(page.getByText("草稿已自动保存")).toBeVisible();

  await page.reload();

  await expect(page.getByText("已恢复本地草稿")).toBeVisible();
  await expect(page.getByLabel("标题")).toHaveValue("Local Draft");

  await page.getByRole("button", { name: "预览" }).click();
  await expect(page.getByRole("heading", { name: "标题" })).toBeVisible();
  await expect(page.getByText("这是一段正文")).toBeVisible();
});
