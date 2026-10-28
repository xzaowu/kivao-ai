import { z } from "zod";

export const capabilities = [
  "图片生成",
  "图片编辑",
  "视频生成",
  "视频理解",
] as const;
export const roles = [
  "product",
  "person",
  "garment",
  "reference_video",
] as const;
export const roleLabels: Record<string, string> = {
  product: "商品图",
  person: "人物图",
  garment: "服装图",
  reference_video: "参考视频",
};
export const statuses: Record<string, string> = {
  enabled: "已启用",
  disabled: "已停用",
  published: "已上架",
  draft: "草稿",
  archived: "已下架",
  queued: "排队中",
  running: "执行中",
  succeeded: "已成功",
  failed: "已失败",
  cancelled: "已取消",
};
const Name = z
  .string()
  .trim()
  .min(1, "请填写名称")
  .max(60, "名称最多 60 个字符");
export const ProviderSchema = z.object({
  id: z.string(),
  name: Name,
  type: z.enum(["OpenAI 兼容", "自定义 HTTP"]),
  baseUrl: z
    .string()
    .url("请输入有效的 HTTPS 地址")
    .refine((s) => {
      try {
        const u = new URL(s);
        return (
          u.protocol === "https:" &&
          !u.username &&
          !u.password &&
          !u.search &&
          !u.hash
        );
      } catch {
        return false;
      }
    }, "仅接受不含凭据、查询和片段的 HTTPS 地址"),
  enabled: z.boolean(),
  connection: z.enum(["未连接", "模拟正常", "模拟异常"]),
});
export const ModelSchema = z.object({
  id: z.string(),
  name: Name,
  modelId: z.string().trim().min(1, "请填写模型 ID").max(100),
  providerId: z.string().min(1, "请选择供应商"),
  capabilities: z.array(z.enum(capabilities)).min(1, "至少选择一项能力"),
  maxInputs: z.number().int().min(1).max(16),
  maxOutput: z.number().int().min(1).max(16),
  maxPrompt: z.number().int().min(1).max(32000),
  resolution: z.string().trim().min(1).max(60),
  cost: z.number().min(0).max(10000),
  credits: z.number().int().min(0).max(100000),
  enabled: z.boolean(),
});
// Admin-only configuration; no dynamic Scene CRUD is claimed by the shared API.
export const SceneConfigSchema = z.object({
  id: z.string(),
  name: Name,
  description: z.string().trim().min(1, "请填写场景描述").max(400),
  category: z.enum(["电商商品", "时尚服饰", "视频创作", "品牌营销"]),
  tags: z.string().max(100),
  cover: z.enum(["product", "fashion", "video", "brand"]),
  requiredRoles: z.array(z.enum(roles)).min(1, "至少选择一个素材角色"),
  outputKind: z.enum(["image", "video"]),
  outputCount: z.number().int().min(1).max(12),
  ratio: z.enum(["1:1", "3:4", "16:9", "9:16"]),
  quality: z.enum(["标准", "高清"]),
  modelId: z.string().min(1, "请选择模型"),
  status: z.enum(["published", "draft", "archived"]),
  updatedAt: z.string(),
  apiSceneId: z
    .enum(["product-images", "virtual-try-on", "reference-video"])
    .nullable(),
});
export type Provider = z.infer<typeof ProviderSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type SceneConfig = z.infer<typeof SceneConfigSchema>;
export type TaskStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";
export type AdminTask = {
  id: string;
  creationId: string;
  user: string;
  modelId: string;
  sceneId: string;
  status: TaskStatus;
  startedAt: string;
  duration: number;
  estimate: number;
  input: string;
  error: string | null;
  result: string | null;
  retryOf: string | null;
};
export type Snapshot = {
  providers: Provider[];
  models: Model[];
  scenes: SceneConfig[];
  tasks: AdminTask[];
};
export const currency = (n: number) => `¥${n.toFixed(2)}`;
export const time = (s: string) =>
  new Date(s).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function createFixtures(): Snapshot {
  const providers: Provider[] = [
    {
      id: "p-studio",
      name: "KIVAO 演示图像服务",
      type: "OpenAI 兼容",
      baseUrl: "https://image.example.test/v1",
      enabled: true,
      connection: "模拟正常",
    },
    {
      id: "p-motion",
      name: "KIVAO 演示视频服务",
      type: "自定义 HTTP",
      baseUrl: "https://video.example.test/api",
      enabled: true,
      connection: "模拟异常",
    },
    {
      id: "p-lab",
      name: "创意实验室",
      type: "OpenAI 兼容",
      baseUrl: "https://lab.example.test/v1",
      enabled: false,
      connection: "未连接",
    },
  ];
  const models: Model[] = [
    {
      id: "m-image",
      name: "Studio Image",
      modelId: "demo-studio-image-v2",
      providerId: "p-studio",
      capabilities: ["图片生成", "图片编辑"],
      maxInputs: 6,
      maxOutput: 6,
      maxPrompt: 2000,
      resolution: "最高 2048 × 2048",
      cost: 0.12,
      credits: 12,
      enabled: true,
    },
    {
      id: "m-tryon",
      name: "Fashion Edit",
      modelId: "demo-fashion-edit-v1",
      providerId: "p-studio",
      capabilities: ["图片编辑"],
      maxInputs: 3,
      maxOutput: 4,
      maxPrompt: 2000,
      resolution: "最高 1536 × 2048",
      cost: 0.18,
      credits: 18,
      enabled: true,
    },
    {
      id: "m-video",
      name: "Motion Video",
      modelId: "demo-motion-video-v1",
      providerId: "p-motion",
      capabilities: ["视频生成", "视频理解"],
      maxInputs: 2,
      maxOutput: 1,
      maxPrompt: 2000,
      resolution: "1080p / 最长 15 秒",
      cost: 1.2,
      credits: 120,
      enabled: true,
    },
    {
      id: "m-lab",
      name: "Creative Lab",
      modelId: "demo-creative-lab",
      providerId: "p-lab",
      capabilities: ["图片生成"],
      maxInputs: 4,
      maxOutput: 4,
      maxPrompt: 1000,
      resolution: "1024 × 1024",
      cost: 0.08,
      credits: 8,
      enabled: false,
    },
  ];
  const names = [
    "商品套图",
    "AI 换装",
    "参考视频创作",
    "品牌海报",
    "美食场景图",
    "服装型录",
    "短视频分镜",
    "护肤品展示",
    "家居产品图",
    "鞋履穿搭",
    "节日营销图",
    "产品开箱视频",
    "珠宝细节",
    "运动服饰",
    "生活方式短片",
    "饮品上新",
  ];
  const scenes: SceneConfig[] = names.map((name, i) => ({
    id: `scene-${i + 1}`,
    name,
    description: `${name}的管理配置演示。定义输入角色、参数与输出规格，不代表一次创作或执行任务。`,
    category: (["电商商品", "时尚服饰", "视频创作", "品牌营销"] as const)[
      i % 4
    ]!,
    tags: i % 2 ? "品牌,创意" : "电商,产品",
    cover: (["product", "fashion", "video", "brand"] as const)[i % 4]!,
    requiredRoles:
      i === 1
        ? ["person", "garment"]
        : i === 2
          ? ["reference_video"]
          : ["product"],
    outputKind: i === 2 || i % 4 === 2 ? "video" : "image",
    outputCount: i === 2 || i % 4 === 2 ? 1 : 4,
    ratio: "1:1",
    quality: "高清",
    modelId:
      i === 1 ? "m-tryon" : i === 2 || i % 4 === 2 ? "m-video" : "m-image",
    status:
      i < 3 || i % 3 === 0 ? "published" : i % 3 === 1 ? "draft" : "archived",
    updatedAt: new Date(Date.UTC(2026, 9, 28, 8, i)).toISOString(),
    apiSceneId:
      (["product-images", "virtual-try-on", "reference-video"] as const)[i] ??
      null,
  }));
  const states: TaskStatus[] = [
    "succeeded",
    "running",
    "failed",
    "succeeded",
    "queued",
    "succeeded",
    "cancelled",
  ];
  const tasks: AdminTask[] = Array.from({ length: 36 }, (_, i) => ({
    id: `DEMO-T${(1068 - i).toString()}`,
    creationId: `DEMO-C${800 - i}`,
    user: `演示用户 ${String((i % 8) + 1).padStart(2, "0")}`,
    modelId: models[i % 3]!.id,
    sceneId: scenes[i % 3]!.id,
    status: states[i % 7]!,
    startedAt: new Date(Date.UTC(2026, 9, 28, 8, 42 - i * 7)).toISOString(),
    duration: i % 7 === 4 ? 0 : 18 + ((i * 13) % 120),
    estimate: models[i % 3]!.cost * (i % 3 === 2 ? 1 : 4),
    input:
      i % 3 === 2
        ? "参考视频 1 段；9:16；输出 1 条；保持原视频节奏。"
        : i % 3 === 1
          ? "人物图 1 张、服装图 1 张；3:4；输出 4 张。"
          : "商品图 1 张；1:1；输出 4 张；白底与生活方式组合。",
    error:
      states[i % 7] === "failed"
        ? "DEMO_PROVIDER_TIMEOUT：模拟供应商响应超时，未发生真实调用。"
        : null,
    result:
      states[i % 7] === "succeeded"
        ? `DEMO-V${600 - i}（预设结果引用，无真实文件）`
        : null,
    retryOf: null,
  }));
  return { providers, models, scenes, tasks };
}
