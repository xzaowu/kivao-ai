import { useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { DemoImage } from '../components/Media';
import { Icon } from '../components/Icon';
import { useUi } from '../components/ui-context';
import type { AssetKey } from '../data/catalog';

export function CanvasPage() {
  const [items, setItems] = useState<AssetKey[]>(['tea', 'tryon']),
    [zoom, setZoom] = useState(75),
    ui = useUi();
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">CANVAS</span>
        <h1>画布</h1>
        <p>把参考素材、创作想法和结果放在一起，梳理下一步。</p>
      </section>
      <div className="canvas-toolbar">
        <div>
          <strong>山间茶事 · 上新策划</strong>
          <span className="badge">交互布局演示</span>
        </div>
        <div>
          <button
            className="secondary"
            onClick={() => {
              if (items.length >= 5) ui.notify('演示画布已放入 5 份素材。');
              else {
                setItems([...items, 'bakery']);
                ui.notify('演示素材已添加，可横向浏览画布。');
              }
            }}
          >
            <Icon name="plus" />
            添加演示素材
          </button>
          <button
            className="icon-button"
            aria-label="缩小画布"
            disabled={zoom <= 45}
            onClick={() => setZoom(Math.max(45, zoom - 10))}
          >
            −
          </button>
          <span>{zoom}%</span>
          <button
            className="icon-button"
            aria-label="放大画布"
            disabled={zoom >= 115}
            onClick={() => setZoom(Math.min(115, zoom + 10))}
          >
            ＋
          </button>
        </div>
      </div>
      <div className="canvas-viewport">
        <div
          className="canvas-board"
          style={{ '--canvas-zoom': zoom / 100 } as CSSProperties}
        >
          <article className="canvas-note">
            <span>01 / 创作目标</span>
            <h2>
              一套图，
              <br />
              完整上新。
            </h2>
            <p>主视觉 → 场景图 → 细节图 → 品牌海报</p>
            <Link
              className="primary"
              to="/scenes/$sceneId"
              params={{ sceneId: 'product' }}
            >
              进入商品套图 <Icon name="arrow" />
            </Link>
          </article>
          {items.map((asset, index) => (
            <button
              className="canvas-node"
              key={`${asset}-${index}`}
              style={{ left: 430 + index * 290, top: index % 2 ? 210 : 80 }}
              onClick={() =>
                ui.open(
                  '画布参考 · 演示',
                  <div className="output-inspect">
                    <DemoImage asset={asset} />
                    <p>参考素材仅用于组织想法，可从对应场景开始创作。</p>
                  </div>,
                  'output-dialog',
                )
              }
            >
              <DemoImage asset={asset} />
              <span>
                {asset === 'tea'
                  ? '商品视觉参考'
                  : asset === 'tryon'
                    ? '人物搭配参考'
                    : '门店氛围参考'}{' '}
                · 演示 <Icon name="search" />
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="catalog-note">
        <Icon name="info" />
        可添加素材、缩放和查看参考；这里验证画布入口与布局，拖拽编辑器、持久化布局和
        AI 节点尚未实现。
      </p>
    </>
  );
}
export function DesignPage() {
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">方案 C · 信息架构说明</span>
        <h1>从找工具，转向完成任务</h1>
        <p>
          开始／图片／视频／画布／作品／素材，六个明确入口。场景、案例和一次创作仍各有职责。
        </p>
      </section>
      <div className="design-objects">
        {[
          ['场景', '可执行任务定义', '素材角色、配置、输出结构与审核标准。'],
          ['案例', '结果参考', '说明输入与产出，通过对应场景开始自己的创作。'],
          [
            'Creation',
            '用户的一次创作',
            '关联 Mock 创作，保留本地素材绑定、计划与演示版本。',
          ],
          [
            '版本与作品',
            '先保留版本，再人工确认',
            '结果版本只新增；作品固定到某个版本的选中输出。',
          ],
          [
            '素材',
            '可复用输入',
            '按角色引用。本地文件仅预览，不会发送到服务端。',
          ],
        ].map(([label, title, description]) => (
          <article key={label}>
            <span className="badge available">{label}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <section className="design-flow">
        <h2>新手可以不写提示词</h2>
        <p>
          选场景或自由描述 → 同屏准备素材与配置 → 确认计划 → 模拟执行 →
          原位审核与调整，确认后保存作品。
        </p>
        <h2>清楚区分后端与前端演示</h2>
        <p>
          商品套图、AI 换装和参考视频使用现有 Mock API
          创建计划与创作容器。执行、取消、版本、调整与审核保存由独立前端演示适配层提供，后端创作仍为
          draft，不会宣称真实任务已执行。
        </p>
        <h2>演示边界</h2>
        <p>
          不接真实 AI、不计费、不登录、不上传本地文件。参考短片是 12
          秒静态素材剪辑；图片与调整结果都是预制媒体，不代表模型质量。数据保存在当前浏览器，Mock
          服务重启后旧 API 引用可能失效。本地文件刷新后需重新选择。
        </p>
        <h2>场景扩展与画布</h2>
        <p>
          场景库支持 12／24／48
          样本及分页，仅前三个场景可完整演示。其他样本只能预览结构。画布只支持添加演示素材、缩放与查看，不提供完整编辑器或
          AI 节点。
        </p>
        <Link className="primary" to="/">
          开始体验 <Icon name="arrow" />
        </Link>
      </section>
    </>
  );
}
export function NotFoundPage() {
  return (
    <div className="empty">
      <h1>这里还没有这次创作</h1>
      <p>页面或本地记录不存在。返回创作首页，选择一个场景开始。</p>
      <Link className="primary" to="/">
        返回首页
      </Link>
    </div>
  );
}
