import { describe, it, expect } from 'vitest';
import { newBoard, connect, fitView, taskBindings, BoardSchema } from './model';
import { canvas } from './store';
describe('local canvas graph', () => {
  it('creates independent boards and assigns template inputs by role', () => {
    const a = newBoard('fashion-tryon'),
      b = newBoard('fashion-tryon');
    expect(BoardSchema.safeParse(a).success).toBe(true);
    expect(a.id).not.toBe(b.id);
    const fit = fitView(a, 800, 700);
    expect(
      Math.max(...a.nodes.map((n) => n.x + n.w)) * fit.scale + fit.x,
    ).toBeLessThanOrEqual(800);
    expect(a.nodes[0]?.id).not.toBe(b.nodes[0]?.id);
    const task = a.nodes.find((n) => n.type === 'task')!;
    expect(taskBindings(a, task.id)).toEqual({
      model: 'model',
      garment: 'garment',
      garmentDetail: 'garment',
    });
  });
  it('rejects cycles and replaces the existing edge for the same task role', () => {
    let b = newBoard('product-launch');
    const task = b.nodes.find((n) => n.type === 'task')!,
      media = b.nodes.find((n) => n.type === 'media')!,
      note = b.nodes.find((n) => n.type === 'note')!;
    expect(() => connect(b, task.id, media.id)).toThrow('循环');
    expect(() => connect(b, task.id, task.id)).toThrow('自身');
    expect(() => connect(b, media.id, task.id)).toThrow('角色');
    b = {
      ...b,
      nodes: [...b.nodes, { ...media, id: 'replacement', materialId: 'serum' }],
    };
    b = connect(b, 'replacement', task.id, 'product');
    expect(taskBindings(b, task.id).product).toBe('serum');
    expect(
      b.edges.filter((e) => e.to === task.id && e.role === 'product'),
    ).toHaveLength(1);
    expect(b.edges.some((e) => e.from === note.id)).toBe(true);
  });
  it('supports undo, redo, independent duplication and recoverable deletion', () => {
    const id = canvas.create('product-launch'),
      original = canvas.board(id)!;
    canvas.edit(id, (b) => ({ ...b, name: '修改名称' }));
    canvas.undo(id);
    expect(canvas.board(id)?.name).toBe(original.name);
    canvas.undo(id, true);
    expect(canvas.board(id)?.name).toBe('修改名称');
    const copy = canvas.duplicate(id);
    canvas.edit(copy, (b) => ({ ...b, name: '另一张画布', trashed: true }));
    expect(canvas.board(id)?.trashed).toBe(false);
    canvas.edit(copy, (b) => ({ ...b, trashed: false }));
    expect(canvas.board(copy)?.trashed).toBe(false);
  });
});
