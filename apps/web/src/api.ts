import { ApiErrorSchema, ScenesResponseSchema } from '@kivao/contracts';

export async function fetchScenes() {
  const response = await fetch('/api/v1/scenes');
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(error.success ? error.data.error.message : '场景请求失败，请检查 Mock API 是否启动。');
  }
  return ScenesResponseSchema.parse(body);
}
