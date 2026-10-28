import { Button } from '@kivao/ui';
import {
  demoMaterials,
  materialUrl,
  requireScene,
  type Role,
} from '../data/catalog';
import { demo, useDemo } from '../demo/store';
import { isDirty, missingRoles, type DemoCreation } from '../demo/model';
import { MaterialPicker, MaterialPreview } from '../components/MaterialPicker';
import { Icon } from '../components/Icon';
import { useUi } from '../components/ui-context';

function InputRole({ creation, role }: { creation: DemoCreation; role: Role }) {
  const state = useDemo(),
    ui = useUi(),
    material = [...demoMaterials, ...state.uploads].find(
      (item) => item.id === creation.bindings[role.id],
    );
  const ready = Boolean(materialUrl(material));
  function bind(materialId: string) {
    demo.edit(creation.id, {
      bindings: {
        ...demo.creation(creation.id).bindings,
        [role.id]: materialId,
      },
    });
  }
  function pick() {
    ui.open(
      `选择${role.label}`,
      <MaterialPicker
        media={role.media}
        label={role.label}
        help={role.help}
        onSelect={(item) => bind(item.id)}
      />,
      'picker-dialog',
    );
  }
  return (
    <article className={`studio-role ${ready ? 'ready' : ''}`}>
      <div className="studio-role-label">
        <h3>{role.label}</h3>
        <span>{role.required ? '必需' : '可选'}</span>
        {ready && <Icon name="check" />}
      </div>
      {ready && material ? (
        <div className="studio-binding">
          <MaterialPreview material={material} controls />
          <div>
            <b>{material.name}</b>
            <small>{material.local ? '本地文件 · 不上传' : '演示素材'}</small>
            <button className="text-link" onClick={pick}>
              替换
            </button>
            <button
              className="text-link"
              onClick={() => {
                const bindings = { ...creation.bindings };
                delete bindings[role.id];
                demo.edit(creation.id, { bindings });
              }}
            >
              移除
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>{material ? '本地文件已失效，请重新选择。' : role.help}</p>
          <div className="studio-role-actions">
            <button className="secondary" onClick={pick}>
              <Icon name="upload" />
              选择素材
            </button>
            <button className="text-link" onClick={() => bind(role.demo)}>
              用示例
            </button>
          </div>
        </>
      )}
    </article>
  );
}
export function Inputs({
  creation,
  pending,
  error,
  onPlan,
  onMode,
  onChooseScene,
}: {
  creation: DemoCreation;
  pending: boolean;
  error: string;
  onPlan: () => void;
  onMode: (mode: 'free' | 'scene') => void;
  onChooseScene: () => void;
}) {
  const state = useDemo(),
    scene = requireScene(creation.sceneId),
    free = creation.sceneId.startsWith('free-');
  const busy =
      pending || creation.phase === 'confirm' || creation.phase === 'running',
    missing = missingRoles(creation, state.uploads);
  function fillDemo(withPrompt: boolean) {
    const prompt =
      scene.output === '视频'
        ? '一段温暖晨光下的面包房短片，展示手作细节和刚出炉的可颂。'
        : '自然光下的护肤品主视觉，米色石台，突出玻璃与精华的质感。';
    demo.edit(creation.id, {
      ...(withPrompt ? { prompt } : {}),
      bindings: {
        ...creation.bindings,
        ...Object.fromEntries(
          scene.roles
            .filter((role) => withPrompt || role.required)
            .map((role) => [role.id, role.demo]),
        ),
      },
    });
  }
  return (
    <section className="studio-inputs" aria-label="素材与配置">
      <div className="studio-mode" role="group" aria-label="创作方式">
        <button
          aria-pressed={free}
          disabled={busy}
          onClick={() => onMode('free')}
        >
          自由创作
        </button>
        <button
          aria-pressed={!free}
          disabled={busy}
          onClick={() => onMode('scene')}
        >
          场景创作
        </button>
      </div>
      <div className="studio-fields">
        <fieldset className="studio-fieldset" disabled={busy}>
          {free ? (
            <>
              <label className="studio-prompt">
                <span>你想做成什么？</span>
                <textarea
                  id="studio-prompt"
                  maxLength={500}
                  value={creation.prompt}
                  onChange={(event) =>
                    demo.edit(creation.id, { prompt: event.target.value })
                  }
                  placeholder={
                    scene.output === '视频'
                      ? '例如：一段温暖晨光下的面包房短片，展示手作和刚出炉的可颂。'
                      : '例如：自然光下的护肤品主视觉，米色石台，突出玻璃与精华质感。'
                  }
                />
              </label>
              <button className="text-link" onClick={() => fillDemo(true)}>
                <Icon name="spark" />
                填入演示想法
              </button>
            </>
          ) : (
            <>
              <div className="studio-scene-choice">
                <div>
                  <small>当前场景</small>
                  <strong>{scene.name}</strong>
                </div>
                <button className="text-link" onClick={onChooseScene}>
                  切换 <Icon name="chevron" />
                </button>
              </div>
              {creation.prompt && (
                <p className="studio-carried-goal">
                  你的目标：{creation.prompt}
                </p>
              )}
            </>
          )}
          <div className="studio-section-head">
            <h2>{free ? '参考素材' : '准备素材'}</h2>
            {free ? (
              <span>可选</span>
            ) : (
              <button className="text-link" onClick={() => fillDemo(false)}>
                填入演示素材
              </button>
            )}
          </div>
          <div className="studio-role-list">
            {scene.roles.map((role) => (
              <InputRole key={role.id} creation={creation} role={role} />
            ))}
          </div>
          <div className="studio-section-head">
            <h2>输出设置</h2>
            <span>{free ? '按需调整' : '已推荐'}</span>
          </div>
          <div className="studio-config">
            {scene.config.map((field) => (
              <label key={field.key} className="config-field">
                <span>{field.label}</span>
                <select
                  aria-label={field.label}
                  value={creation.settings[field.key]}
                  onChange={(event) =>
                    demo.edit(creation.id, {
                      settings: {
                        ...creation.settings,
                        [field.key]: event.target.value,
                      },
                    })
                  }
                >
                  {field.options.map((option) => {
                    const [value, label] = Array.isArray(option)
                      ? option
                      : [option, option];
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            ))}
          </div>
          {scene.output === '视频' && (
            <p className="studio-fixed-spec">演示规格固定为 12 秒 · 16:9</p>
          )}
          <details className="studio-more">
            <summary>
              模型与生成说明 <Icon name="chevron" />
            </summary>
            <p>
              智能推荐 · 演示模式。结果均为预制素材，不连接真实 AI
              或计费服务。本地文件不上传，刷新后需重新选择。自由创作完全由前端演示层提供。
            </p>
          </details>
        </fieldset>
      </div>
      <div className="studio-generate">
        <p id="studio-validation" role={error ? 'alert' : 'status'}>
          {error ||
            (missing.length
              ? `还需准备 ${missing.map((role) => role.label).join('、')}`
              : isDirty(creation)
                ? '设置已修改，右侧仍保留原版本结果。'
                : free
                  ? '描述目标后，先核对输出计划。'
                  : '素材与配置就绪后，先核对输出计划。')}
        </p>
        <Button className="primary full" disabled={busy} onClick={onPlan}>
          <Icon name="spark" />
          {pending
            ? '正在准备计划…'
            : creation.versions.length
              ? '预览新一版计划'
              : '预览生成计划'}
          <span>¥0 · 演示</span>
        </Button>
      </div>
    </section>
  );
}
