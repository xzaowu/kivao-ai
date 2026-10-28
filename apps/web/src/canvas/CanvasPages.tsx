import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { AssetKeySchema, requireScene } from '../data/catalog';
import { DemoImage, OutputMedia } from '../components/Media';
import { MaterialPicker, MaterialPreview } from '../components/MaterialPicker';
import { Icon } from '../components/Icon';
import { errorMessage, useUi } from '../components/ui-context';
import { Workspace } from '../workspace/Workspace';
import { demo, useDemo } from '../demo/store';
import { BoardForm } from './BoardForm';
import { canvas, useCanvas } from './store';
import {
  fitView,
  templates,
  connect,
  taskBindings,
  templateNodes,
  type Board,
  type CanvasNode,
  type CanvasTemplate,
} from './model';

function Cover({ template: t }: { template: CanvasTemplate }) {
  return (
    <div className={`cv-cover cv-cover-${t.id}`}>
      {t.id === 'moodboard' ? (
        <div className="cv-cover-collage">
          <DemoImage asset="serum" />
          <DemoImage asset="tea" />
          <DemoImage asset="model" />
        </div>
      ) : t.id === 'fashion-tryon' ? (
        <div className="cv-cover-tryon">
          <DemoImage asset="model" />
          <DemoImage asset="tryon" />
        </div>
      ) : (
        <DemoImage
          asset={AssetKeySchema.parse(t.poster)}
          alt={t.name + ' · 演示参考'}
        />
      )}
      <span className="cv-cover-type">{t.type}</span>
      {'clip' in t && (
        <span className="cv-cover-play">
          <Icon name="play" />
        </span>
      )}
      <div className="cv-cover-graph">
        <span>
          <Icon name="image" />
          素材
        </span>
        <i />
        <span>
          <Icon name={'clip' in t ? 'video' : 'spark'} />
          {t.scene ? '创作' : '整理'}
        </span>
        <i />
        <span>
          <Icon name="check" />
          结果
        </span>
      </div>
    </div>
  );
}
export function CanvasPage() {
  const state = useCanvas(),
    ui = useUi(),
    navigate = useNavigate();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('全部'),
    [trash, setTrash] = useState(false);
  function create(id?: string) {
    try {
      void navigate({
        to: '/canvas/$boardId',
        params: { boardId: canvas.create(id) },
      });
    } catch (e) {
      ui.notify(errorMessage(e));
    }
  }
  function manage(b: Board) {
    ui.open('管理画布', <BoardForm board={b} onDone={ui.close} />);
  }
  const filtered = templates.filter(
    (t) =>
      (category === '全部' || t.category === category) &&
      (
        t.name +
        t.summary +
        t.category +
        (t.scene ? requireScene(t.scene).name : '')
      ).includes(query.trim()),
  );
  const boards = state.boards
    .filter((b) => b.trashed === trash)
    .slice()
    .sort((a, b) => b.updated - a.updated);
  return (
    <>
      <div className="cv-hub-top">
        <div>
          <span className="eyebrow">CANVAS / 让想法，有处可放。</span>
          <h1>画布</h1>
          <p>从一个现成流程开始，或把素材与想法自由放在一起。</p>
        </div>
        <button className="primary" onClick={() => create()}>
          <Icon name="plus" />
          新建空白画布
        </button>
      </div>
      {state.warning && (
        <p role="alert" className="app-notice">
          {state.warning}
        </p>
      )}
      {state.tab === 'templates' ? (
        <>
          <div className="cv-discovery-bar">
            <label className="image-search cv-search">
              <Icon name="search" />
              <input
                type="search"
                aria-label="搜索画布模板"
                placeholder="搜索用途或模板，如上新、换装"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="cv-categories">
              {[
                '全部',
                '电商商品',
                '服装人像',
                '门店营销',
                '创意短片',
                '灵感整理',
              ].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="cv-gallery-note">
            <span>先看效果，再看素材和节点如何连接。</span>
            <span>全部为演示模板 · 无需付费</span>
          </div>
          <div className="cv-template-grid">
            {filtered.map((t) => (
              <button
                key={t.id}
                className="cv-template-card"
                onClick={() =>
                  ui.open(
                    t.name,
                    <div className="cv-template-detail">
                      <Cover template={t} />
                      <div>
                        <span className="badge">演示模板</span>
                        <p>{t.summary}</p>
                        <p>
                          素材：
                          {t.scene
                            ? requireScene(t.scene)
                                .roles.map((r) => r.label)
                                .join('＋')
                            : '参考与便签'}
                        </p>
                        <p>输出：{t.out}</p>
                        <p>
                          采用后创建独立画布；任务需要你核对计划并确认模拟。
                        </p>
                        <button
                          className="primary full"
                          onClick={() => {
                            ui.close();
                            create(t.id);
                          }}
                        >
                          使用这个模板 <Icon name="arrow" />
                        </button>
                      </div>
                    </div>,
                    'cv-template-dialog',
                  )
                }
              >
                <Cover template={t} />
                <span className="cv-template-copy">
                  <small>
                    {t.category} ·{' '}
                    {t.scene ? requireScene(t.scene).roles.length + 3 : 4}个节点
                  </small>
                  <strong>{t.name}</strong>
                  <span>
                    {t.out}
                    <Icon name="arrow" />
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && <div className="empty">没有找到对应模板</div>}
        </>
      ) : (
        <>
          <div className="cv-boards-toolbar">
            <div>
              <button aria-pressed={!trash} onClick={() => setTrash(false)}>
                我的画布
              </button>
              <button aria-pressed={trash} onClick={() => setTrash(true)}>
                最近删除
              </button>
            </div>
            <span>仅保存在当前浏览器</span>
          </div>
          <div className="cv-board-grid">
            {boards.map((b) => (
              <article className="cv-board-card" key={b.id}>
                <Link to="/canvas/$boardId" params={{ boardId: b.id }}>
                  <div className="cv-board-preview">
                    <Icon name="grid" />
                    <span>{b.nodes.length} 个节点</span>
                  </div>
                  <h3>{b.name}</h3>
                  <p>{new Date(b.updated).toLocaleString('zh-CN')}</p>
                </Link>
                <button className="text-link" onClick={() => manage(b)}>
                  管理画布
                </button>
              </article>
            ))}
          </div>
          {!boards.length && (
            <div className="empty">
              <h3>{trash ? '最近删除是空的' : '还没有自己的画布'}</h3>
              <button
                className="secondary"
                onClick={() => canvas.tab('templates')}
              >
                从模板开始
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
function CanvasMaterialPicker({
  initialMedia,
  onSelect,
}: {
  initialMedia: 'image' | 'video';
  onSelect: (m: import('../data/catalog').Material) => void;
}) {
  const [media, setMedia] = useState(initialMedia);
  return (
    <>
      <div className="cv-dialog-body" role="group" aria-label="画布素材类型">
        <button
          className="secondary"
          aria-pressed={media === 'image'}
          onClick={() => setMedia('image')}
        >
          图片素材
        </button>
        <button
          className="secondary"
          aria-pressed={media === 'video'}
          onClick={() => setMedia('video')}
        >
          视频素材
        </button>
      </div>
      <MaterialPicker
        media={media}
        label="素材"
        help="素材只引用到画布；连接任务时需明确角色。"
        onSelect={onSelect}
      />
    </>
  );
}
function NoteForm({
  node,
  onSave,
}: {
  node: CanvasNode;
  onSave: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState(node.title),
    [body, setBody] = useState(node.body || '');
  return (
    <form
      className="cv-dialog-body"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(title.trim(), body);
      }}
    >
      <label className="cv-form-label">
        便签名称
        <input
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="cv-form-label">
        内容
        <textarea
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <button className="primary full">保存便签</button>
    </form>
  );
}
export function CanvasEditorPage() {
  const { boardId } = useParams({ from: '/canvas/$boardId' });
  return <Editor key={boardId} id={boardId} />;
}
function Editor({ id }: { id: string }) {
  const state = useCanvas(),
    sessions = useDemo(),
    b = state.boards.find((board) => board.id === id),
    ui = useUi();
  const [selected, setSelected] = useState(''),
    [mode, setMode] = useState<'select' | 'pan'>('select'),
    [connecting, setConnecting] = useState(''),
    [goal, setGoal] = useState('');
  const panel = state.panel,
    list = state.list,
    setPanel = (value: boolean) => canvas.panel(value);
  const stage = useRef<HTMLDivElement>(null),
    initialized = useRef(false);
  const drag = useRef<{
    node: string | undefined;
    x: number;
    y: number;
    original: Board;
    moved: boolean;
  } | null>(null);
  useEffect(() => {
    if (initialized.current || !b || b.trashed) return;
    initialized.current = true;
    if (b.created !== b.updated) return;
    const rect = stage.current?.getBoundingClientRect();
    if (rect)
      canvas.edit(
        id,
        (old) => ({ ...old, view: fitView(old, rect.width, rect.height) }),
        false,
      );
  }, [id, b]);
  useEffect(() => {
    if (!b || b.trashed) return;
    const next = structuredClone(b);
    let changed = false;
    for (const task of next.nodes.filter((n) => n.type === 'task')) {
      const c = sessions.creations.find((c) => c.id === task.creationId);
      if (!c) continue;
      for (const v of c.versions) {
        if (
          next.nodes.some(
            (n) => n.taskId === task.id && n.version === v.record.ordinal,
          )
        )
          continue;
        const placeholder = next.nodes.find(
          (n) => n.taskId === task.id && n.type === 'placeholder',
        );
        if (placeholder) {
          placeholder.type = 'results';
          placeholder.version = v.record.ordinal;
          placeholder.title = '结果 V' + v.record.ordinal;
        } else {
          const resultId = crypto.randomUUID();
          next.nodes.push({
            id: resultId,
            type: 'results',
            taskId: task.id,
            title: '结果 V' + v.record.ordinal,
            version: v.record.ordinal,
            x: task.x + 335 + (v.record.ordinal - 1) * 280,
            y: task.y,
            w: 245,
            h: 230,
          });
          next.edges.push({
            id: crypto.randomUUID(),
            from: task.id,
            to: resultId,
          });
        }
        changed = true;
      }
    }
    if (changed) {
      try {
        canvas.edit(id, () => next, false);
      } catch (e) {
        ui.notify(errorMessage(e));
      }
    }
  }, [id, b, sessions.creations, ui]);
  if (!b || b.trashed)
    return (
      <div className="empty">
        <h1>这张画布暂不可用</h1>
        <p>可从“我的画布”的最近删除中恢复。</p>
        <Link className="primary" to="/canvas">
          返回画布列表
        </Link>
      </div>
    );
  const board = b,
    sel = b.nodes.find((n) => n.id === selected),
    running = b.nodes.some(
      (n) =>
        sessions.creations.find((c) => c.id === n.creationId)?.phase ===
        'running',
    ),
    history = canvas.history(id);
  function edit(fn: (old: Board) => Board, record = true) {
    try {
      canvas.edit(id, fn, record);
    } catch (e) {
      ui.notify(errorMessage(e));
    }
  }
  function editNode(nodeId: string, patch: Partial<CanvasNode>) {
    edit((old) => ({
      ...old,
      nodes: old.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }));
  }
  function note(n: CanvasNode) {
    ui.open(
      '编辑便签',
      <NoteForm
        node={n}
        onSave={(title, body) => {
          editNode(n.id, { title, body });
          ui.close();
        }}
      />,
    );
  }
  function pick(node?: CanvasNode) {
    ui.open(
      '选择画布素材',
      <CanvasMaterialPicker
        initialMedia={
          demo.materials().find((m) => m.id === node?.materialId)?.media ||
          'image'
        }
        onSelect={(m) => {
          if (node) editNode(node.id, { materialId: m.id });
          else
            edit((old) => ({
              ...old,
              nodes: [
                ...old.nodes,
                {
                  id: crypto.randomUUID(),
                  type: 'media',
                  title: m.name,
                  materialId: m.id,
                  x: 100,
                  y: 100,
                  w: 220,
                  h: 230,
                },
              ],
            }));
        }}
      />,
      'picker-dialog',
    );
  }
  function append(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    edit((old) => {
      const offset = old.nodes.length
          ? Math.max(...old.nodes.map((n) => n.x + n.w)) + 60
          : 0,
        part = templateNodes(t, offset);
      return {
        ...old,
        nodes: [...old.nodes, ...part.nodes],
        edges: [...old.edges, ...part.edges],
      };
    });
    ui.close();
    fitSoon();
  }
  function fitSoon() {
    requestAnimationFrame(() => fit());
  }
  function fit() {
    const current = canvas.board(id)!,
      rect = stage.current?.getBoundingClientRect();
    if (!rect || !current.nodes.length) return;
    edit(
      (old) => ({ ...old, view: fitView(current, rect.width, rect.height) }),
      false,
    );
  }
  function run(n: CanvasNode, ordinal?: number) {
    try {
      let creation =
        n.creationId &&
        demo.getState().creations.find((c) => c.id === n.creationId);
      const bindings = taskBindings(board, n.id);
      if (!creation) {
        const sessionId = demo.begin(n.sceneId!, {
          prompt:
            board.goal ||
            board.nodes
              .filter((x) => x.type === 'note')
              .map((x) => x.body)
              .join(' '),
          bindings,
        });
        editNode(n.id, { creationId: sessionId });
        creation = demo.creation(sessionId);
      } else if (creation.phase === 'materials' || creation.phase === 'review')
        demo.edit(creation.id, { bindings });
      if (ordinal && creation.phase === 'review')
        demo.selectVersion(creation.id, ordinal);
      ui.open(
        n.title + ' · 画布任务',
        <div className="canvas-workspace">
          <Workspace sessionId={creation.id} embedded />
        </div>,
        'canvas-task-dialog',
      );
    } catch (e) {
      ui.notify(errorMessage(e));
    }
  }
  function chooseTask() {
    ui.open(
      '添加创作任务',
      <div className="cv-dialog-body">
        {templates
          .filter((t) =>
            ['product-launch', 'fashion-tryon', 'shop-film'].includes(t.id),
          )
          .map((t) => (
            <button
              key={t.id}
              className="cv-quick-task"
              onClick={() => append(t.id)}
            >
              <DemoImage asset={AssetKeySchema.parse(t.poster)} />
              <span>
                <b>{requireScene(t.scene!).name}</b>
                <small>{t.out}</small>
              </span>
              <Icon name="plus" />
            </button>
          ))}
      </div>,
    );
  }
  function finishConnection(to: CanvasNode) {
    if (!connecting) return;
    const from = board.nodes.find((n) => n.id === connecting);
    setConnecting('');
    if (!from) return;
    const apply = (role?: string) => {
      try {
        if (role && from.type === 'media') {
          const m = demo.materials().find((x) => x.id === from.materialId),
            r = requireScene(to.sceneId!).roles.find((x) => x.id === role);
          if (!m || m.media !== r?.media)
            throw new Error('素材类型与任务角色不匹配');
        }
        edit((old) => connect(old, from.id, to.id, role));
        ui.close();
      } catch (e) {
        ui.notify(errorMessage(e));
      }
    };
    if (to.type === 'task' && from.type === 'media') {
      ui.open(
        '选择素材角色',
        <div className="cv-dialog-body">
          {requireScene(to.sceneId!).roles.map((r) => (
            <button
              key={r.id}
              className="secondary full"
              onClick={() => apply(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>,
      );
    } else apply();
  }
  function pointerDown(e: PointerEvent, nodeId?: string) {
    if (
      e.button !== 0 ||
      (e.target as HTMLElement).closest('button,input,textarea,select,a,video')
    )
      return;
    if (connecting && nodeId) {
      finishConnection(board.nodes.find((n) => n.id === nodeId)!);
      return;
    }
    if (nodeId && mode === 'select') setSelected(nodeId);
    drag.current = {
      node: mode === 'pan' ? undefined : nodeId,
      x: e.clientX,
      y: e.clientY,
      original: structuredClone(board),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }
  function pointerMove(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    d.moved ||= Math.abs(dx) + Math.abs(dy) > 4;
    if (!d.moved) return;
    const original = d.original;
    canvas.edit(
      id,
      (old) => ({
        ...old,
        ...(d.node
          ? {
              nodes: original.nodes.map((n) =>
                n.id === d.node
                  ? {
                      ...n,
                      x: n.x + dx / original.view.scale,
                      y: n.y + dy / original.view.scale,
                    }
                  : n,
              ),
            }
          : {
              view: {
                ...original.view,
                x: original.view.x + dx,
                y: original.view.y + dy,
              },
            }),
      }),
      false,
    );
  }
  function pointerUp() {
    const d = drag.current;
    drag.current = null;
    if (d?.moved && d.node) {
      const final = canvas.board(id)!;
      canvas.edit(id, () => d.original, false);
      canvas.edit(id, () => final);
    }
  }
  function nodeView(n: CanvasNode, inList = false) {
    const material = demo.materials().find((m) => m.id === n.materialId),
      task =
        n.type === 'placeholder' || n.type === 'results'
          ? board.nodes.find((x) => x.id === n.taskId)
          : n,
      c = sessions.creations.find((x) => x.id === task?.creationId),
      version = c?.versions.find(
        (v) => v.record.ordinal === (n.version || c.activeVersion),
      );
    return (
      <article
        key={n.id}
        className={`cv-node cv-node-${version && (n.type === 'placeholder' || n.type === 'results') ? 'results' : n.type} ${selected === n.id ? 'selected' : ''} ${inList ? 'in-list' : ''}`}
        style={
          inList ? {} : { left: n.x, top: n.y, width: n.w, minHeight: n.h }
        }
        tabIndex={0}
        aria-label={n.title + '节点'}
        onPointerDown={(e) => pointerDown(e, n.id)}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter') {
            setSelected(n.id);
            if (connecting) finishConnection(n);
          }
          if (
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
          ) {
            e.preventDefault();
            editNode(n.id, {
              x:
                n.x +
                (e.key === 'ArrowLeft' ? -10 : e.key === 'ArrowRight' ? 10 : 0),
              y:
                n.y +
                (e.key === 'ArrowUp' ? -10 : e.key === 'ArrowDown' ? 10 : 0),
            });
          }
        }}
        onDoubleClick={() => n.type === 'note' && note(n)}
      >
        <header className="cv-node-handle">
          <span>
            <Icon
              name={
                n.type === 'media'
                  ? 'image'
                  : n.type === 'task'
                    ? 'spark'
                    : 'book'
              }
            />
            {n.title}
          </span>
          <button
            aria-label={'查看 ' + n.title}
            onClick={() => {
              setSelected(n.id);
              setPanel(true);
            }}
          >
            ···
          </button>
        </header>
        {n.type === 'media' ? (
          <>
            {material ? (
              <MaterialPreview material={material} />
            ) : (
              <div className="cv-node-missing">素材需重新选择</div>
            )}
            <div className="cv-node-meta">
              <span>{material?.local ? '本地文件' : '演示素材'}</span>
              <button onClick={() => pick(n)}>替换</button>
            </div>
          </>
        ) : n.type === 'note' ? (
          <>
            <p className="cv-note-text">{n.body}</p>
            <button className="text-link" onClick={() => note(n)}>
              编辑便签 <Icon name="sliders" />
            </button>
          </>
        ) : n.type === 'task' ? (
          <div className="cv-task-body">
            <span className="badge">
              {c?.phase === 'running'
                ? '正在模拟…'
                : version
                  ? '已有 V' + c!.activeVersion
                  : '待确认计划'}
            </span>
            <p>{requireScene(n.sceneId!).out}</p>
            <small>
              {requireScene(n.sceneId!)
                .roles.filter((r) => r.required)
                .map((r) => r.label)
                .join('＋')}
            </small>
            <button className="primary full" onClick={() => run(n)}>
              {version ? '再做一版' : '查看输出计划'} <Icon name="arrow" />
            </button>
            {version && (
              <button className="text-link" onClick={() => run(n)}>
                查看已有结果
              </button>
            )}
          </div>
        ) : version ? (
          <>
            <div className="cv-result-thumb">
              {version.items.slice(0, 4).map((o) => (
                <OutputMedia key={o.id} output={o} sceneId={c!.sceneId} />
              ))}
            </div>
            <div className="cv-result-caption">
              <span>
                V{version.record.ordinal} · {version.items.length}项结果
              </span>
              <button onClick={() => task && run(task, n.version)}>
                查看与审核 <Icon name="arrow" />
              </button>
            </div>
          </>
        ) : (
          <div className="cv-placeholder-body">
            <Icon name="grid" />
            <p>
              确认计划并模拟后，
              <br />
              结果会出现在这里。
            </p>
            <span>每一版都会保留</span>
          </div>
        )}
        {!inList && (
          <>
            <span className="cv-in-port" />
            <button
              className={`cv-port ${connecting === n.id ? 'connecting' : ''}`}
              aria-label={'连接 ' + n.title}
              onClick={() =>
                connecting ? finishConnection(n) : setConnecting(n.id)
              }
            >
              ＋
            </button>
          </>
        )}
      </article>
    );
  }
  return (
    <>
      {state.warning && (
        <p className="app-notice" role="alert">
          {state.warning}
        </p>
      )}
      <div
        className={`cv-editor-shell ${panel ? '' : 'panel-collapsed'} ${list ? 'cv-show-list' : ''}`}
      >
        <aside
          className={`cv-assistant ${panel ? 'open' : ''}`}
          aria-label="画布创作助手"
        >
          <div className="cv-assistant-head">
            <span>
              <Icon name="spark" />
              创作助手
            </span>
            <button
              className="icon-button"
              aria-label="收起创作助手"
              onClick={() => setPanel(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="cv-assistant-scroll">
            {sel ? (
              <div className="cv-selection">
                <span className="small-label">当前选择</span>
                <h2>{sel.title}</h2>
                <p>
                  {sel.type === 'task'
                    ? '连接素材后核对计划，确认后才模拟执行。'
                    : '拖动节点或使用方向键调整位置。'}
                </p>
                <button
                  className="text-link"
                  disabled={running}
                  onClick={() => {
                    edit((old) => ({
                      ...old,
                      nodes: old.nodes.filter((n) => n.id !== sel.id),
                      edges: old.edges.filter(
                        (e) => e.from !== sel.id && e.to !== sel.id,
                      ),
                    }));
                    setSelected('');
                  }}
                >
                  移除节点
                </button>
                {board.edges
                  .filter((e) => e.from === sel.id || e.to === sel.id)
                  .map((e) => (
                    <button
                      key={e.id}
                      className="text-link"
                      onClick={() =>
                        edit((old) => ({
                          ...old,
                          edges: old.edges.filter((x) => x.id !== e.id),
                        }))
                      }
                    >
                      断开连接{' '}
                      {
                        board.nodes.find(
                          (n) => n.id === (e.from === sel.id ? e.to : e.from),
                        )?.title
                      }
                    </button>
                  ))}
              </div>
            ) : (
              <>
                <h2>把想法，放到画布上。</h2>
                <p>先整理素材和方向，再由你确认每一步创作。</p>
              </>
            )}
            <div className="cv-assistant-section">
              <span className="small-label">从一个具体任务开始</span>
              {templates.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  className="cv-quick-task"
                  onClick={() => append(t.id)}
                >
                  <DemoImage asset={AssetKeySchema.parse(t.poster)} />
                  <span>
                    <b>{requireScene(t.scene!).name}</b>
                    <small>{t.out}</small>
                  </span>
                  <Icon name="plus" />
                </button>
              ))}
            </div>
            <div className="cv-assistant-tip">
              <Icon name="info" />
              拖动节点整理位置；点连接点后选择另一个节点。双击便签可编辑内容。
            </div>
            <Link className="text-link" to="/creations">
              <Icon name="clock" />
              当前创作记录
            </Link>
          </div>
          <div className="cv-assistant-compose">
            <label htmlFor="cv-goal">你想完成什么？</label>
            <textarea
              id="cv-goal"
              maxLength={500}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：为新品做一套上新图片。"
            />
            <div>
              <span>流程演示 · 先确认再执行</span>
              <button
                className="primary"
                onClick={() => {
                  const ts = templates.filter((t) =>
                    /视频|短片/.test(goal)
                      ? ['shop-film', 'brand-film'].includes(t.id)
                      : /换装|模特/.test(goal)
                        ? t.id === 'fashion-tryon'
                        : t.id === 'product-launch',
                  );
                  ui.open(
                    '先选一个合适的流程',
                    <div className="cv-dialog-body">
                      {ts.map((t) => (
                        <button
                          className="secondary full"
                          key={t.id}
                          onClick={() => append(t.id)}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>,
                  );
                }}
              >
                整理成计划 <Icon name="arrow" />
              </button>
            </div>
          </div>
        </aside>
        <section className="cv-stage-wrap" aria-label="可交互画布">
          <div
            ref={stage}
            className={`cv-stage ${mode === 'pan' ? 'is-panning' : ''}`}
            tabIndex={0}
            aria-label="画布区域，拖动空白平移，拖动节点移动"
            onPointerDown={(e) => pointerDown(e)}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
          >
            <div
              className="cv-grid"
              style={{
                backgroundPosition: `${board.view.x}px ${board.view.y}px`,
                backgroundSize: `${24 * board.view.scale}px ${24 * board.view.scale}px`,
              }}
            />
            <div
              className="cv-world"
              style={{
                transform: `translate(${board.view.x}px,${board.view.y}px) scale(${board.view.scale})`,
              }}
            >
              <svg className="cv-edges" aria-hidden="true">
                {board.edges.map((e) => {
                  const a = board.nodes.find((n) => n.id === e.from),
                    z = board.nodes.find((n) => n.id === e.to);
                  if (!a || !z) return null;
                  const x = a.x + a.w,
                    y = a.y + 70,
                    x2 = z.x,
                    y2 = z.y + 70,
                    dx = Math.max(70, Math.abs(x2 - x) * 0.5);
                  return (
                    <path
                      key={e.id}
                      d={`M${x},${y} C${x + dx},${y} ${x2 - dx},${y2} ${x2},${y2}`}
                    />
                  );
                })}
              </svg>
              {board.nodes.map((n) => nodeView(n))}
            </div>
            {!board.nodes.length && (
              <div className="cv-empty-stage">
                <span>
                  <Icon name="grid" />
                </span>
                <h2>让第一份想法，落在这里。</h2>
                <p>添加素材或便签，也可以从一个现成流程开始。</p>
                <button
                  className="secondary"
                  onClick={() => append('product-launch')}
                >
                  体验商品上新流程 <Icon name="arrow" />
                </button>
              </div>
            )}
          </div>
          <div className="cv-node-list" aria-label="画布节点列表">
            {board.nodes.map((n) => nodeView(n, true))}
            {!board.nodes.length && <p>还没有节点，请添加素材或便签。</p>}
          </div>
          <div className="cv-toolbar" aria-label="画布工具">
            <button
              aria-label="选择与移动节点"
              aria-pressed={mode === 'select'}
              className={mode === 'select' ? 'active' : ''}
              onClick={() => setMode('select')}
            >
              <Icon name="arrow" />
            </button>
            <button
              aria-label="平移画布"
              aria-pressed={mode === 'pan'}
              className={mode === 'pan' ? 'active' : ''}
              onClick={() => setMode('pan')}
            >
              <Icon name="sliders" />
            </button>
            <i />
            <button aria-label="添加素材" onClick={() => pick()}>
              <Icon name="image" />
            </button>
            <button
              aria-label="添加便签"
              onClick={() => {
                const n: CanvasNode = {
                  id: crypto.randomUUID(),
                  type: 'note',
                  title: '新便签',
                  body: '',
                  x: 200,
                  y: 100,
                  w: 245,
                  h: 165,
                };
                edit((old) => ({ ...old, nodes: [...old.nodes, n] }));
                note(n);
              }}
            >
              <Icon name="book" />
            </button>
            <button aria-label="添加创作任务" onClick={chooseTask}>
              <Icon name="spark" />
            </button>
            <i />
            <button
              aria-label="撤销"
              disabled={running || !history.past.length}
              onClick={() => canvas.undo(id)}
            >
              ↶
            </button>
            <button
              aria-label="重做"
              disabled={running || !history.future.length}
              onClick={() => canvas.undo(id, true)}
            >
              ↷
            </button>
          </div>
          <div className="cv-zoom">
            <button
              aria-label="缩小画布"
              onClick={() =>
                edit(
                  (old) => ({
                    ...old,
                    view: {
                      ...old.view,
                      scale: Math.max(0.2, old.view.scale - 0.1),
                    },
                  }),
                  false,
                )
              }
            >
              −
            </button>
            <span>{Math.round(board.view.scale * 100)}%</span>
            <button
              aria-label="放大画布"
              onClick={() =>
                edit(
                  (old) => ({
                    ...old,
                    view: {
                      ...old.view,
                      scale: Math.min(2, old.view.scale + 0.1),
                    },
                  }),
                  false,
                )
              }
            >
              ＋
            </button>
            <i />
            <button aria-label="适应画布" onClick={fit}>
              <Icon name="grid" />
            </button>
          </div>
          <div className="cv-stage-hint">
            {connecting
              ? '请选择连接的终点节点'
              : '本地演示 · 不会自动执行生成'}
          </div>
        </section>
      </div>
      <p className="sr-only">
        画布仅模拟模板任务，不是通用工作流引擎；不会自动执行依赖节点。
      </p>
    </>
  );
}
