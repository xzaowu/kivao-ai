import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { assetQuery, workQuery } from '../api';
import { demoMaterials, materialUrl, type Material } from '../data/catalog';
import { useDemo } from '../demo/store';
import { CreationCard } from '../components/SceneCards';
import { MaterialPreview, UploadButton } from '../components/MaterialPicker';
import { OutputMedia } from '../components/Media';
import { Icon } from '../components/Icon';
import { useUi } from '../components/ui-context';

export function CreationsPage() {
  const state = useDemo(),
    creations = state.creations
      .filter((creation) => !creation.draft)
      .slice()
      .reverse();
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">每次开始，都可以接着做。</span>
        <h1>我的创作</h1>
        <p>
          素材、计划和版本都在这里。确认结果另存为作品；本地演示记录与 Mock
          服务的生命周期独立。
        </p>
      </section>
      {creations.length ? (
        <div className="creation-list">
          {creations.map((creation) => (
            <CreationCard key={creation.id} creation={creation} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <span>
            <Icon name="spark" />
          </span>
          <h3>从第一次创作开始</h3>
          <p>不需要先懂模型或写提示词，选一个任务就可以。</p>
          <Link className="primary" to="/scenes">
            带我一步步做 <Icon name="arrow" />
          </Link>
        </div>
      )}
    </>
  );
}
export function WorksPage() {
  const state = useDemo(),
    query = useQuery(workQuery);
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">你确认留下的，才是作品。</span>
        <h1>
          作品 <small>{state.works.length}</small>
        </h1>
        <p>
          保留已确认的版本和来源。新的调整不会覆盖这里的作品。保存范围为当前浏览器的前端演示。
        </p>
      </section>
      {state.works.length ? (
        <div className="works-grid">
          {state.works
            .slice()
            .reverse()
            .map((work) => (
              <article className="work-card" key={work.record.id}>
                <OutputMedia
                  output={work.output}
                  ratio={work.snapshot.settings.ratio}
                  sceneId={work.sceneId}
                />
                <span className="badge available">
                  已确认 · V{work.ordinal} · 前端演示
                </span>
                <h3>{work.record.title}</h3>
                <p>{work.creationName}</p>
                <Link
                  className="text-link"
                  to="/creations/$creationId"
                  params={{ creationId: work.sessionId }}
                >
                  回到来源创作 <Icon name="arrow" />
                </Link>
              </article>
            ))}
        </div>
      ) : (
        <div className="empty">
          <span>
            <Icon name="grid" />
          </span>
          <h3>第一件作品，等你来确认</h3>
          <p>
            执行中和待审核的版本在“创作”中。完成一次场景并确认后，会出现在这里。
          </p>
          <Link className="primary" to="/scenes">
            选择一个场景 <Icon name="arrow" />
          </Link>
        </div>
      )}
      <details className="api-samples">
        <summary>
          Mock API 的固定作品样本
          {query.data ? `（${query.data.data.length} 条）` : ''}
        </summary>
        <p className="small-note">
          以下为 API 预置的模拟保存记录，不是你本次审核保存的作品。
        </p>
        {query.isPending && <p role="status">正在读取模拟记录…</p>}
        {query.isError && (
          <p role="alert">
            {query.error.message}
            <button className="text-link" onClick={() => void query.refetch()}>
              重试
            </button>
          </p>
        )}
        {query.data && (
          <ul>
            {query.data.data.map((work) => (
              <li key={work.id}>
                {work.title}
                <small> · Mock API</small>
              </li>
            ))}
          </ul>
        )}
      </details>
    </>
  );
}
function InspectMaterial({ material }: { material: Material }) {
  return (
    <div className="output-inspect">
      <MaterialPreview material={material} controls />
      <p>
        {material.local
          ? materialUrl(material)
            ? '本地文件，未上传'
            : '本地文件已失效，请在素材选择器中重新选择文件。'
          : '预置演示素材'}{' '}
        · {material.role}
      </p>
      <p className="small-note">
        进入具体创作后，按角色引用这份素材。本地预览不代表文件已上传到 API。
      </p>
    </div>
  );
}
export function MaterialsPage() {
  const state = useDemo(),
    [type, setType] = useState('全部'),
    ui = useUi(),
    query = useQuery(assetQuery);
  const list = [...demoMaterials, ...state.uploads].filter(
    (material) =>
      type === '全部' ||
      material.media === (type === '图片' ? 'image' : 'video'),
  );
  return (
    <>
      <section className="page-heading material-heading">
        <div>
          <span className="eyebrow">素材是起点，可以反复使用。</span>
          <h1>素材</h1>
          <p>在创作中按角色引用同一份素材，无需重复导入。</p>
        </div>
        <UploadButton className="primary">从本地导入</UploadButton>
      </section>
      <div className="simple-tabs">
        {['全部', '图片', '视频'].map((value) => (
          <button
            key={value}
            className={type === value ? 'active' : ''}
            aria-pressed={type === value}
            onClick={() => setType(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="catalog-note">
        <Icon name="info" />
        预置素材均为演示；本地文件不会上传，刷新后需重新选择。
      </p>
      <div className="materials-grid">
        {list.length ? (
          list.map((material) => (
            <button
              className="material-card"
              key={material.id}
              onClick={() =>
                ui.open(
                  material.name,
                  <InspectMaterial material={material} />,
                  'output-dialog',
                )
              }
            >
              <MaterialPreview material={material} />
              <div>
                <span className="badge">
                  {material.local ? '本地文件' : '演示素材'} ·{' '}
                  {material.media === 'video' ? '视频' : '图片'}
                </span>
                <h3>{material.name}</h3>
                <p>{material.role}</p>
              </div>
            </button>
          ))
        ) : (
          <div className="empty">
            <h3>暂无这类素材</h3>
            <p>从本地选择素材，仅在浏览器预览。</p>
          </div>
        )}
      </div>
      <details className="api-samples">
        <summary>
          Mock API 素材引用
          {query.data ? `（${query.data.data.length} 条）` : ''}
        </summary>
        <p className="small-note">
          这组引用供三个核心场景创建 API
          计划使用；本地预览与角色补充信息由前端演示层保存。
        </p>
        {query.isError && (
          <p role="alert">
            {query.error.message}
            <button className="text-link" onClick={() => void query.refetch()}>
              重试
            </button>
          </p>
        )}
        {query.data && (
          <ul>
            {query.data.data.map((material) => (
              <li key={material.id}>
                {material.name} · {material.allowedRoles.join(' / ')}
              </li>
            ))}
          </ul>
        )}
      </details>
    </>
  );
}
