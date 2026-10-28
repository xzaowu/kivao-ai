import features from '../data/features.json';
import { AssetKeySchema, assetUrl, requireScene } from '../data/catalog';
import { type DemoCreation } from '../demo/model';
import { demo } from '../demo/store';
import { ImageArt } from '../components/FeatureArt';
import { Icon } from '../components/Icon';
export function ToolGuide({ creation: c }: { creation: DemoCreation }) {
  const scene = requireScene(c.sceneId),
    video = scene.output === '视频' || c.sceneId.startsWith('video-');
  const t = video
    ? features.VIDEO_TOOLS.find((t) => t.scene === c.sceneId)
    : features.IMAGE_TOOLS.find((t) => t.scene === c.sceneId);
  if (!t) return null;
  const note =
    c.sceneId === 'image-cutout'
      ? '棋盘格仅为背景处理示意；不执行真实抠图，也不导出透明 PNG。'
      : c.sceneId === 'video-motion'
        ? '静态人物运镜样片，不包含真实动作模仿。'
        : c.sceneId === 'video-avatar'
          ? '静态人物样片，不包含真实口播、语音或口型合成。'
          : c.sceneId === 'video-transcript'
            ? '手写预置台词示例，不是从无声视频实时转写所得。'
            : c.sceneId === 'video-upscale'
              ? '使用预制片段展示流程，不进行真实画质增强。'
              : c.sceneId === 'video-clean'
                ? '使用有字幕／无字幕预制片段，不进行真实去字。'
                : '使用预制参考呈现流程，自定义素材不会被真实 AI 处理。';
  function fill() {
    demo.edit(c.id, {
      bindings: Object.fromEntries(scene.roles.map((r) => [r.id, r.demo])),
      ...(c.sceneId.startsWith('free-')
        ? {
            prompt: video
              ? '一段温暖晨光下的面包房短片，展示手作细节。'
              : '自然光下的护肤品主视觉，米色石台，画面简洁。',
          }
        : {}),
    });
  }
  return (
    <div className={video ? 'video-workspace-guide' : 'image-workspace-guide'}>
      <header>
        <span className="eyebrow">{t.name} · 功能示例</span>
        <h2>{t.summary}</h2>
        <p>
          {c.sceneId.startsWith('free-')
            ? '描述画面，也可以添加一张参考图。'
            : '不必写提示词，按左侧角色准备素材就能开始。'}
        </p>
      </header>
      <ol className={video ? 'video-guide-steps' : 'image-guide-steps'}>
        <li>
          <b>1</b>
          <div>
            准备素材<small>{t.input}</small>
          </div>
        </li>
        <li>
          <b>2</b>
          <div>
            确认输出<small>{'out' in t ? t.out : t.output}</small>
          </div>
        </li>
        <li>
          <b>3</b>
          <div>
            审核与调整<small>保留每一版结果</small>
          </div>
        </li>
      </ol>
      {'clip' in t ? (
        <>
          <video
            className="video-guide-player"
            controls
            playsInline
            preload="metadata"
            poster={assetUrl(AssetKeySchema.parse(t.poster))}
            src={assetUrl(AssetKeySchema.parse(t.clip))}
            aria-label={t.name + ' · 12秒预制无声演示'}
          />
          <div className="video-guide-foot">
            <div>
              <span className="badge">预制演示</span>
              <p>{note}</p>
            </div>
            <button className="primary" onClick={fill}>
              <Icon name="play" />
              用演示素材体验
            </button>
          </div>
          <div className="video-guide-roles">
            {scene.roles.map((r) => (
              <div key={r.id}>
                <b>
                  {r.label}
                  <small>{r.required ? '必需' : '可选'}</small>
                </b>
                <p>{r.help}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="image-guide-example">
            <ImageArt kind={t.art} />
            <div>
              <span className="badge">演示内容</span>
              <h3>{t.name}可以这样用</h3>
              <ul>
                {scene.roles.map((r) => (
                  <li key={r.id}>
                    <b>{r.label}</b>
                    <span>
                      {r.required ? '必需' : '可选'} · {r.help}
                    </span>
                  </li>
                ))}
              </ul>
              <p>{note}</p>
              <button className="primary" onClick={fill}>
                <Icon name="play" />
                用演示素材体验
              </button>
            </div>
          </div>
          <p className="image-guide-note">
            素材 → 输出计划 → 模拟结果 → 继续调整。确认后才进入作品。
          </p>
        </>
      )}
    </div>
  );
}
