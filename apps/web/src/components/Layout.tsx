import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { sceneQuery } from '../api';
import { getScene } from '../data/catalog';
import { useDemo } from '../demo/store';
import { DemoImage } from './Media';
import { Icon } from './Icon';
import { useUi } from './ui-context';

const navigation = [
  ['/', 'spark', '开始'],
  ['/images', 'image', '图片'],
  ['/videos', 'video', '视频'],
  ['/canvas', 'grid', '画布'],
  ['/works', 'book', '作品'],
  ['/materials', 'folder', '素材'],
] as const;
export function Layout() {
  const { pathname } = useLocation(),
    state = useDemo(),
    ui = useUi(),
    api = useQuery(sceneQuery);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('kivao-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const { close } = ui;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('kivao-theme', theme);
    } catch {
      /* Theme still works for this page when storage is disabled. */
    }
  }, [theme]);
  useEffect(() => {
    close();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, close]);
  const creation = state.creations.find(
    (item) => pathname === `/creations/${item.id}`,
  );
  const isStudio =
    pathname === '/images' || pathname === '/videos' || Boolean(creation);
  const isStart = pathname === '/';
  const sceneId =
    creation?.sceneId ||
    (pathname.startsWith('/scenes/') ? pathname.split('/').at(-1) : undefined);
  const scene = sceneId && getScene(sceneId);
  const active = scene
    ? scene.output === '视频'
      ? '/videos'
      : '/images'
    : navigation.some(([path]) => path === pathname)
      ? pathname
      : '/';
  const activeLabel =
    navigation.find(([path]) => path === active)?.[2] || '开始';
  const count = state.creations.filter((item) => !item.draft).length;
  function about() {
    ui.open(
      '方案 C · 从场景到作品',
      <div className="about-body">
        <h3>先选结果，再按角色准备。</h3>
        <p>
          开始、图片、视频、画布、作品、素材六个入口，各有职责。场景定义流程，创作保存计划与版本，作品只保存你确认的结果。
        </p>
        <p>
          三个核心场景接入 Mock 计划与创作
          API。执行、调整、版本与审核保存由独立前端演示层提供，结果均为预制媒体。
        </p>
        <p>
          不连接真实
          AI、账号或计费。本地文件不上传，刷新后需重新选择；其他演示记录保存在此浏览器。
        </p>
        <Link className="primary" to="/design" onClick={ui.close}>
          阅读流程与边界 <Icon name="arrow" />
        </Link>
      </div>,
    );
  }
  return (
    <div
      className={`kivao-app ${isStart ? 'on-start' : ''} ${isStudio ? 'in-studio' : ''} ${creation ? 'in-creation' : ''}`}
    >
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <aside className="rail">
        <Link className="brand" to="/" aria-label="风筝 KIVAO 开始">
          <DemoImage asset="kivao-mark" eager alt="风筝 KIVAO" />
          <span>
            KIVAO<small>风筝创作</small>
          </span>
        </Link>
        <nav aria-label="全局导航">
          {navigation.map(([path, icon, label], index) => (
            <Link
              key={path}
              to={path}
              className={`rail-link ${active === path ? 'active' : ''} ${index === 4 ? 'nav-library-start' : ''}`}
              aria-current={active === path ? 'page' : undefined}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {active === path && <i />}
            </Link>
          ))}
        </nav>
        <Link className="rail-scenes" to="/scenes">
          <Icon name="search" />
          发现更多场景
          <Icon name="chevron" />
        </Link>
        <div className="rail-bottom">
          <Link className="rail-help" to="/design">
            <Icon name="book" />
            设计说明
          </Link>
          <div className="rail-person">
            <span className="avatar">K</span>
            <span>
              我的工作空间<small>本地演示 · 不计费</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <Link className="wordmark" to="/">
            <span className="mobile-wordmark">KIVAO</span>
            <span className="desktop-breadcrumb">
              个人工作空间 <b>/</b>
              <strong>{activeLabel}</strong>
            </span>
          </Link>
          <div className="header-right">
            <Link className="text-link" to="/creations">
              <Icon name="clock" />
              我的创作{count > 0 && <span>{count}</span>}
            </Link>
            <span className="demo-label">方案 C · 交互演示</span>
            <button
              className="credit-chip"
              onClick={() =>
                ui.open(
                  '积分展示 · 演示',
                  <div className="about-body">
                    <h3>演示积分：0</h3>
                    <p>
                      此数字只是界面展示，不是账户余额。当前没有登录、充值、真实扣费或购买功能；Mock
                      估算不构成真实费用。
                    </p>
                  </div>,
                )
              }
            >
              演示积分 0
            </button>
            <button
              className="icon-button"
              aria-label={theme === 'light' ? '切换深色主题' : '切换浅色主题'}
              title={theme === 'light' ? '深色主题' : '浅色主题'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Icon name="sliders" />
            </button>
            <button
              className="icon-button"
              onClick={about}
              aria-label="关于本演示"
            >
              <Icon name="info" />
            </button>
          </div>
        </header>
        {['/', '/scenes', '/creations'].includes(pathname) && (
          <nav className="creation-nav" aria-label="开始内导航">
            <Link className={pathname === '/' ? 'active' : ''} to="/">
              为你推荐
            </Link>
            <Link
              className={pathname === '/scenes' ? 'active' : ''}
              to="/scenes"
            >
              场景库
            </Link>
            <Link
              className={pathname === '/creations' ? 'active' : ''}
              to="/creations"
            >
              我的创作{count > 0 && <span>{count}</span>}
            </Link>
          </nav>
        )}
        {api.isError && (
          <div className="app-notice" role="alert">
            Mock API 暂不可用，素材仍可预览。{api.error.message}
            <button className="text-link" onClick={() => void api.refetch()}>
              重试连接
            </button>
          </div>
        )}
        {state.storageWarning && (
          <p className="app-notice" role="alert">
            {state.storageWarning}
          </p>
        )}
        <main
          id="main"
          className={`content ${isStudio ? 'studio-content' : isStart ? 'start-content' : ''}`}
        >
          <Outlet />
          {!isStudio && (
            <footer className="page-footer">
              <span>风筝 KIVAO · 线始终在人手里。</span>
              <span>场景驱动创作 · 本地演示 · 不计费</span>
            </footer>
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="移动端全局导航">
        {navigation.map(([path, icon, label]) => (
          <Link
            key={path}
            to={path}
            className={active === path ? 'active' : ''}
            aria-current={active === path ? 'page' : undefined}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
