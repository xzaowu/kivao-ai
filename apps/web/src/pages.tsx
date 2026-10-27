import { Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@kivao/ui';
import { fetchScenes } from './api';

export function Layout() {
  return <div className="mx-auto min-h-screen max-w-6xl px-5 sm:px-10">
    <a href="#main" className="sr-only focus:not-sr-only">跳到主要内容</a>
    <header className="flex flex-wrap items-center justify-between gap-4 border-b py-6">
      <Link to="/" className="text-2xl font-semibold tracking-tight" aria-label="KIVAO 首页">KIVAO</Link>
      <nav aria-label="主导航" className="flex gap-6 text-sm"><Link to="/" activeProps={{ className: 'underline underline-offset-8' }} activeOptions={{ exact: true }}>创作场景</Link><Link to="/about" activeProps={{ className: 'underline underline-offset-8' }}>开发说明</Link></nav>
    </header>
    <div role="note" className="my-6 bg-muted px-4 py-3 text-sm text-muted-foreground">早期开发 · 当前使用 Mock API，AI 生成尚未接入，不会产生费用。</div>
    <main id="main" className="py-8 sm:py-12"><Outlet /></main>
    <footer className="mt-12 border-t py-6 text-sm text-muted-foreground">KIVAO · 第一阶段工程外壳</footer>
  </div>;
}

export function ScenesPage() {
  const query = useQuery({ queryKey: ['scenes'], queryFn: fetchScenes });
  return <>
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">创作场景</h1>
    <p className="mt-4 max-w-2xl text-muted-foreground">这是共享契约与 Mock API 的请求示例。正式创作页面将在下一阶段迁入。</p>
    <div className="mt-8 flex items-center gap-4"><Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>{query.isFetching ? '读取中…' : '刷新模拟场景'}</Button><span className="text-sm text-muted-foreground" aria-live="polite">{query.data ? '数据来源：Mock API' : ''}</span></div>
    {query.isPending && <p role="status" className="mt-8">正在读取场景…</p>}
    {query.isError && <p role="alert" className="mt-8">无法读取场景。请确认 API 已启动后重试。</p>}
    {query.data && (query.data.data.length ? <ul className="mt-8 divide-y border-y">{query.data.data.map((scene) => <li key={scene.id} className="py-6 sm:flex sm:items-start sm:justify-between sm:gap-8"><div><h2 className="text-xl font-medium">{scene.name}</h2><p className="mt-2 text-muted-foreground">{scene.description}</p></div><p className="mt-3 text-sm text-muted-foreground sm:mt-1">{scene.outputKind === 'image' ? '图片场景' : '视频场景'} · 模拟</p></li>)}</ul> : <p className="mt-8">暂无演示场景。</p>)}
  </>;
}
export function AboutPage() {
  return <><h1 className="text-3xl font-semibold">开发说明</h1><p className="mt-5 max-w-2xl text-muted-foreground">当前只有工程外壳、业务契约与本地 Mock 数据。真实生成、登录、充值、扣费及作品保存操作均未接入。模拟创作保存在 API 进程内，重启后清空。</p><p className="mt-4 max-w-2xl text-muted-foreground">后续沿用 KIVAO 现有品牌，并将方案 C 高保真原型迁移为 React 页面；本阶段不重新设计。</p></>;
}
export function NotFoundPage() { return <><h1 className="text-3xl font-semibold">页面不存在</h1><Link to="/" className="mt-4 inline-block underline">返回首页</Link></>; }
