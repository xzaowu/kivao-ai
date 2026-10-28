import { z } from 'zod';
import {
  ApiErrorSchema,
  AssetsResponseSchema,
  CreateCreationSchema,
  CreatePlanSchema,
  CreationResponseSchema,
  PlanResponseSchema,
  ScenesResponseSchema,
  WorksResponseSchema,
  type CreatePlan,
} from '@kivao/contracts';

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: RequestInit,
): Promise<z.output<T>> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new Error('无法连接 Mock API，请确认 API 已启动后重试。');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('Mock API 未返回有效 JSON，请检查开发代理配置。');
  }
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success
        ? error.data.error.message
        : `Mock API 请求失败（${response.status}）。`,
    );
  }
  const result = schema.safeParse(body);
  if (!result.success)
    throw new Error('Mock API 响应不符合共享契约，请检查服务版本。');
  return result.data;
}
const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
export const sceneQuery = {
  queryKey: ['api', 'scenes'],
  queryFn: () => request('/api/v1/scenes', ScenesResponseSchema),
};
export const assetQuery = {
  queryKey: ['api', 'assets'],
  queryFn: () => request('/api/v1/assets', AssetsResponseSchema),
};
export const workQuery = {
  queryKey: ['api', 'works'],
  queryFn: () => request('/api/v1/works', WorksResponseSchema),
};
export const createApiPlan = (input: CreatePlan) =>
  request(
    '/api/v1/plans',
    PlanResponseSchema,
    post(CreatePlanSchema.parse(input)),
  );
export const getApiPlan = (id: string) =>
  request(`/api/v1/plans/${encodeURIComponent(id)}`, PlanResponseSchema);
export const createApiCreation = (planId: string) =>
  request(
    '/api/v1/creations',
    CreationResponseSchema,
    post(CreateCreationSchema.parse({ planId, confirmed: true })),
  );
export const getApiCreation = (id: string) =>
  request(
    `/api/v1/creations/${encodeURIComponent(id)}`,
    CreationResponseSchema,
  );
