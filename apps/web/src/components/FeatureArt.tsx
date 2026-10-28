import { AssetKeySchema } from '../data/catalog';
import { DemoImage } from './Media';
import { Icon } from './Icon';

export function ImageArt({ kind }: { kind: string }) {
  const pic = (key: string) => (
    <DemoImage asset={AssetKeySchema.parse(key)} alt="预制演示参考" />
  );
  return (
    <div className={`im-art im-art-${kind}`} aria-hidden="true">
      {kind === 'product' ? (
        <>
          <div className="im-product-main">{pic('tea')}</div>
          <div className="im-product-small">
            {pic('tea')}
            {pic('tea')}
          </div>
          <span className="im-art-note">主图 / 场景 / 海报</span>
        </>
      ) : ['tryon', 'fashion', 'remix'].includes(kind) ? (
        <>
          {pic(kind === 'remix' ? 'serum' : 'model')}
          {pic(kind === 'remix' ? 'tea' : 'tryon')}
          <span className="im-before">
            {kind === 'remix' ? '参考风格' : '原模特'}
          </span>
          <span className="im-after">
            {kind === 'remix' ? '商品呈现' : '换装示例'}
          </span>
        </>
      ) : ['background', 'cutout', 'white', 'warm'].includes(kind) ? (
        <>
          <div className="im-subject">{pic('garment')}</div>
          <span className="im-art-note">
            {kind === 'cutout'
              ? '背景处理示意'
              : kind === 'white'
                ? '白底展示示意'
                : kind === 'warm'
                  ? '温暖米色 · 示意'
                  : '浅蓝影棚 · 示意'}
          </span>
        </>
      ) : (
        <>
          {pic(['poster', 'detail'].includes(kind) ? 'tea' : 'serum')}
          {kind === 'poster' && (
            <span className="im-poster-copy">
              SPRING, IN A CUP.<b>一罐春天。</b>
              <small>山间茶事 · 新品演示</small>
            </span>
          )}
          {kind === 'social' && (
            <span className="im-social-copy">
              A MOMENT
              <br />
              FOR YOURSELF.
            </span>
          )}
        </>
      )}
    </div>
  );
}
export function VideoArt({ id, poster }: { id: string; poster: string }) {
  return (
    <div className={`video-art video-art-${id}`} aria-hidden="true">
      <DemoImage asset={AssetKeySchema.parse(poster)} alt="预制演示参考" />
      {['reference', 'product', 'outfit', 'motion'].includes(id) && (
        <span className="video-input-thumb">
          <DemoImage
            asset={
              id === 'product'
                ? 'tea'
                : id === 'outfit'
                  ? 'garment'
                  : id === 'motion'
                    ? 'model'
                    : 'bakery'
            }
          />
        </span>
      )}
      {id === 'avatar' && (
        <span className="video-script-lines">
          <i />
          <i />
          <i />
        </span>
      )}
      <span className="video-art-play">
        <Icon name="play" />
      </span>
      <span className="video-art-time">12s · 演示</span>
    </div>
  );
}
