import type { Asset, AssetReference } from '@kivao/contracts';
import { coreSceneIds } from '../data/catalog';
import {
  makeLocalPlan,
  type Adjustment,
  type DemoCreation,
  type DemoPlan,
} from './model';
import { assetQuery, createApiPlan } from '../api';
import type { QueryClient } from '@tanstack/react-query';

export function mockReferences(
  creation: DemoCreation,
  assets: Asset[],
): AssetReference[] {
  const roles: AssetReference['role'][] =
    creation.sceneId === 'product'
      ? ['product']
      : creation.sceneId === 'tryon'
        ? ['person', 'garment']
        : ['reference_video'];
  return roles.map((role) => {
    const asset = assets.find(
      (item) =>
        item.source === 'mock_fixture' && item.allowedRoles.includes(role),
    );
    if (!asset) throw new Error(`Mock API 缺少 ${role} 演示素材。`);
    return { assetId: asset.id, role };
  });
}
export async function preparePlan(
  creation: DemoCreation,
  client: QueryClient,
  adjustment: Adjustment | null = null,
): Promise<DemoPlan> {
  const plan = makeLocalPlan(creation, adjustment),
    sceneId = coreSceneIds[creation.sceneId];
  if (!sceneId) return plan;
  const assets = await client.ensureQueryData(assetQuery);
  // Local files stay in-browser. The API receives only its own explicitly simulated fixture references.
  const response = await createApiPlan({
    sceneId,
    prompt:
      creation.prompt.trim() ||
      `${creation.name}：${plan.items.map((item) => item.title).join('、')}`,
    assets: mockReferences(creation, assets.data),
  });
  return { ...plan, source: 'mock_api', backend: response.data };
}
