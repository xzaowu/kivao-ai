import { describe, expect, it } from 'vitest';
import { CreationPlanSchema } from '@kivao/contracts';
import {
  advanceRun,
  cancelRun,
  currentVersion,
  isDirty,
  isSaved,
  makeLocalPlan,
  saveSelected,
  startRun,
  validateCreation,
  type DemoCreation,
  type DemoState,
} from './model';
import { makeCreation, readPersisted, serializeState } from './store';

const now = Date.parse('2026-10-28T00:00:00.000Z');
function readyProduct() {
  const creation = makeCreation('product', 1, { demo: true });
  creation.settings.count = '6';
  return {
    ...creation,
    phase: 'confirm' as const,
    plan: makeLocalPlan(creation),
  };
}
function complete(creation: DemoCreation) {
  return advanceRun(startRun(creation, now), now + 3000);
}

describe('isolated frontend demonstration adapter', () => {
  it('requires real material bindings and an explicit goal for free creation', () => {
    expect(() => validateCreation(makeCreation('tryon', 1), [])).toThrow(
      '模特图',
    );
    expect(() => validateCreation(makeCreation('free-image', 1), [])).toThrow(
      '描述目标',
    );
    const stale = makeCreation('product', 1, {
      bindings: { product: 'local-file' },
    });
    expect(() =>
      validateCreation(stale, [
        {
          id: 'local-file',
          name: '失效图片',
          media: 'image',
          role: '商品图',
          local: true,
        },
      ]),
    ).toThrow('准备');
  });
  it('requires plan confirmation, keeps progress bounded, and cancellation creates no version', () => {
    expect(() =>
      startRun(makeCreation('product', 1, { demo: true }), now),
    ).toThrow('计划');
    const running = startRun(readyProduct(), now);
    expect(advanceRun(running, now - 200).task?.progress).toBe(0);
    expect(advanceRun(running, now + 1200).task?.progress).toBe(50);
    const cancelled = cancelRun(running);
    expect(cancelled.phase).toBe('confirm');
    expect(cancelled.task?.status).toBe('cancelled');
    expect(advanceRun(cancelled, now + 5000).versions).toHaveLength(0);
    expect(complete(cancelled).versions).toHaveLength(1);
  });
  it('retains V1, revises only selected outputs, and preserves confirmed work snapshots', () => {
    const first = complete(readyProduct()),
      original = structuredClone(first.versions[0]);
    first.selected = ['out-1', 'out-2'];
    const works = saveSelected(first, [], true),
      savedSnapshot = structuredClone(works);
    expect(works).toHaveLength(2);
    expect(isSaved(first, works)).toBe(false);
    expect(saveSelected(first, works, true)).toHaveLength(2);
    expect(() => saveSelected(first, [], false)).toThrow('人工审核');
    const adjustment = {
      baseVersion: 1,
      ids: ['out-1', 'out-2'],
      intent: '背景更简洁',
      note: '',
    };
    const second = complete({
      ...first,
      phase: 'confirm',
      plan: makeLocalPlan(first, adjustment),
    });
    expect(second.versions).toHaveLength(2);
    expect(second.versions[0]).toEqual(original);
    expect(currentVersion(second)?.items.map((item) => item.revision)).toEqual([
      2, 2, 1, 1, 1, 1,
    ]);
    expect(second.selected).toEqual(['out-1', 'out-2']);
    expect(works).toEqual(savedSnapshot);
    expect(currentVersion(second)?.record.artifactUrl).toBeNull();
    expect(currentVersion(second)?.record.simulated).toBe(true);
    expect(advanceRun(second, now + 8000).versions).toHaveLength(2);
  });
  it('blocks adjusting old results with changed settings and protects old ratios when saving', () => {
    const first = complete(readyProduct());
    first.selected = ['out-1'];
    const changed = {
      ...first,
      settings: { ...first.settings, ratio: '1:1' as const },
    };
    expect(isDirty(changed)).toBe(true);
    expect(() =>
      makeLocalPlan(changed, {
        baseVersion: 1,
        ids: ['out-1'],
        intent: '调整',
        note: '',
      }),
    ).toThrow('设置已修改');
    expect(saveSelected(changed, [], true)[0]?.snapshot.settings.ratio).toBe(
      '3:4',
    );
    expect(currentVersion(changed)?.snapshot.settings.ratio).toBe('3:4');
    expect(() =>
      makeLocalPlan(first, {
        baseVersion: 1,
        ids: ['unknown-output'],
        intent: '调整',
        note: '',
      }),
    ).toThrow('调整范围');
  });
  it('rejects expired API plans and unconfirmed backend creation references', () => {
    const creation = readyProduct(),
      backend = CreationPlanSchema.parse({
        id: crypto.randomUUID(),
        input: {
          sceneId: 'product-images',
          prompt: '演示',
          assets: [{ assetId: crypto.randomUUID(), role: 'product' }],
        },
        status: 'awaiting_confirmation',
        estimate: { currency: 'CNY', amountMinor: 500, simulated: true },
        createdAt: new Date(now - 2000).toISOString(),
        expiresAt: new Date(now - 1).toISOString(),
      });
    const plan = { ...creation.plan!, source: 'mock_api' as const, backend };
    expect(() => startRun({ ...creation, plan }, now)).toThrow('Mock API 确认');
    expect(() =>
      startRun(
        {
          ...creation,
          plan,
          backend: {
            id: crypto.randomUUID(),
            sceneId: 'product-images',
            planId: backend.id,
            status: 'draft',
            taskIds: [],
            versionIds: [],
            createdAt: new Date(now).toISOString(),
          },
        },
        now,
      ),
    ).toThrow('已过期');
  });
  it('persists confirmed sessions and pinned works while excluding blob URLs and temporary free drafts', () => {
    const creation = complete(readyProduct()),
      works = saveSelected(creation, [], true);
    const state: DemoState = {
      schema: 2,
      creations: [creation, makeCreation('free-image', 2, { draft: true })],
      works,
      uploads: [
        {
          id: 'local',
          name: '本地.webp',
          media: 'image',
          local: true,
          role: '参考',
          url: 'blob:temporary',
        },
      ],
      storageWarning: '',
    };
    const serialized = serializeState(state);
    expect(serialized).not.toContain('blob:');
    const restored = readPersisted(serialized);
    expect(restored.creations).toHaveLength(1);
    expect(restored.works).toEqual(works);
    expect(restored.uploads[0]).not.toHaveProperty('url');
    expect(readPersisted('not json').storageWarning).toContain('损坏');
    const invalid = JSON.parse(serialized);
    invalid.creations[0].settings.count = 'Infinity';
    expect(readPersisted(JSON.stringify(invalid)).creations).toHaveLength(0);
  });
});
