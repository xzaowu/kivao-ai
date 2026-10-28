import { z } from 'zod';
const schema = z.object({
  mode: z.enum(['guide', 'image', 'video']),
  prompt: z.string().max(2000),
  attachments: z.array(z.string()).max(4),
});
export const HOME_DRAFT_KEY = 'kivao-react-home-draft-v1';
export type HomeDraft = z.infer<typeof schema>;
export function readHomeDraft(raw: string | null): {
  draft: HomeDraft;
  warning: string;
} {
  const empty = { mode: 'guide' as const, prompt: '', attachments: [] };
  if (!raw) return { draft: empty, warning: '' };
  try {
    return { draft: schema.parse(JSON.parse(raw)), warning: '' };
  } catch {
    return {
      draft: empty,
      warning: '首页草稿无法读取，当前输入不会覆盖原数据。',
    };
  }
}
export function loadHomeDraft() {
  try {
    return readHomeDraft(localStorage.getItem(HOME_DRAFT_KEY));
  } catch {
    return {
      draft: { mode: 'guide' as const, prompt: '', attachments: [] },
      warning: '首页草稿存储不可用，本次输入仅保留在页面内。',
    };
  }
}
