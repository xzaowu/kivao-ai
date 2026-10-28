import { useSyncExternalStore } from 'react';
import { BoardSchema, newBoard, type Board } from './model';
const KEY = 'kivao-react-canvas-v1';
let boards: Board[] = [],
  warning = '';
try {
  const raw =
    typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
  if (raw) boards = BoardSchema.array().max(100).parse(JSON.parse(raw));
} catch {
  warning = '画布记录无法读取，当前使用临时画布，不覆盖原数据。';
}
let state = { boards, warning, tab: 'templates' as 'templates' | 'boards', panel:typeof innerWidth==='undefined'||innerWidth>760,list:false };
const listeners = new Set<() => void>(),
  histories = new Map<string, { past: Board[]; future: Board[] }>();
function publish() {
  if (!warning) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.boards));
    } catch {
      state = { ...state, warning: '画布保存失败，刷新后可能丢失本次改动。' };
    }
  }
  listeners.forEach((fn) => fn());
}
export const canvas = {
  getState: () => state,
  panel(panel: boolean) {
    state = { ...state, panel };
    publish();
  },
  list(list: boolean) {
    state = { ...state, list };
    publish();
  },
  board: (id: string) => state.boards.find((b) => b.id === id),
  history(id: string) {
    return histories.get(id) || { past: [], future: [] };
  },
  tab(tab: 'templates' | 'boards') {
    state = { ...state, tab };
    publish();
  },
  create(templateId?: string) {
    if (state.boards.length >= 100) throw new Error('演示画布已达 100 张上限');
    const b = newBoard(templateId);
    state = { ...state, boards: [...state.boards, b] };
    publish();
    return b.id;
  },
  edit(id: string, fn: (b: Board) => Board, history = true) {
    const old = canvas.board(id);
    if (!old) throw new Error('画布不存在');
    const next = BoardSchema.parse({
      ...fn(structuredClone(old)),
      updated: Date.now(),
    });
    if (history) {
      const h = canvas.history(id);
      histories.set(id, { past: [...h.past, old].slice(-25), future: [] });
    }
    state = {
      ...state,
      boards: state.boards.map((b) => (b.id === id ? next : b)),
    };
    publish();
  },
  undo(id: string, redo = false) {
    const h = canvas.history(id),
      from = redo ? h.future : h.past,
      to = redo ? h.past : h.future,
      b = canvas.board(id);
    if (!from.length || !b) return;
    to.push(b);
    const next = from.pop()!;
    histories.set(id, h);
    state = {
      ...state,
      boards: state.boards.map((item) => (item.id === id ? next : item)),
    };
    publish();
  },
  duplicate(id: string) {
    const b = canvas.board(id);
    if (!b) throw new Error('画布不存在');
    if (state.boards.length >= 100) throw new Error('演示画布已达 100 张上限');
    const copy = {
      ...structuredClone(b),
      id: crypto.randomUUID(),
      name: b.name.slice(0, 70) + ' · 副本',
      created: Date.now(),
      updated: Date.now(),
      trashed: false,
      nodes: b.nodes.map((n) => ({ ...n, creationId: undefined })),
    };
    state = { ...state, boards: [...state.boards, copy] };
    publish();
    return copy.id;
  },
};
export function useCanvas() {
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
