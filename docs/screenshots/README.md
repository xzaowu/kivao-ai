# 实际浏览器截图

2026-10-28，在 WSL Chromium 中捕获当前 React 前台与用户修正的 `/tmp/KIVAO_V2_Prototype`（2026-10-28 重新打包版）。本目录保留 22 张实际浏览器截图。没有重新绘制界面，也没有把截图作为页面运行时。

`compare-*` 左侧是本次运行修正源码捕获的原型，右侧是 React。桌面对比的每侧视口为 1440×900，手机对比的每侧视口为 390×844，密度均为 1；合并后宽度分别为 2880 和 780。其他 React 图片包含视口图与完整页面图，实际像素尺寸列在下表，不能一概视为相同裁切。

| 截图 | 实际尺寸 | 内容 |
| --- | --- | --- |
| [home-desktop.png](home-desktop.png) | 1440×900 | 开始页，桌面 |
| [home-mobile.png](home-mobile.png) | 390×844 | 开始页，手机 |
| [home-dark-mobile.png](home-dark-mobile.png) | 390×2227 | 深色开始页，手机完整页面 |
| [images-desktop.png](images-desktop.png) | 1440×900 | 图片功能总览，桌面 |
| [images-mobile.png](images-mobile.png) | 390×844 | 图片功能总览，手机 |
| [videos-desktop.png](videos-desktop.png) | 1440×900 | 视频功能总览，桌面 |
| [videos-mobile.png](videos-mobile.png) | 390×844 | 视频功能总览，手机 |
| [product-workspace-desktop.png](product-workspace-desktop.png) | 1440×900 | 商品套图工作区，桌面 |
| [product-workspace-mobile.png](product-workspace-mobile.png) | 390×1623 | 商品套图工作区，手机完整页面 |
| [tryon-workspace-desktop.png](tryon-workspace-desktop.png) | 1440×900 | AI 换装工作区，桌面 |
| [video-workspace-mobile.png](video-workspace-mobile.png) | 390×935 | 参考视频工作区，手机完整页面 |
| [canvas-desktop.png](canvas-desktop.png) | 1440×900 | 画布入口，桌面 |
| [canvas-editor-mobile.png](canvas-editor-mobile.png) | 390×848 | 画布编辑器，手机 |
| [canvas-results-desktop.png](canvas-results-desktop.png) | 1440×900 | 画布结果，桌面 |
| [canvas-results-mobile.png](canvas-results-mobile.png) | 390×848 | 画布结果，手机 |
| [works-managed-desktop.png](works-managed-desktop.png) | 1440×1196 | 作品整理，桌面完整页面 |
| [materials-managed-desktop.png](materials-managed-desktop.png) | 1440×900 | 素材整理，桌面 |
| [compare-home-desktop.png](compare-home-desktop.png) | 2880×900 | 开始页，源码／React 桌面对比 |
| [compare-home-mobile.png](compare-home-mobile.png) | 780×844 | 开始页，源码／React 手机对比 |
| [compare-images-desktop.png](compare-images-desktop.png) | 2880×900 | 图片总览，源码／React 桌面对比 |
| [compare-scenes-mobile.png](compare-scenes-mobile.png) | 780×844 | 场景库，源码／React 手机对比 |
| [compare-canvas-editor-mobile.png](compare-canvas-editor-mobile.png) | 780×844 | 画布编辑器，源码／React 手机对比 |

完整源码／React 对比截图及捕获记录保留在本机 `/tmp`（对比图目录 `/tmp/kivao-c-corrected-final`），本目录只保留上述选图。视觉检查的状态、差异和限制见根目录 [design-qa.md](../../design-qa.md)。截图用于展示与视觉比较，不证明所有交互、真实生成质量、上传或生产持久化；源码包自己的报告也不作为 React 验证结果。
