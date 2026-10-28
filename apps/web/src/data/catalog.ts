import { z } from 'zod';
import data from './catalog.json';
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
  output: z.enum(['图片', '视频', '图文']),
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
export const demoMaterials = MaterialSchema.array().parse(data.materials);
export const cases = data.cases;
export const coreSceneIds: Record<string, Scene['id']> = {
  product: 'product-images',
  tryon: 'virtual-try-on',
  video: 'reference-video',
};
export const defaults: Record<string, Record<string, string>> = {
  ...data.defaults,
  'free-image': { style: '自然摄影', ratio: '3:4', count: '2' },
  'free-video': {
    channel: '门店展示',
    captions: '简洁字幕',
    ratio: '16:9',
    count: '1',
  },
};
export const freeScenes = SceneDefinitionSchema.array().parse([
  {
    id: 'free-image',
    name: '自由图片创作',
    category: '自由创作',
    output: '图片',
    input: '一张图片',
    image: 'serum',
    summary: '描述你的画面目标，先核对计划再开始。',
    ready: true,
    roles: [
      {
        id: 'reference',
        label: '参考图片',
        required: false,
        media: 'image',
        demo: 'serum',
        help: '可选。用于说明主体、风格或构图。',
      },
    ],
    config: [
      {
        key: 'style',
        label: '画面风格',
        options: ['自然摄影', '极简产品', '生活方式'],
      },
      { key: 'ratio', label: '画面比例', options: ['3:4', '1:1', '16:9'] },
      {
        key: 'count',
        label: '图片数量',
        options: [
          ['2', '2 张'],
          ['4', '4 张'],
        ],
      },
    ],
    checks: ['主体和画面符合目标', '文字与品牌内容可用', '细节和构图适合使用'],
    adjustments: ['背景更简洁', '调整构图', '强化主体细节'],
    out: '2–4 张图片',
  },
  {
    id: 'free-video',
    name: '自由视频创作',
    category: '自由创作',
    output: '视频',
    input: '一张图片',
    image: 'bakery',
    summary: '描述短片主题，核对镜头与输出。',
    ready: true,
    roles: [
      {
        id: 'subject',
        label: '主体参考图',
        required: false,
        media: 'image',
        demo: 'bakery',
        help: '可选。用于说明产品、门店或人物主体。',
      },
    ],
    config: [
      {
        key: 'channel',
        label: '发布用途',
        options: ['门店展示', '社媒短片', '品牌介绍'],
      },
      { key: 'captions', label: '字幕方式', options: ['简洁字幕', '无字幕'] },
    ],
    checks: ['镜头与节奏符合目标', '主体和画面内容正确', '字幕与品牌内容可用'],
    adjustments: ['节奏更利落', '突出主体', '字幕更克制'],
    out: '1 条 12 秒演示短片',
  },
]);
export function getScene(id: string) {
  return [...scenes, ...freeScenes].find((scene) => scene.id === id);
}
export function requireScene(id: string) {
  const scene = getScene(id);
  if (!scene?.ready) throw new Error('此场景仅供流程预览，尚未提供执行能力。');
  return scene;
}
export function assetUrl(key: AssetKey) {
  return `/demo/${key}.${key === 'kivao-mark' ? 'png' : key === 'bakery-demo' ? 'mp4' : 'webp'}`;
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
