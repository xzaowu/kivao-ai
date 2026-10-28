import { describe, it, expect } from 'vitest';
import features from './features.json';
import { requireScene, demoMaterials } from './catalog';
import { demo, makeCreation } from '../demo/store';
import {
  makeLocalPlan,
  validateCreation,
  OutputSchema,
  advanceRun,
  startRun,
  saveSelected,
} from '../demo/model';
import { mockReferences } from '../demo/bridge';
import { readHomeDraft } from '../demo/homeDraft';
describe('corrected prototype fixtures', () => {
  it('has six image tools, nine video tools, twelve templates per medium and eight canvas templates', () => {
    expect(features.IMAGE_TOOLS).toHaveLength(6);
    expect(features.VIDEO_TOOLS).toHaveLength(9);
    expect(features.IMAGE_TEMPLATES).toHaveLength(12);
    expect(features.VIDEO_CASES).toHaveLength(12);
    expect(features.CV_TEMPLATES).toHaveLength(8);
  });
  it.each([...features.IMAGE_TOOLS, ...features.VIDEO_TOOLS])(
    '$scene can complete an explicitly frontend simulation with valid role fixtures',
    (tool) => {
      const scene = requireScene(tool.scene),
        c = makeCreation(scene.id, 1, {
          demo: true,
          prompt: '明确标识的演示目标',
        });
      for (const role of scene.roles)
        expect(demoMaterials.find((m) => m.id === role.demo)?.media).toBe(
          role.media,
        );
      validateCreation(c, []);
      const plan = makeLocalPlan(c);
      expect(plan.source).toBe('frontend_demo');
      expect(OutputSchema.array().safeParse(plan.items).success).toBe(true);
      const done = advanceRun(
        startRun({ ...c, phase: 'confirm', plan }, 0),
        3000,
      );
      expect(done.versions).toHaveLength(1);
      expect(saveSelected(done, [], true).length).toBeGreaterThan(0);
      if (scene.id === 'video-transcript') {
        expect(plan.items[0]?.kind).toBe('text');
        expect(done.versions[0]?.record.kind).toBe('text');
        expect(plan.items[0]?.body).toContain('00:00');
      }
    },
  );
  it('retains a replaced meaningful draft as a resumable record', () => {
    const first = demo.begin('image-remix', { draft: true, demo: true });
    const second = demo.begin('image-remix', { draft: true });
    expect(demo.creation(first).draft).toBe(false);
    expect(demo.creation(second).draft).toBe(true);
    expect(demo.creation(first).bindings.reference).toBe('serum');
  });
  it('requires a spoken script, keeps unknown roles out of core API and rejects malformed home drafts', () => {
    const c = makeCreation('video-avatar', 1, { demo: true });
    c.settings.script = '   ';
    expect(() => validateCreation(c, [])).toThrow('口播文稿');
    expect(() => mockReferences(makeCreation('product', 1), [])).toThrow(
      'Mock API',
    );
    expect(readHomeDraft('{bad').warning).toContain('不');
    expect(
      readHomeDraft(
        JSON.stringify({ mode: 'image', prompt: '草稿', attachments: ['one'] }),
      ).draft.prompt,
    ).toBe('草稿');
  });
});
