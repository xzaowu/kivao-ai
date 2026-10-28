// Sidebar/header/theme composition informed by shadcn-admin (MIT). See docs/third-party/shadcn-admin.md.
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@kivao/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Modal } from "./common";
import { useFeedback } from "./feedback-context";
import {
  failNextSave,
  resetDemo,
  setDemoState,
  type DemoState,
} from "../mock/adapter";
const navigation = [
  { to: "/", label: "数据概览", icon: LayoutDashboard, group: "工作台" },
  { to: "/users", label: "用户管理", icon: Users, group: "" },
  { to: "/models", label: "模型与供应商", icon: Boxes, group: "创作管理" },
  { to: "/scenes", label: "场景管理", icon: FolderOpen, group: "" },
  { to: "/tasks", label: "生成任务", icon: Activity, group: "" },
  { to: "/billing", label: "积分与计费", icon: Wallet, group: "运营与系统" },
  { to: "/orders", label: "订单与充值", icon: CreditCard, group: "" },
  { to: "/library", label: "作品与素材", icon: FolderOpen, group: "" },
  { to: "/settings", label: "系统设置", icon: Settings, group: "" },
] as const;
type Theme = "light" | "dark" | "system";
function initialTheme(): Theme {
  try {
    const t = localStorage.getItem("kivao-admin-theme");
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}
export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [help, setHelp] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DemoState>("normal");
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const notify = useFeedback();
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
      document.documentElement.style.colorScheme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    try {
      localStorage.setItem("kivao-admin-theme", theme);
    } catch {
      /* Theme still works without storage. */
    }
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((x) => !x);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const current =
    navigation.find((x) => x.to === location.pathname)?.label ?? "页面不存在";
  const go = (to: (typeof navigation)[number]["to"]) => {
    setMobile(false);
    setSearchOpen(false);
    void navigate({ to });
  };
  const nav = (
    <>
      <div className="sidebar-brand">
        <Link
          to="/"
          aria-label="KIVAO 管理后台"
          onClick={() => setMobile(false)}
        >
          <span className="brand-mark">K</span>
          <span className="brand-text">
            KIVAO <small>管理控制台</small>
          </span>
        </Link>
        <button
          className="icon-btn mobile-close"
          aria-label="关闭导航"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
      </div>
      <nav aria-label="管理导航">
        {navigation.map(({ to, label, icon: Icon, group }) => (
          <div key={to}>
            {group && <div className="nav-group">{group}</div>}
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="nav-link"
              activeProps={{ className: "nav-link active" }}
              title={label}
              onClick={() => setMobile(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {to === "/tasks" && <small className="nav-count">演示</small>}
            </Link>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="environment">
          <span className="env-dot" />
          <span>
            前端演示环境<small>未连接生产服务</small>
          </span>
        </div>
        <button
          className="sidebar-help"
          title="演示说明"
          onClick={() => setHelp(true)}
        >
          <CircleHelp size={18} />
          <span>演示说明与能力边界</span>
        </button>
        <div className="operator">
          <span className="avatar">演</span>
          <div>
            演示管理员<small>无登录 · 无权限鉴权</small>
          </div>
          <ShieldCheck size={17} />
        </div>
      </div>
    </>
  );
  return (
    <div className={`admin-shell ${collapsed ? "is-collapsed" : ""}`}>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <aside className="sidebar desktop-sidebar">{nav}</aside>
      <Dialog open={mobile} onOpenChange={setMobile}>
        <DialogContent className="mobile-sidebar" showCloseButton={false}>
          <DialogTitle className="sr-only">管理导航</DialogTitle>
          <DialogDescription className="sr-only">
            切换后台业务页面
          </DialogDescription>
          {nav}
        </DialogContent>
      </Dialog>
      <div className="admin-body">
        <header className="topbar">
          <button
            className="icon-btn collapse-toggle"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((x) => !x)}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <button
            className="icon-btn mobile-toggle"
            aria-label="打开导航"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <nav className="breadcrumb" aria-label="面包屑">
            <span>管理后台</span>
            <ChevronRight size={14} />
            <strong aria-current="page">{current}</strong>
          </nav>
          <div className="global-actions">
            <button
              className="global-search"
              aria-label="搜索管理页面"
              onClick={() => {
                setSearch("");
                setSearchOpen(true);
              }}
            >
              <Search size={16} />
              <span>搜索页面…</span>
              <kbd>⌘ K</kbd>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="icon-btn" aria-label="切换主题">
                  {theme === "dark" ? (
                    <Moon size={19} />
                  ) : theme === "light" ? (
                    <Sun size={19} />
                  ) : (
                    <Monitor size={19} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(
                  [
                    ["light", "浅色"],
                    ["dark", "深色"],
                    ["system", "跟随系统"],
                  ] as const
                ).map(([v, l]) => (
                  <DropdownMenuItem key={v} onSelect={() => setTheme(v)}>
                    {l}
                    {v === theme ? " · 当前" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="demo-control" aria-label="演示控制">
                  <SlidersHorizontal size={16} />
                  <span>演示控制</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(
                  [
                    ["normal", "正常数据"],
                    ["loading", "慢速加载"],
                    ["empty", "空数据"],
                    ["error", "加载错误"],
                  ] as const
                ).map(([v, l]) => (
                  <DropdownMenuItem
                    key={v}
                    onSelect={() => {
                      setDemoState(v);
                      setMode(v);
                      void client.invalidateQueries({
                        queryKey: ["admin-mock"],
                      });
                    }}
                  >
                    {l}
                    {mode === v ? " · 当前" : ""}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onSelect={() => {
                    failNextSave();
                    notify("下次保存将模拟失败，表单内容会保留。");
                  }}
                >
                  下次保存模拟失败
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (
                      window.confirm(
                        "恢复全部初始演示数据？本会话的配置修改将被清除。",
                      )
                    ) {
                      resetDemo();
                      setMode("normal");
                      void client.invalidateQueries({
                        queryKey: ["admin-mock"],
                      });
                      go("/");
                      notify("已恢复初始演示数据");
                    }
                  }}
                >
                  重置演示数据
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="mock-banner">
          <span className="mock-tag">MOCK</span>
          <span>
            所有指标与操作均为模拟。未连接真实后台、AI、支付或账户系统。
          </span>
          <button className="text-btn" onClick={() => setHelp(true)}>
            查看说明
            <ArrowUpRight size={13} />
          </button>
        </div>
        <main id="main" className="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>KIVAO 管理控制台 · UI 预览</span>
          <span>演示样本 · 2026.10.28</span>
        </footer>
      </div>
      {help && (
        <Modal title="演示说明与能力边界" onClose={() => setHelp(false)}>
          <div className="prose">
            <p>
              本后台基于 shadcn-admin 的 MIT 组件模式构建，使用 KIVAO
              品牌主题。展示的数据为独立构造的 Mock 样本。
            </p>
            <ul>
              <li>
                Provider 是供应商连接配置；Model
                是供应商下的能力、限制与价格配置。
              </li>
              <li>
                Scene 是可执行场景定义；Creation 是持续创作；Task
                是一次执行；Version 是不可覆盖的结果；Work 是用户保存的作品。
              </li>
              <li>
                添加、编辑、上下架、重试与取消仅在本页演示适配层发生。刷新页面后恢复初始样本。
              </li>
              <li>
                不接受真实密钥；不发起网络连接测试；无真实充值、扣费、认证、权限或审计存储。
              </li>
            </ul>
          </div>
          <div className="dialog-actions">
            <Button onClick={() => setHelp(false)}>我知道了</Button>
          </div>
        </Modal>
      )}
      {searchOpen && (
        <Modal
          title="搜索管理页面"
          description="按模块名称查找并跳转。快捷键 Ctrl / ⌘ + K。"
          onClose={() => setSearchOpen(false)}
        >
          <label className="search-input command-search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="搜索页面…"
              aria-label="搜索页面关键词"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="command-results">
            {navigation
              .filter((x) => x.label.includes(search.trim()))
              .map(({ to, label, icon: Icon }) => (
                <button key={to} onClick={() => go(to)}>
                  <Icon size={18} />
                  {label}
                  <ChevronRight size={15} />
                </button>
              ))}
            {!navigation.some((x) => x.label.includes(search.trim())) && (
              <p>未找到页面，请换个关键词。</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
