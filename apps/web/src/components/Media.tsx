import type { CSSProperties } from 'react';
import { assetUrl, type AssetKey, type SceneDefinition } from '../data/catalog';
import type { Output } from '../demo/model';

export function DemoImage({
  asset,
  className = '',
  alt = 'AI 生成的演示素材',
  eager = false,
}: {
  asset: AssetKey;
  className?: string;
  alt?: string;
  eager?: boolean;
}) {
  return (
    <img
      className={`${className} asset-${asset}`}
      src={assetUrl(asset)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
    />
  );
}
export function SceneMedia({
  scene,
  large = false,
}: {
  scene: SceneDefinition;
  large?: boolean;
}) {
  return (
    <div className={`scene-art ${scene.id} ${large ? 'large' : ''}`}>
      {scene.id === 'tryon' ? (
        <div className="before-after">
          <DemoImage asset="model" alt="换装前成年模特 · AI演示" />
          <DemoImage asset="tryon" alt="蓝色衬衫换装效果 · AI演示" />
          <span>原模特</span>
          <b>换装示例</b>
        </div>
      ) : (
        <DemoImage asset={scene.image} alt={`${scene.name}结果参考 · 演示`} />
      )}
      {scene.id === 'video' && <span className="time">12s · 演示剪辑</span>}
      {scene.id === 'product' && (
        <span className="art-caption">
          山间茶事
          <br />
          <strong>一套图，完整上新。</strong>
        </span>
      )}
    </div>
  );
}
export function OutputMedia({
  output,
  ratio = '3:4',
  sceneId = '',
}: {
  output: Output;
  ratio?: string;
  sceneId?: string;
}) {
  return (
    <div
      style={{ '--output-ratio': ratio.replace(':', ' / ') } as CSSProperties}
      className={`output-visual ${output.layout} ${sceneId === 'tryon' ? 'fashion' : ''}`}
    >
      {output.kind === 'video' ? (
        <video
          controls
          playsInline
          preload="metadata"
          poster={assetUrl('bakery')}
          src={assetUrl('bakery-demo')}
          aria-label="12秒静态素材剪辑演示"
        />
      ) : (
        <DemoImage
          asset={output.asset}
          alt={`${output.title} · 预制演示结果`}
        />
      )}
      {output.layout === 'poster' && (
        <div className="poster-type">
          <span>山 间 茶 事</span>
          <strong>
            把春天，
            <br />
            留在日常。
          </strong>
          <small>山间茉莉茶 · 新品演示</small>
        </div>
      )}
      {output.layout === 'detail' && sceneId === 'product' && (
        <div className="detail-type">
          <span>THE DETAILS</span>
          <b>
            细节，
            <br />
            看得见。
          </b>
        </div>
      )}
      {output.layout === 'editorial' && (
        <div className="editorial-type">
          一罐春天。
          <br />
          <small>A MOMENT OF CALM.</small>
        </div>
      )}
    </div>
  );
}
