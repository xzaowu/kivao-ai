import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from 'vitest';
import { ApiErrorSchema, AssetsResponseSchema, CreationResponseSchema, HealthSchema, PlanResponseSchema, SceneResponseSchema, ScenesResponseSchema, TaskResponseSchema, VersionResponseSchema, WorksResponseSchema } from '@kivao/contracts';
import { buildApp } from './app.js';
import { assets, demoCreations, fixtureId, scenes } from './fixtures.js';

type App = Awaited<ReturnType<typeof buildApp>>;
const apps: App[] = [];
async function setup(options: Parameters<typeof buildApp>[0] = {}) { const app = await buildApp(options); apps.push(app); return app; }
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
const input = (sceneId: (typeof scenes)[number]['id'] = 'product-images') => ({
  sceneId, prompt: '用于本地演示的创作计划',
  assets: scenes.find((scene) => scene.id === sceneId)!.requiredRoles.map((role) => ({ assetId: assets.find((asset) => asset.allowedRoles.includes(role))!.id, role })),
});

describe('Mock API', () => {
  it('serves health and every read endpoint using the shared schemas', async () => {
    const app = await setup();
    const endpoints = [
      ['/health', HealthSchema], ['/api/v1/scenes', ScenesResponseSchema],
      ['/api/v1/scenes/product-images', SceneResponseSchema], ['/api/v1/assets', AssetsResponseSchema],
      ['/api/v1/works', WorksResponseSchema], [`/api/v1/tasks/${fixtureId(30)}`, TaskResponseSchema],
      [`/api/v1/versions/${fixtureId(40)}`, VersionResponseSchema],
      [`/api/v1/creations/${fixtureId(20)}`, CreationResponseSchema], [`/api/v1/plans/${fixtureId(10)}`, PlanResponseSchema],
    ] as const;
    for (const [url, schema] of endpoints) {
      const response = await app.inject({ url });
      expect(response.statusCode, url).toBe(200);
      expect(schema.safeParse(response.json()).success, url).toBe(true);
      expect(response.json().mode).toBe('mock');
    }
    const works = WorksResponseSchema.parse((await app.inject({ url: '/api/v1/works' })).json()).data;
    for (const work of works) {
      const version = VersionResponseSchema.parse((await app.inject({ url: `/api/v1/versions/${work.versionId}` })).json()).data;
      expect(version.creationId).toBe(work.creationId);
      expect(version.simulated).toBe(true);
      expect(version.artifactUrl).toBeNull();
      expect(demoCreations.some((creation) => creation.id === work.creationId && creation.versionIds.includes(version.id))).toBe(true);
    }
  });
  it.each(['product-images', 'virtual-try-on', 'reference-video'] as const)('creates and retrieves a plan and draft for %s without executing anything', async (sceneId) => {
    const app = await setup();
    const response = await app.inject({ method: 'POST', url: '/api/v1/plans', payload: input(sceneId) });
    expect(response.statusCode).toBe(201);
    const plan = PlanResponseSchema.parse(response.json()).data;
    expect(plan.estimate.simulated).toBe(true);
    expect((await app.inject({ url: `/api/v1/plans/${plan.id}` })).json()).toEqual(response.json());
    const created = await app.inject({ method: 'POST', url: '/api/v1/creations', payload: { planId: plan.id, confirmed: true } });
    expect(created.statusCode).toBe(201);
    const creation = CreationResponseSchema.parse(created.json()).data;
    expect(creation).toMatchObject({ sceneId, planId: plan.id, status: 'draft', taskIds: [], versionIds: [] });
    expect((await app.inject({ url: `/api/v1/creations/${creation.id}` })).json()).toEqual(created.json());
    expect((await app.inject({ method: 'POST', url: '/api/v1/creations', payload: { planId: plan.id, confirmed: true } })).statusCode).toBe(409);
  });
  it('validates roles, references, confirmation, request shapes and JSON', async () => {
    const app = await setup();
    for (const payload of [
      { ...input(), prompt: ' ' }, { ...input(), assets: [] },
      { ...input('virtual-try-on'), assets: [input('virtual-try-on').assets[0]] },
      { ...input(), assets: [{ assetId: fixtureId(1), role: 'garment' }] },
      { ...input(), assets: [input().assets[0], input().assets[0]] },
      { ...input(), execute: true },
    ]) {
      const response = await app.inject({ method: 'POST', url: '/api/v1/plans', payload });
      expect(response.statusCode).toBe(400);
      expect(ApiErrorSchema.parse(response.json()).error.code).toBe('VALIDATION_ERROR');
    }
    const missing = await app.inject({ method: 'POST', url: '/api/v1/plans', payload: { ...input(), assets: [{ assetId: fixtureId(999), role: 'product' }] } });
    expect(missing.statusCode).toBe(404);
    const unconfirmed = await app.inject({ method: 'POST', url: '/api/v1/creations', payload: { planId: fixtureId(10), confirmed: false } });
    expect(unconfirmed.statusCode).toBe(400);
    const malformed = await app.inject({ method: 'POST', url: '/api/v1/plans', headers: { 'content-type': 'application/json' }, payload: '{' });
    expect(malformed.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(malformed.json()).error.code).toBe('VALIDATION_ERROR');
    const oversized = await app.inject({ method: 'POST', url: '/api/v1/plans', payload: { ...input(), prompt: 'a'.repeat(70_000) } });
    expect(oversized.statusCode).toBe(413);
    expect(ApiErrorSchema.safeParse(oversized.json()).success).toBe(true);
  });
  it('returns consistent errors for missing resources and absent real business interfaces', async () => {
    const app = await setup();
    for (const url of ['/api/v1/scenes/unknown', ...['plans', 'creations', 'tasks', 'versions'].map((name) => `/api/v1/${name}/${fixtureId(999)}`), '/api/v1/auth/login', '/api/v1/billing']) {
      const response = await app.inject({ url });
      expect(response.statusCode, url).toBe(404);
      expect(ApiErrorSchema.parse(response.json()).error.code).toBe('NOT_FOUND');
    }
    const malformedId = await app.inject({ url: '/api/v1/tasks/not-a-uuid' });
    expect(malformedId.statusCode).toBe(400);
    const execution = await app.inject({ method: 'POST', url: `/api/v1/creations/${fixtureId(20)}/execute` });
    expect(execution.statusCode).toBe(404);
    const overwrite = await app.inject({ method: 'PUT', url: `/api/v1/versions/${fixtureId(40)}`, payload: { label: 'overwrite' } });
    expect(overwrite.statusCode).toBe(404);
    expect(VersionResponseSchema.parse((await app.inject({ url: `/api/v1/versions/${fixtureId(40)}` })).json()).data.label).toContain('模拟');
  });
  it('rejects expired plans and bounds process-local storage', async () => {
    let time = new Date('2026-01-01T00:00:00.000Z');
    const app = await setup({ now: () => time, capacity: 4 });
    const plan = PlanResponseSchema.parse((await app.inject({ method: 'POST', url: '/api/v1/plans', payload: input() })).json()).data;
    expect((await app.inject({ method: 'POST', url: '/api/v1/plans', payload: input() })).statusCode).toBe(503);
    time = new Date('2026-01-01T00:30:00.000Z');
    const expired = await app.inject({ method: 'POST', url: '/api/v1/creations', payload: { planId: plan.id, confirmed: true } });
    expect(expired.statusCode).toBe(410);
    expect(ApiErrorSchema.parse(expired.json()).error.code).toBe('PLAN_EXPIRED');
    const otherApp = await setup();
    expect((await otherApp.inject({ url: `/api/v1/plans/${plan.id}` })).statusCode).toBe(404);
  });
  it('does not expose internal exception details in server errors', async () => {
    const app = await setup({ now: () => { throw new Error('private implementation detail'); } });
    const response = await app.inject({ method: 'POST', url: '/api/v1/plans', payload: input() });
    expect(response.statusCode).toBe(500);
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('INTERNAL_ERROR');
    expect(response.body).not.toContain('private implementation detail');
  });
  it('generates the committed OpenAPI from the runtime route schemas', async () => {
    const app = await setup();
    const response = await app.inject({ url: '/openapi.json' });
    expect(response.statusCode).toBe(200);
    const spec = response.json();
    expect(spec.openapi).toBe('3.0.3');
    expect(Object.keys(spec.paths)).toHaveLength(11);
    expect(spec.paths['/api/v1/plans'].post.requestBody.required).toBe(true);
    expect(spec.paths['/api/v1/creations'].post.responses['201']).toBeDefined();
    for (const name of ['Scene', 'Asset', 'CreationPlan', 'Creation', 'Task', 'Version', 'Work', 'ApiError']) {
      expect(spec.components.schemas[name], name).toBeDefined();
    }
    for (const match of JSON.stringify(spec).matchAll(/"\$ref":"([^"]+)"/g)) {
      const reference = match[1]!;
      expect(reference.startsWith('#/'), reference).toBe(true);
      let target: unknown = spec;
      for (const part of reference.slice(2).split('/')) {
        target = (target as Record<string, unknown> | undefined)?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
      }
      expect(target, reference).toBeDefined();
    }
    expect(spec).toEqual(JSON.parse(await readFile(new URL('../../../docs/openapi.json', import.meta.url), 'utf8')));
  });
});
