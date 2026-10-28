import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const executableErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  executableErrors.set(page, errors);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
});
test.afterEach(({ page }) => expect(executableErrors.get(page)).toEqual([]));
async function shot(page: Page, info: TestInfo, name: string) {
  const dir = process.env.KIVAO_SCREENSHOT_DIR;
  if (!dir) return;
  await mkdir(dir, { recursive: true });
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.screenshot({
    path: resolve(dir, name + '-' + info.project.name + '.png'),
    fullPage: true,
    animations: 'disabled',
  });
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
}
async function confirm(page: Page) {
  await page
    .locator('.studio-confirm-actions')
    .getByRole('button', { name: '确认并模拟生成' })
    .click();
  await expect(
    page.getByRole('button', { name: 'V1 · 初版', exact: true }),
  ).toBeVisible();
}

test('corrected image and video discovery, template adoption and all named routes', async ({
  page,
}, info) => {
  await page.goto('/images');
  await expect(page.locator('.image-tool-card')).toHaveCount(6);
  await expect(page.locator('.image-template-card')).toHaveCount(12);
  await noOverflow(page);
  await shot(page, info, 'images-overview');
  await page
    .getByRole('searchbox', { name: '搜索图片模板' })
    .fill('不存在的模板');
  await expect(page.getByText('没有找到匹配的模板')).toBeVisible();
  await page.getByRole('button', { name: '清除搜索与筛选' }).click();
  await page.locator('.image-template-card').first().click();
  await expect(page.getByRole('dialog')).toContainText('需要准备');
  await page.getByRole('button', { name: '用示例体验', exact: true }).click();
  await expect(page.locator('.studio-binding')).toHaveCount(1);
  for (const id of [
    'product',
    'tryon',
    'remix',
    'background',
    'cutout',
    'free',
  ]) {
    await page.goto('/images/' + id);
    await expect(page.locator('.studio-inputs')).toBeVisible();
    if (info.project.name === 'mobile')
      await page
        .getByRole('button', { name: '结果与参考', exact: true })
        .click();
    await expect(page.locator('.image-workspace-guide')).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: '图片功能' })
        .getByRole('link', { name: '全部功能' }),
    ).not.toHaveAttribute('aria-current', 'page');
    await noOverflow(page);
  }
  await page.goto('/videos');
  await expect(page.locator('.video-tool-card')).toHaveCount(6);
  await expect(page.locator('.video-utilities a')).toHaveCount(3);
  await expect(page.locator('.video-case-card')).toHaveCount(12);
  await shot(page, info, 'videos-overview');
  await noOverflow(page);
  const v = page.locator('.video-case-media video').first();
  await v.evaluate(async (el) => {
    const v = el as HTMLVideoElement;
    v.muted = true;
    await v.play();
  });
  await expect
    .poll(() => v.evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  for (const id of [
    'free',
    'reference',
    'product',
    'motion',
    'outfit',
    'avatar',
    'upscale',
    'clean',
    'transcript',
  ]) {
    await page.goto('/videos/' + id);
    if (info.project.name === 'mobile')
      await page
        .getByRole('button', { name: '结果与参考', exact: true })
        .click();
    await expect(page.locator('.video-workspace-guide')).toBeVisible();
    if (info.project.name === 'mobile') {
      const tab = page
        .getByRole('navigation', { name: '视频功能' })
        .getByRole('link', {
          name:
            id === 'reference'
              ? '参考视频'
              : id === 'transcript'
                ? '提取台词'
                : id === 'clean'
                  ? '去除字幕'
                  : id === 'upscale'
                    ? '视频高清'
                    : id === 'avatar'
                      ? '数字人口播'
                      : id === 'outfit'
                        ? '服装展示'
                        : id === 'motion'
                          ? '动作模仿'
                          : id === 'product'
                            ? '商品视频'
                            : '自由创作',
          exact: true,
        });
      const r = await tab.boundingBox(),
        n = await page.locator('.header-navigation').boundingBox();
      expect(r!.x).toBeGreaterThanOrEqual(n!.x);
      expect(r!.x + r!.width).toBeLessThanOrEqual(n!.x + n!.width + 1);
    }
    await noOverflow(page);
  }
});

for (const [path, kind] of [
  ['/images/cutout', 'image'],
  ['/videos/avatar', 'video'],
  ['/videos/transcript', 'text'],
] as const) {
  test(`frontend-only ${path} plan, explicit limits and correct output type`, async ({
    page,
  }, info) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() === 'POST') posts.push(r.url());
    });
    await page.goto(path);
    await page
      .getByRole('button', { name: '填入演示素材', exact: true })
      .click();
    if (kind === 'video') {
      const script = page.getByRole('textbox', { name: '口播文稿（必填）' });
      await script.fill('');
      await page.getByRole('button', { name: '预览生成计划' }).click();
      await expect(page.locator('#studio-validation')).toContainText(
        '口播文稿',
      );
      await script.fill('这是明确标识的前端演示稿。');
    }
    await page.getByRole('button', { name: '预览生成计划' }).click();
    await expect(page.locator('.adapter-note')).toContainText('前端演示层');
    if (kind === 'text')
      await expect(page.locator('.studio-plan-head')).toContainText(
        '份示例文稿',
      );
    if (kind === 'video')
      await expect(page.locator('.studio-plan-goal')).toContainText(
        '这是明确标识的前端演示稿。',
      );
    await confirm(page);
    await expect(page.locator('.result-card')).toHaveCount(1);
    if (kind === 'text') {
      await expect(page.locator('.video-text-output')).toContainText(
        '非实时语音识别',
      );
      await expect(page.locator('.studio-output-grid video')).toHaveCount(0);
    }
    if (kind === 'image')
      await expect(page.locator('.output-visual.cutout')).toBeVisible();
    await shot(page, info, kind + '-tool-result');
    expect(posts).toHaveLength(0);
    await noOverflow(page);
  });
}

test('canvas drag, undo, role connection, embedded API task, retained versions and review', async ({
  page,
}, info) => {
  await page.goto('/canvas');
  await shot(page, info, 'canvas-overview');
  await page.locator('.cv-template-card').first().click();
  await page.getByRole('button', { name: '使用这个模板' }).click();
  await expect(page).toHaveURL(/\/canvas\//);
  const boardUrl = page.url();
  const mobile = info.project.name === 'mobile';
  if (mobile)
    await page.getByRole('button', { name: '节点列表', exact: true }).click();
  const container = page.locator(mobile ? '.cv-node-list' : '.cv-stage');
  await expect(container.locator('.cv-node')).toHaveCount(5);
  if (!mobile) {
    const note = container.locator('.cv-node-note'),
      before = await note.evaluate((el) => ({
        left: (el as HTMLElement).style.left,
        top: (el as HTMLElement).style.top,
      })),
      box = await note.locator('header').boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + 60, box!.y + 15);
    await page.mouse.down();
    await page.mouse.move(box!.x + 110, box!.y + 55, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(() => note.evaluate((el) => (el as HTMLElement).style.left))
      .not.toBe(before.left);
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await expect(note).toHaveCSS('left', before.left);
    await page.getByRole('button', { name: '重做', exact: true }).click();
  }
  if (!mobile) {
    await container
      .getByRole('button', { name: '连接 商品正面图', exact: true })
      .click();
    await container
      .getByRole('button', { name: '连接 商品套图', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '商品正面图', exact: true })
      .click();
    await expect(container.locator('.cv-edges path')).toHaveCount(4);
  }
  await shot(page, info, 'canvas-editor');
  await container.getByRole('button', { name: '查看输出计划' }).click();
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await expect(page).toHaveURL(boardUrl);
  await expect(page.locator('.adapter-note')).toContainText('Mock API');
  await confirm(page);
  await page.getByRole('button', { name: '调整选中项', exact: true }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(2);
  await page
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: '查看调整计划' })
    .click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page
    .locator('.studio-confirm-actions')
    .getByRole('button', { name: '确认并模拟生成' })
    .click();
  await expect(page.getByRole('button', { name: 'V2 · 调整版' })).toBeVisible();
  await page.getByRole('button', { name: /^确认保留/ }).click();
  await page
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: '我已检查，保存选中项' })
    .click();
  await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(container.locator('.cv-node-results')).toHaveCount(2);
  await expect(container).toContainText('V1');
  await expect(container).toContainText('V2');
  await shot(page, info, 'canvas-results');
  await page.reload();
  if (mobile)
    await page.getByRole('button', { name: '节点列表', exact: true }).click();
  await expect(container.locator('.cv-node-results')).toHaveCount(2);
  await noOverflow(page);
  await page.goto('/works');
  await expect(page.locator('.ls-work-card')).toHaveCount(4);
});

test('local library grouping, favorites, recoverable deletion, reselect and guarded forms', async ({
  page,
}, info) => {
  await page.goto('/materials');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles(resolve('apps/web/public/demo/tea.webp'));
  await expect(page.locator('.ls-material-card')).toHaveCount(1);
  await page.getByRole('button', { name: '新建分组', exact: true }).click();
  await page.getByRole('textbox', { name: '分组名称' }).fill('新品素材');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alert')).toContainText('未保存');
  await page.getByRole('button', { name: '继续编辑' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '新建分组', exact: true })
    .click();
  await page.getByRole('checkbox', { name: /选择 tea/ }).check();
  await page.getByRole('button', { name: '移动分组', exact: true }).click();
  await page
    .getByRole('combobox', { name: '移动到分组' })
    .selectOption('新品素材');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '移动分组', exact: true })
    .click();
  await expect(page.locator('.ls-material-card')).toContainText('新品素材');
  await page.getByRole('button', { name: '收藏', exact: true }).click();
  await page.getByRole('button', { name: '只看收藏' }).click();
  await expect(page.locator('.ls-material-card')).toHaveCount(1);
  await page.getByRole('button', { name: '移入最近删除', exact: true }).click();
  await expect(page.locator('.ls-material-card')).toHaveCount(0);
  await page.getByRole('button', { name: '最近删除', exact: true }).click();
  await expect(page.locator('.ls-material-card')).toHaveCount(1);
  await page.getByRole('button', { name: '恢复', exact: true }).click();
  await page.getByRole('button', { name: '我的素材', exact: true }).click();
  await expect(page.locator('.ls-material-card')).toHaveCount(1);
  const original = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('kivao-react-scheme-c-v2')!).uploads[0]
        .id,
  );
  await page.reload();
  await expect(page.locator('.ls-material-card')).toContainText('需重新选择');
  await page.getByRole('button', { name: /查看素材/ }).click();
  await page
    .getByRole('dialog')
    .locator('input[type=file]')
    .setInputFiles(resolve('apps/web/public/demo/tea.webp'));
  await expect(page.locator('.ls-material-card')).toContainText('当前可用');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('kivao-react-scheme-c-v2')!).uploads[0]
          .id,
    ),
  ).toBe(original);
  await shot(page, info, 'materials-managed');
  await noOverflow(page);
  await page.goto('/works');
  await page.getByRole('button', { name: '演示作品', exact: true }).click();
  await expect(page.locator('.ls-work-card')).toHaveCount(4);
  await page
    .getByRole('button', { name: /查看作品/ })
    .first()
    .click();
  await page.getByRole('button', { name: '保留这份演示到我的作品' }).click();
  await expect(page.locator('.ls-work-card')).toHaveCount(1);
  await shot(page, info, 'works-managed');
  await page.goto('/creations');
  await page.getByRole('button', { name: '载入演示记录', exact: true }).click();
  await expect(page.locator('.ls-record-card')).toHaveCount(3);
  await page.getByRole('button', { name: '失败', exact: true }).click();
  await expect(page.locator('.ls-record-card')).toHaveCount(1);
  await page.getByRole('link', { name: '继续创作' }).click();
  await page.getByRole('button', { name: '预览生成计划' }).click();
  await expect(page.locator('.studio-plan-head')).toBeVisible();
});

test('home and unconfirmed workspace drafts survive refresh without persisting file bytes', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('textbox', { name: '一句话开始创作' })
    .fill('待继续的首页目标');
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('kivao-react-home-draft-v1')),
    )
    .toContain('待继续');
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: '一句话开始创作' }),
  ).toHaveValue('待继续的首页目标');
  await page.getByRole('button', { name: '清空本次输入', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: '一句话开始创作' }),
  ).toHaveValue('');
  await page
    .locator('#toast')
    .getByRole('button', { name: '撤销', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: '一句话开始创作' }),
  ).toHaveValue('待继续的首页目标');
  await page.goto('/images/free');
  await page
    .getByRole('textbox', { name: '你想做成什么？' })
    .fill('尚未确认的工作区目标');
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: '你想做成什么？' }),
  ).toHaveValue('尚未确认的工作区目标');
});
