import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFixtures,
  ModelSchema,
  ProviderSchema,
  SceneConfigSchema,
  type Snapshot,
  type Model,
  type Provider,
  type SceneConfig,
} from "./data";

let state = createFixtures();
export type DemoState = "normal" | "empty" | "error" | "loading";
let demoState: DemoState = "normal";
let failSave = false;
export function setDemoState(value: DemoState) {
  demoState = value;
}
export function failNextSave() {
  failSave = true;
}
export function resetDemo() {
  state = createFixtures();
  demoState = "normal";
  failSave = false;
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function readSnapshot(): Promise<Snapshot> {
  const mode = demoState;
  await wait(mode === "loading" ? 2200 : 220);
  if (mode === "error")
    throw new Error("模拟数据加载失败。请切回正常状态后重试。");
  return structuredClone(
    mode === "empty"
      ? { providers: [], models: [], scenes: [], tasks: [] }
      : state,
  );
}
function unique<T extends { id: string }>(items: T[], item: T) {
  return items.some(
    (x) =>
      x.id !== item.id &&
      ("modelId" in x && "modelId" in item
        ? x.modelId === item.modelId &&
          "providerId" in x &&
          "providerId" in item &&
          x.providerId === item.providerId
        : "name" in x && "name" in item && x.name === item.name),
  );
}
function draftScenes(s: Snapshot, ids: string[]) {
  s.scenes.forEach((x) => {
    if (ids.includes(x.modelId) && x.status === "published") x.status = "draft";
  });
}
export type Change =
  | { kind: "provider"; value: Provider }
  | { kind: "model"; value: Model }
  | { kind: "scene"; value: SceneConfig }
  | { kind: "task"; id: string; action: "retry" | "cancel" };
export function applyChange(snapshot: Snapshot, change: Change): Snapshot {
  const next = structuredClone(snapshot);
  if (change.kind === "provider") {
    const p = ProviderSchema.parse(change.value);
    if (unique(next.providers, p)) throw new Error("供应商名称已存在");
    next.providers = [...next.providers.filter((x) => x.id !== p.id), p];
    if (!p.enabled) {
      const linked = next.models.filter((x) => x.providerId === p.id);
      linked.forEach((x) => {
        x.enabled = false;
      });
      draftScenes(
        next,
        linked.map((x) => x.id),
      );
    }
  } else if (change.kind === "model") {
    const m = ModelSchema.parse(change.value);
    const provider = next.providers.find((x) => x.id === m.providerId);
    if (!provider || (m.enabled && !provider.enabled))
      throw new Error("启用模型前，请先启用关联供应商");
    if (unique(next.models, m)) throw new Error("该供应商下的模型 ID 已存在");
    const scenes = next.scenes.filter((x) => x.modelId === m.id);
    if (scenes.some((x) => !supports(m, x)))
      throw new Error("模型能力或限制与关联场景不兼容，请先调整场景");
    next.models = [...next.models.filter((x) => x.id !== m.id), m];
    if (!m.enabled) draftScenes(next, [m.id]);
  } else if (change.kind === "scene") {
    const s = SceneConfigSchema.parse(change.value);
    const m = next.models.find((x) => x.id === s.modelId);
    if (!m || !supports(m, s))
      throw new Error("关联模型的能力或输入输出上限与场景不兼容");
    if (
      s.status === "published" &&
      (!m.enabled ||
        !next.providers.find((x) => x.id === m.providerId)?.enabled)
    )
      throw new Error("上架前请启用关联模型及供应商");
    if (unique(next.scenes, s)) throw new Error("场景名称已存在");
    next.scenes = [...next.scenes.filter((x) => x.id !== s.id), s];
  } else {
    const t = next.tasks.find((x) => x.id === change.id);
    if (!t) throw new Error("未找到演示任务");
    if (change.action === "cancel") {
      if (!["running", "queued"].includes(t.status))
        throw new Error("仅可取消排队中或执行中的任务");
      t.status = "cancelled";
      t.error = null;
    } else {
      if (!["failed", "cancelled"].includes(t.status))
        throw new Error("仅可重试失败或已取消的任务");
      const model = next.models.find((x) => x.id === t.modelId);
      if (
        !model?.enabled ||
        !next.providers.find((x) => x.id === model.providerId)?.enabled
      )
        throw new Error("关联模型或供应商已停用，无法模拟重试");
      next.tasks.unshift({
        ...t,
        id: `DEMO-T-${crypto.randomUUID().slice(0, 8)}`,
        startedAt: new Date().toISOString(),
        status: "queued",
        duration: 0,
        error: null,
        result: null,
        retryOf: t.id,
      });
    }
  }
  return next;
}
function supports(m: Model, s: SceneConfig) {
  return (
    m.capabilities.some((c) =>
      s.outputKind === "video"
        ? c === "视频生成"
        : c === "图片生成" || c === "图片编辑",
    ) &&
    m.maxInputs >= s.requiredRoles.length &&
    m.maxOutput >= s.outputCount
  );
}
export async function saveChange(change: Change) {
  await wait(420);
  if (failSave) {
    failSave = false;
    throw new Error("模拟保存失败，改动尚未保存。请重试；表单内容已保留。");
  }
  if (demoState === "empty" || demoState === "error")
    throw new Error("请先切回正常演示数据再保存");
  state = applyChange(state, change);
  return structuredClone(state);
}
export function useAdminData() {
  return useQuery({
    queryKey: ["admin-mock"],
    queryFn: readSnapshot,
    retry: false,
  });
}
export function useSave() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveChange,
    onSuccess: (data) => {
      client.setQueryData(["admin-mock"], data);
    },
  });
}
