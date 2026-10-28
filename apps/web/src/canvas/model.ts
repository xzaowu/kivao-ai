import { z } from 'zod';
import features from '../data/features.json';
import { requireScene } from '../data/catalog';
export const templates = features.CV_TEMPLATES;
export type CanvasTemplate = (typeof templates)[number];
const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['media', 'note', 'task', 'placeholder', 'results']),
  title: z.string().max(80),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  body: z.string().optional(),
  materialId: z.string().optional(),
  role: z.string().optional(),
  sceneId: z.string().optional(),
  creationId: z.string().optional(),
  taskId: z.string().optional(),
  version: z.number().int().positive().optional(),
});
const EdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  role: z.string().optional(),
});
export const BoardSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  goal: z.string(),
  templateId: z.string().nullable(),
  created: z.number(),
  updated: z.number(),
  trashed: z.boolean(),
  nodes: z.array(NodeSchema).max(100),
  edges: z.array(EdgeSchema).max(200),
  view: z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number().min(0.2).max(2),
  }),
});
export type Board = z.infer<typeof BoardSchema>;
export type CanvasNode = z.infer<typeof NodeSchema>;
export function templateNodes(
  t: CanvasTemplate,
  offset = 0,
): Pick<Board, 'nodes' | 'edges'> {
  const nodes: CanvasNode[] = [],
    edges: Board['edges'] = [];
  if (t.scene) {
    const s = requireScene(t.scene);
    for (const [i, r] of s.roles.entries())
      nodes.push({
        id: crypto.randomUUID(),
        type: 'media',
        title: r.label,
        role: r.id,
        materialId:
          'demoSubject' in t && r.media === 'image'
            ? t.demoSubject
            : t.scene.startsWith('free-')
              ? t.poster
              : r.demo,
        x: 60 + offset,
        y: 70 + i * 260,
        w: 220,
        h: 230,
      });
    const task: CanvasNode = {
      id: crypto.randomUUID(),
      type: 'task',
      title: s.name,
      sceneId: s.id,
      x: 365 + offset,
      y: 310,
      w: 245,
      h: 205,
    };
    nodes.push({
      id: crypto.randomUUID(),
      type: 'note',
      title: '创作方向',
      body: t.goal,
      x: 365 + offset,
      y: 60,
      w: 245,
      h: 165,
    });
    for (const n of nodes)
      edges.push({
        id: crypto.randomUUID(),
        from: n.id,
        to: task.id,
        role: n.role,
      });
    nodes.push(task);
    const placeholder: CanvasNode = {
      id: crypto.randomUUID(),
      type: 'placeholder',
      title: '结果预留区',
      taskId: task.id,
      x: 700 + offset,
      y: 310,
      w: 245,
      h: 205,
    };
    nodes.push(placeholder);
    edges.push({ id: crypto.randomUUID(), from: task.id, to: placeholder.id });
  } else {
    nodes.push({
      id: crypto.randomUUID(),
      type: 'note',
      title: '方向与想法',
      body: t.goal,
      x: 60 + offset,
      y: 65,
      w: 245,
      h: 190,
    });
    for (const [i, id] of ['serum', 'tea', 'model'].entries())
      nodes.push({
        id: crypto.randomUUID(),
        type: 'media',
        title: ['光影与材质', '商品视觉', '人物风格'][i]!,
        materialId: id,
        x: 360 + offset + (i % 2) * 280,
        y: 65 + Math.floor(i / 2) * 280,
        w: 220,
        h: 230,
      });
  }
  return { nodes, edges };
}
export function newBoard(templateId?: string): Board {
  const t = templates.find((item) => item.id === templateId);
  return {
    id: crypto.randomUUID(),
    name: t?.name || '未命名画布',
    goal: t?.goal || '',
    templateId: t?.id || null,
    created: Date.now(),
    updated: Date.now(),
    trashed: false,
    nodes: [],
    edges: [],
    ...(t ? templateNodes(t) : {}),
    view: { x: 45, y: 35, scale: 0.8 },
  };
}
export function connect(
  board: Board,
  from: string,
  to: string,
  role?: string,
): Board {
  if (from === to) throw new Error('不能连接到节点自身');
  if (
    !board.nodes.some((n) => n.id === from) ||
    !board.nodes.some((n) => n.id === to)
  )
    throw new Error('连接节点不存在');
  const seen = new Set<string>();
  const reaches = (id: string): boolean => {
    if (id === from) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return board.edges.filter((e) => e.from === id).some((e) => reaches(e.to));
  };
  if (reaches(to)) throw new Error('这条连接会形成循环，请换一个终点');
  const target = board.nodes.find((n) => n.id === to)!;
  const source = board.nodes.find((n) => n.id === from)!;
  if (target.type === 'task' && source.type === 'media') {
    if (
      !role ||
      !requireScene(target.sceneId!).roles.some((r) => r.id === role)
    )
      throw new Error('请先选择这份素材在任务中的角色');
  }
  const edges = board.edges.filter(
    (e) =>
      !(e.from === from && e.to === to) &&
      !(target.type === 'task' && role && e.to === to && e.role === role),
  );
  return {
    ...board,
    edges: [...edges, { id: crypto.randomUUID(), from, to, role }],
  };
}
export function taskBindings(board: Board, nodeId: string) {
  return Object.fromEntries(
    board.edges
      .filter((e) => e.to === nodeId)
      .flatMap((e) => {
        const n = board.nodes.find((n) => n.id === e.from);
        return n?.type === 'media' && n.materialId && (e.role || n.role)
          ? [[e.role || n.role!, n.materialId]]
          : [];
      }),
  );
}

export function fitView(
  board: Board,
  width: number,
  height: number,
): Board['view'] {
  const maxX = Math.max(700, ...board.nodes.map((n) => n.x + n.w)),
    maxY = Math.max(450, ...board.nodes.map((n) => n.y + n.h)),
    minX = Math.min(0, ...board.nodes.map((n) => n.x)),
    minY = Math.min(0, ...board.nodes.map((n) => n.y));
  const scale = Math.max(
    0.25,
    Math.min(0.95, (width - 60) / (maxX - minX), (height - 90) / (maxY - minY)),
  );
  return {
    scale,
    x: Math.max(15, (width - (maxX - minX) * scale) / 2) - minX * scale,
    y: 25 - minY * scale,
  };
}
