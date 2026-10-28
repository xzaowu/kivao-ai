import { useSyncExternalStore } from 'react';
import { z } from 'zod';
export type LibraryKind = 'works' | 'materials' | 'creations';
export type LibrarySource = 'mine' | 'demo' | 'trash';
const MetaSchema = z.object({
  name: z.string().max(80).optional(),
  group: z.string().default(''),
  favorite: z.boolean().default(false),
  trashed: z.boolean().default(false),
  archived: z.boolean().default(false),
  pinned: z.boolean().default(false),
});
export type LibraryMeta = z.infer<typeof MetaSchema>;
const Schema = z.object({
  metadata: z.record(z.string(), MetaSchema),
  groups: z.object({
    works: z.array(z.string()),
    materials: z.array(z.string()),
  }),
});
const KEY = 'kivao-react-library-v1';
const empty = () =>
  ({ metadata: {}, groups: { works: [], materials: [] } }) as z.infer<
    typeof Schema
  >;
let warning = '';
let saved = empty();
try {
  const raw =
    typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
  if (raw) saved = Schema.parse(JSON.parse(raw));
} catch {
  warning = '整理记录无法读取，当前改动仅保留在内存中，不覆盖原数据。';
}
let state = {
  ...saved,
  warning,
  sources: { works: 'mine', materials: 'mine' } as Record<
    'works' | 'materials',
    LibrarySource
  >,
};
const listeners = new Set<() => void>();
function publish(persist = true) {
  if (persist && !warning) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ metadata: state.metadata, groups: state.groups }),
      );
    } catch {
      state = {
        ...state,
        warning: '整理信息保存失败，刷新后可能丢失本次改动。',
      };
    }
  }
  listeners.forEach((fn) => fn());
}
export const library = {
  getState: () => state,
  meta: (kind: LibraryKind, id: string): LibraryMeta =>
    state.metadata[kind + ':' + id] || MetaSchema.parse({}),
  update(kind: LibraryKind, ids: string[], patch: Partial<LibraryMeta>) {
    const metadata = { ...state.metadata };
    for (const id of ids)
      metadata[kind + ':' + id] = MetaSchema.parse({
        ...library.meta(kind, id),
        ...patch,
      });
    state = { ...state, metadata };
    publish();
  },
  source(kind: 'works' | 'materials', source: LibrarySource) {
    state = { ...state, sources: { ...state.sources, [kind]: source } };
    publish(false);
  },
  addGroup(kind: 'works' | 'materials', name: string) {
    name = name.trim();
    if (!name || name.length > 40) throw new Error('分组名称需为 1–40 个字');
    if (state.groups[kind].includes(name)) throw new Error('已有同名分组');
    state = {
      ...state,
      groups: { ...state.groups, [kind]: [...state.groups[kind], name] },
    };
    publish();
  },
};
export function useLibrary() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
}
