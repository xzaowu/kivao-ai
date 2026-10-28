import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { sceneQuery } from '../api';
import { getScene } from '../data/catalog';
import features from '../data/features.json';
import { useDemo } from '../demo/store';
import { library, useLibrary } from '../demo/library';
import { BoardForm } from '../canvas/BoardForm';
import { canvas, useCanvas } from '../canvas/store';
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
    lib = useLibrary(),
    boards = useCanvas(),
    ui = useUi(),
    api = useQuery(sceneQuery);
  const navigationRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const value = localStorage.getItem('kivao-theme');
      return value === 'dark' || value === 'system' ? value : 'light';
    } catch {
      return 'light';
    }
  });
  const { dismiss } = ui;
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply);
    try {
      localStorage.setItem('kivao-theme', theme);
    } catch {
      /* Theme remains usable without storage. */
    }
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    dismiss();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, dismiss]);
  const creation = state.creations.find(
      (c) => pathname === `/creations/${c.id}`,
    ),
    sceneId =
      creation?.sceneId ||
      (pathname.startsWith('/scenes/')
        ? pathname.split('/').at(-1)
        : undefined),
    scene = sceneId ? getScene(sceneId) : undefined;
  const kind =
    pathname.startsWith('/images') ||
    (scene && scene.output !== '视频' && !scene.id.startsWith('video-'))
      ? 'images'
      : pathname.startsWith('/videos') ||
          scene?.output === '视频' ||
          scene?.id.startsWith('video-')
        ? 'videos'
        : '';
  const isStudio = Boolean(creation) || /^\/(images|videos)\//.test(pathname),
    isStart = pathname === '/',
    boardId = pathname.startsWith('/canvas/')
      ? pathname.split('/')[2]
      : undefined,
    board = boards.boards.find((b) => b.id === boardId);
  const active = kind
    ? '/' + kind
    : navigation.find(
        ([path]) => path !== '/' && pathname.startsWith(path),
      )?.[0] || '/';
  const count = state.creations.filter(
    (c) => !c.draft && !library.meta('creations', c.id).archived,
  ).length;
  const inStart = ['/', '/scenes', '/creations'].includes(pathname),
    tools = kind === 'videos' ? features.VIDEO_TOOLS : features.IMAGE_TOOLS;
  const toolId = creation
    ? tools.find((t) => t.scene === creation.sceneId)?.id
    : pathname.split('/')[2];
  useEffect(() => {
    const scroller = navigationRef.current,
      active = scroller?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!scroller || !active) return;
    const box = scroller.getBoundingClientRect(),
      item = active.getBoundingClientRect();
    if (item.left < box.left) scroller.scrollLeft -= box.left - item.left + 8;
    else if (item.right > box.right)
      scroller.scrollLeft += item.right - box.right + 8;
  }, [pathname, toolId]);
  function about() {
    ui.open(
      '方案 C · 从场景到作品',
      <div className="about-body">
        <h3>先选结果，再按角色准备。</h3>
        <p>场景定义流程，创作保存计划与版本，作品只保存你确认的结果。</p>
        <p>
          三个核心场景接入 Mock 计划与创作
          API。其他工具、执行、调整、画布与内容整理使用独立前端演示层，结果均为预制媒体。
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
  function themeDialog() {
    ui.open(
      '主题外观',
      <div className="ac-dialog-body">
        <p>选择你舒服的创作环境。作品图片和视频保持原来的颜色。</p>
        <div className="ac-theme-options" role="group" aria-label="主题外观">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                ui.close();
              }}
            >
              <Icon name="sliders" />
              <b>{{ light: '浅色', dark: '深色', system: '跟随系统' }[t]}</b>
            </button>
          ))}
        </div>
      </div>,
    );
  }
  function utilities(editor: boolean) {
    return (
      <div
        className={
          editor ? 'cv-editor-top-actions' : 'header-right ac-header-actions'
        }
      >
        {editor && board && (
          <>
            <button
              className="icon-button"
              aria-label="画布设置"
              onClick={() =>
                ui.open(
                  '管理画布',
                  <BoardForm board={board} onDone={ui.close} />,
                )
              }
            >
              <Icon name="sliders" />
            </button>
            <button
              className="secondary cv-panel-toggle"
              aria-pressed={boards.panel}
              onClick={() => canvas.panel(!boards.panel)}
            >
              <Icon name="spark" />
              创作助手
            </button>
            <button
              className="secondary cv-mobile-list-toggle"
              aria-pressed={boards.list}
              onClick={() => canvas.list(!boards.list)}
            >
              <Icon name={boards.list ? 'grid' : 'book'} />
              {boards.list ? '看画布' : '节点列表'}
            </button>
          </>
        )}
        <button
          className={
            editor ? 'ac-credit-chip ac-editor-credit' : 'ac-credit-chip'
          }
          onClick={() =>
            ui.open(
              '积分展示 · 演示',
              <div className="about-body">
                <h3>1,200 演示积分</h3>
                <p>
                  此数字为原型展示样本，不是账户余额。当前没有登录、充值、真实扣费或购买功能；实际支付为
                  0，Mock 估算不构成真实费用。
                </p>
              </div>,
            )
          }
        >
          <strong>1,200</strong>{' '}
          <small className={editor ? 'sr-only' : ''}>演示积分</small>
        </button>
        <button
          className="icon-button"
          aria-label="主题外观"
          onClick={themeDialog}
        >
          <Icon name="sliders" />
        </button>
        {!editor && (
          <button
            className="icon-button"
            aria-label="关于本演示"
            onClick={about}
          >
            <Icon name="info" />
          </button>
        )}
      </div>
    );
  }
  return (
    <div
      className={`kivao-app ${isStart ? 'on-start' : ''} ${isStudio ? 'in-studio' : ''} ${creation ? 'in-creation' : ''} ${boardId ? 'canvas-editing' : ''} ${pathname.startsWith('/canvas') ? 'on-canvas' : ''} ${pathname === '/scenes' ? 'on-scenes' : ''} ${kind === 'images' ? 'on-images' : ''} ${kind === 'images' && isStudio ? 'image-studio' : ''} ${kind === 'videos' ? 'on-videos' : ''} ${kind === 'videos' && isStudio ? 'video-studio' : ''}`}
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
            <span className="avatar">创</span>
            <span>
              创作者<small>我的 · 本地演示账户</small>
            </span>
            <button
              className="icon-button"
              aria-label="主题外观"
              onClick={themeDialog}
            >
              <Icon name="sliders" />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header
          className={`topbar ${boardId ? 'cv-merged-topbar' : 'merged-topbar'}`}
          aria-label="工作台导航"
        >
          {boardId ? (
            <div className="cv-editor-top">
              <Link
                className="icon-button"
                to="/canvas"
                aria-label="返回画布列表"
              >
                <Icon name="back" />
              </Link>
              <div>
                <h1>{board?.name || '画布'}</h1>
                <span id="cv-save-status">
                  {boards.warning || '已保存在此浏览器'}
                </span>
              </div>
              {utilities(true)}
            </div>
          ) : (
            <>
              <Link className="wordmark" to="/" aria-label="KIVAO 开始">
                <span className="mobile-wordmark">
                  <DemoImage asset="kivao-mark" />
                </span>
              </Link>
              <div className="header-navigation" ref={navigationRef}>
                {inStart ? (
                  <nav className="creation-nav" aria-label="开始内导航">
                    {(
                      [
                        ['/', '为你推荐'],
                        ['/scenes', '场景库'],
                        ['/creations', '创作记录'],
                      ] as const
                    ).map(([path, label]) => (
                      <Link
                        key={path}
                        to={path}
                        activeOptions={{ exact: true }}
                        className={pathname === path ? 'active' : ''}
                        aria-current={pathname === path ? 'page' : undefined}
                      >
                        {label}
                        {path === '/creations' && count > 0 && (
                          <span>{count}</span>
                        )}
                      </Link>
                    ))}
                  </nav>
                ) : kind ? (
                  <nav
                    className={
                      kind === 'images'
                        ? 'image-feature-nav'
                        : 'video-feature-nav'
                    }
                    aria-label={kind === 'images' ? '图片功能' : '视频功能'}
                  >
                    <Link
                      to={kind === 'images' ? '/images' : '/videos'}
                      activeOptions={{ exact: true }}
                      aria-current={!toolId ? 'page' : undefined}
                    >
                      <Icon name="grid" />
                      全部功能
                    </Link>
                    {tools.map((t) => (
                      <Link
                        key={t.id}
                        to={
                          kind === 'images'
                            ? '/images/$toolId'
                            : '/videos/$toolId'
                        }
                        params={{ toolId: t.id }}
                        aria-current={toolId === t.id ? 'page' : undefined}
                      >
                        {'short' in t ? t.short : t.name}
                      </Link>
                    ))}
                  </nav>
                ) : pathname === '/works' || pathname === '/materials' ? (
                  <nav
                    className="ls-header-nav"
                    aria-label={pathname === '/works' ? '作品分类' : '素材分类'}
                  >
                    {(['mine', 'demo', 'trash'] as const).map((source) => (
                      <button
                        key={source}
                        aria-pressed={
                          lib.sources[
                            pathname === '/works' ? 'works' : 'materials'
                          ] === source
                        }
                        onClick={() =>
                          library.source(
                            pathname === '/works' ? 'works' : 'materials',
                            source,
                          )
                        }
                      >
                        {source === 'mine'
                          ? pathname === '/works'
                            ? '我的作品'
                            : '我的素材'
                          : source === 'demo'
                            ? pathname === '/works'
                              ? '演示作品'
                              : '演示素材'
                            : '最近删除'}
                      </button>
                    ))}
                  </nav>
                ) : pathname === '/canvas' ? (
                  <nav className="ls-header-nav" aria-label="画布入口">
                    <button
                      aria-pressed={boards.tab === 'templates'}
                      onClick={() => canvas.tab('templates')}
                    >
                      精选模板
                    </button>
                    <button
                      aria-pressed={boards.tab === 'boards'}
                      onClick={() => canvas.tab('boards')}
                    >
                      我的画布{' '}
                      <span>
                        {boards.boards.filter((b) => !b.trashed).length}
                      </span>
                    </button>
                  </nav>
                ) : null}
              </div>
            </>
          )}
          {!boardId && utilities(false)}
        </header>
        {api.isError && (
          <div className="app-notice" role="alert">
            Mock API 暂不可用，素材仍可预览。{api.error.message}
            <button className="text-link" onClick={() => void api.refetch()}>
              重试连接
            </button>
          </div>
        )}
        {(state.storageWarning || lib.warning) && (
          <p className="app-notice" role="alert">
            {state.storageWarning || lib.warning}
          </p>
        )}
        <main
          id="main"
          className={`content ${isStudio ? 'studio-content' : isStart ? 'start-content' : ''} ${boardId ? 'cv-editor-content' : pathname === '/canvas' ? 'cv-hub-content' : pathname === '/images' ? 'image-hub-content' : pathname === '/videos' ? 'video-hub-content' : ''}`}
        >
          <Outlet />
          {!isStudio && !boardId && (
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
