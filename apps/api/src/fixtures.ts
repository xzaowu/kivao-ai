import {
  AssetSchema, CreationSchema, SceneSchema, TaskSchema, VersionSchema, WorkSchema,
} from '@kivao/contracts';

export const fixtureId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const createdAt = '2026-01-01T00:00:00.000Z';

export const scenes = SceneSchema.array().parse([
  { id: 'product-images', name: '商品套图', description: '根据商品素材规划一组展示图片。', requiredRoles: ['product'], outputKind: 'image' },
  { id: 'virtual-try-on', name: 'AI 换装', description: '以人物与服装素材规划换装效果。', requiredRoles: ['person', 'garment'], outputKind: 'image' },
  { id: 'reference-video', name: '参考视频创作', description: '参考视频结构，规划新的创作结果。', requiredRoles: ['reference_video'], outputKind: 'video' },
]);

export const assets = AssetSchema.array().parse([
  { id: fixtureId(1), name: '演示商品素材（模拟）', kind: 'image', allowedRoles: ['product'], source: 'mock_fixture', createdAt },
  { id: fixtureId(2), name: '演示人物素材（模拟）', kind: 'image', allowedRoles: ['person'], source: 'mock_fixture', createdAt },
  { id: fixtureId(3), name: '演示服装素材（模拟）', kind: 'image', allowedRoles: ['garment'], source: 'mock_fixture', createdAt },
  { id: fixtureId(4), name: '演示参考视频（模拟）', kind: 'video', allowedRoles: ['reference_video'], source: 'mock_fixture', createdAt },
]);

export const demoCreations = scenes.map((scene, i) => CreationSchema.parse({
  id: fixtureId(20 + i), sceneId: scene.id, planId: fixtureId(10 + i), status: 'completed',
  taskIds: [fixtureId(30 + i)], versionIds: [fixtureId(40 + i)], createdAt,
}));
export const tasks = scenes.map((_, i) => TaskSchema.parse({
  id: fixtureId(30 + i), creationId: fixtureId(20 + i), status: 'succeeded', progress: 100,
  versionId: fixtureId(40 + i), error: null, simulated: true, createdAt,
}));
export const versions = scenes.map((scene, i) => VersionSchema.parse({
  id: fixtureId(40 + i), creationId: fixtureId(20 + i), taskId: fixtureId(30 + i), ordinal: 1,
  kind: scene.outputKind, label: `${scene.name}结果占位（模拟，无真实文件）`, artifactUrl: null, simulated: true, createdAt,
}));
export const works = scenes.map((scene, i) => WorkSchema.parse({
  id: fixtureId(50 + i), creationId: fixtureId(20 + i), versionId: fixtureId(40 + i),
  title: `${scene.name}演示作品（模拟保存记录）`, savedAt: createdAt,
}));
