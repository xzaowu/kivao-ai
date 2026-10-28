import { useSyncExternalStore } from 'react';
import {
  defaults,
  demoMaterials,
  getScene,
  requireScene,
  type Material,
} from '../data/catalog';
import { MaterialSchema } from '../data/catalog';
import {
  DemoCreationSchema,
  PersistedStateSchema,
  advanceRun,
  cancelRun,
  currentVersion,
  isDirty,
  saveSelected,
  type DemoCreation,
  type DemoState,
} from './model';

export const STORAGE_KEY = 'kivao-react-scheme-c-v2';
const emptyState = (): DemoState => ({
  schema: 2,
  creations: [],
  works: [],
  uploads: [],
  storageWarning: '',
});
export function readPersisted(raw: string | null): DemoState {
  if (!raw) return emptyState();
  try {
    const parsed = PersistedStateSchema.parse(JSON.parse(raw));
    const allowed = parsed.creations.filter(
      (creation) => getScene(creation.sceneId)?.ready,
    );
    return { ...parsed, creations: allowed, storageWarning: '' };
  } catch {
    return {
      ...emptyState(),
      storageWarning:
        '本地演示记录格式已损坏。为保护原始数据，本次使用临时工作空间，不覆盖旧记录；刷新后新增进度不会保留。',
    };
  }
}
export function serializeState(state: DemoState) {
  return JSON.stringify({
    schema: 2,
    creations: state.creations.filter((creation) => !creation.draft),
    works: state.works,
    uploads: state.uploads.map((material) => MaterialSchema.parse(material)),
  });
}
function initialState() {
  if (typeof window === 'undefined') return emptyState();
  try {
    return readPersisted(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {
      ...emptyState(),
      storageWarning: '浏览器存储不可用，本次创作仅保留到页面关闭。',
    };
  }
}
let state = initialState();
const listeners = new Set<() => void>();
function commit(next: DemoState) {
  state = next;
  if (typeof window !== 'undefined' && !next.storageWarning.includes('损坏')) {
    try {
      localStorage.setItem(STORAGE_KEY, serializeState(next));
    } catch {
      state = {
        ...next,
        storageWarning: '无法保存到浏览器，刷新后可能丢失本次演示进度。',
      };
    }
  }
  listeners.forEach((listener) => listener());
}
export function makeCreation(
  sceneId: string,
  index: number,
  options: {
    demo?: boolean;
    draft?: boolean;
    prompt?: string;
    bindings?: Record<string, string>;
  } = {},
): DemoCreation {
  const scene = requireScene(sceneId),
    now = new Date().toISOString();
  const bindings =
    options.bindings ||
    (options.demo
      ? Object.fromEntries(
          scene.roles
            .filter((role) => role.required)
            .map((role) => [role.id, role.demo]),
        )
      : {});
  return DemoCreationSchema.parse({
    id: crypto.randomUUID(),
    shortId: `C${String(index).padStart(3, '0')}`,
    sceneId,
    name:
      options.prompt?.trim().slice(0, 24) ||
      {
        product: '山间茶事 · 新品上新',
        tryon: '蓝色衬衫 · 模特换装',
        video: '巷口面包房 · 清晨短片',
      }[sceneId] ||
      scene.name,
    draft: options.draft ?? false,
    createdAt: now,
    updatedAt: now,
    phase: 'materials',
    prompt: options.prompt || '',
    settings: { ...defaults[sceneId] },
    bindings,
    plan: null,
    versions: [],
    activeVersion: 0,
    selected: [],
    execution: null,
  });
}
export const demo = {
  getState: () => state,
  creation(id: string) {
    const creation = state.creations.find((item) => item.id === id);
    if (!creation) throw new Error('没有找到这次创作，请返回首页开始。');
    return creation;
  },
  begin(sceneId: string, options: Parameters<typeof makeCreation>[2] = {}) {
    if (state.creations.length >= 100)
      throw new Error('本地演示创作数量已达 100 条上限。');
    const creation = makeCreation(
      sceneId,
      state.creations.filter((item) => !item.draft).length + 1,
      options,
    );
    commit({ ...state, creations: [...state.creations, creation] });
    return creation.id;
  },
  ensureDraft(sceneId: string) {
    return (
      state.creations.find((item) => item.draft && item.sceneId === sceneId)
        ?.id || demo.begin(sceneId, { draft: true })
    );
  },
  update(id: string, fn: (creation: DemoCreation) => DemoCreation) {
    const creation = demo.creation(id),
      updated = fn(creation);
    commit({
      ...state,
      creations: state.creations.map((item) =>
        item.id === id
          ? { ...updated, updatedAt: new Date().toISOString() }
          : item,
      ),
    });
  },
  edit(
    id: string,
    patch: Partial<Pick<DemoCreation, 'settings' | 'bindings' | 'prompt'>>,
  ) {
    demo.update(id, (creation) => {
      if (creation.phase === 'running' || creation.phase === 'confirm')
        throw new Error('请先返回修改或取消当前模拟。');
      return { ...creation, ...patch, plan: null };
    });
  },
  restore(id: string) {
    demo.update(id, (creation) => {
      const version = currentVersion(creation);
      return version
        ? { ...creation, ...structuredClone(version.snapshot), plan: null }
        : creation;
    });
  },
  selectVersion(id: string, ordinal: number) {
    demo.update(id, (creation) => {
      const version = creation.versions.find(
        (item) => item.record.ordinal === ordinal,
      );
      if (!version || creation.phase !== 'review')
        throw new Error('当前无法切换这个版本。');
      return {
        ...creation,
        ...(!isDirty(creation) ? structuredClone(version.snapshot) : {}),
        activeVersion: ordinal,
        selected: version.items.map((item) => item.id),
      };
    });
  },
  select(id: string, selected: string[]) {
    demo.update(id, (creation) => ({ ...creation, selected }));
  },
  cancel(id: string) {
    demo.update(id, cancelRun);
  },
  save(id: string, reviewed: boolean) {
    const works = saveSelected(demo.creation(id), state.works, reviewed),
      count = works.length - state.works.length;
    commit({ ...state, works });
    return count;
  },
  addUploads(materials: Material[]) {
    if (state.uploads.length + materials.length > 30)
      throw new Error('本地演示最多保留 30 份素材。');
    commit({ ...state, uploads: [...state.uploads, ...materials] });
  },
  materials: () => [...demoMaterials, ...state.uploads],
  tick(now: number) {
    let changed = false;
    const creations = state.creations.map((creation) => {
      const updated = advanceRun(creation, now);
      changed ||= updated !== creation;
      return updated;
    });
    if (changed) commit({ ...state, creations });
  },
};
export function useDemo() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => state,
  );
}
