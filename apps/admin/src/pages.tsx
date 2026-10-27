import { Link, Outlet } from '@tanstack/react-router';

export function Layout() {
  return <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
    <a href="#main" className="sr-only focus:not-sr-only">跳到主要内容</a>
    <aside className="border-b bg-muted p-6 md:border-r md:border-b-0">
      <Link to="/" className="text-2xl font-semibold tracking-tight">KIVAO <span className="text-sm font-normal">Admin</span></Link>
      <nav aria-label="管理导航" className="mt-8 flex gap-5 md:flex-col"><Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'font-semibold underline underline-offset-4' }}>管理概览</Link><Link to="/scenes" activeProps={{ className: 'font-semibold underline underline-offset-4' }}>场景管理</Link></nav>
    </aside>
    <div className="min-w-0 p-6 sm:p-10"><header className="border-b pb-5 text-sm text-muted-foreground">开发占位 · 尚未接入身份认证和真实管理操作</header><main id="main" className="max-w-3xl py-10"><Outlet /></main></div>
  </div>;
}
export function OverviewPage() { return <><h1 className="text-3xl font-semibold">管理概览</h1><p className="mt-5 text-muted-foreground">管理端已独立运行。此处只保留布局、路由与共享 UI 基础，不展示虚构的运营指标。</p><Link to="/scenes" className="mt-6 inline-block underline underline-offset-4">查看场景管理占位页</Link></>; }
export function ScenesPage() { return <><h1 className="text-3xl font-semibold">场景管理</h1><p className="mt-5 text-muted-foreground">管理功能尚未实现。后续接入身份认证、权限和真实数据后，再提供场景配置与操作。</p></>; }
export function NotFoundPage() { return <><h1 className="text-3xl font-semibold">页面不存在</h1><Link to="/" className="mt-4 inline-block underline">返回首页</Link></>; }
