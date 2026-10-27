import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import { jsonSchemaTransform, jsonSchemaTransformObject, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ApiErrorSchema, AssetsResponseSchema, CreateCreationSchema, CreatePlanSchema, CreationResponseSchema,
  HealthSchema, IdSchema, PlanResponseSchema, SceneResponseSchema, ScenesResponseSchema,
  TaskResponseSchema, VersionResponseSchema, WorksResponseSchema,
  type ApiError, type Creation, type CreationPlan,
} from '@kivao/contracts';
import { assets, demoCreations, fixtureId, scenes, tasks, versions, works } from './fixtures.js';

class ApiFailure extends Error {
  constructor(readonly statusCode: number, readonly code: ApiError['error']['code'], message: string) { super(message); }
}
const errors = { 400: ApiErrorSchema, 404: ApiErrorSchema, 409: ApiErrorSchema, 410: ApiErrorSchema, 413: ApiErrorSchema, 503: ApiErrorSchema, 500: ApiErrorSchema };
const idParams = z.object({ id: IdSchema });
const mock = <T>(data: T) => ({ mode: 'mock' as const, data });

export async function buildApp(options: { logger?: boolean; now?: () => Date; capacity?: number } = {}) {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 64 * 1024 }).withTypeProvider<ZodTypeProvider>();
  const now = options.now ?? (() => new Date());
  const capacity = options.capacity ?? 1000;
  // shortcut: process-local demo storage, replace with authenticated persistence before real use.
  const plans = new Map<string, CreationPlan>();
  const creations = new Map<string, Creation>(demoCreations.map((creation) => [creation.id, creation]));
  scenes.forEach((scene, i) => plans.set(fixtureId(10 + i), {
    id: fixtureId(10 + i), status: 'awaiting_confirmation',
    input: { sceneId: scene.id, prompt: `模拟${scene.name}`, assets: scene.requiredRoles.map((role) => ({ assetId: assets.find((asset) => asset.allowedRoles.includes(role))!.id, role })) },
    estimate: { currency: 'CNY', amountMinor: 0, simulated: true },
    createdAt: '2026-01-01T00:00:00.000Z', expiresAt: '2026-01-01T01:00:00.000Z',
  }));

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number }, request, reply) => {
    const known = error instanceof ApiFailure;
    const validation = Boolean(error.validation) || error.statusCode === 400 || error.statusCode === 413 || error.statusCode === 415;
    const status = known ? error.statusCode : validation ? (error.statusCode === 413 ? 413 : 400) : 500;
    if (status === 500) request.log.error({ err: error }, 'Request failed');
    reply.code(status).send({ error: {
      code: known ? error.code : validation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message: known ? error.message : validation ? '请求格式或参数不符合契约。' : '服务内部错误。', requestId: request.id,
    } });
  });
  app.setNotFoundHandler((request, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: '接口不存在；真实执行、支付和登录尚未实现。', requestId: request.id } }));
  await app.register(swagger, {
    openapi: { openapi: '3.0.3', info: { title: 'KIVAO Mock API', version: '0.1.0', description: '仅供本地开发；所有业务响应均为模拟数据，不执行生成、不扣费、无登录。' } },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  app.get('/health', { schema: { operationId: 'health', response: { 200: HealthSchema } } }, async () => ({ status: 'ok', mode: 'mock' } as const));
  app.get('/api/v1/scenes', { schema: { operationId: 'listScenes', response: { 200: ScenesResponseSchema, ...errors } } }, async () => mock(scenes));
  app.get('/api/v1/scenes/:id', { schema: { operationId: 'getScene', params: z.object({ id: z.string().min(1).max(100) }), response: { 200: SceneResponseSchema, ...errors } } }, async (request) => {
    const scene = scenes.find((item) => item.id === request.params.id);
    if (!scene) throw new ApiFailure(404, 'NOT_FOUND', '场景不存在。');
    return mock(scene);
  });
  app.get('/api/v1/assets', { schema: { operationId: 'listAssets', response: { 200: AssetsResponseSchema, ...errors } } }, async () => mock(assets));
  app.get('/api/v1/works', { schema: { operationId: 'listWorks', response: { 200: WorksResponseSchema, ...errors } } }, async () => mock(works));

  app.post('/api/v1/plans', { schema: { operationId: 'createPlan', body: CreatePlanSchema, response: { 201: PlanResponseSchema, ...errors } } }, async (request, reply) => {
    const input = request.body;
    const scene = scenes.find((item) => item.id === input.sceneId)!;
    for (const ref of input.assets) {
      const asset = assets.find((item) => item.id === ref.assetId);
      if (!asset) throw new ApiFailure(404, 'NOT_FOUND', '引用的素材不存在。');
      if (!asset.allowedRoles.includes(ref.role) || !scene.requiredRoles.includes(ref.role)) throw new ApiFailure(400, 'VALIDATION_ERROR', '素材引用角色不适用于本场景。');
    }
    if (!scene.requiredRoles.every((role) => input.assets.some((ref) => ref.role === role))) throw new ApiFailure(400, 'VALIDATION_ERROR', '缺少场景要求的素材角色。');
    if (plans.size >= capacity) throw new ApiFailure(503, 'MOCK_CAPACITY_REACHED', 'Mock 存储已满，请重启开发服务。');
    const created = now();
    const plan: CreationPlan = {
      id: randomUUID(), input, status: 'awaiting_confirmation',
      estimate: { currency: 'CNY', amountMinor: scene.outputKind === 'video' ? 2000 : 500, simulated: true },
      createdAt: created.toISOString(), expiresAt: new Date(created.getTime() + 30 * 60 * 1000).toISOString(),
    };
    plans.set(plan.id, plan);
    return reply.code(201).send(mock(plan));
  });
  app.get('/api/v1/plans/:id', { schema: { operationId: 'getPlan', params: idParams, response: { 200: PlanResponseSchema, ...errors } } }, async (request) => {
    const plan = plans.get(request.params.id);
    if (!plan) throw new ApiFailure(404, 'NOT_FOUND', '创作计划不存在。');
    return mock(plan);
  });
  app.post('/api/v1/creations', { schema: { operationId: 'createCreation', body: CreateCreationSchema, response: { 201: CreationResponseSchema, ...errors } } }, async (request, reply) => {
    const plan = plans.get(request.body.planId);
    if (!plan) throw new ApiFailure(404, 'NOT_FOUND', '创作计划不存在。');
    if (Date.parse(plan.expiresAt) <= now().getTime()) throw new ApiFailure(410, 'PLAN_EXPIRED', '创作计划已过期，请重新获取模拟估算。');
    if ([...creations.values()].some((creation) => creation.planId === plan.id)) throw new ApiFailure(409, 'CONFLICT', '该计划已经创建了创作。');
    if (creations.size >= capacity) throw new ApiFailure(503, 'MOCK_CAPACITY_REACHED', 'Mock 存储已满，请重启开发服务。');
    const creation: Creation = { id: randomUUID(), sceneId: plan.input.sceneId, planId: plan.id, status: 'draft', taskIds: [], versionIds: [], createdAt: now().toISOString() };
    creations.set(creation.id, creation);
    return reply.code(201).send(mock(creation));
  });
  app.get('/api/v1/creations/:id', { schema: { operationId: 'getCreation', params: idParams, response: { 200: CreationResponseSchema, ...errors } } }, async (request) => {
    const creation = creations.get(request.params.id);
    if (!creation) throw new ApiFailure(404, 'NOT_FOUND', '创作不存在。');
    return mock(creation);
  });
  app.get('/api/v1/tasks/:id', { schema: { operationId: 'getTask', params: idParams, response: { 200: TaskResponseSchema, ...errors } } }, async (request) => {
    const task = tasks.find((item) => item.id === request.params.id);
    if (!task) throw new ApiFailure(404, 'NOT_FOUND', '任务不存在。');
    return mock(task);
  });
  app.get('/api/v1/versions/:id', { schema: { operationId: 'getVersion', params: idParams, response: { 200: VersionResponseSchema, ...errors } } }, async (request) => {
    const version = versions.find((item) => item.id === request.params.id);
    if (!version) throw new ApiFailure(404, 'NOT_FOUND', '结果版本不存在。');
    return mock(version);
  });
  app.get('/openapi.json', { schema: { hide: true } }, async () => app.swagger());
  await app.ready();
  return app;
}
