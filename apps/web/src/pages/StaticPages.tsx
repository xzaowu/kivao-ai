import { Link } from '@tanstack/react-router';
import { Icon } from '../components/Icon';

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
          样本及分页，仅前三个场景由 Mock API 支持。其他场景样本只能预览结构。图片与视频功能页的额外工具使用明确标识的前端演示层。画布支持模板、素材与便签、拖动和平移缩放、角色连接、撤销重做及任务版本审核；仅模拟模板任务，不是自动执行的通用工作流引擎。
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
