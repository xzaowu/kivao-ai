import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const capture = async (page: Page, name: string) => {
  await mkdir("/tmp/kivao-admin-evidence", { recursive: true });
  await page.screenshot({
    path: `/tmp/kivao-admin-evidence/${name}-${test.info().project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
};
async function ready(page: Page, path: string, heading: string) {
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: heading, exact: true }),
  ).toBeVisible();
}
async function demo(page: Page, label: string) {
  await page.getByRole("button", { name: "演示控制" }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page }) => {
  page.on("console", (message) => {
    if (message.type() === "error") throw new Error(message.text());
  });
  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("dialog", (dialog) => void dialog.accept());
});
test("overview, chart data, export and routed task lookup", async ({
  page,
}) => {
  await ready(page, "/", "数据概览");
  await expect(page.getByText("生成成功率", { exact: true })).toBeVisible();
  await page.getByLabel("趋势时间范围").selectOption("30");
  await page.getByText("查看趋势数据明细").click();
  await expect(page.locator(".trend-data-grid span")).toHaveCount(30);
  await page.getByText("查看趋势数据明细").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出演示报表" }).click();
  expect((await download).suggestedFilename()).toBe("KIVAO-MOCK-trend.csv");
  await capture(page, "overview");
  await noOverflow(page);
  await page.locator(".mini-row").filter({ hasText: "DEMO-T1068" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("DEMO-T1068");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
test("navigation, sidebar, themes, system preference and global search", async ({
  page,
  isMobile,
}) => {
  await ready(page, "/", "数据概览");
  if (isMobile) {
    await page.getByRole("button", { name: "打开导航" }).click();
    await capture(page, "mobile-navigation");
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "场景管理", exact: true })
      .click();
  } else {
    await page.getByRole("button", { name: "收起侧边栏" }).click();
    await expect(page.locator(".admin-shell")).toHaveClass(/is-collapsed/);
    await page.getByRole("button", { name: "展开侧边栏" }).click();
    await page.getByRole("link", { name: "场景管理", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "场景管理", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "切换主题" }).click();
  await page.getByRole("menuitem", { name: "深色", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await capture(page, "scenes-dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换主题" }).click();
  await page.getByRole("menuitem", { name: "浅色", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换主题" }).click();
  await page.getByRole("menuitem", { name: "跟随系统", exact: true }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "搜索管理页面" }).click();
  await page.getByRole("textbox", { name: "搜索页面关键词" }).fill("生成任务");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "生成任务" })
    .click();
  await expect(
    page.getByRole("heading", { name: "生成任务", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
});
test("models, providers, forms, masking and retained edits after failure", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("example.test") || r.url().includes("/api/"))
      requests.push(r.url());
  });
  await ready(page, "/models", "模型与供应商");
  await page.getByLabel("状态", { exact: true }).selectOption("false");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "清除筛选" }).click();
  await capture(page, "models");
  await page.getByRole("tab", { name: /供应商管理/ }).click();
  await page
    .getByLabel("接口类型", { exact: true })
    .selectOption("自定义 HTTP");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("button", { name: "添加供应商", exact: true }).click();
  await page.getByLabel("供应商名称", { exact: true }).fill("新的演示供应商");
  await page
    .getByLabel("Base URL", { exact: false })
    .fill("https://demo.example.test/v1");
  await expect(page.getByText("•••• •••• DEMO")).toBeVisible();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
  await page.getByRole("button", { name: "保存演示配置" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("searchbox").fill("新的演示供应商");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "新的演示供应商", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "供应商详情", exact: true }),
  ).toBeVisible();
  await capture(page, "provider-detail");
  await page.getByRole("button", { name: "编辑供应商", exact: true }).click();
  await page.getByLabel("供应商名称", { exact: true }).fill("供应商编辑成功");
  await page.getByRole("button", { name: "保存演示配置" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("tab", { name: /模型管理/ }).click();
  await demo(page, "下次保存模拟失败");
  await page.getByRole("button", { name: "添加模型", exact: true }).click();
  await page.getByLabel("模型名称", { exact: true }).fill("测试模型");
  await page.getByLabel("模型 ID", { exact: true }).fill("demo-test-model");
  await page.getByRole("button", { name: "保存演示配置" }).click();
  await expect(page.getByRole("alert")).toContainText("模拟保存失败");
  await expect(page.getByLabel("模型名称", { exact: true })).toHaveValue(
    "测试模型",
  );
  await expect(page.getByRole("alert")).toBeInViewport();
  await expect(page.getByRole("alert")).toBeFocused();
  if (await page.getByRole("button", { name: "关闭通知" }).isVisible())
    await page.getByRole("button", { name: "关闭通知" }).click();
  await capture(page, "model-save-error");
  await page.getByRole("button", { name: "保存演示配置" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("searchbox").fill("demo-test-model");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  expect(requests).toEqual([]);
  await noOverflow(page);
});
test("scene search, filters, pagination, preview, edit and publish simulation", async ({
  page,
}) => {
  await ready(page, "/scenes", "场景管理");
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();
  await page.getByRole("button", { name: "上一页", exact: true }).click();
  await page.getByLabel("分类", { exact: true }).selectOption("时尚服饰");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("searchbox").fill("商品套图");
  await page.getByRole("button", { name: /商品套图 共享 API/ }).click();
  await expect(
    page.getByRole("heading", { name: "场景预览", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "编辑场景", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("标签", { exact: false })
    .fill("电商,演示编辑");
  await page.getByLabel("输出数量").fill("3");
  await capture(page, "scene-editor");
  await page.getByRole("button", { name: "保存演示配置" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("图片 · 3 个");
  await page.getByRole("button", { name: "商品套图的操作" }).click();
  await page.getByRole("menuitem", { name: "模拟下架" }).click();
  await page.getByRole("button", { name: "确认模拟操作" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("已下架");
  await page.getByRole("button", { name: "商品套图的操作" }).click();
  await page.getByRole("menuitem", { name: "模拟上架" }).click();
  await page.getByRole("button", { name: "确认模拟操作" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("已上架");
  await capture(page, "scenes");
  await noOverflow(page);
});
test("tasks sort, filters, detail timeline, independent retry and cancel", async ({
  page,
}) => {
  await ready(page, "/tasks", "生成任务");
  await page.getByLabel("场景", { exact: true }).selectOption("scene-3");
  await expect(page.locator(".row-count")).toContainText("12 条记录");
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("button", { name: "耗时", exact: true }).click();
  await expect(page.locator("th[aria-sort=ascending]")).toContainText("耗时");
  await page.getByLabel("状态", { exact: true }).selectOption("failed");
  await page.getByRole("button", { name: "DEMO-T1066", exact: true }).click();
  const drawer = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "任务详情", exact: true }),
  });
  await expect(
    drawer.getByRole("heading", { name: "执行时间线" }),
  ).toBeVisible();
  await expect(drawer.getByText(/DEMO_PROVIDER_TIMEOUT/)).toBeVisible();
  await capture(page, "task-detail");
  await drawer.getByRole("button", { name: "模拟重试", exact: true }).click();
  await page.getByRole("button", { name: "确认模拟操作" }).click();
  await expect(
    page.getByRole("heading", { name: "模拟重试任务", exact: true }),
  ).toHaveCount(0);
  await drawer.getByRole("button", { name: "关闭详情" }).click();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByRole("searchbox").fill("DEMO-T1066");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody")).toContainText("已失败");
  await expect(page.locator("tbody")).toContainText("排队中");
  const row = page.locator("tbody tr").filter({ hasText: "排队中" });
  await row.getByRole("button", { name: /的操作/ }).click();
  await page.getByRole("menuitem", { name: "模拟取消" }).click();
  await page.getByRole("button", { name: "确认模拟操作" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("已取消");
  await page.getByRole("button", { name: "清除筛选" }).click();
  await capture(page, "tasks");
  await noOverflow(page);
});
test("recoverable empty, loading and error states", async ({ page }) => {
  await ready(page, "/scenes", "场景管理");
  await demo(page, "空数据");
  await expect(
    page.getByRole("heading", { name: "暂无演示记录" }),
  ).toBeVisible();
  await capture(page, "empty");
  await demo(page, "加载错误");
  await expect(
    page.getByRole("heading", { name: "演示数据加载失败" }),
  ).toBeVisible();
  await capture(page, "error");
  await demo(page, "慢速加载");
  await expect(
    page.getByRole("heading", { name: "正在加载演示数据" }),
  ).toBeVisible();
  await capture(page, "loading");
  await expect(
    page.getByRole("heading", { name: "场景管理", exact: true }),
  ).toBeVisible();
  await demo(page, "正常数据");
  await expect(page.locator("tbody tr")).toHaveCount(8);
});
test("business frameworks, global keyboard and dialog focus containment", async ({
  page,
}) => {
  for (const [path, heading] of [
    ["/users", "用户管理"],
    ["/billing", "积分与计费"],
    ["/orders", "订单与充值"],
    ["/library", "作品与素材"],
    ["/settings", "系统设置"],
  ]) {
    await ready(page, path!, heading!);
    await noOverflow(page);
    await page.getByRole("tab").nth(1).click();
    await noOverflow(page);
  }
  await page.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("heading", { name: "搜索管理页面" }),
  ).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest("[role=dialog]"),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await capture(page, "settings");
});
