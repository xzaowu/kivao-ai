import { Button } from '@kivao/ui';
import { demoMaterials, requireScene } from '../data/catalog';
import { useDemo } from '../demo/store';
import type { DemoCreation } from '../demo/model';
import { Icon } from '../components/Icon';

export function Storyboard() {
  return (
    <div className="storyboard">
      <h3>镜头计划 · 共 12 秒</h3>
      {[
        ['0–4s', '清晨开场', '建立门店与温暖晨光'],
        ['4–8s', '手作细节', '展示可颂制作与材质'],
        ['8–12s', '产品收尾', '突出成品，保留门店信息'],
      ].map(([time, title, description]) => (
        <div key={time}>
          <span>{time}</span>
          <b>{title}</b>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}
export function Plan({
  creation,
  pending,
  error,
  onConfirm,
  onBack,
}: {
  creation: DemoCreation;
  pending: boolean;
  error: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const scene = requireScene(creation.sceneId),
    state = useDemo(),
    plan = creation.plan!;
  const materials = [...demoMaterials, ...state.uploads];
  return (
    <>
      <div className="studio-plan-head">
        <span className="badge available">执行前确认</span>
        <h2>
          {plan.adjustment
            ? `只调整选中的 ${plan.adjustment.ids.length} 项`
            : `这次将得到 ${plan.items.length}${scene.output === '文本' ? ' 份示例文稿' : scene.output === '视频' ? ' 条短片' : ' 张图片'}`}
        </h2>
        <p>
          {plan.adjustment
            ? `从 V${plan.adjustment.baseVersion} 继续，原版本保留。`
            : '确认素材、配置和输出，再决定是否开始。'}
        </p>
      </div>
      <div className="studio-plan-scroll">
        {creation.prompt && (
          <div className="studio-plan-goal">
            <small>创作目标</small>
            <p>{creation.prompt}</p>
          </div>
        )}
        {creation.sceneId === 'video-avatar' && (
          <div className="studio-plan-goal">
            <small>口播文稿 · 演示不会真实合成语音</small>
            <p>{creation.settings.script}</p>
          </div>
        )}
        {plan.adjustment && (
          <div className="version-note">
            {plan.adjustment.intent} · 其余项目保留。{plan.adjustment.note}
          </div>
        )}
        <ol className="studio-plan-list">
          {plan.items.map((item, index) => (
            <li key={item.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.brief}</p>
              </div>
              <b>
                {item.kind === 'text'
                  ? '文稿'
                  : item.kind === 'video'
                    ? '12秒'
                    : creation.settings.ratio}
              </b>
            </li>
          ))}
        </ol>
        {creation.sceneId === 'video' && <Storyboard />}
        <div className="studio-plan-summary">
          <h3>本次使用</h3>
          <dl>
            {scene.roles
              .filter((role) => creation.bindings[role.id])
              .map((role) => (
                <div className="dl-row" key={role.id}>
                  <dt>{role.label}</dt>
                  <dd>
                    {materials.find(
                      (item) => item.id === creation.bindings[role.id],
                    )?.name || '本地文件需重选'}
                  </dd>
                </div>
              ))}
            {scene.config.map((field) => (
              <div className="dl-row" key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  {creation.settings[field.key]}
                  {field.key === 'count'
                    ? scene.output === '文本'
                      ? ' 份'
                      : scene.output === '视频'
                        ? ' 条'
                        : ' 张'
                    : ''}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="adapter-note">
          {plan.source === 'mock_api'
            ? '计划来源：Mock API。上传文件仅在浏览器预览，API 使用模拟素材引用；配置、主体补充素材和输出结构由前端演示层保存。'
            : '计划来源：前端演示层。此工具尚无后端执行接口。'}{' '}
          结果均为预制演示，不会理解提示词或真实编辑画面。
        </p>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <footer className="studio-confirm-actions">
        <div>
          <strong>
            ¥0 <span>本次演示实际费用</span>
          </strong>
          <p>
            {plan.backend
              ? `Mock 模拟估算：¥${(plan.backend.estimate.amountMinor / 100).toFixed(2)}；不会扣费。`
              : '前端模拟，不调用真实 AI。'}
          </p>
        </div>
        <div>
          <button className="secondary" disabled={pending} onClick={onBack}>
            返回修改
          </button>
          <Button className="primary" disabled={pending} onClick={onConfirm}>
            {pending ? '正在确认…' : '确认并模拟生成'} <Icon name="arrow" />
          </Button>
        </div>
      </footer>
    </>
  );
}
export function Running({
  creation,
  onCancel,
}: {
  creation: DemoCreation;
  onCancel: () => void;
}) {
  const progress = creation.task?.progress || 0;
  return (
    <section className="running-panel">
      <div className="running-orbit">
        <Icon name="spark" />
      </div>
      <span className="eyebrow">{creation.shortId} · 前端演示任务</span>
      <h2>正在按你的计划，准备结果</h2>
      <p>这是本地模拟，你的素材、配置和计划会完整保留。</p>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="模拟执行进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol className="execution-steps">
        {['核对素材角色', '按输出计划准备预制结果', '整理成待审核版本'].map(
          (text, index) => (
            <li key={text} className={progress > index * 33 ? 'done' : ''}>
              {text}
            </li>
          ),
        )}
      </ol>
      <p className="small-note">
        可以离开此页，从“我的创作”恢复。没有真实模型调用或扣费。
      </p>
      <button className="secondary" onClick={onCancel}>
        取消模拟，返回计划
      </button>
    </section>
  );
}
