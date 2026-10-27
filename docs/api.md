# API 与业务边界

接口真相来源为 `packages/contracts/src/index.ts` 与 `apps/api/src/app.ts`。OpenAPI 使用 Fastify Zod Provider 从实际请求和响应 Schema 生成，禁止另写一套前后端 DTO。

| 对象 | 含义 | 关联 |
| --- | --- | --- |
| Scene | 可执行创作场景的定义与输入角色要求 | 一个场景可有多次 Creation |
| Asset | 素材记录 | 通过 `{assetId, role}` 引用；角色由场景和素材共同约束 |
| CreationPlan | 确认前的输入快照、有效期、费用估算 | 创建 Creation 必须显式确认有效计划 |
| Creation | 持续创作容器 | 可关联多个 Task 与 Version；不是单次执行 |
| Task | 一次异步执行的状态 | 属于 Creation，可产出 Version |
| Version | 不可覆盖的结果版本 | 属于 Creation 和 Task；变更结果应新增版本 |
| Work | 用户明确保存的作品记录 | 指向 Creation 的特定 Version |

本阶段 Zod Version 输出为只读，API 仅提供版本查询，不提供更新、删除、真实执行或保存作品接口。正式持久化前还需数据库层的不可覆盖保护。固定 Work 是模拟保存记录，不表示当前用户已执行保存。

所有业务成功响应为 `{ "mode": "mock", "data": ... }`。健康检查为 `{ "status": "ok", "mode": "mock" }`；只证明 Mock API 存活，不证明数据库或模型服务可用。

| 方法 | 路径 | 当前行为 |
| --- | --- | --- |
| GET | `/health` | Mock 进程健康检查 |
| GET | `/api/v1/scenes` | 三个演示场景 |
| GET | `/api/v1/scenes/:id` | 场景详情 |
| POST | `/api/v1/plans` | 校验输入与素材角色，创建模拟计划（201） |
| GET | `/api/v1/plans/:id` | 计划查询 |
| POST | `/api/v1/creations` | `{planId, confirmed: true}`，创建空 draft（201） |
| GET | `/api/v1/creations/:id` | 创作查询 |
| GET | `/api/v1/tasks/:id` | 固定模拟任务状态，无实际执行 |
| GET | `/api/v1/versions/:id` | 固定不可覆盖结果记录，无真实文件 |
| GET | `/api/v1/assets` | 虚构素材记录 |
| GET | `/api/v1/works` | 模拟保存记录 |
| GET | `/openapi.json` | 运行时 OpenAPI 3.0.3 |

场景 ID 是 `product-images`、`virtual-try-on`、`reference-video`。商品场景需要 `product`；换装需要 `person` 和 `garment`；视频场景需要 `reference_video`。演示素材 UUID 末尾 `001` 至 `004` 分别对应以上四种角色。演示创作、计划、任务、版本、作品 UUID 末尾分别为 `020..022`、`010..012`、`030..032`、`040..042`、`050..052`。完整形式示例：`00000000-0000-4000-8000-000000000030`。演示计划使用固定过去时间，查询可用但已过期，不能用于创建新创作。

错误统一为：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求格式或参数不符合契约。",
    "requestId": "req-1"
  }
}
```

| HTTP | code | 含义 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 请求、UUID、角色或 JSON 无效 |
| 404 | `NOT_FOUND` | 对象或接口不存在；未实现业务没有假成功响应 |
| 409 | `CONFLICT` | 已使用的计划 |
| 410 | `PLAN_EXPIRED` | 计划过期 |
| 413 | `VALIDATION_ERROR` | 请求体超过 64 KiB |
| 503 | `MOCK_CAPACITY_REACHED` | 内存演示存储已满 |
| 500 | `INTERNAL_ERROR` | 服务端异常；响应不暴露内部异常内容 |

契约保留 `NOT_IMPLEMENTED` 错误码供未来显式占位接口使用；当前未实现的登录、支付、执行接口均不存在，返回 404。当前 API 无身份与租户隔离，只用于本机演示。
