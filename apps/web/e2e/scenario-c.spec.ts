import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { DemoCreation, DemoWork } from '../src/demo/model';

const storageKey = 'kivao-react-scheme-c-v2';
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }, info) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !(info.title.includes('API failure') && message.text().includes('503'))
    )
      errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});
async function state(page: Page) {
  return page.evaluate(
    (key) =>
      JSON.parse(
        localStorage.getItem(key) || '{"creations":[],"works":[]}',
      ) as { creations: DemoCreation[]; works: DemoWork[] },
    storageKey,
  );
}
async function screenshot(page: Page, info: TestInfo, name: string) {
  const directory = process.env.KIVAO_SCREENSHOT_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document
      .querySelectorAll<HTMLElement>('.studio-review-body, .studio-fields')
      .forEach((element) => {
        element.scrollTop = 0;
      });
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.screenshot({
    path: resolve(directory, `${name}-${info.project.name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  if (name === 'home')
    await page.screenshot({
      path: resolve(directory, `${name}-${info.project.name}-viewport.png`),
      animations: 'disabled',
    });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
}
async function pane(page: Page, name: '素材与配置' | '结果与参考') {
  const button = page
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first();
  if (await button.isVisible()) {
    await button.click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }
}
async function selectFirst(page: Page, count: number) {
  const inputs = page.locator('.result-select input');
  for (let index = 0; index < (await inputs.count()); index++) {
    if (index < count) await inputs.nth(index).check();
    else await inputs.nth(index).uncheck();
  }
}
async function confirm(page: Page) {
  await page
    .locator('.studio-confirm-actions')
    .getByRole('button', { name: '确认并模拟生成' })
    .click();
}
async function save(page: Page) {
  await page.getByRole('button', { name: /^确认保留/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '我已检查，保存选中项' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('home fidelity, guided intentions, dialogs, navigation, theme and credits', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.locator('.start-tool')).toHaveCount(3);
  await expect(
    page.getByRole('heading', { name: '从一个想法，开始创作。' }),
  ).toBeVisible();
  await noOverflow(page);
  await screenshot(page, info, 'home');
  await page
    .getByRole('textbox', { name: '一句话开始创作' })
    .fill('商品套图和一段宣传视频');
  await page.getByRole('button', { name: '开始创作', exact: true }).click();
  await expect(
    page.getByRole('dialog').locator('.suggested-scene'),
  ).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page
    .getByRole('button', { name: '主题外观', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const contrasts = await page.evaluate(() => {
    function luminance(color: string) {
      const values = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map((value) => Number(value) / 255)
        .map((value) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
        );
      return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
    }
    return [
      ['.start-tool .text-link:first-child', '.start-tool'],
      ['.start-attach-button', '.start-composer'],
      ['.start-modes button[aria-pressed="false"]', '.start-modes'],
      ['.example-card > div > b', 'body'],
    ].map(([selector, background]) => {
      const bg = luminance(
        getComputedStyle(document.querySelector(background!)!).backgroundColor,
      );
      const ratios = Array.from(document.querySelectorAll(selector!)).map(
        (element) => {
          const fg = luminance(getComputedStyle(element).color);
          return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        },
      );
      return { selector, count: ratios.length, minimum: Math.min(...ratios) };
    });
  });
  for (const group of contrasts) {
    expect(group.count, group.selector).toBeGreaterThan(0);
    expect(group.minimum, group.selector).toBeGreaterThanOrEqual(4.5);
  }
  const caseActionColor = await page
    .locator('.example-card > div > b')
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  await expect(page.locator('.before-after > b')).not.toHaveCSS(
    'color',
    caseActionColor,
  );
  await screenshot(page, info, 'home-dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('button', { name: '主题外观', exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole('button', { name: '浅色', exact: true }).click();
  await page.getByRole('button', { name: /1,200.*演示积分/ }).click();
  await expect(page.getByRole('dialog')).toContainText('不是账户余额');
  await page.keyboard.press('Escape');
  for (const [path, title] of [
    ['/images', '图片创作'],
    ['/videos', '视频创作'],
    ['/canvas', '画布'],
    ['/works', '作品'],
    ['/materials', '素材'],
  ]) {
    await page.goto(path!);
    await expect(page.locator('h1')).toContainText(title!);
    await noOverflow(page);
    await page.reload();
    await expect(page.locator('h1')).toContainText(title!);
  }
  await page.goto('/');
  await page.getByRole('button', { name: '查看案例' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('不是本次创作结果');
  await page.getByRole('link', { name: '查看对应场景' }).click();
  await expect(page.locator('h1')).toHaveText('商品套图');
  await page.getByRole('button', { name: '关于本演示' }).click();
  await page.getByRole('link', { name: '阅读流程与边界' }).click();
  await expect(page.locator('h1')).toHaveText('从找工具，转向完成任务');
});

test('catalog search, categories, filters, 12/24/48 samples and preview-only boundaries', async ({
  page,
}, info) => {
  await page.goto('/scenes');
  for (const size of [12, 24, 48]) {
    const settings = page.locator('.sample-settings');
    if (
      !(await settings.evaluate(
        (element) => (element as HTMLDetailsElement).open,
      ))
    )
      await settings.locator('summary').click();
    await settings
      .getByRole('button', { name: String(size), exact: true })
      .click();
    await expect(page.locator('.results-meta')).toContainText(
      `找到 ${size} 个场景`,
    );
    await expect(page.locator('.catalog-grid .scene-card')).toHaveCount(12);
    if (size > 12) {
      await page.getByRole('button', { name: '下一页', exact: true }).click();
      await expect(page.locator('.pagination')).toContainText(
        `2 / ${size / 12}`,
      );
      await page.getByRole('button', { name: '上一页', exact: true }).click();
    }
    await noOverflow(page);
    await screenshot(page, info, `catalog-${size}`);
  }
  await page.getByRole('searchbox', { name: '搜索场景' }).fill(' 换装 ');
  await expect(page.locator('.catalog-grid .scene-card')).toHaveCount(1);
  await page.getByRole('searchbox', { name: '搜索场景' }).fill('不存在的内容');
  await expect(
    page.getByText('当前条件下没有场景', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '清除搜索与筛选' }).click();
  await page.getByRole('button', { name: '服装人像', exact: true }).click();
  await page.locator('.facets summary').click();
  await page.getByLabel('想得到什么', { exact: true }).selectOption('图片');
  await page.getByLabel('只看完整演示').check();
  await expect(page.locator('.catalog-grid .scene-card')).toHaveCount(1);
  await page.getByRole('button', { name: '清除条件', exact: true }).click();
  await page.goto('/scenes/catalog-1');
  await expect(
    page.getByText('仅流程预览 · 未接后端', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '用演示素材体验' }),
  ).toHaveCount(0);
});

for (const [sceneId, title, count] of [
  ['product', '商品套图', 6],
  ['tryon', 'AI 换装', 2],
  ['video', '参考视频创作', 1],
] as const) {
  test(`${title}: API plan, V1, selected adjustment, V2, pinned works and resume`, async ({
    page,
  }, info) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST')
        posts.push(new URL(request.url()).pathname);
    });
    await page.goto('/');
    await page
      .locator('.start-tool')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      .getByRole('button', { name: '用示例体验', exact: true })
      .click();
    if (sceneId === 'product')
      await page.getByLabel('套图结构').selectOption('6');
    await screenshot(page, info, `${sceneId}-inputs`);
    await page.getByRole('button', { name: '预览生成计划' }).click();
    await expect(page.locator('.studio-plan-head')).toContainText(
      `这次将得到 ${count}`,
    );
    await expect(page.locator('.adapter-note')).toContainText('Mock API');
    await expect(page.locator('.studio-confirm-actions')).toContainText(
      '不会扣费',
    );
    await screenshot(page, info, `${sceneId}-plan`);
    await confirm(page);
    await expect(
      page.getByRole('button', { name: 'V1 · 初版', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.result-card')).toHaveCount(count);
    const first = (await state(page)).creations[0]!.versions[0];
    await selectFirst(page, Math.min(2, count));
    await save(page);
    const pinned = (await state(page)).works;
    await page.getByRole('button', { name: '调整选中项', exact: true }).click();
    await page
      .getByRole('textbox', { name: /补充说明/ })
      .fill('只调整已选结果，其余保留。');
    await page.getByRole('button', { name: '查看调整计划' }).click();
    await expect(page.locator('.studio-plan-head')).toContainText(
      '只调整选中的',
    );
    await confirm(page);
    await expect(
      page.getByRole('button', { name: 'V2 · 调整版', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.locator('.result-card[data-source-version="2"]'),
    ).toHaveCount(Math.min(2, count));
    expect((await state(page)).creations[0]!.versions[0]).toEqual(first);
    expect((await state(page)).works).toEqual(pinned);
    await page.getByRole('button', { name: 'V1 · 初版', exact: true }).click();
    await expect(
      page.locator('.result-card[data-source-version="1"]'),
    ).toHaveCount(count);
    await page
      .getByRole('button', { name: 'V2 · 调整版', exact: true })
      .click();
    if (sceneId === 'product') {
      await pane(page, '素材与配置');
      await page.getByLabel('画面比例').selectOption('1:1');
      await pane(page, '结果与参考');
      await expect(
        page.getByRole('button', { name: '调整选中项', exact: true }),
      ).toBeDisabled();
      await page.getByRole('button', { name: '恢复此版本设置' }).click();
      await expect(
        page.getByRole('button', { name: '调整选中项', exact: true }),
      ).toBeEnabled();
    }
    await selectFirst(page, Math.min(2, count));
    await save(page);
    await noOverflow(page);
    await screenshot(page, info, `${sceneId}-results`);
    const beforeReload = (await state(page)).works;
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'V2 · 调整版', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect((await state(page)).works).toEqual(beforeReload);
    await page.goto('/works');
    await expect(page.locator('.ls-work-card')).toHaveCount(
      Math.min(2, count) * 2,
    );
    await screenshot(page, info, `${sceneId}-works`);
    if (sceneId === 'product') {
      await page.goto('/');
      await expect(page.locator('.start-continue .creation-card')).toHaveCount(
        1,
      );
      await page.locator('.start-continue .creation-card').click();
      await expect(
        page.getByRole('button', { name: 'V2 · 调整版', exact: true }),
      ).toBeVisible();
    }
    expect(posts.filter((path) => path === '/api/v1/plans')).toHaveLength(2);
    expect(posts.filter((path) => path === '/api/v1/creations')).toHaveLength(
      1,
    );
    expect(
      posts.some(
        (path) => !['/api/v1/plans', '/api/v1/creations'].includes(path),
      ),
    ).toBe(false);
  });
}

test('uploads are local, validated, role-bound and visibly stale after refresh', async ({
  page,
}) => {
  const uploadRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST')
      uploadRequests.push(request.postData() || '');
  });
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not an image'),
  });
  await expect(page.getByRole('alert')).toContainText('文件内容与格式不符');
  await page
    .locator('input[type="file"]')
    .setInputFiles(resolve('apps/web/public/demo/tea.webp'));
  await expect(page.locator('.start-attachment')).toHaveCount(1);
  await expect(page.locator('.start-attachment img')).toHaveAttribute(
    'src',
    /^blob:/,
  );
  await page.getByRole('textbox', { name: '一句话开始创作' }).fill('商品套图');
  await page.getByRole('button', { name: '开始创作', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /商品套图/ })
    .click();
  await expect(page.locator('.studio-binding')).toContainText('tea.webp');
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await expect(page.locator('.studio-plan-head')).toBeVisible();
  expect(uploadRequests.join('')).not.toContain('blob:');
  expect(uploadRequests.join('')).not.toContain('tea.webp');
  await page.getByRole('button', { name: '返回修改', exact: true }).click();
  await page.reload();
  await pane(page, '素材与配置');
  await expect(
    page.getByText('本地文件已失效，请重新选择。', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await expect(page.locator('#studio-validation')).toContainText('请先准备');
});

test('free image and video goals, empty validation, frontend plans and playable video', async ({
  page,
}) => {
  for (const [path, goal] of [
    ['/images', '自然光下的商品主视觉'],
    ['/videos', '温暖的面包房短片'],
  ]) {
    await page.goto(path! + '/free');
    await page.getByRole('button', { name: '预览生成计划' }).click();
    await expect(page.locator('#studio-validation')).toContainText('描述目标');
    await page.goto('/');
    await page
      .getByRole('group', { name: '创作模式' })
      .getByRole('button', {
        name: path === '/videos' ? '视频' : '图片',
        exact: true,
      })
      .click();
    await page.getByRole('textbox', { name: '一句话开始创作' }).fill(goal!);
    await page.getByRole('button', { name: '开始创作', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: '你想做成什么？' }),
    ).toHaveValue(goal!);
    await page.getByRole('button', { name: '预览生成计划' }).click();
    await expect(page.locator('.adapter-note')).toContainText('前端演示层');
    await confirm(page);
    await expect(
      page.getByRole('button', { name: 'V1 · 初版', exact: true }),
    ).toBeVisible();
    if (path === '/videos') {
      const video = page.locator('.studio-output-grid video');
      await video.evaluate(async (element) => {
        const media = element as HTMLVideoElement;
        media.muted = true;
        await media.play();
      });
      await expect
        .poll(() =>
          video.evaluate(
            (element) => (element as HTMLVideoElement).currentTime,
          ),
        )
        .toBeGreaterThan(0);
    }
    await save(page);
  }
  await page.goto('/works');
  await expect(page.locator('.ls-work-card')).toHaveCount(3);
});

test('cancellation and API failure keep progress and inputs honest', async ({
  page,
}) => {
  await page.route('**/api/v1/plans', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'MOCK_CAPACITY_REACHED',
          message: '测试：Mock API 暂不可用',
          requestId: 'test',
        },
      }),
    }),
  );
  await page.goto('/');
  await page
    .locator('.start-tool')
    .filter({
      has: page.getByRole('heading', { name: '参考视频创作', exact: true }),
    })
    .getByRole('button', { name: '用示例体验', exact: true })
    .click();
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await expect(page.locator('#studio-validation')).toContainText(
    'Mock API 暂不可用',
  );
  expect((await state(page)).creations[0]!.versions).toHaveLength(0);
  await page.unroute('**/api/v1/plans');
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await confirm(page);
  await page.getByRole('button', { name: '取消模拟，返回计划' }).click();
  await expect(page.locator('.studio-plan-head')).toBeVisible();
  expect((await state(page)).creations[0]!.versions).toHaveLength(0);
  await confirm(page);
  await expect(
    page.getByRole('button', { name: 'V1 · 初版', exact: true }),
  ).toBeVisible();
  expect((await state(page)).creations[0]!.versions).toHaveLength(1);
});

test('canvas templates, material sources and empty works', async ({ page }) => {
  await page.goto('/works');
  await expect(
    page.getByRole('heading', { name: '还没有确认保留的作品' }),
  ).toBeVisible();
  await page.goto('/canvas');
  await expect(page.locator('.cv-template-card')).toHaveCount(8);
  await noOverflow(page);
  await page.getByRole('searchbox', { name: '搜索画布模板' }).fill('换装');
  await expect(page.locator('.cv-template-card')).toHaveCount(1);
  await page.locator('.cv-template-card').click();
  await page.getByRole('button', { name: '使用这个模板' }).click();
  await expect(page.locator('.cv-stage .cv-node')).toHaveCount(6);
  await noOverflow(page);
  await page.goto('/materials');
  await page.getByRole('button', { name: '演示素材', exact: true }).click();
  await page.getByRole('button', { name: '视频', exact: true }).click();
  await expect(page.locator('.ls-material-card')).toHaveCount(4);
});

test('corrupt local records are never overwritten by a new temporary session', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(
    (key) => localStorage.setItem(key, 'invalid original record'),
    storageKey,
  );
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('不覆盖旧记录');
  await page
    .getByRole('button', { name: '用示例体验', exact: true })
    .first()
    .click();
  await expect(page.locator('h1')).toHaveText('山间茶事 · 新品上新');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBe('invalid original record');
});
