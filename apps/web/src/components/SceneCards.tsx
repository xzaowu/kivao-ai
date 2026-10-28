import { Link } from '@tanstack/react-router';
import { Button } from '@kivao/ui';
import {
  assetUrl,
  cases,
  requireScene,
  type SceneDefinition,
} from '../data/catalog';
import { useDemo } from '../demo/store';
import { currentVersion, type DemoCreation } from '../demo/model';
import { Icon } from './Icon';
import { DemoImage, SceneMedia } from './Media';
import { useUi } from './ui-context';

export function SceneCard({ scene }: { scene: SceneDefinition }) {
  return (
    <Link
      to="/scenes/$sceneId"
      params={{ sceneId: scene.id }}
      className="scene-card"
    >
      <div className="scene-thumb">
        <DemoImage asset={scene.image} alt={`${scene.name}演示参考`} />
      </div>
      <div className="scene-card-body">
        <div className="card-title">
          <h3>{scene.name}</h3>
          <span className={`badge ${scene.ready ? 'available' : ''}`}>
            {scene.ready ? '完整演示 · Mock' : '流程预览'}
          </span>
        </div>
        <p>{scene.summary}</p>
        <div className="scene-facts">
          <span>
            <Icon name={scene.output === '视频' ? 'video' : 'image'} />
            {scene.output}
          </span>
          <span>{scene.input}</span>
          <span>{scene.ready ? scene.out : '目录样本 · 未接后端'}</span>
        </div>
      </div>
    </Link>
  );
}
export function CreationCard({ creation }: { creation: DemoCreation }) {
  const state = useDemo(),
    scene = requireScene(creation.sceneId),
    version = currentVersion(creation);
  const saved =
    version &&
    state.works.filter((work) => work.record.versionId === version.record.id)
      .length;
  const status =
    creation.phase === 'running'
      ? '执行中'
      : creation.phase === 'confirm'
        ? '待确认计划'
        : creation.phase === 'review'
          ? saved
            ? '已有确认作品'
            : '待审核'
          : '素材准备';
  return (
    <Link
      className="creation-card"
      to="/creations/$creationId"
      params={{ creationId: creation.id }}
    >
      <DemoImage asset={scene.image} alt={`${scene.name}创作封面`} />
      <div>
        <span className="small-label">
          {scene.name} · {creation.shortId}
        </span>
        <h3>{creation.name}</h3>
        <span
          className={`status ${creation.phase === 'running' ? 'running' : creation.phase === 'review' ? 'review' : ''}`}
        >
          {status}
        </span>
      </div>
      <span className="resume">
        继续创作 <Icon name="arrow" />
      </span>
    </Link>
  );
}
function CaseContent({ caseId }: { caseId: string }) {
  const item = cases.find((entry) => entry.id === caseId)!,
    scene = requireScene(item.sceneId),
    ui = useUi();
  return (
    <div className="case-layout">
      <div>
        <SceneMedia scene={scene} large />
        <span className="media-note">演示案例，不是本次创作结果</span>
      </div>
      <div>
        <span className="badge">案例 / 结果参考</span>
        <h3>{scene.summary}</h3>
        <dl>
          <dt>示例输入</dt>
          <dd>
            {scene.roles
              .filter((role) => role.required)
              .map((role) => role.label)
              .join('＋')}
          </dd>
          <dt>示例交付</dt>
          <dd>{scene.out}</dd>
          <dt>如何开始自己的创作</dt>
          <dd>
            进入场景，重新准备素材和确认输出计划。案例不会直接变成你的创作。
          </dd>
        </dl>
        <Button asChild className="primary full">
          <Link
            to="/scenes/$sceneId"
            params={{ sceneId: scene.id }}
            onClick={ui.close}
          >
            查看对应场景 <Icon name="arrow" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
export function CaseCard({
  caseId,
  variant = 'home',
}: {
  caseId: string;
  variant?: 'home' | 'workspace';
}) {
  const item = cases.find((entry) => entry.id === caseId)!,
    scene = requireScene(item.sceneId),
    ui = useUi();
  if (variant === 'workspace')
    return (
      <article>
        {scene.output === '视频' ? (
          <video
            controls
            playsInline
            preload="metadata"
            poster={assetUrl('bakery')}
            src={assetUrl('bakery-demo')}
            aria-label="面包房12秒演示参考"
          />
        ) : (
          <button
            className="studio-example-image"
            onClick={() =>
              ui.open(
                `${item.title} · 结果参考`,
                <CaseContent caseId={caseId} />,
                'case-dialog',
              )
            }
          >
            <DemoImage asset={scene.image} alt={`${item.title} · 演示参考`} />
          </button>
        )}
        <div>
          <span>
            {scene.output === '视频'
              ? '演示案例 · 12秒预制剪辑'
              : '预制演示 · 结果参考'}
          </span>
          <h3>
            {scene.id === 'product'
              ? '一套图，完整上新'
              : scene.id === 'tryon'
                ? '同一个人，换一种搭配'
                : item.title}
          </h3>
          <button
            className="text-link"
            onClick={() =>
              ui.open(
                `${item.title} · 结果参考`,
                <CaseContent caseId={caseId} />,
                'case-dialog',
              )
            }
          >
            查看案例 <Icon name="arrow" />
          </button>
        </div>
      </article>
    );
  return (
    <button
      className="example-card"
      onClick={() =>
        ui.open(
          `${item.title} · 结果参考`,
          <CaseContent caseId={caseId} />,
          'case-dialog',
        )
      }
    >
      <SceneMedia scene={scene} />
      <div>
        <span>{item.outputSummary}</span>
        <h3>{item.title}</h3>
        <b>
          查看案例 <Icon name="arrow" />
        </b>
      </div>
    </button>
  );
}
export function SceneChoices({
  list,
  prompt = '',
  bindings = {},
  onChoose,
}: {
  list: SceneDefinition[];
  prompt?: string;
  bindings?: Record<string, string>;
  onChoose: (scene: SceneDefinition) => void;
}) {
  return (
    <div className="guide-body start-match">
      <span className="badge">关键词匹配演示 · 非真实 AI 理解</span>
      <p>
        {prompt
          ? `你的目标：${prompt}`
          : '可以直接选场景。素材和输出会在工作区里一步步确认。'}
      </p>
      {list.map((scene) => (
        <button
          className="suggested-scene"
          key={scene.id}
          onClick={() => onChoose(scene)}
        >
          <DemoImage asset={scene.image} />
          <span>
            <b>{scene.name}</b>
            <small>{scene.summary}</small>
            <em>
              准备：
              {scene.roles
                .filter((role) => role.required)
                .map((role) => role.label)
                .join('＋')}
            </em>
            {Object.keys(bindings).length > 0 && (
              <small>素材会按添加顺序建议用途，请在下一步核对或替换。</small>
            )}
          </span>
          <Icon name="arrow" />
        </button>
      ))}
    </div>
  );
}
