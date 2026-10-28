import { z } from 'zod';
import features from '../data/features.json';
import {
  CreationPlanSchema,
  CreationSchema,
  TaskSchema,
  VersionSchema,
  WorkSchema,
} from '@kivao/contracts';
import {
  AssetKeySchema,
  MaterialSchema,
  demoMaterials,
  materialUrl,
  requireScene,
  type Material,
} from '../data/catalog';

export const OutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  asset: AssetKeySchema,
  kind: z.enum(['image', 'video', 'text']),
  body: z.string().optional(),
  poster: AssetKeySchema.optional(),
  layout: z.enum([
    'normal',
    'poster',
    'detail',
    'editorial',
    'background',
    'cutout',
  ]),
  brief: z.string(),
  revision: z.number().int().positive(),
});
export type Output = z.infer<typeof OutputSchema>;
export const SettingsSchema = z
  .object({
    ratio: z.enum(['3:4', '1:1', '4:5', '2:3', '16:9']),
    count: z.enum(['1', '2', '4', '6']),
  })
  .catchall(z.string());
const SnapshotSchema = z.object({
  settings: SettingsSchema,
  bindings: z.record(z.string(), z.string()),
  prompt: z.string().max(2000),
});
const AdjustmentSchema = z.object({
  baseVersion: z.number().int().positive(),
  ids: z.array(z.string()).min(1),
  intent: z.string().min(1),
  note: z.string().max(500),
});
export type Adjustment = z.infer<typeof AdjustmentSchema>;
export const DemoPlanSchema = z.object({
  source: z.enum(['mock_api', 'frontend_demo']),
  backend: CreationPlanSchema.optional(),
  items: z.array(OutputSchema),
  snapshot: SnapshotSchema,
  adjustment: AdjustmentSchema.nullable(),
});
export type DemoPlan = z.infer<typeof DemoPlanSchema>;
const DemoVersionSchema = z.object({
  record: VersionSchema.unwrap().extend({
    kind: z.enum(['image', 'video', 'text']),
  }),
  items: z.array(OutputSchema),
  snapshot: SnapshotSchema,
  adjustment: AdjustmentSchema.nullable(),
});
export type DemoVersion = z.infer<typeof DemoVersionSchema>;
export const DemoCreationSchema = z.object({
  id: z.uuid(),
  shortId: z.string(),
  sceneId: z.enum([
    'product',
    'tryon',
    'video',
    'free-image',
    'free-video',
    'image-remix',
    'image-background',
    'image-cutout',
    'video-product',
    'video-motion',
    'video-outfit',
    'video-avatar',
    'video-upscale',
    'video-clean',
    'video-transcript',
  ]),
  name: z.string(),
  draft: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  phase: z.enum(['materials', 'confirm', 'running', 'review']),
  prompt: z.string().max(2000),
  settings: SettingsSchema,
  bindings: z.record(z.string(), z.string()),
  backend: CreationSchema.optional(),
  plan: DemoPlanSchema.nullable(),
  task: TaskSchema.optional(),
  versions: z.array(DemoVersionSchema),
  activeVersion: z.number().int().nonnegative(),
  selected: z.array(z.string()),
  execution: z
    .object({ startedAt: z.number(), duration: z.number().positive() })
    .nullable(),
});
export type DemoCreation = z.infer<typeof DemoCreationSchema>;
export const DemoWorkSchema = z.object({
  record: WorkSchema,
  sessionId: z.uuid(),
  creationName: z.string(),
  sceneId: z.string(),
  ordinal: z.number().int().positive(),
  output: OutputSchema,
  snapshot: SnapshotSchema,
});
export type DemoWork = z.infer<typeof DemoWorkSchema>;
export const PersistedStateSchema = z.object({
  schema: z.literal(2),
  creations: z.array(DemoCreationSchema).max(100),
  works: z.array(DemoWorkSchema).max(1000),
  uploads: z.array(MaterialSchema).max(30),
});
export type DemoState = z.infer<typeof PersistedStateSchema> & {
  uploads: Material[];
  storageWarning: string;
};
export function snapshot(creation: DemoCreation) {
  return {
    settings: { ...creation.settings },
    bindings: { ...creation.bindings },
    prompt: creation.prompt,
  };
}
export function currentVersion(creation: DemoCreation) {
  return creation.versions.find(
    (version) => version.record.ordinal === creation.activeVersion,
  );
}
export function isDirty(creation: DemoCreation) {
  const version = currentVersion(creation);
  return Boolean(
    version &&
      JSON.stringify(snapshot(creation)) !== JSON.stringify(version.snapshot),
  );
}
export function isSaved(creation: DemoCreation, works: DemoWork[]) {
  const version = currentVersion(creation);
  return Boolean(
    version &&
      version.items.every((item) =>
        works.some(
          (work) =>
            work.record.versionId === version.record.id &&
            work.output.id === item.id,
        ),
      ),
  );
}
export function missingRoles(creation: DemoCreation, uploads: Material[]) {
  const materials = [...demoMaterials, ...uploads];
  return requireScene(creation.sceneId).roles.filter(
    (role) =>
      role.required &&
      !materials.some(
        (item) =>
          item.id === creation.bindings[role.id] &&
          item.media === role.media &&
          materialUrl(item),
      ),
  );
}
export function validateCreation(creation: DemoCreation, uploads: Material[]) {
  const missing = missingRoles(creation, uploads);
  if (missing.length)
    throw new Error(
      `请先准备${missing.map((role) => role.label).join('、')}。`,
    );
  if (creation.sceneId === 'video-avatar' && !creation.settings.script?.trim())
    throw new Error('请填写口播文稿。');
  if (creation.sceneId.startsWith('free-') && !creation.prompt.trim())
    throw new Error('请描述目标，或填入演示想法。');
}
export function outputsFor(creation: DemoCreation): Output[] {
  const tool = features.VIDEO_TOOLS.find(
    (item) => item.scene === creation.sceneId,
  );
  if (creation.sceneId === 'video-transcript')
    return [
      {
        id: 'out-1',
        title: '台词示例稿',
        kind: 'text',
        asset: 'bakery',
        layout: 'normal',
        brief: '手写预置文稿，非实时语音识别',
        revision: 1,
        body:
          creation.settings.format === '纯文本'
            ? '清晨，从一炉刚出炉的面包开始。\n手作的温度，藏在每一个细节里。\n来巷口面包房，留住今天的香气。'
            : '[00:00–00:04] 清晨，从一炉刚出炉的面包开始。\n[00:04–00:08] 手作的温度，藏在每一个细节里。\n[00:08–00:12] 来巷口面包房，留住今天的香气。',
      },
    ];
  if (creation.sceneId.startsWith('video-'))
    return [
      {
        id: 'out-1',
        title: tool?.name + ' · 预制样片',
        kind: 'video',
        asset: AssetKeySchema.parse(tool?.clip),
        poster: AssetKeySchema.parse(tool?.poster),
        layout: 'normal',
        brief: '12 秒静态素材剪辑，不执行真实视频处理',
        revision: 1,
      },
    ];
  if (creation.sceneId.startsWith('image-'))
    return Array.from(
      { length: Number(creation.settings.count || 2) },
      (_, i) => ({
        id: `out-${i + 1}`,
        title: `${requireScene(creation.sceneId).name} · 示意 ${i + 1}`,
        kind: 'image' as const,
        asset:
          creation.sceneId === 'image-remix'
            ? ('tea' as const)
            : ('garment' as const),
        layout:
          creation.sceneId === 'image-cutout'
            ? ('cutout' as const)
            : creation.sceneId === 'image-background'
              ? ('background' as const)
              : ('normal' as const),
        brief: '预制概念示意，不改变用户上传的图片',
        revision: 1,
      }),
    );
  const count = Number(creation.settings.count || 1),
    scene = requireScene(creation.sceneId);
  let titles: string[];
  if (creation.sceneId === 'product')
    titles = [
      '商品主视觉',
      '自然使用场景',
      '包装与材质细节',
      '品牌上新海报',
      ...(count === 6 ? ['社媒竖版视觉', '渠道封面延展'] : []),
    ];
  else if (creation.sceneId === 'tryon')
    titles = [
      '正面换装展示',
      '搭配效果展示',
      ...(count === 4 ? ['服装结构细节', '搭配场景延展'] : []),
    ];
  else if (scene.output === '视频') titles = ['门店清晨短片'];
  else
    titles = Array.from(
      { length: count },
      (_, index) => `创作画面 ${index + 1}`,
    );
  return titles.map((title, index) => ({
    id: `out-${index + 1}`,
    title,
    kind: scene.output === '视频' ? 'video' : 'image',
    revision: 1,
    asset:
      scene.output === '视频'
        ? 'bakery-demo'
        : creation.sceneId === 'product'
          ? 'tea'
          : creation.sceneId === 'tryon'
            ? 'tryon'
            : index % 2
              ? 'tea'
              : 'serum',
    layout:
      creation.sceneId === 'product'
        ? index === 3
          ? 'poster'
          : index === 2
            ? 'detail'
            : index >= 4
              ? 'editorial'
              : 'normal'
        : creation.sceneId === 'tryon' && index === 2
          ? 'detail'
          : 'normal',
    brief:
      scene.output === '视频'
        ? '12 秒 · 16:9 · 3 段镜头'
        : creation.sceneId === 'product'
          ? [
              '突出商品主体与品牌识别',
              '让商品进入真实使用情境',
              '检查包装与材质表达',
              '为新品提供完整的海报表达',
              '适配社媒展示',
              '提供渠道封面',
            ][index]!
          : creation.sceneId === 'tryon'
            ? '保留人物身份与指定服装，观察搭配与细节。'
            : '按目标、参考素材和配置准备的图片演示',
  }));
}
export function makeLocalPlan(
  creation: DemoCreation,
  adjustment: Adjustment | null = null,
): DemoPlan {
  if (adjustment && isDirty(creation))
    throw new Error('设置已修改，请先恢复此版本设置，或生成新一版。');
  const base = adjustment ? currentVersion(creation) : undefined;
  if (
    adjustment &&
    (!base ||
      adjustment.baseVersion !== base.record.ordinal ||
      adjustment.ids.some((id) => !base.items.some((item) => item.id === id)))
  )
    throw new Error('调整范围不属于当前版本。');
  return {
    source: 'frontend_demo',
    items: base
      ? base.items.filter((item) => adjustment!.ids.includes(item.id))
      : outputsFor(creation),
    snapshot: snapshot(creation),
    adjustment,
  };
}
export function startRun(creation: DemoCreation, now: number): DemoCreation {
  if (creation.phase !== 'confirm' || !creation.plan)
    throw new Error('请先核对创作计划。');
  if (creation.plan.source === 'mock_api' && !creation.backend)
    throw new Error('请先通过 Mock API 确认创作。');
  if (
    creation.plan.backend &&
    Date.parse(creation.plan.backend.expiresAt) <= now
  )
    throw new Error('创作计划已过期，请返回修改并重新获取计划。');
  const task = TaskSchema.parse({
    id: crypto.randomUUID(),
    creationId: creation.backend?.id || creation.id,
    status: 'running',
    progress: 0,
    versionId: null,
    error: null,
    simulated: true,
    createdAt: new Date(now).toISOString(),
  });
  return {
    ...creation,
    phase: 'running',
    draft: false,
    task,
    execution: { startedAt: now, duration: 2400 },
    updatedAt: new Date(now).toISOString(),
  };
}
export function advanceRun(creation: DemoCreation, now: number): DemoCreation {
  if (
    creation.phase !== 'running' ||
    !creation.execution ||
    !creation.task ||
    !creation.plan
  )
    return creation;
  const progress = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((now - creation.execution.startedAt) / creation.execution.duration) *
          100,
      ),
    ),
  );
  if (progress < 100)
    return progress === creation.task.progress
      ? creation
      : { ...creation, task: { ...creation.task, progress } };
  const ordinal = (creation.versions.at(-1)?.record.ordinal || 0) + 1,
    { adjustment } = creation.plan;
  const base = adjustment
    ? creation.versions.find(
        (version) => version.record.ordinal === adjustment.baseVersion,
      )
    : undefined;
  const items = base
    ? base.items.map((item) =>
        adjustment!.ids.includes(item.id)
          ? { ...item, revision: ordinal }
          : item,
      )
    : creation.plan.items.map((item) => ({ ...item, revision: ordinal }));
  const record = DemoVersionSchema.shape.record.parse({
    id: crypto.randomUUID(),
    creationId: creation.task.creationId,
    taskId: creation.task.id,
    ordinal,
    kind:
      creation.sceneId === 'video-transcript'
        ? 'text'
        : requireScene(creation.sceneId).output === '视频'
          ? 'video'
          : 'image',
    label: `V${ordinal} · 前端演示结果`,
    artifactUrl: null,
    simulated: true,
    createdAt: new Date(now).toISOString(),
  });
  const version: DemoVersion = {
    record,
    items,
    snapshot: structuredClone(creation.plan.snapshot),
    adjustment,
  };
  return {
    ...creation,
    phase: 'review',
    execution: null,
    versions: [...creation.versions, version],
    activeVersion: ordinal,
    selected: adjustment ? [...adjustment.ids] : items.map((item) => item.id),
    task: {
      ...creation.task,
      status: 'succeeded',
      progress: 100,
      versionId: record.id,
    },
    updatedAt: new Date(now).toISOString(),
  };
}
export function cancelRun(creation: DemoCreation): DemoCreation {
  if (creation.phase !== 'running') return creation;
  return {
    ...creation,
    phase: 'confirm',
    execution: null,
    ...(creation.task
      ? { task: { ...creation.task, status: 'cancelled' as const } }
      : {}),
  };
}
export function saveSelected(
  creation: DemoCreation,
  existing: DemoWork[],
  reviewed: boolean,
): DemoWork[] {
  const version = currentVersion(creation);
  if (
    !reviewed ||
    creation.phase !== 'review' ||
    !version ||
    !creation.selected.length
  )
    throw new Error('请先选中结果并完成人工审核。');
  const additions = version.items
    .filter(
      (item) =>
        creation.selected.includes(item.id) &&
        !existing.some(
          (work) =>
            work.record.versionId === version.record.id &&
            work.output.id === item.id,
        ),
    )
    .map((item) => ({
      record: WorkSchema.parse({
        id: crypto.randomUUID(),
        creationId: version.record.creationId,
        versionId: version.record.id,
        title: item.title,
        savedAt: new Date().toISOString(),
      }),
      sessionId: creation.id,
      creationName: creation.name,
      sceneId: creation.sceneId,
      ordinal: version.record.ordinal,
      output: structuredClone(item),
      snapshot: structuredClone(version.snapshot),
    }));
  if (existing.length + additions.length > 1000)
    throw new Error('本地演示作品数量已达上限。');
  return [...existing, ...additions];
}
