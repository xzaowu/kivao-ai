import { z } from 'zod';
import data from './catalog.json';
import features from './features.json';
import type { Scene } from '@kivao/contracts';

export const AssetKeySchema = z.enum([
  'tea',
  'serum',
  'bakery',
  'model',
  'garment',
  'tryon',
  'kivao-mark',
  'bakery-demo',
  'beauty-demo',
  'caption-demo',
  'fashion-demo',
  'portrait-demo',
  'product-demo',
]);
export type AssetKey = z.infer<typeof AssetKeySchema>;
export const RoleSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  media: z.enum(['image', 'video']),
  demo: z.string(),
  help: z.string(),
});
export const SceneDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  output: z.enum(['图片', '视频', '图文', '文本']),
  input: z.string(),
  image: AssetKeySchema,
  summary: z.string(),
  keywords: z.string().default(''),
  ready: z.boolean(),
  tag: z.string().optional(),
  roles: z.array(RoleSchema),
  checks: z.array(z.string()).default([]),
  adjustments: z.array(z.string()).default([]),
  config: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        options: z.array(
          z.union([z.string(), z.tuple([z.string(), z.string()])]),
        ),
      }),
    )
    .default([]),
  out: z.string(),
});
export type SceneDefinition = z.infer<typeof SceneDefinitionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  media: z.enum(['image', 'video']),
  asset: AssetKeySchema.optional(),
  poster: AssetKeySchema.optional(),
  role: z.string(),
  local: z.boolean().default(false),
});
export type Material = z.infer<typeof MaterialSchema> & { url?: string };
export const scenes = SceneDefinitionSchema.array().parse(data.scenes);
export const categories = data.categories;
export const demoMaterials = MaterialSchema.array().parse(features.materials);
export const cases = data.cases;
export const coreSceneIds: Record<string, Scene['id']> = {
  product: 'product-images',
  tryon: 'virtual-try-on',
  video: 'reference-video',
};
export const defaults: Record<
  string,
  Record<string, string>
> = features.defaults;
export const freeScenes = SceneDefinitionSchema.array().parse(
  Object.values(features.freeScenes).map((scene) => ({
    summary: '',
    input: '',
    ...scene,
    config: scene.config.filter((field) => field.key !== 'script'),
  })),
);
export function getScene(id: string) {
  return [...scenes, ...freeScenes].find((scene) => scene.id === id);
}
export function requireScene(id: string) {
  const scene = getScene(id);
  if (!scene?.ready) throw new Error('此场景仅供流程预览，尚未提供执行能力。');
  return scene;
}
export function assetUrl(key: AssetKey) {
  return `/demo/${key}.${key === 'kivao-mark' ? 'png' : key.endsWith('-demo') ? 'mp4' : 'webp'}`;
}
export function materialUrl(material: Material | undefined) {
  return (
    material?.url || (material?.asset ? assetUrl(material.asset) : undefined)
  );
}
export interface CatalogFilters {
  size: 12 | 24 | 48;
  query: string;
  category: string;
  input: string;
  output: string;
  ready: boolean;
  sort: string;
  page: number;
}
export const defaultFilters: CatalogFilters = {
  size: 24,
  query: '',
  category: '全部',
  input: '全部',
  output: '全部',
  ready: false,
  sort: 'recommended',
  page: 1,
};
export function filterCatalog(filters: CatalogFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  let result = scenes
    .slice(0, filters.size)
    .filter(
      (scene) =>
        (filters.category === '全部' || scene.category === filters.category) &&
        (filters.input === '全部' || scene.input === filters.input) &&
        (filters.output === '全部' || scene.output === filters.output) &&
        (!filters.ready || scene.ready) &&
        (!query ||
          `${scene.name}${scene.summary}${scene.keywords}${scene.category}`
            .toLocaleLowerCase()
            .includes(query)),
    );
  if (filters.sort === 'name')
    result = result
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  const pages = Math.max(1, Math.ceil(result.length / 12)),
    page = Math.min(Math.max(1, filters.page), pages);
  return {
    total: result.length,
    pages,
    page,
    items: result.slice((page - 1) * 12, page * 12),
  };
}
export function recommendScenes(prompt: string, hasVideo = false) {
  const ids = [
    /商品|产品|上架|套图|新品/.test(prompt) && 'product',
    /换装|衣|模特|穿搭/.test(prompt) && 'tryon',
    (/视频|短片|镜头|门店/.test(prompt) || hasVideo) && 'video',
  ];
  const matched = scenes.slice(0, 3).filter((scene) => ids.includes(scene.id));
  return matched.length ? matched : scenes.slice(0, 3);
}
export function suggestBindings(scene: SceneDefinition, materials: Material[]) {
  const used = new Set<string>();
  return Object.fromEntries(
    [...scene.roles]
      .sort((a, b) => Number(b.required) - Number(a.required))
      .flatMap((role) => {
        const material = materials.find(
          (item) =>
            !used.has(item.id) &&
            item.media === role.media &&
            materialUrl(item),
        );
        if (!material) return [];
        used.add(material.id);
        return [[role.id, material.id]];
      }),
  );
}
