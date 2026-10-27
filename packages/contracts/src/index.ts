import { z } from 'zod';

export const IdSchema = z.uuid();
const TimestampSchema = z.iso.datetime();
export const AssetRoleSchema = z.enum(['product', 'person', 'garment', 'reference_video']);
export const AssetReferenceSchema = z.object({ assetId: IdSchema, role: AssetRoleSchema }).strict();

export const SceneSchema = z.object({
  id: z.enum(['product-images', 'virtual-try-on', 'reference-video']),
  name: z.string().min(1), description: z.string(),
  requiredRoles: z.array(AssetRoleSchema).min(1), outputKind: z.enum(['image', 'video']),
}).meta({ id: 'Scene', description: '可执行创作场景的定义，不是创作、任务或作品。' });

export const AssetSchema = z.object({
  id: IdSchema, name: z.string().min(1), kind: z.enum(['image', 'video']),
  allowedRoles: z.array(AssetRoleSchema).min(1), source: z.enum(['user_upload', 'mock_fixture']), createdAt: TimestampSchema,
}).meta({ id: 'Asset', description: '用户素材；在创作输入中通过 assetId 和 role 引用。' });

export const CreatePlanSchema = z.object({
  sceneId: SceneSchema.shape.id,
  prompt: z.string().trim().min(1).max(2000),
  assets: z.array(AssetReferenceSchema).min(1).max(10),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.assets.map((asset) => asset.assetId)).size !== value.assets.length) {
    ctx.addIssue({ code: 'custom', path: ['assets'], message: '素材不可重复引用' });
  }
});

export const CreationPlanSchema = z.object({
  id: IdSchema, input: CreatePlanSchema, status: z.literal('awaiting_confirmation'),
  estimate: z.object({ currency: z.literal('CNY'), amountMinor: z.number().int().nonnegative(), simulated: z.literal(true) }),
  createdAt: TimestampSchema, expiresAt: TimestampSchema,
}).meta({ id: 'CreationPlan', description: '执行前的输入快照和费用估算，不代表扣费或执行。' });

export const CreateCreationSchema = z.object({ planId: IdSchema, confirmed: z.literal(true) }).strict();
export const CreationSchema = z.object({
  id: IdSchema, sceneId: SceneSchema.shape.id, planId: IdSchema,
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  taskIds: z.array(IdSchema), versionIds: z.array(IdSchema), createdAt: TimestampSchema,
}).meta({ id: 'Creation', description: '持续创作的容器，可关联多个任务和不可覆盖的结果版本。' });

export const TaskSchema = z.object({
  id: IdSchema, creationId: IdSchema,
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']),
  progress: z.number().int().min(0).max(100), versionId: IdSchema.nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  simulated: z.boolean(), createdAt: TimestampSchema,
}).meta({ id: 'Task', description: '一次异步执行的状态；Mock 任务是固定演示记录。' });

export const VersionSchema = z.object({
  id: IdSchema, creationId: IdSchema, taskId: IdSchema, ordinal: z.number().int().positive(),
  kind: z.enum(['image', 'video']), label: z.string().min(1),
  artifactUrl: z.url().nullable(), simulated: z.boolean(), createdAt: TimestampSchema,
}).readonly().meta({ id: 'Version', description: '不可覆盖的生成结果版本；模拟版本没有真实生成文件。' });

export const WorkSchema = z.object({
  id: IdSchema, creationId: IdSchema, versionId: IdSchema, title: z.string().min(1), savedAt: TimestampSchema,
}).meta({ id: 'Work', description: '用户明确保存的作品，引用特定结果版本。' });

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'PLAN_EXPIRED', 'CONFLICT', 'MOCK_CAPACITY_REACHED', 'NOT_IMPLEMENTED', 'INTERNAL_ERROR']),
    message: z.string(), requestId: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
}).meta({ id: 'ApiError' });

export const HealthSchema = z.object({ status: z.literal('ok'), mode: z.literal('mock') });
export const mockResponse = <T extends z.ZodType>(schema: T) => z.object({ mode: z.literal('mock'), data: schema });
export const ScenesResponseSchema = mockResponse(z.array(SceneSchema));
export const SceneResponseSchema = mockResponse(SceneSchema);
export const PlanResponseSchema = mockResponse(CreationPlanSchema);
export const CreationResponseSchema = mockResponse(CreationSchema);
export const TaskResponseSchema = mockResponse(TaskSchema);
export const VersionResponseSchema = mockResponse(VersionSchema);
export const AssetsResponseSchema = mockResponse(z.array(AssetSchema));
export const WorksResponseSchema = mockResponse(z.array(WorkSchema));

export type Scene = z.infer<typeof SceneSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type AssetReference = z.infer<typeof AssetReferenceSchema>;
export type CreationPlan = z.infer<typeof CreationPlanSchema>;
export type Creation = z.infer<typeof CreationSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type Work = z.infer<typeof WorkSchema>;
export type CreatePlan = z.infer<typeof CreatePlanSchema>;
export type CreateCreation = z.infer<typeof CreateCreationSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
