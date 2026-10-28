import { useState } from 'react';
import type { Board } from './model';
import { canvas } from './store';
import { errorMessage, useUi } from '../components/ui-context';

export function BoardForm({
  board: b,
  onDone,
}: {
  board: Board;
  onDone: () => void;
}) {
  const [name, setName] = useState(b.name),
    ui = useUi();
  return (
    <form
      className="cv-dialog-body"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          canvas.edit(b.id, (old) => ({ ...old, name: name.trim() }));
          onDone();
        } catch {
          ui.notify('请输入 1–80 字画布名称');
        }
      }}
    >
      <label className="cv-form-label">
        画布名称
        <input
          maxLength={80}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button className="primary full">保存名称</button>
      <button
        type="button"
        className="secondary full"
        onClick={() => {
          try {
            canvas.duplicate(b.id);
            onDone();
            ui.notify('已建立独立副本，任务结果不会被覆盖');
          } catch (e) {
            ui.notify(errorMessage(e));
          }
        }}
      >
        复制画布
      </button>
      <button
        type="button"
        className="text-link"
        onClick={() => {
          canvas.edit(b.id, (old) => ({ ...old, trashed: !old.trashed }));
          onDone();
        }}
      >
        {b.trashed ? '恢复画布' : '移入最近删除'}
      </button>
      <p>全部画布信息仅存于此浏览器。</p>
    </form>
  );
}
