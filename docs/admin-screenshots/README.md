# Admin 实际浏览器截图

2026-10-28，Chromium，本地 Vite 应用。桌面视口 1440 × 900，手机视口 390 × 844，deviceScaleFactor=1。未使用设计稿、合成图或放大后的截图。

共 26 张 PNG，下表尺寸已逐一核对 PNG 文件头。常规文件为视口截图；`*-full` 为 fullPage 截图，超出视口的高度见下表。表格仅在自身容器内横向滚动；手机文件不表示所有列同时可见。表单字段区域独立滚动，底部操作条保持可用，全部字段可在表单内部滚动访问。

| 文件 | 实际像素尺寸 |
| --- | --- |
| [empty-desktop.png](empty-desktop.png) | 1440 × 900 |
| [error-desktop.png](error-desktop.png) | 1440 × 900 |
| [loading-desktop.png](loading-desktop.png) | 1440 × 900 |
| [model-editor-desktop.png](model-editor-desktop.png) | 1440 × 900 |
| [model-editor-mobile.png](model-editor-mobile.png) | 390 × 844 |
| [model-save-error-desktop.png](model-save-error-desktop.png) | 1440 × 900 |
| [model-save-error-mobile.png](model-save-error-mobile.png) | 390 × 844 |
| [models-desktop.png](models-desktop.png) | 1440 × 900 |
| [models-mobile.png](models-mobile.png) | 390 × 844 |
| [navigation-mobile.png](navigation-mobile.png) | 390 × 844 |
| [overview-dark-desktop.png](overview-dark-desktop.png) | 1440 × 900 |
| [overview-dark-mobile.png](overview-dark-mobile.png) | 390 × 844 |
| [overview-desktop-full.png](overview-desktop-full.png) | 1440 × 1305 |
| [overview-desktop.png](overview-desktop.png) | 1440 × 900 |
| [overview-mobile-full.png](overview-mobile-full.png) | 390 × 2274 |
| [overview-mobile.png](overview-mobile.png) | 390 × 844 |
| [providers-desktop.png](providers-desktop.png) | 1440 × 900 |
| [providers-mobile.png](providers-mobile.png) | 390 × 844 |
| [scene-editor-desktop.png](scene-editor-desktop.png) | 1440 × 900 |
| [scene-editor-mobile.png](scene-editor-mobile.png) | 390 × 844 |
| [scenes-desktop.png](scenes-desktop.png) | 1440 × 900 |
| [scenes-mobile.png](scenes-mobile.png) | 390 × 844 |
| [task-detail-desktop.png](task-detail-desktop.png) | 1440 × 900 |
| [task-detail-mobile.png](task-detail-mobile.png) | 390 × 844 |
| [tasks-desktop.png](tasks-desktop.png) | 1440 × 900 |
| [tasks-mobile.png](tasks-mobile.png) | 390 × 844 |

截图覆盖数据概览、模型与供应商、场景管理、生成任务四个重点页面，以及浅深主题、手机侧栏、模型/场景表单、任务详情、空/加载/错误状态和保存失败保留内容。用户、计费、订单、内容与设置五个框架未单独截图；其交互检查位于 `apps/admin/e2e/admin.spec.ts`。截图与测试用例存在本身不代表检查已通过，执行结果以本轮验证报告为准。

截图中的账户、数值、URL、任务、成本和配置全部是演示数据。截图不证明真实 API、AI、认证、支付或生产可用性；未做真机或读屏器验收。

保存失败截图直接记录提交后的固定错误摘要，未手动滚动表单定位错误。摘要位于独立滚动的字段区域外、底部操作条上方，并自动获得焦点。自动测试用例包含错误可见、获得焦点、输入保留及再次提交成功的断言。
