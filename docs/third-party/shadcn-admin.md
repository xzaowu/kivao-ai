# shadcn-admin 参考与复用记录

- 上游：[satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)
- 实际克隆目录：`/tmp/kivao-shadcn-admin-reference-20261028`（不提交）
- 克隆及核对日期：2026-10-28
- 分支：`main`
- 精确提交：`e16c87f213a5ba5e45964e9b67c792105ec74d26`
- 上游 package.json：`shadcn-admin` 2.2.1。已检查组件目录、依赖、布局、数据表格、表单、主题和 LICENSE；未将上游依赖表或应用整体复制进 Monorepo。
- 上游许可证：MIT，`Copyright (c) 2024 Sat Naing`。完整原文保存在 [shadcn-admin-MIT.txt](shadcn-admin-MIT.txt)。本记录及该许可证只覆盖所复用的第三方代码，**不为 KIVAO 整体选择许可证**。

## 实际复制并适配的代码

以下上游文件均位于上述精确提交，目标文件保留来源注释，并随仓库提供完整 MIT 声明。

| 上游文件 | KIVAO 文件 | 适配内容 |
| --- | --- | --- |
| `src/components/ui/table.tsx` | `apps/admin/src/components/ui/table.tsx` | 保留实际使用的 Table/Header/Body/Row/Head/Cell，改用共享 `cn`；移除未使用的导出。 |
| `src/components/ui/dialog.tsx` | `apps/admin/src/components/ui/dialog.tsx` | 保留 Portal、遮罩、焦点管理、关闭、标题与描述；关闭文案中文化；统一用于弹窗和右侧抽屉。 |
| `src/components/ui/dropdown-menu.tsx` | `apps/admin/src/components/ui/dropdown-menu.tsx` | 保留实际使用的根、触发器、Portal 内容和菜单项；删除未使用的子菜单、单选与复选包装。 |
| `src/features/tasks/components/tasks-table.tsx`、`src/components/data-table/pagination.tsx` | `apps/admin/src/components/DataTable.tsx` | 适配 TanStack Table 组合、分页控制模式；改为泛型列、中文搜索/过滤、明确排序与可滚动区域；未复制任务样本、批量删除、URL 状态钩子或未使用的高级控件。 |

## 检查与参考，未直接复制

- `src/components/layout/app-sidebar.tsx`、`header.tsx`、`nav-group.tsx`、`authenticated-layout.tsx`：参考导航分组、固定顶部和可收起侧栏模式；KIVAO `Layout.tsx` 根据自己的九模块导航重新实现。
- `src/context/theme-provider.tsx`、`src/components/theme-switch.tsx`：参考三种主题模式及系统变化监听；KIVAO 使用独立的 `kivao-admin-theme` 本地偏好，不复制 Cookie 工具或 Provider 体系。
- `src/features/users/components/users-action-dialog.tsx`、`src/components/confirm-dialog.tsx`：检查表单和确认模式；KIVAO 使用现有 Zod、原生表单约束、TanStack Query Mutation 和复用 Dialog，自行实现 Admin 业务字段与错误反馈。
- `src/features/dashboard/index.tsx` 及图表组件：参考操作型后台的信息密度；不复制其运营数字、人物资料、销售样本、截图或图表数据。KIVAO 使用独立的 Mock 指标与 SVG 数据图表。
- 在线演示已在浏览器实际打开并检查，临时截图不作为 KIVAO 资产提交。

## 依赖选择

保持 React 19.2.9、TypeScript 5.9.3、Vite 7.3.7、TanStack Router 1.170.46 / Query 5.105.0 和共享 UI。仅在 Admin 添加 Dialog 1.1.15、Dropdown Menu 2.1.16、TanStack Table 8.21.3、Lucide React 0.468.0；Zod 4.6.7 复用仓库既有版本。锁文件一并提交。

没有引入 Clerk、Zustand、Axios、React Hook Form、Recharts、第二套路由、登录实现或上游静态素材；`packages/ui` 未修改，避免影响方案 C 前台。
