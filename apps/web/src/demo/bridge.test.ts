import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildApp } from '../../../api/src/app.js';
import { createApiCreation, getApiCreation, getApiPlan } from '../api';
import { preparePlan } from './bridge';
import { makeCreation } from './store';
import { advanceRun, startRun } from './model';

let app: Awaited<ReturnType<typeof buildApp>>;
const paths: string[] = [];
beforeEach(async () => {
  app = await buildApp();
  paths.length = 0;
  vi.stubGlobal('fetch', async (path: string, init?: RequestInit) => {
    paths.push(`${init?.method || 'GET'} ${path}`);
    const response = await app.inject({
      method: init?.method === 'POST' ? 'POST' : 'GET',
      url: path,
      ...(init?.body
        ? {
            payload: String(init.body),
            headers: { 'content-type': 'application/json' },
          }
        : {}),
    });
    return new Response(response.body, {
      status: response.statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await app.close();
});
it.each(['product', 'tryon', 'video'])(
  'uses the existing API for %s and keeps execution in the frontend adapter',
  async (sceneId) => {
    const client = new QueryClient(),
      creation = makeCreation(sceneId, 1, { demo: true });
    const plan = await preparePlan(creation, client);
    expect(plan.source).toBe('mock_api');
    expect(plan.backend?.estimate.simulated).toBe(true);
    expect((await getApiPlan(plan.backend!.id)).data).toEqual(plan.backend);
    const backend = (await createApiCreation(plan.backend!.id)).data;
    const running = startRun(
      { ...creation, plan, phase: 'confirm', backend },
      Date.now(),
    );
    const completed = advanceRun(running, Date.now() + 3000);
    expect(completed.versions).toHaveLength(1);
    expect((await getApiCreation(backend.id)).data).toMatchObject({
      status: 'draft',
      taskIds: [],
      versionIds: [],
    });
    expect(paths.some((path) => path.includes('/execute'))).toBe(false);
    expect(
      paths.some((path) => /billing|auth|upload|versions/.test(path)),
    ).toBe(false);
    client.clear();
  },
);
it('never silently substitutes a local plan when the core API fails', async () => {
  vi.stubGlobal('fetch', async () => {
    throw new Error('network unavailable');
  });
  await expect(
    preparePlan(makeCreation('product', 1, { demo: true }), new QueryClient()),
  ).rejects.toThrow('无法连接');
  const free = await preparePlan(
    makeCreation('free-image', 1, { prompt: '自然光商品展示' }),
    new QueryClient(),
  );
  expect(free.source).toBe('frontend_demo');
  expect(free.backend).toBeUndefined();
});
