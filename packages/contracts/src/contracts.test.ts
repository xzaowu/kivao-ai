import { describe, expect, it } from 'vitest';
import { ApiErrorSchema, CreateCreationSchema, CreatePlanSchema, CreationPlanSchema, VersionSchema } from './index.js';

const asset = { assetId: '00000000-0000-4000-8000-000000000001', role: 'product' };
describe('shared API contracts', () => {
  it('rejects empty prompts, duplicate references, unknown fields and oversized input', () => {
    const input = { sceneId: 'product-images', prompt: ' 商品展示 ', assets: [asset] };
    expect(CreatePlanSchema.parse(input).prompt).toBe('商品展示');
    for (const invalid of [
      { ...input, prompt: ' ' }, { ...input, assets: [asset, asset] },
      { ...input, execute: true }, { ...input, prompt: 'a'.repeat(2001) },
      { ...input, assets: [] }, { ...input, sceneId: 'anything' },
    ]) expect(CreatePlanSchema.safeParse(invalid).success).toBe(false);
  });
  it('requires explicit confirmation and rejects billing or execution flags', () => {
    const planId = asset.assetId;
    expect(CreateCreationSchema.safeParse({ planId, confirmed: true }).success).toBe(true);
    expect(CreateCreationSchema.safeParse({ planId, confirmed: false }).success).toBe(false);
    expect(CreateCreationSchema.safeParse({ planId, confirmed: true, charge: true }).success).toBe(false);
  });
  it('uses integer minor currency units and explicit simulated estimates', () => {
    const estimate = CreationPlanSchema.shape.estimate;
    expect(estimate.safeParse({ currency: 'CNY', amountMinor: 500, simulated: true }).success).toBe(true);
    for (const amountMinor of [-1, 0.1]) expect(estimate.safeParse({ currency: 'CNY', amountMinor, simulated: true }).success).toBe(false);
    expect(estimate.safeParse({ currency: 'CNY', amountMinor: 500, simulated: false }).success).toBe(false);
  });
  it('returns immutable version values with no invented artifact', () => {
    const version = VersionSchema.parse({ id: asset.assetId, creationId: asset.assetId, taskId: asset.assetId, ordinal: 1, kind: 'image', label: '模拟', artifactUrl: null, simulated: true, createdAt: '2026-01-01T00:00:00.000Z' });
    expect(Object.isFrozen(version)).toBe(true);
    expect(version.artifactUrl).toBeNull();
  });
  it('requires an explicit error code, message and request identity', () => {
    expect(ApiErrorSchema.safeParse({ error: { code: 'NOT_FOUND', message: '不存在', requestId: 'req-1' } }).success).toBe(true);
    expect(ApiErrorSchema.safeParse({ message: 'Not found' }).success).toBe(false);
  });
});
