import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@kivao/ui';
import { requireScene } from '../data/catalog';
import {
  currentVersion,
  isDirty,
  type Adjustment,
  type DemoCreation,
} from '../demo/model';
import { demo, useDemo } from '../demo/store';
import { CaseCard } from '../components/SceneCards';
import { Icon } from '../components/Icon';
import { OutputMedia } from '../components/Media';
import { useUi } from '../components/ui-context';
import { AdjustmentDialog, InspectOutput, SaveDialog } from './ReviewDialogs';

function Examples({ video }: { video: boolean }) {
  return (
    <div className={`studio-examples ${video ? 'video-examples' : ''}`}>
      {video ? (
        <CaseCard caseId="case-bakery-film" variant="workspace" />
      ) : (
        <>
          <CaseCard caseId="case-tea-launch" variant="workspace" />
          <CaseCard caseId="case-blue-shirt" variant="workspace" />
        </>
      )}
    </div>
  );
}
export function Results({
  creation,
  onPrepare,
}: {
  creation: DemoCreation;
  onPrepare: (adjustment: Adjustment) => void;
}) {
  const [tab, setTab] = useState<'results' | 'cases'>('results'),
    [compare, setCompare] = useState(false);
  const scene = requireScene(creation.sceneId),
    version = currentVersion(creation),
    state = useDemo(),
    ui = useUi(),
    dirty = isDirty(creation);
  const previous = creation.versions.find(
    (item) => item.record.ordinal === creation.activeVersion - 1,
  );
  const comparedId = version?.adjustment?.ids[0] || version?.items[0]?.id;
  const comparedBefore = previous?.items.find((item) => item.id === comparedId),
    comparedAfter = version?.items.find((item) => item.id === comparedId);
  const already = Boolean(
    version &&
      creation.selected.length &&
      creation.selected.every((id) =>
        state.works.some(
          (work) =>
            work.record.versionId === version.record.id &&
            work.output.id === id,
        ),
      ),
  );
  return (
    <>
      <div className="studio-result-head">
        <div className="studio-result-tabs">
          <button
            aria-pressed={tab === 'results'}
            onClick={() => setTab('results')}
          >
            本次结果{version ? ` · ${version.items.length}` : ''}
          </button>
          <button
            aria-pressed={tab === 'cases'}
            onClick={() => setTab('cases')}
          >
            案例参考
          </button>
        </div>
        <span className="studio-demo-tag">前端演示结果</span>
      </div>
      {tab === 'cases' ? (
        <Examples video={scene.output === '视频'} />
      ) : !version ? (
        <div className="studio-empty-state">
          <div>
            <span className="eyebrow">让结果，成为创作的下一步。</span>
            <h2>这里会保留你的每一版结果</h2>
            <p>在左侧准备素材和配置，核对计划后开始。先看看下面的演示参考。</p>
          </div>
          <Examples video={scene.output === '视频'} />
        </div>
      ) : (
        <>
          <div className="studio-review-body">
            <div className="studio-version-bar">
              <div className="version-tabs" aria-label="结果版本">
                {creation.versions.map((item) => (
                  <button
                    key={item.record.id}
                    aria-pressed={item.record.id === version.record.id}
                    className={
                      item.record.id === version.record.id ? 'active' : ''
                    }
                    onClick={() => {
                      demo.selectVersion(creation.id, item.record.ordinal);
                      setCompare(false);
                    }}
                  >
                    V{item.record.ordinal}
                    {item.record.ordinal === 1 ? ' · 初版' : ' · 调整版'}
                  </button>
                ))}
              </div>
              <div>
                <button
                  className="text-link"
                  onClick={() =>
                    demo.select(
                      creation.id,
                      version.items.map((item) => item.id),
                    )
                  }
                >
                  全选
                </button>
                {previous && (
                  <button
                    className="text-link"
                    onClick={() => setCompare(!compare)}
                  >
                    {compare ? '收起对比' : '对比上一版'}
                  </button>
                )}
              </div>
            </div>
            {version.adjustment && (
              <p className="studio-version-note">
                <Icon name="check" />
                {version.adjustment.intent} · 调整{' '}
                {version.adjustment.ids.length}{' '}
                项，其余保留；演示不真实编辑图像。
              </p>
            )}
            {dirty && (
              <p className="studio-version-note">
                左侧设置有修改，本次结果仍来自 V{version.record.ordinal}{' '}
                的原始计划。
                <button
                  className="text-link"
                  onClick={() => demo.restore(creation.id)}
                >
                  恢复此版本设置
                </button>
              </p>
            )}
            {compare && previous && comparedBefore && comparedAfter && (
              <section className="version-compare">
                <div>
                  <h3>V{previous.record.ordinal} · 上一版</h3>
                  <OutputMedia
                    output={comparedBefore}
                    ratio={previous.snapshot.settings.ratio}
                    sceneId={creation.sceneId}
                  />
                </div>
                <div>
                  <h3>V{version.record.ordinal} · 本次版本</h3>
                  <OutputMedia
                    output={comparedAfter}
                    ratio={version.snapshot.settings.ratio}
                    sceneId={creation.sceneId}
                  />
                </div>
              </section>
            )}
            <div
              className={`studio-output-grid ${scene.output === '视频' ? 'studio-video-grid' : ''}`}
            >
              {version.items.map((output) => (
                <article
                  className="result-card"
                  key={output.id}
                  data-output-id={output.id}
                  data-source-version={output.revision}
                >
                  <label className="result-select">
                    <input
                      type="checkbox"
                      checked={creation.selected.includes(output.id)}
                      onChange={(event) =>
                        demo.select(
                          creation.id,
                          event.target.checked
                            ? [...creation.selected, output.id]
                            : creation.selected.filter(
                                (id) => id !== output.id,
                              ),
                        )
                      }
                    />
                    <span>{output.title}</span>
                    {output.revision === version.record.ordinal &&
                      version.record.ordinal > 1 && <b>本次调整</b>}
                  </label>
                  <OutputMedia
                    output={output}
                    ratio={version.snapshot.settings.ratio}
                    sceneId={creation.sceneId}
                  />
                  <div className="result-meta">
                    <span>
                      {output.kind === 'video'
                        ? '12秒 · 16:9'
                        : version.snapshot.settings.ratio}{' '}
                      · 演示
                    </span>
                    <button
                      className="text-link"
                      onClick={() =>
                        ui.open(
                          output.title,
                          <InspectOutput creation={creation} output={output} />,
                          'output-dialog',
                        )
                      }
                    >
                      查看大图 <Icon name="search" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <details className="studio-review-hints">
              <summary>审核要点</summary>
              <ul>
                {scene.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
              <p>
                预制演示媒体；版本变化只验证流程，不代表真实模型编辑。保存固定当前版本与原始设置。
              </p>
            </details>
          </div>
          <footer className="studio-review-actions">
            <span>
              已选 <b>{creation.selected.length}</b> 项
              <small>V{version.record.ordinal} · 原版本保留</small>
            </span>
            <div>
              <button
                className="secondary"
                disabled={!creation.selected.length || dirty}
                title={
                  dirty ? '先生成左侧变更，或恢复原版本设置' : '只调整选中结果'
                }
                onClick={() =>
                  ui.open(
                    `调整选中的 ${creation.selected.length} 项结果`,
                    <AdjustmentDialog
                      creation={creation}
                      onPrepare={onPrepare}
                    />,
                  )
                }
              >
                调整选中项
              </button>
              {already ? (
                <Button asChild className="primary">
                  <Link to="/works">
                    查看作品 <Icon name="check" />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="primary"
                  disabled={!creation.selected.length}
                  onClick={() =>
                    ui.open(
                      `确认保留 ${creation.selected.length} 项结果`,
                      <SaveDialog creation={creation} />,
                    )
                  }
                >
                  确认保留 {creation.selected.length} 项 <Icon name="check" />
                </Button>
              )}
            </div>
          </footer>
        </>
      )}
    </>
  );
}
