import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@kivao/ui';
import {
  materialUrl,
  cases,
  recommendScenes,
  requireScene,
  scenes,
  suggestBindings,
  type Material,
  type SceneDefinition,
} from '../data/catalog';
import { HOME_DRAFT_KEY, loadHomeDraft } from '../demo/homeDraft';
import { demo, useDemo } from '../demo/store';
import { isSaved } from '../demo/model';
import { CreationCard, CaseCard, SceneChoices } from '../components/SceneCards';
import { useStartCreation } from '../components/useStartCreation';
import { DemoImage } from '../components/Media';
import { Icon } from '../components/Icon';
import { MaterialPreview, UploadButton } from '../components/MaterialPicker';
import { useUi } from '../components/ui-context';

const placeholders = {
  guide: '描述你想完成的内容，例如：为新品做一套上架图片，并延展一段宣传短片。',
  image: '描述你想要的画面、主体或风格，也可以先添加参考图片。',
  video: '描述短片的主题、镜头或节奏，也可以添加主体图片或参考视频。',
};
export function HomePage() {
  const [saved] = useState(loadHomeDraft);
  const [mode, setMode] = useState(saved.draft.mode),
    [prompt, setPrompt] = useState(saved.draft.prompt),
    [attachments, setAttachments] = useState<Material[]>(() =>
      saved.draft.attachments.flatMap((id) => {
        const m = demo.materials().find((item) => item.id === id);
        return m ? [m] : [];
      }),
    );
  const [saveWarning, setSaveWarning] = useState(saved.warning);
  useEffect(() => {
    if (saved.warning) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          HOME_DRAFT_KEY,
          JSON.stringify({
            mode,
            prompt,
            attachments: attachments.map((m) => m.id),
          }),
        );
      } catch {
        setSaveWarning('首页草稿保存失败，刷新后可能丢失输入。');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mode, prompt, attachments, saved.warning]);
  const state = useDemo(),
    start = useStartCreation(),
    ui = useUi();
  const ongoing = state.creations.filter(
    (creation) => !creation.draft && !isSaved(creation, state.works),
  );
  function startScene(scene: SceneDefinition) {
    start(scene.id, { prompt, bindings: suggestBindings(scene, attachments) });
  }
  function choose(forced?: string) {
    ui.open(
      prompt.trim() ? '选择一个适合的创作流程' : '先选一件想完成的事',
      <SceneChoices
        list={
          forced
            ? [requireScene(forced)]
            : recommendScenes(
                prompt,
                attachments.some((item) => item.media === 'video'),
              )
        }
        prompt={prompt}
        bindings={Object.fromEntries(
          attachments.map((item) => [item.id, item.id]),
        )}
        onChoose={startScene}
      />,
    );
  }
  function begin() {
    if (attachments.some((m) => !materialUrl(m))) {
      ui.notify('本地参考需重新选择，请移除或从素材页重新关联后继续。');
      return;
    }
    if (mode === 'guide') {
      choose();
      return;
    }
    if (attachments.some((item) => item.media === 'video')) {
      if (mode === 'image')
        ui.notify(
          '图片创作请使用图片参考；视频素材可从智能引导进入参考视频场景。',
        );
      else choose('video');
      return;
    }
    const scene = requireScene(mode === 'video' ? 'free-video' : 'free-image');
    const first = attachments.find((item) => item.media === 'image');
    start(scene.id, {
      prompt,
      draft: true,
      bindings: first ? { [scene.roles[0]!.id]: first.id } : {},
    });
  }
  return (
    <>
      {saveWarning && (
        <p className="app-notice" role="alert">
          {saveWarning}
        </p>
      )}
      <section className="start-hero" aria-label="开始创作">
        <div className="start-heading">
          <span className="eyebrow">风筝 KIVAO · 线始终在人手里。</span>
          <h1>
            从一个想法，<span>开始创作。</span>
          </h1>
          <p>说出目标，放入素材，让想法一步步成为作品。</p>
        </div>
        <div className="start-composer">
          <div className="start-composer-top">
            <div className="start-modes" role="group" aria-label="创作模式">
              {(
                [
                  ['guide', 'spark', '智能引导'],
                  ['image', 'image', '图片'],
                  ['video', 'video', '视频'],
                ] as const
              ).map(([key, icon, label]) => (
                <button
                  key={key}
                  aria-pressed={mode === key}
                  onClick={() => setMode(key)}
                >
                  <Icon name={icon} />
                  {label}
                </button>
              ))}
            </div>
            <span className="start-demo-label">创作流程演示</span>
          </div>
          <label className="sr-only" htmlFor="free-goal">
            一句话开始创作
          </label>
          <textarea
            id="free-goal"
            className="start-prompt"
            maxLength={500}
            placeholder={placeholders[mode]}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          {attachments.length > 0 && (
            <div className="start-attachments" aria-label="本次参考素材">
              {attachments.map((item) => (
                <div className="start-attachment" key={item.id}>
                  {item.media === 'image' ? (
                    <MaterialPreview material={item} />
                  ) : (
                    <span className="start-file-icon">
                      <Icon name="video" />
                    </span>
                  )}
                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.media === 'video' ? '视频参考' : '图片参考'} ·
                      本地预览
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={`移除本次参考 ${item.name}`}
                    onClick={() =>
                      setAttachments(
                        attachments.filter((entry) => entry.id !== item.id),
                      )
                    }
                  >
                    <Icon name="close" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="start-composer-actions">
            <div>
              <UploadButton
                {...(mode === 'image' ? { media: 'image' as const } : {})}
                className="start-attach-button"
                onImport={(items) => {
                  if (attachments.length + items.length > 4) {
                    ui.notify('一次最多引用 4 份素材，其余已留在素材库。');
                  }
                  setAttachments([...attachments, ...items].slice(0, 4));
                }}
              >
                添加素材
              </UploadButton>
              <span>图片 / 视频 · 下一步确认用途</span>
            </div>
            <Button className="primary start-submit" onClick={begin}>
              开始创作 <Icon name="arrow" />
            </Button>
          </div>
        </div>
        <div className="ix-home-draft-bar">
          <span id="ix-home-save" role="status">
            {saveWarning ||
              (saved.draft.prompt && saved.draft.prompt === prompt
                ? '已恢复本地草稿'
                : '描述和模式会自动保存')}
          </span>
          <button
            onClick={() => {
              const backup = { prompt, mode, attachments };
              setPrompt('');
              setAttachments([]);
              ui.notify('本次输入已清空', {
                label: '撤销',
                run: () => {
                  setPrompt(backup.prompt);
                  setMode(backup.mode);
                  setAttachments(backup.attachments);
                },
              });
            }}
          >
            清空本次输入
          </button>
        </div>
        <p className="start-helper">
          {mode === 'guide'
            ? '智能引导为关键词匹配演示；先选任务，再确认素材与输出。'
            : '先进入工作区准备与确认，当前为预制结果演示，不调用真实 AI。'}
          <button className="text-link" onClick={() => choose()}>
            不知道怎么写？选个场景 <Icon name="chevron" />
          </button>
        </p>
      </section>
      {ongoing.length > 0 && (
        <section className="start-continue">
          <div className="section-heading">
            <div>
              <h2>继续创作</h2>
              <p>上次的素材、计划和版本都在。</p>
            </div>
            <Link className="text-link" to="/creations">
              全部创作 <Icon name="arrow" />
            </Link>
          </div>
          <div className="continue-grid">
            {ongoing
              .slice()
              .reverse()
              .slice(0, 3)
              .map((creation) => (
                <CreationCard key={creation.id} creation={creation} />
              ))}
          </div>
        </section>
      )}
      <section className="start-tools">
        <div className="section-heading">
          <div>
            <h2>场景工具</h2>
            <p>从具体任务开始，不必先写提示词。</p>
          </div>
          <Link className="text-link" to="/scenes">
            全部场景 <Icon name="arrow" />
          </Link>
        </div>
        <div className="start-tool-grid">
          {scenes.slice(0, 3).map((scene) => (
            <article className="start-tool" key={scene.id}>
              <DemoImage asset={scene.image} alt={`${scene.name}演示参考`} />
              <div>
                <h3>{scene.name}</h3>
                <p>
                  {scene.id === 'product'
                    ? '1张商品图 → 4–6张成套图片'
                    : scene.id === 'tryon'
                      ? '模特＋服装 → 换装效果图'
                      : '参考短片＋主体 → 镜头与短片'}
                </p>
                <div>
                  <button
                    className="text-link"
                    onClick={() => startScene(scene)}
                  >
                    开始制作 <Icon name="arrow" />
                  </button>
                  <button
                    className="text-link"
                    onClick={() => start(scene.id, { demo: true })}
                  >
                    用示例体验
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="start-cases">
        <div className="section-heading">
          <div>
            <h2>精选案例</h2>
            <p>看看想法可以做成什么。</p>
          </div>
          <span className="quiet-label">演示内容</span>
        </div>
        <div className="example-grid">
          {cases.map((item) => (
            <CaseCard key={item.id} caseId={item.id} />
          ))}
        </div>
      </section>
    </>
  );
}
