import { tabKeyboard } from "../components/tab-keyboard";
import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FileClock,
  Info,
  Layers,
  ShieldCheck,
} from "lucide-react";
import {
  DataBoundary,
  PageHeading,
  Modal,
  DetailRows,
  StatePanel,
} from "../components/common";
import { DataTable } from "../components/DataTable";
import { currency } from "../mock/data";
const configs = {
  "/users": {
    title: "用户管理",
    description:
      "用户列表与资料预览框架。所有账户均为虚构样本，尚未接入身份认证与权限。",
    tabs: ["用户列表", "接入说明"],
  },
  "/billing": {
    title: "积分与计费",
    description: "集中查看演示模型定价。尚未实现积分账户、冻结、扣费或结算。",
    tabs: ["模型定价", "计费边界"],
  },
  "/orders": {
    title: "订单与充值",
    description:
      "预留订单查询与充值管理入口。当前无支付系统，不创建虚构支付记录。",
    tabs: ["订单列表", "接入说明"],
  },
  "/library": {
    title: "作品与素材",
    description:
      "统一的内容管理页面框架。这里仅提供元数据样本，不读取用户前台的本地内容。",
    tabs: ["作品样本", "素材样本"],
  },
  "/settings": {
    title: "系统设置",
    description: "查看演示环境与能力边界。本轮不开放生产系统配置。",
    tabs: ["环境信息", "安全与接入"],
  },
};
export function FrameworkPage() {
  const path = useLocation().pathname as keyof typeof configs;
  return <Content key={path} path={path} />;
}
function Content({ path }: { path: keyof typeof configs }) {
  const config = configs[path];
  const [tab, setTab] = useState(0);
  const [detail, setDetail] = useState<{
    title: string;
    items: [string, string][];
  } | null>(null);
  if (!config) return <NotFoundPage />;
  return (
    <>
      <PageHeading title={config.title} description={config.description} />
      <div className="framework-notice">
        <Info size={18} />
        <span>
          页面框架预览 · 业务写入能力将在真实 API 与权限系统就绪后接入。
        </span>
      </div>
      <div
        className="tab-bar"
        role="tablist"
        onKeyDown={tabKeyboard}
        aria-label={config.title}
      >
        {config.tabs.map((t, i) => (
          <button
            role="tab"
            aria-selected={tab === i}
            tabIndex={tab === i ? 0 : -1}
            key={t}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="panel framework-panel">
        {path === "/users" && tab === 0 ? (
          <DataTable
            data={Array.from({ length: 8 }, (_, i) => ({
              id: `DEMO-U${i + 1}`,
              name: `演示用户 ${String(i + 1).padStart(2, "0")}`,
              identity: "虚构账户样本",
              status: "预览",
            }))}
            searchLabel="搜索演示用户"
            columns={[
              { key: "id", label: "用户编号" },
              {
                key: "name",
                label: "用户",
                render: (u) => (
                  <button
                    className="identity"
                    onClick={() =>
                      setDetail({
                        title: u.name,
                        items: [
                          ["用户编号", u.id],
                          ["数据来源", "独立演示样本"],
                          ["账户状态", "不对应真实账户"],
                          ["身份认证", "尚未接入"],
                        ],
                      })
                    }
                  >
                    <span className="avatar">演</span>
                    <strong>{u.name}</strong>
                  </button>
                ),
              },
              { key: "identity", label: "数据来源" },
              {
                key: "status",
                label: "状态",
                render: () => <span className="chip">仅预览</span>,
              },
            ]}
          />
        ) : path === "/billing" && tab === 0 ? (
          <DataBoundary>
            {(data) => (
              <DataTable
                data={data.models}
                searchLabel="搜索演示定价"
                columns={[
                  { key: "name", label: "模型" },
                  {
                    key: "cost",
                    label: "单次成本（模拟）",
                    render: (m) => currency(m.cost),
                  },
                  {
                    key: "credits",
                    label: "积分售价（模拟）",
                    render: (m) => `${m.credits} 积分`,
                  },
                ]}
                actions={() => (
                  <Link className="text-btn" to="/models">
                    管理配置
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              />
            )}
          </DataBoundary>
        ) : path === "/orders" && tab === 0 ? (
          <StatePanel title="尚未接入订单与支付">
            当前没有真实订单或充值记录。后续接入支付、回调和对账后，在此管理。
          </StatePanel>
        ) : path === "/library" ? (
          <DataTable
            key={tab}
            data={Array.from({ length: 5 }, (_, i) => ({
              id: `DEMO-${tab ? "A" : "W"}${i + 1}`,
              name: `${tab ? "素材" : "作品"}元数据样本 ${i + 1}`,
              kind: i % 3 === 2 ? "视频" : "图片",
              reference: tab ? "用户素材角色引用" : `DEMO-V${201 + i}`,
              source: "预设元数据 · 无真实文件",
            }))}
            searchLabel={tab ? "搜索素材样本" : "搜索作品样本"}
            columns={[
              {
                key: "name",
                label: tab ? "素材" : "作品",
                render: (x) => (
                  <button
                    className="identity"
                    onClick={() =>
                      setDetail({
                        title: x.name,
                        items: [
                          ["编号", x.id],
                          ["类型", x.kind],
                          ["引用", x.reference],
                          ["来源", x.source],
                        ],
                      })
                    }
                  >
                    <span className="entity-icon">
                      <Layers size={18} />
                    </span>
                    <span>
                      <strong>{x.name}</strong>
                      <small>{x.id}</small>
                    </span>
                  </button>
                ),
              },
              { key: "kind", label: "类型" },
              { key: "reference", label: tab ? "引用方式" : "结果版本引用" },
              { key: "source", label: "数据来源" },
            ]}
          />
        ) : path === "/settings" && tab === 0 ? (
          <div className="settings-content">
            <h2>当前环境</h2>
            <p>只读展示，不保存生产配置。</p>
            <DetailRows
              items={[
                ["应用", "KIVAO Admin UI"],
                ["数据源", "Admin 内存 Mock 适配层"],
                ["状态保存", "业务数据刷新即重置；主题保存在本地"],
                ["真实 API", "未连接"],
                ["AI Provider", "未连接"],
                ["数据库 / 队列", "未连接"],
                ["认证 / 权限", "未接入"],
                ["支付 / 扣费", "未接入"],
              ]}
            />
          </div>
        ) : (
          <div className="settings-content">
            <ShieldCheck size={30} />
            <h2>
              {path === "/billing"
                ? "计费接入边界"
                : path === "/settings"
                  ? "安全与后续接入"
                  : "功能接入说明"}
            </h2>
            <p>本轮仅提供可交互的管理 UI。接入真实业务前，需要完成以下能力：</p>
            <ul>
              <li>生产身份认证、权限校验与操作审计。</li>
              <li>服务端数据校验、持久化与明确的管理 API 契约。</li>
              <li>
                {path === "/billing" || path === "/orders"
                  ? "积分账本、支付回调、幂等处理、对账与退款。"
                  : "分页查询、错误恢复以及业务操作的权限控制。"}
              </li>
              <li>密钥服务端加密与脱敏；前端仅接收凭据状态。</li>
            </ul>
            <div className="notice">
              演示数据不能作为运营、财务或用户身份依据。
            </div>
          </div>
        )}
      </section>
      {detail && (
        <Modal drawer title={detail.title} onClose={() => setDetail(null)}>
          <div className="drawer-body">
            <DetailRows items={detail.items} />
            <div className="notice">只读演示资料，不对应真实账户或文件。</div>
          </div>
        </Modal>
      )}
    </>
  );
}
export function NotFoundPage() {
  return (
    <StatePanel
      title="页面不存在"
      action={
        <Link to="/" className="text-btn">
          返回数据概览
          <ArrowUpRight size={16} />
        </Link>
      }
    >
      <FileClock />
      请检查地址，或从侧边栏选择页面。
    </StatePanel>
  );
}
