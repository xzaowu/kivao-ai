import { makeCreation } from './store';
import { advanceRun, makeLocalPlan, startRun, saveSelected } from './model';
// Explicit demonstration records, independent from API-supported executions.
export const demoWorks = ['product', 'tryon', 'video', 'video-transcript'].map(
  (scene, i) => {
    const id = (n: number) =>
      `00000000-0000-4000-8000-${String(i * 10 + n).padStart(12, '0')}`;
    let c = makeCreation(scene, i + 1, { demo: true, prompt: '演示作品参考' });
    c = { ...c, id: id(1), phase: 'confirm', plan: makeLocalPlan(c) };
    c = advanceRun(
      startRun(c, Date.parse('2026-10-27T00:00:00Z')),
      Date.parse('2026-10-27T00:00:03Z'),
    );
    const w = saveSelected(c, [], true)[0]!;
    return {
      ...w,
      record: {
        ...w.record,
        id: id(2),
        creationId: id(1),
        versionId: id(3),
        title: w.output.title + ' · 演示',
        savedAt: '2026-10-27T00:00:00.000Z',
      },
    };
  },
);
