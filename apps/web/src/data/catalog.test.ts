import { describe, expect, it } from 'vitest';
import {
  defaultFilters,
  demoMaterials,
  filterCatalog,
  recommendScenes,
  requireScene,
  scenes,
  suggestBindings,
} from './catalog';

describe('scheme C catalog and guidance', () => {
  it.each([12, 24, 48] as const)(
    'provides %i samples with only three supported scenarios and 12 items per page',
    (size) => {
      const result = filterCatalog({ ...defaultFilters, size });
      expect(result.total).toBe(size);
      expect(result.items).toHaveLength(12);
      expect(result.pages).toBe(size / 12);
      expect(scenes.slice(0, size).filter((scene) => scene.ready)).toHaveLength(
        3,
      );
      expect(filterCatalog({ ...defaultFilters, size, page: 99 }).page).toBe(
        size / 12,
      );
    },
  );
  it('combines search, classification, input and output filters and supports an empty result', () => {
    expect(
      filterCatalog({
        ...defaultFilters,
        size: 48,
        query: '  换装  ',
        category: '服装人像',
        input: '人物与服装',
        output: '图片',
        ready: true,
      }).items.map((scene) => scene.id),
    ).toEqual(['tryon']);
    expect(
      filterCatalog({ ...defaultFilters, query: '不存在的场景' }).total,
    ).toBe(0);
    expect(() => requireScene('catalog-1')).toThrow('仅供流程预览');
  });
  it('retains multiple matching intents instead of pretending to understand prompts with AI', () => {
    expect(
      recommendScenes('商品套图和一段宣传视频').map((scene) => scene.id),
    ).toEqual(['product', 'video']);
    expect(recommendScenes('换装').map((scene) => scene.id)).toEqual(['tryon']);
    expect(recommendScenes('', true).map((scene) => scene.id)).toEqual([
      'video',
    ]);
    expect(recommendScenes('')).toHaveLength(3);
  });
  it('assigns distinct materials to required roles before optional roles', () => {
    const reference = demoMaterials.find(
      (material) => material.id === 'reference',
    )!;
    const bakery = demoMaterials.find((material) => material.id === 'bakery')!;
    expect(suggestBindings(requireScene('video'), [bakery, reference])).toEqual(
      { reference: 'reference', subject: 'bakery' },
    );
    expect(
      suggestBindings(
        requireScene('tryon'),
        demoMaterials.filter((material) =>
          ['model', 'garment'].includes(material.id),
        ),
      ),
    ).toEqual({ model: 'model', garment: 'garment' });
  });
});
