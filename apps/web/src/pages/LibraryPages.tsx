import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  demoMaterials,
  materialUrl,
  requireScene,
  type Material,
} from '../data/catalog';
import { demo, useDemo } from '../demo/store';
import { library, useLibrary, type LibraryKind } from '../demo/library';
import { demoWorks } from '../demo/fixtures';
import {
  isSaved,
  advanceRun,
  makeLocalPlan,
  startRun,
  type DemoCreation,
  type DemoWork,
} from '../demo/model';
import { MaterialPreview, UploadButton } from '../components/MaterialPicker';
import { DemoImage, OutputMedia } from '../components/Media';
import { Icon } from '../components/Icon';
import { useStartCreation } from '../components/useStartCreation';
import { errorMessage, useUi } from '../components/ui-context';
import { downloadOutput } from '../demo/download';
import { importUpload } from '../demo/uploads';

type Item = {
  id: string;
  name: string;
  type: 'image' | 'video' | 'text';
  date: string;
  work?: DemoWork;
  material?: Material;
  creation?: DemoCreation;
};
function recordStatus(c: DemoCreation, works: DemoWork[]) {
  if (isSaved(c, works)) return '已完成';
  return c.task?.status === 'failed'
    ? '失败'
    : c.phase === 'running'
      ? '执行中'
      : c.phase === 'review'
        ? '待审核'
        : c.phase === 'confirm'
          ? '待确认'
          : '草稿';
}
function EditForm({ kind, item }: { kind: LibraryKind; item: Item }) {
  const state = useLibrary(),
    meta = library.meta(kind, item.id),
    [name, setName] = useState(meta.name || item.name),
    [group, setGroup] = useState(meta.group),
    ui = useUi();
  return (
    <form
      className="ls-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          ui.notify('请输入名称');
          return;
        }
        library.update(kind, [item.id], { name: name.trim(), group });
        ui.close();
      }}
    >
      <label>
        名称
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {kind !== 'creations' && (
        <label>
          分组
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">未分组</option>
            {state.groups[kind].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      )}
      <button className="primary full">保存整理信息</button>
      <button
        type="button"
        className="text-link ls-trash-action"
        onClick={() => {
          library.update(
            kind,
            [item.id],
            kind === 'creations'
              ? { archived: !meta.archived }
              : { trashed: !meta.trashed },
          );
          ui.close();
        }}
      >
        {kind === 'creations'
          ? meta.archived
            ? '恢复记录'
            : '收起记录'
          : meta.trashed
            ? '恢复'
            : '移入最近删除'}
      </button>
      <p>整理信息只保存在当前浏览器。最近删除可以恢复。</p>
    </form>
  );
}
function GroupForm({
  kind,
  ids = [],
}: {
  kind: 'works' | 'materials';
  ids?: string[];
}) {
  const state = useLibrary(),
    ui = useUi(),
    [name, setName] = useState(''),
    [group, setGroup] = useState('');
  return (
    <form
      className="ls-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (ids.length) {
            library.update(kind, ids, { group });
            ui.close();
          } else {
            library.addGroup(kind, name);
            ui.close();
          }
        } catch (error) {
          ui.notify(errorMessage(error));
        }
      }}
    >
      {ids.length ? (
        <label>
          移动到分组
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">未分组</option>
            {state.groups[kind].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          分组名称
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
      )}
      <button className="primary full">
        {ids.length ? '移动分组' : '新建分组'}
      </button>
    </form>
  );
}
function Reselect({ material: m }: { material: Material }) {
  const ref = useRef<HTMLInputElement>(null),
    ui = useUi();
  return (
    <>
      <input
        type="file"
        hidden
        ref={ref}
        accept={
          m.media === 'image'
            ? 'image/jpeg,image/png,image/webp'
            : 'video/mp4,video/webm'
        }
        aria-label="重新选择原素材文件"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          let next: Material | undefined;
          try {
            next = await importUpload(f, m.media);
            demo.replaceUpload(m.id, next);
            ui.close();
            ui.notify('文件已重新关联，分组与创作引用保留');
          } catch (error) {
            if (next?.url) URL.revokeObjectURL(next.url);
            ui.notify(errorMessage(error));
          }
        }}
      />
      <button className="secondary full" onClick={() => ref.current?.click()}>
        重新选择文件
      </button>
    </>
  );
}
export function CreationsPage() {
  return <LibraryPage kind="creations" />;
}
export function WorksPage() {
  return <LibraryPage kind="works" />;
}
export function MaterialsPage() {
  return <LibraryPage kind="materials" />;
}
function LibraryPage({ kind }: { kind: LibraryKind }) {
  const state = useDemo(),
    lib = useLibrary(),
    ui = useUi(),
    start = useStartCreation(),
    record = kind === 'creations',
    material = kind === 'materials',
    source = record ? 'mine' : lib.sources[kind];
  const label = record ? '创作记录' : material ? '素材' : '作品';
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('全部'),
    [group, setGroup] = useState('all'),
    [sort, setSort] = useState('recent'),
    [favorites, setFavorites] = useState(false),
    [type, setType] = useState('全部类型'),
    [selected, setSelected] = useState<string[]>([]);
  let items: Item[] = record
    ? state.creations
        .filter((c) => !c.draft)
        .map((c) => ({
          id: c.id,
          name: c.name,
          type: requireScene(c.sceneId).output === '视频' ? 'video' : 'image',
          date: c.updatedAt,
          creation: c,
        }))
    : material
      ? (source === 'demo' ? demoMaterials : state.uploads).map((m) => ({
          id: m.id,
          name: m.name,
          type: m.media,
          date: '',
          material: m,
        }))
      : (source === 'demo' ? demoWorks : state.works).map((w) => ({
          id: w.record.id,
          name: w.record.title,
          type: w.output.kind,
          date: w.record.savedAt,
          work: w,
        }));
  items = items
    .filter((item) => {
      const meta = library.meta(kind, item.id),
        name = meta.name || item.name,
        typeLabel =
          item.type === 'image'
            ? '图片'
            : item.type === 'video'
              ? '视频'
              : '文稿';
      return (
        (record
          ? filter === '已收起'
            ? meta.archived
            : !meta.archived
          : source === 'trash'
            ? meta.trashed
            : !meta.trashed) &&
        (!query.trim() ||
          (
            name +
            (item.creation ? requireScene(item.creation.sceneId).name : '')
          ).includes(query.trim())) &&
        (!favorites || meta.favorite) &&
        (group === 'all' ||
          (group === 'none' ? !meta.group : group === meta.group)) &&
        (record
          ? (filter === '全部' ||
              filter === '已收起' ||
              recordStatus(item.creation!, state.works) === filter) &&
            (type === '全部类型' || type === typeLabel)
          : filter === '全部' || typeLabel === filter)
      );
    })
    .sort((a, b) => {
      const am = library.meta(kind, a.id),
        bm = library.meta(kind, b.id);
      return record && am.pinned !== bm.pinned
        ? am.pinned
          ? -1
          : 1
        : sort === 'name'
          ? (am.name || a.name).localeCompare(bm.name || b.name, 'zh-CN')
          : sort === 'oldest'
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date);
    });
  const selection = selected.filter((id) =>
      items.some((item) => item.id === id),
    ),
    editable = !record && source !== 'demo',
    filtered =
      query ||
      favorites ||
      group !== 'all' ||
      !['全部', '已收起'].includes(filter);
  function clear() {
    setQuery('');
    setFilter('全部');
    setFavorites(false);
    setGroup('all');
    setType('全部类型');
  }
  function organize(item: Item) {
    ui.open('整理' + label, <EditForm kind={kind} item={item} />);
  }
  function selectMaterialUse(m: Material) {
    if (!materialUrl(m)) {
      ui.notify('请先重新选择本地文件');
      return;
    }
    ui.open(
      '这份素材，用来做什么？',
      <div className="ls-form">
        <p>选择具体用途，素材会带到对应位置，其余内容由你继续确认。</p>
        <div className="ls-use-options">
          {['product', 'tryon', 'video', 'free-image', 'free-video'].flatMap(
            (id) =>
              requireScene(id)
                .roles.filter((r) => r.media === m.media)
                .map((r) => (
                  <button
                    key={id + r.id}
                    onClick={() => start(id, { bindings: { [r.id]: m.id } })}
                  >
                    <Icon name={m.media === 'video' ? 'video' : 'image'} />
                    <span>
                      <b>{requireScene(id).name}</b>
                      <small>作为{r.label}</small>
                    </span>
                    <Icon name="arrow" />
                  </button>
                )),
          )}
        </div>
      </div>,
    );
  }
  function download(w: DemoWork) {
    downloadOutput(w.output);
    ui.notify('下载预制演示文件，不包含页面叠加排版');
  }
  function detail(item: Item) {
    const m = item.material,
      w = item.work,
      meta = library.meta(kind, item.id);
    ui.open(
      meta.name || item.name,
      <div className="ls-detail">
        <div className="ls-detail-preview">
          {m ? (
            <MaterialPreview material={m} controls />
          ) : w ? (
            <OutputMedia
              output={w.output}
              ratio={w.snapshot.settings.ratio}
              sceneId={w.sceneId}
            />
          ) : null}
        </div>
        <div className="ls-detail-copy">
          <span className="badge">
            {source === 'demo' ? '预置演示内容' : '当前浏览器 · 演示'}
          </span>
          <h3>{meta.name || item.name}</h3>
          <p>
            {m
              ? '本地文件不上传，刷新后重选即可继续使用。'
              : '预制演示结果，不代表真实 AI 处理。'}
          </p>
          <dl>
            <dt>类型</dt>
            <dd>
              {item.type === 'video'
                ? '视频'
                : item.type === 'text'
                  ? '文稿'
                  : '图片'}
            </dd>
            <dt>分组</dt>
            <dd>{meta.group || '未分组'}</dd>
          </dl>
          {m ? (
            <>
              <button
                className="primary full"
                disabled={!materialUrl(m)}
                onClick={() => selectMaterialUse(m)}
              >
                用于创作 <Icon name="arrow" />
              </button>
              {m.local && <Reselect material={m} />}
            </>
          ) : w ? (
            <>
              <button
                className="primary full"
                onClick={() => {
                  const id = start(w.sceneId, {
                    demo: true,
                    prompt: '在这份演示结果的基础上继续调整。',
                  });
                  if (id)
                    demo.update(id, (c) => ({
                      ...c,
                      name: item.name.slice(0, 60) + ' · 再创作',
                      settings: structuredClone(w.snapshot.settings),
                      phase: 'review',
                      versions: [
                        {
                          record: {
                            id: crypto.randomUUID(),
                            creationId: c.id,
                            taskId: crypto.randomUUID(),
                            ordinal: 1,
                            kind: w.output.kind,
                            label: 'V1 · 演示再创作',
                            artifactUrl: null,
                            simulated: true,
                            createdAt: new Date().toISOString(),
                          },
                          items: [structuredClone(w.output)],
                          snapshot: {
                            ...structuredClone(w.snapshot),
                            bindings: c.bindings,
                            prompt: c.prompt,
                          },
                          adjustment: null,
                        },
                      ],
                      activeVersion: 1,
                      selected: [w.output.id],
                    }));
                }}
              >
                继续创作 <Icon name="arrow" />
              </button>
              <button className="secondary full" onClick={() => download(w)}>
                <Icon name="download" />
                下载演示{item.type === 'text' ? '文稿' : '原文件'}
              </button>
              {source === 'demo' && (
                <button
                  className="text-link"
                  onClick={() => {
                    try {
                      demo.keepWork(w);
                      library.source('works', 'mine');
                      ui.close();
                      ui.notify('已保留这份演示作品');
                    } catch (e) {
                      ui.notify(errorMessage(e));
                    }
                  }}
                >
                  保留这份演示到我的作品
                </button>
              )}
            </>
          ) : null}
          {source !== 'demo' && (
            <button className="text-link" onClick={() => organize(item)}>
              修改名称与分组
            </button>
          )}
        </div>
      </div>,
      'ls-detail-dialog',
    );
  }
  function seed() {
    if (state.creations.some((c) => c.name.includes('演示记录'))) {
      ui.notify('演示记录已载入');
      return;
    }
    for (const [i, scene] of ['product', 'tryon', 'video'].entries()) {
      const id = demo.begin(scene!, {
        demo: true,
        prompt: '演示记录 · 非真实执行',
      });
      demo.update(id, (c) => {
        if (i === 0) return { ...c, name: '商品草稿 · 演示记录' };
        if (i === 1) {
          const complete = advanceRun(
            startRun(
              { ...c, phase: 'confirm', plan: makeLocalPlan(c) },
              Date.now() - 3000,
            ),
            Date.now(),
          );
          return { ...complete, name: '换装待审核 · 演示记录' };
        }
        const failed = startRun(
          { ...c, phase: 'confirm', plan: makeLocalPlan(c) },
          Date.now(),
        );
        return {
          ...failed,
          name: '短片中断 · 演示记录',
          phase: 'materials',
          execution: null,
          task: {
            ...failed.task!,
            status: 'failed',
            error: {
              code: 'DEMO_INTERRUPTED',
              message: '模拟中断，请重新核对计划',
            },
          },
        };
      });
    }
    ui.notify('已载入 3 条明确标注的演示记录');
  }
  return (
    <>
      <section className="ls-page-heading">
        <div>
          <span className="eyebrow">
            {record
              ? '离开一会儿，也能接着做。'
              : material
                ? '让好素材，反复派上用场。'
                : '保存喜欢的，再接着创造。'}
          </span>
          <h1>{label}</h1>
          <p>
            {record
              ? '找到上次的进度，继续准备、查看计划或审核结果。'
              : material
                ? '收好商品、人物与参考短片，需要时直接带入创作。'
                : '整理图片、短片与文稿，随时开始下一次创作。'}
          </p>
        </div>
        {material ? (
          <UploadButton className="primary" />
        ) : (
          <Link className="primary" to="/scenes">
            <Icon name="plus" />
            {record ? '新建创作' : '开始创作'}
          </Link>
        )}
      </section>
      <div className="ls-toolbar">
        <label className="search-field ls-search">
          <Icon name="search" />
          <span className="sr-only">搜索{label}</span>
          <input
            type="search"
            placeholder={'搜索' + label + '名称'}
            aria-label={'搜索' + label}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="ls-toolbar-selects">
          {record ? (
            <select
              aria-label="按创作类型筛选"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {['全部类型', '图片', '视频'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          ) : (
            <select
              aria-label="按分组筛选"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="all">全部分组</option>
              <option value="none">未分组</option>
              {lib.groups[kind].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          )}
          <select
            aria-label="排序方式"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">最近{record ? '更新' : '添加'}</option>
            <option value="oldest">最早{record ? '更新' : '添加'}</option>
            <option value="name">按名称</option>
          </select>
        </div>
      </div>
      <div className="ls-filters">
        <div
          className="ls-filter-chips"
          role="group"
          aria-label={label + '筛选'}
        >
          {(record
            ? [
                '全部',
                '草稿',
                '待确认',
                '执行中',
                '待审核',
                '已完成',
                '失败',
                '已收起',
              ]
            : ['全部', '图片', '视频', ...(material ? [] : ['文稿'])]
          ).map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {!record && (
          <>
            <button
              className="ls-favorite-filter"
              aria-pressed={favorites}
              onClick={() => setFavorites(!favorites)}
            >
              <Icon name="book" />
              只看收藏
            </button>
            <button
              className="text-link"
              onClick={() => ui.open('新建分组', <GroupForm kind={kind} />)}
            >
              <Icon name="plus" />
              新建分组
            </button>
          </>
        )}
      </div>
      {material && (
        <p className="ls-library-notice">
          <Icon name="info" />
          本地文件不会上传，刷新后需重新选择；分组和整理信息会保留。
        </p>
      )}
      <div className="ls-results-meta" role="status">
        <span>
          {items.length} 项{label}
        </span>
        <span>仅保存在此浏览器</span>
      </div>
      {editable && items.length > 0 && (
        <div className="ls-batchbar">
          <label>
            <input
              type="checkbox"
              checked={items.every((i) => selection.includes(i.id))}
              onChange={(e) =>
                setSelected(e.target.checked ? items.map((i) => i.id) : [])
              }
            />
            本页全选
          </label>
          <span>已选 {selection.length} 项</span>
          <div>
            {source === 'trash' ? (
              <button
                className="text-link"
                disabled={!selection.length}
                onClick={() => {
                  library.update(kind, selection, { trashed: false });
                  setSelected([]);
                }}
              >
                恢复选中
              </button>
            ) : (
              <>
                <button
                  className="text-link"
                  disabled={!selection.length}
                  onClick={() =>
                    ui.open(
                      '移动分组',
                      <GroupForm
                        kind={kind as 'works' | 'materials'}
                        ids={selection}
                      />,
                    )
                  }
                >
                  移动分组
                </button>
                <button
                  className="text-link"
                  disabled={!selection.length}
                  onClick={() => {
                    library.update(kind, selection, { trashed: true });
                    setSelected([]);
                  }}
                >
                  移入最近删除
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {!items.length ? (
        <div className="ls-empty">
          <span>
            <Icon name={record ? 'clock' : material ? 'folder' : 'book'} />
          </span>
          <h2>
            {filtered
              ? '没有找到符合条件的' + label
              : source === 'trash'
                ? '最近删除是空的'
                : record
                  ? '开始一次创作，进度会留在这里'
                  : material
                    ? '放入第一份素材，从这里开始'
                    : '还没有确认保留的作品'}
          </h2>
          <p>
            {filtered
              ? '试试其它关键词，或清除筛选。'
              : source === 'trash'
                ? '移入这里的内容可以恢复。'
                : record
                  ? '素材准备、输出计划与结果审核都可以随时接着做。'
                  : material
                    ? '导入商品、人物或参考短片，在不同创作中反复使用。'
                    : '生成并确认保留后，图片、短片和文稿会出现在这里。'}
          </p>
          <div>
            {filtered ? (
              <button className="secondary" onClick={clear}>
                清除搜索与筛选
              </button>
            ) : source === 'trash' ? null : record ? (
              <>
                <Link className="primary" to="/scenes">
                  选择一个场景
                </Link>
                <button className="secondary" onClick={seed}>
                  载入演示记录
                </button>
              </>
            ) : material ? (
              <>
                <UploadButton className="primary" />
                <button
                  className="secondary"
                  onClick={() => library.source(kind, 'demo')}
                >
                  浏览演示素材
                </button>
              </>
            ) : (
              <>
                <Link className="primary" to="/scenes">
                  开始创作
                </Link>
                <button
                  className="secondary"
                  onClick={() => library.source(kind, 'demo')}
                >
                  体验演示作品
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            record
              ? 'ls-record-list'
              : material
                ? 'ls-materials-grid'
                : 'ls-works-grid'
          }
        >
          {items.map((item) => {
            const meta = library.meta(kind, item.id),
              name = meta.name || item.name,
              c = item.creation;
            return record ? (
              <article key={item.id} className="ls-record-card">
                <DemoImage
                  asset={requireScene(c!.sceneId).image}
                  alt={requireScene(c!.sceneId).name + ' · 演示参考'}
                />
                <div className="ls-record-title">
                  <span>
                    {meta.pinned ? '置顶 · ' : ''}
                    {requireScene(c!.sceneId).name}
                  </span>
                  <h2>{name}</h2>
                  <p>
                    {c!.shortId} ·{' '}
                    {new Date(c!.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <span className="status">{recordStatus(c!, state.works)}</span>
                <div className="ls-record-actions">
                  <Link
                    className="secondary"
                    to="/creations/$creationId"
                    params={{ creationId: item.id }}
                  >
                    继续创作 <Icon name="arrow" />
                  </Link>
                  <button
                    className="text-link"
                    onClick={() =>
                      library.update(kind, [item.id], { pinned: !meta.pinned })
                    }
                  >
                    {meta.pinned ? '取消置顶' : '置顶'}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={'管理 ' + name}
                    onClick={() => organize(item)}
                  >
                    ···
                  </button>
                </div>
              </article>
            ) : (
              <article
                key={item.id}
                className={material ? 'ls-material-card' : 'ls-work-card'}
              >
                <div
                  className={material ? 'ls-material-media' : 'ls-work-media'}
                >
                  <button
                    className={
                      material ? 'ls-material-open' : 'ls-work-preview'
                    }
                    data-action={
                      material ? 'ls-material-detail' : 'ls-work-detail'
                    }
                    onClick={() => detail(item)}
                    aria-label={'查看' + label + ' ' + name}
                  >
                    {item.material ? (
                      <MaterialPreview material={item.material} />
                    ) : (
                      <OutputMedia
                        interactive={false}
                        output={item.work!.output}
                        ratio={item.work!.snapshot.settings.ratio}
                        sceneId={item.work!.sceneId}
                      />
                    )}
                  </button>
                  <span className="ls-media-label">
                    演示内容 ·{' '}
                    {item.type === 'video'
                      ? '视频 · 12s'
                      : item.type === 'text'
                        ? '文稿'
                        : '图片'}
                  </span>
                  {editable && (
                    <label className="ls-select">
                      <input
                        type="checkbox"
                        aria-label={'选择 ' + name}
                        checked={selection.includes(item.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selection, item.id]
                              : selection.filter((i) => i !== item.id),
                          )
                        }
                      />
                    </label>
                  )}
                  <button
                    className={`ls-card-favorite ${meta.favorite ? 'active' : ''}`}
                    aria-label={meta.favorite ? '取消收藏' : '收藏'}
                    aria-pressed={meta.favorite}
                    onClick={() =>
                      library.update(kind, [item.id], {
                        favorite: !meta.favorite,
                      })
                    }
                  >
                    <Icon name="book" />
                  </button>
                </div>
                <div className="ls-card-copy">
                  <h2>
                    <button onClick={() => detail(item)}>{name}</button>
                  </h2>
                  <p>
                    {meta.group || '未分组'}
                    {item.material?.local
                      ? materialUrl(item.material)
                        ? ' · 当前可用'
                        : ' · 需重新选择'
                      : ''}
                  </p>
                  <button
                    className="text-link"
                    onClick={() =>
                      source === 'trash'
                        ? library.update(kind, [item.id], { trashed: false })
                        : detail(item)
                    }
                  >
                    {source === 'trash' ? '恢复' : '查看详情'}{' '}
                    <Icon name="arrow" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {record &&
        items.length > 0 &&
        !state.creations.some((c) => c.name.includes('演示记录')) && (
          <button className="text-link ls-load-examples" onClick={seed}>
            载入演示记录，体验不同状态
          </button>
        )}
      {!record && !material && (
        <div className="ls-page-note">
          <Icon name="info" />
          全部生成与下载均为演示。
          <button
            className="text-link"
            onClick={() =>
              ui.open(
                '素材使用说明',
                <div className="about-body">
                  <p>素材使用条款仍待确认，当前仅供浏览器内演示。</p>
                </div>,
              )
            }
          >
            素材使用说明
          </button>
        </div>
      )}
    </>
  );
}
