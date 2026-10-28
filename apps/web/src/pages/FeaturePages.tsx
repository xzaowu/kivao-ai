import { useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import features from '../data/features.json';
import { assetUrl, AssetKeySchema, requireScene } from '../data/catalog';
import { ImageArt, VideoArt } from '../components/FeatureArt';
import { Icon } from '../components/Icon';
import { useUi } from '../components/ui-context';
import { useStartCreation } from '../components/useStartCreation';
import { demo } from '../demo/store';
import { SettingsSchema } from '../demo/model';
import { Workspace } from '../workspace/Workspace';

const imageTools = features.IMAGE_TOOLS;
const videoTools = features.VIDEO_TOOLS;
export function FeaturePage({ kind }: { kind: 'images' | 'videos' }) {
  const video = kind === 'videos',
    ui = useUi(),
    start = useStartCreation();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('全部');
  const categories = video
    ? ['全部', '电商带货', '服装人像', '门店探店', '品牌内容']
    : ['全部', '电商商品', '服装人像', '海报图文', '图片处理'];
  const templates = video ? features.VIDEO_CASES : features.IMAGE_TEMPLATES;
  const tools = video ? videoTools : imageTools;
  const filtered = templates.filter(
    (item) =>
      (category === '全部' || item.category === category) &&
      (item.title + item.category).includes(query.trim()),
  );
  function detail(item: (typeof templates)[number]) {
    const tool = tools.find((t) => t.id === item.tool)!;
    const scene = requireScene(tool.scene);
    const clip = 'clip' in item ? item.clip : undefined;
    function adopt(useDemo: boolean) {
      const id = start(scene.id, {
        demo: useDemo,
        prompt: 'goal' in item ? item.goal : '',
        draft: true,
      });
      if (id)
        demo.edit(id, {
          settings: SettingsSchema.parse({
            ...demo.creation(id).settings,
            ...item.settings,
          }),
        });
    }
    ui.open(
      item.title,
      <div className="image-template-detail">
        <div>
          {clip ? (
            <video
              controls
              playsInline
              src={assetUrl(AssetKeySchema.parse(clip))}
              poster={assetUrl(
                AssetKeySchema.parse('poster' in item ? item.poster : 'bakery'),
              )}
            />
          ) : (
            <ImageArt kind={'art' in item ? item.art : 'free'} />
          )}
        </div>
        <div>
          <span className="badge">模板参考 · 预制演示</span>
          <h3>{tool.name}</h3>
          <p>{scene.summary || tool.summary}</p>
          <h4>需要准备</h4>
          <ul>
            {scene.roles.map((r) => (
              <li key={r.id}>
                {r.label} · {r.required ? '必需' : '可选'}
                <p>{r.help}</p>
              </li>
            ))}
          </ul>
          <p>输出：{scene.out}</p>
          <p className="small-note">
            采用后建立独立草稿。预制图片与视频不会随上传素材真实改变。
          </p>
          <button className="primary full" onClick={() => adopt(true)}>
            用示例体验 <Icon name="arrow" />
          </button>
          <button className="secondary full" onClick={() => adopt(false)}>
            使用自己的素材
          </button>
        </div>
      </div>,
      'image-template-dialog',
    );
  }
  return (
    <>
      <section className={`image-heading ${video ? 'video-heading' : ''}`}>
        <div>
          <h1>{video ? '视频创作' : '图片创作'}</h1>
          <p>
            {video
              ? '做商品、拍穿搭、讲故事。先选一个适合你的起点。'
              : '先选你要做的事，再把素材变成作品。'}
          </p>
        </div>
        <Link
          className="secondary"
          to={video ? '/videos/$toolId' : '/images/$toolId'}
          params={{ toolId: 'free' }}
        >
          <Icon name="plus" />
          {video ? '自由创作' : '自由生图'}
        </Link>
      </section>
      <section
        className={video ? '' : 'image-tools'}
        aria-label={`${video ? '视频' : '图片'}功能总览`}
      >
        <div className="image-section-head">
          <h2>常用功能</h2>
          <span>
            {video
              ? '看看能做什么，再准备素材'
              : '素材怎么准备、结果是什么，一眼看清'}
          </span>
        </div>
        <div className={`image-tools-grid ${video ? 'video-tools-grid' : ''}`}>
          {tools
            .filter((t) => !('utility' in t && t.utility))
            .map((t) => (
              <Link
                key={t.id}
                className={`image-tool-card ${video ? 'video-tool-card' : ''}`}
                to={video ? '/videos/$toolId' : '/images/$toolId'}
                params={{ toolId: t.id }}
              >
                {'art' in t ? (
                  <ImageArt kind={t.art} />
                ) : (
                  <VideoArt id={t.id} poster={t.poster} />
                )}
                <div>
                  <h3>
                    {t.name}
                    {'tag' in t && t.tag && <span>{t.tag}</span>}
                  </h3>
                  <p>{t.summary}</p>
                  <span className="image-tool-io">
                    {t.input} <Icon name="arrow" />{' '}
                    {'output' in t ? t.output : t.out}
                  </span>
                  <b>
                    开始使用 <Icon name="arrow" />
                  </b>
                </div>
              </Link>
            ))}
        </div>
      </section>
      {video && (
        <section className="video-utilities" aria-label="视频后期工具">
          <div>
            <h2>后期工具</h2>
            <span>处理已有视频</span>
          </div>
          {videoTools
            .filter((t) => 'utility' in t && t.utility)
            .map((t) => (
              <Link key={t.id} to="/videos/$toolId" params={{ toolId: t.id }}>
                <span className="video-utility-icon">
                  <Icon name={t.id === 'transcript' ? 'book' : 'sliders'} />
                </span>
                <span>
                  <b>{t.name}</b>
                  <small>{t.summary}</small>
                </span>
                <Icon name="arrow" />
              </Link>
            ))}
        </section>
      )}
      <section
        className={`image-template-section ${video ? 'video-case-section' : ''}`}
        aria-label={video ? '视频示例' : '图片模板'}
      >
        <div className="image-section-head image-template-heading">
          <div>
            <h2>{video ? '看看视频可以这样做' : '从喜欢的效果开始'}</h2>
            <p>
              {video
                ? '播放示例，了解素材要求，再开始自己的创作。'
                : '选好方向，再准备你自己的素材。'}
            </p>
          </div>
          <label className="image-search">
            <Icon name="search" />
            <span className="sr-only">
              {video ? '搜索视频示例' : '搜索图片模板'}
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                video
                  ? '搜索用途，如商品、穿搭、门店'
                  : '搜索模板，如商品、换装'
              }
            />
          </label>
        </div>
        <div
          className="image-template-filters"
          role="group"
          aria-label="模板分类"
        >
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
          <span>
            {video ? '12 秒预制剪辑 · 无声演示' : '示例素材 · 演示内容'}
          </span>
        </div>
        <p className="sr-only" role="status">
          找到 {filtered.length} 个{video ? '视频示例' : '图片模板'}
        </p>
        <div className={video ? 'video-case-grid' : 'image-template-grid'}>
          {filtered.map((item) =>
            'art' in item ? (
              <button
                key={item.id}
                className="image-template-card"
                onClick={() => detail(item)}
              >
                <ImageArt kind={item.art} />
                <span className="image-template-copy">
                  <small>{tools.find((t) => t.id === item.tool)?.name}</small>
                  <strong>{item.title}</strong>
                  <span>
                    查看示例与素材要求 <Icon name="arrow" />
                  </span>
                </span>
              </button>
            ) : (
              <article key={item.id} className="video-case-card">
                <div className="video-case-media">
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster={assetUrl(AssetKeySchema.parse(item.poster))}
                    src={assetUrl(AssetKeySchema.parse(item.clip))}
                    aria-label={item.title + ' · 12秒预制无声剪辑'}
                  />
                  <span className="video-case-badge">
                    {tools.find((t) => t.id === item.tool)?.name}
                  </span>
                </div>
                <div className="video-case-copy">
                  <h3>{item.title}</h3>
                  <span>演示内容 · {item.category}</span>
                  <button className="text-link" onClick={() => detail(item)}>
                    看素材，做同款 <Icon name="arrow" />
                  </button>
                </div>
              </article>
            ),
          )}
        </div>
        {!filtered.length && (
          <div className="empty">
            <h3>没有找到匹配的{video ? '示例' : '模板'}</h3>
            <button
              className="text-link"
              onClick={() => {
                setQuery('');
                setCategory('全部');
              }}
            >
              清除搜索与筛选
            </button>
          </div>
        )}
      </section>
    </>
  );
}
export function ImagesPage() {
  return <FeaturePage kind="images" />;
}
export function VideosPage() {
  return <FeaturePage kind="videos" />;
}
export function ImageToolPage() {
  const id = useLoaderData({ from: '/images/$toolId' });
  return <Workspace key={id} sessionId={id} />;
}
export function VideoToolPage() {
  const id = useLoaderData({ from: '/videos/$toolId' });
  return <Workspace key={id} sessionId={id} />;
}
