import { Link, useParams } from '@tanstack/react-router';
import { Button } from '@kivao/ui';
import { getScene } from '../data/catalog';
import { SceneMedia } from '../components/Media';
import { Icon } from '../components/Icon';
import { useStartCreation } from '../components/useStartCreation';
import { NotFoundPage } from './StaticPages';

export function SceneDetailPage() {
  const { sceneId } = useParams({ from: '/scenes/$sceneId' }),
    scene = getScene(sceneId),
    start = useStartCreation();
  if (!scene) return <NotFoundPage />;
  return (
    <>
      <Link className="back-link" to="/scenes">
        <Icon name="back" />
        返回场景库
      </Link>
      <div className="scene-overview">
        <div className="overview-visual">
          <SceneMedia scene={scene} large />
          <span className="media-note">
            {scene.ready
              ? '预制演示素材 · 只说明结果形态'
              : '目录样本 · 非已实现能力'}
          </span>
        </div>
        <div className="overview-copy">
          <span className="eyebrow">
            {scene.category} / {scene.output}
          </span>
          <h1>{scene.name}</h1>
          <p className="lead">{scene.summary}</p>
          {scene.ready ? (
            <>
              <div className="overview-facts">
                <div>
                  <span>需要准备</span>
                  <b>
                    {scene.roles
                      .filter((role) => role.required)
                      .map((role) => role.label)
                      .join('＋')}
                  </b>
                </div>
                <div>
                  <span>你将得到</span>
                  <b>{scene.out}</b>
                </div>
                <div>
                  <span>操作方式</span>
                  <b>选素材、选配置、确认计划；无需提示词</b>
                </div>
              </div>
              <Button
                className="primary full"
                onClick={() => start(scene.id, { demo: true })}
              >
                用演示素材体验 <Icon name="arrow" />
              </Button>
              <button
                className="secondary full"
                onClick={() => start(scene.id)}
              >
                使用自己的素材
              </button>
              <p className="small-note">
                计划和创作由 Mock API 创建；执行和版本为前端演示，不产生费用。
              </p>
            </>
          ) : (
            <>
              <span className="badge">仅流程预览 · 未接后端</span>
              <div className="preview-blueprint">
                <h3>计划中的任务结构</h3>
                <ol>
                  <li>按角色准备{scene.input}</li>
                  <li>选择用途与输出结构</li>
                  <li>确认计划后执行</li>
                  <li>审核{scene.out}，再决定是否保留</li>
                </ol>
              </div>
              <p className="small-note">
                本次只验证场景发现与扩展。请使用三个核心场景体验完整模拟流程。
              </p>
              <Link className="primary full" to="/scenes">
                返回选择完整演示
              </Link>
            </>
          )}
        </div>
      </div>
      {scene.ready && (
        <section className="role-explainer">
          <div className="section-heading">
            <div>
              <h2>先分清，每份素材的作用</h2>
              <p>素材角色会跟随本次创作，不再混放在一个输入框里。</p>
            </div>
          </div>
          <div className="role-explain-grid">
            {scene.roles.map((role) => (
              <div key={role.id}>
                <span className={`badge ${role.required ? 'available' : ''}`}>
                  {role.required ? '必需' : '可选'}
                </span>
                <h3>{role.label}</h3>
                <p>{role.help}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
