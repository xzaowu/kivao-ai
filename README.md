# KIVAO

**早期开发项目。AI 生成功能尚未真实接入。** 前台已将 KIVAO V2 方案 C 交互原型迁移为 React：开始页、图片／视频工作区、场景库、创作计划、版本调整、审核保存、作品与素材、画布布局预览均可体验。三个核心场景调用本地 Mock API；执行与版本结果为明确标识的前端演示，不调用真实模型，不实现登录、充值、扣费或真实任务执行。Admin 仍为独立外壳，无真实管理功能或认证。

本仓库从空仓库独立初始化，不包含旧私有仓库的代码、Git 历史、内部治理资料、测试证据或素材。项目许可证待 Human 确认，当前没有授予项目代码的开源许可；第三方组件仍受各自许可证约束，见 [第三方声明](THIRD_PARTY_NOTICES.md)。

## 本地启动

需要 Node.js 22（至少 22.12，建议使用 `.nvmrc` 的版本）和 pnpm 10.12.1。

```bash
nvm use
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm install
pnpm dev
```

默认地址：

| 应用 | 地址 / 行为 |
| --- | --- |
| Web | http://127.0.0.1:5173 |
| Admin | http://127.0.0.1:5174 |
| API | http://127.0.0.1:3001/health |
| OpenAPI | http://127.0.0.1:3001/openapi.json |
| Worker | 独立空闲进程，输出启动日志；不消费任何任务 |

无需 `.env`、PostgreSQL 或其他基础设施即可运行。需要覆盖端口时，可复制 `.env.example` 为根目录 `.env`；不要提交本地环境文件。修改 API 端口时同步修改 `API_PROXY_TARGET`。Web 和 Admin 在开发时通过 Vite 同源代理访问 `/api`。

所有命令均从根目录运行：

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 先构建共享包，再同时监听四个应用与共享包 |
| `pnpm dev:web` / `pnpm dev:admin` | 单独启动相应界面；请求示例需要另开 API |
| `pnpm dev:api` / `pnpm dev:worker` | 独立启动 API / Worker |
| `pnpm typecheck` | 应用、共享包、配置和测试的 TypeScript 检查 |
| `pnpm lint` | ESLint（零警告） |
| `pnpm test` | Vitest 契约、Mock API、前端版本与持久化逻辑测试，无外部服务 |
| `pnpm test:e2e` | Playwright 的 1440×900 桌面与 390×844 手机浏览器验收 |
| `pnpm build` | 构建共享包、Web、Admin、API 和 Worker |
| `pnpm openapi` | 从路由 Zod Schema 生成 `docs/openapi.json` |
| `pnpm db:generate` | 根据 Drizzle Schema 生成迁移，不连接数据库 |
| `pnpm db:migrate` | 显式应用迁移，需要自行提供本地 PostgreSQL 和 `DATABASE_URL` |

`pnpm test` 会比较生成的规范与运行时规范。修改契约或路由后先执行 `pnpm openapi`，并提交规范变更。生产构建后可用 `pnpm --filter @kivao/api start` 和 `pnpm --filter @kivao/worker start` 启动编译产物；Vite 的 `preview` 只用于静态产物预览，不是部署服务器，实际部署需要配置 `/api` 反向代理及 SPA 路由回退。

## 目录

```text
apps/
  web/                方案 C React 前台、组件、演示适配层与浏览器测试
  admin/              独立后台外壳与场景管理占位页
  api/                Fastify Mock 路由、Drizzle 定义与迁移
  worker/             独立进程外壳，无队列和真实执行
packages/
  contracts/          Zod Schema 与推导类型
  ui/                 Tailwind tokens、shadcn/ui Button 与工具函数
  config/             共享 TypeScript 与 Vite 配置
docs/                 API、业务边界及生成的 OpenAPI
```

应用依赖共享包；业务类型只由 `packages/contracts` 的 Zod Schema 推导。`packages/ui` 按 shadcn/ui 的源码分发方式维护，`components.json` 为后续添加组件提供配置。公共包先构建后使用，根目录命令负责顺序。

## 方案 C 前台

首页按关键词推荐任务，也可直接进入自由图片／视频创作。场景库提供 12／24／48 条压力样本、搜索、分类、素材／输出筛选与分页；只有商品套图、AI 换装、参考视频创作三条核心流程使用 Mock API，其余标注为流程预览。

前台通过 Zod 校验 API 响应，TanStack Query 管理查询与计划确认；路由由 TanStack Router 管理。没有嵌入原始单文件 HTML、使用 `innerHTML` 或把旧脚本作为运行时加载。组件、演示层和源码素材来源见 [前台迁移说明](docs/frontend.md)、[媒体来源清单](docs/source-media.json)。

模拟执行前必须核对计划。V2 只更新选中输出，V1 保留；左侧设置改变后，旧版本仍使用原设置，必须恢复原设置或生成新计划才能调整。作品在人工确认后固定版本和选中项，后续调整不会覆盖。结果是预制媒体，下载按钮提供演示原素材，不声称下载真实生成或编辑后的文件。

前端演示记录保存在当前浏览器 `localStorage`，与 API 进程内存相互独立；自由创作确认计划前只是临时草稿。本地文件只使用 Blob URL 预览，不上传、不持久化文件内容，刷新后需重选。Mock API 重启会清空后端引用，已有本地版本和作品保留；旧创作需要重新开始 API 流程。存储损坏时保留旧原始记录，使用带可见提示的临时工作空间。

浏览器测试首次运行先安装 Chromium：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

测试可自动启动本机 Web 与 API，非 CI 环境会复用已运行的开发服务；要求默认端口 5173／3001。也可使用现有兼容 Chromium：`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/absolute/path/to/chrome pnpm test:e2e`。设置 `KIVAO_SCREENSHOT_DIR=/absolute/output/path` 可导出各视口的实际截图。浏览器安装不是 `pnpm install` 的隐式副作用。

## Mock 演示

提供商品套图、AI 换装、参考视频创作三个场景。所有业务响应都带 `mode: "mock"`。素材均为虚构记录，无真实用户数据或素材文件。固定演示任务、版本和作品只用于查询展示，版本 `artifactUrl` 为 `null`，不能下载真实生成结果。

```bash
curl http://127.0.0.1:3001/api/v1/scenes
curl http://127.0.0.1:3001/api/v1/assets
curl -X POST http://127.0.0.1:3001/api/v1/plans \
  -H 'Content-Type: application/json' \
  -d '{"sceneId":"product-images","prompt":"演示商品展示","assets":[{"assetId":"00000000-0000-4000-8000-000000000001","role":"product"}]}'
```

返回的 `data.id` 可用于 `GET /api/v1/plans/:id`，以及：

```bash
curl -X POST http://127.0.0.1:3001/api/v1/creations \
  -H 'Content-Type: application/json' \
  -d '{"planId":"替换为返回的计划 UUID","confirmed":true}'
```

创建计划返回整数分表示的**模拟**人民币估算，不是价格承诺。计划有效期为 30 分钟；同一计划只创建一个创作。创建创作只得到 `draft` 容器，`taskIds` 和 `versionIds` 为空，不会推进演示任务或产生新结果。内存数据在 API 重启时清空，计划与创作存储分别限制为 1000 条（含固定演示记录）。

## 数据库与后续阶段

PostgreSQL/Drizzle 仅提供可迁移的初始表结构和显式连接入口；Mock 路由从不导入或连接数据库。初始结构不是生产数据层：身份归属、权限、数据库业务约束、版本写入保护和持久化仓储需随真实流程接入并进行 PostgreSQL 集成测试。未引入 Docker、Redis、消息队列、Better Auth 或 pg-boss。

前台沿用用户提供的方案 C 品牌标记、媒体与样式，并新增同一蓝色体系下的本地深浅主题和明确标识的积分展示。画布只支持添加演示素材、缩放、查看参考；完整编辑器、AI 节点与布局持久化未实现。真实登录、素材上传、生成执行、计费及服务端作品保存分别按后续需求实现。

更多定义与接口说明见 [API 边界](docs/api.md)。选型参考：[Fastify Zod Provider](https://github.com/turkerdev/fastify-type-provider-zod)、[Vite 环境要求](https://vite.dev/guide/)、[shadcn/ui Monorepo](https://ui.shadcn.com/docs/monorepo)、[Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)。版本固定在各 `package.json` 与 `pnpm-lock.yaml`，未采用 Vite 的下一主版本或 Drizzle 的预发布版本。根目录对 Drizzle Kit 的旧 `@esbuild-kit/core-utils` 间接依赖覆盖了 esbuild 安全版本；升级 Drizzle Kit 后可重新评估该覆盖，迁移生成已按覆盖后的工具链验证。
