import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@kivao/ui";
import {
  Badge,
  DataBoundary,
  PageHeading,
  StatePanel,
} from "../components/common";
import { currency, time, type Snapshot } from "../mock/data";
import { useFeedback } from "../components/feedback-context";
export function OverviewPage() {
  return <DataBoundary>{(data) => <Content data={data} />}</DataBoundary>;
}
function Content({ data }: { data: Snapshot }) {
  const [period, setPeriod] = useState(7);
  const [active, setActive] = useState<number | null>(null);
  const client = useQueryClient();
  const notify = useFeedback();
  const succeeded = data.tasks.filter((t) => t.status === "succeeded");
  const failed = data.tasks.filter((t) => t.status === "failed");
  const completed = data.tasks.filter((t) =>
    ["succeeded", "failed"].includes(t.status),
  );
  const successRate = completed.length
    ? (succeeded.length / completed.length) * 100
    : 0;
  const cost = data.tasks.reduce((n, t) => n + t.estimate, 0);
  const revenue = succeeded.reduce((n, t) => n + t.estimate * 2.4, 0);
  const trend = Array.from({ length: period }, (_, i) => {
    const date = new Date(Date.UTC(2026, 9, 29 - period + i));
    return {
      day: `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`,
      count: data.tasks.length ? 18 + ((i * 17 + 9) % 43) : 0,
      cost: data.tasks.length ? 2 + ((i * 7 + 4) % 13) : 0,
    };
  });
  const points = trend
    .map((t, i) => `${48 + (i * 640) / (period - 1)},${214 - t.count * 2.7}`)
    .join(" ");
  const exportReport = () => {
    const content =
      "\uFEFF日期,模拟任务量,模拟成本(元)\n" +
      trend.map((t) => `${t.day},${t.count},${t.cost}`).join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "KIVAO-MOCK-trend.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("已导出演示趋势 CSV，文件不包含真实运营数据");
  };
  const metrics = [
    {
      label: "演示用户",
      value: new Set(data.tasks.map((t) => t.user)).size.toLocaleString(),
      note: "独立演示账户样本",
      icon: Users,
    },
    {
      label: "创作任务",
      value: data.tasks.length.toLocaleString(),
      note: `${data.tasks.filter((t) => ["running", "queued"].includes(t.status)).length} 个排队 / 执行中`,
      icon: Activity,
    },
    {
      label: "生成成功率",
      value: `${successRate.toFixed(1)}%`,
      note: "成功 ÷（成功 + 失败）",
      icon: CheckCircle2,
    },
    {
      label: "模拟收入",
      value: currency(revenue),
      note: "成功任务估算 × 2.4（样本）",
      icon: Wallet,
    },
    {
      label: "模型成本估算",
      value: currency(cost),
      note: "任务估算合计，未真实扣费",
      icon: Coins,
    },
  ];
  return (
    <>
      <PageHeading
        title="数据概览"
        description="从创作到执行，快速了解 KIVAO 的演示运行情况。"
        action={
          <div className="heading-actions">
            <Button
              variant="outline"
              onClick={() =>
                void client.invalidateQueries({ queryKey: ["admin-mock"] })
              }
              aria-label="刷新演示数据"
            >
              <RefreshCw size={16} />
              <span>刷新</span>
            </Button>
            <Button onClick={exportReport}>
              <ArrowDownToLine size={16} />
              导出演示报表
            </Button>
          </div>
        }
      />
      <div className="overview-context">
        <div className="tab-pills">
          <span className="selected">运营概况</span>
          <span>固定样本 · 非实时数据</span>
        </div>
        <span>样本快照：2026 年 10 月 28 日</span>
      </div>
      <section className="metric-grid" aria-label="Mock 指标">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article className="metric" key={label}>
            <div>
              {label}
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </section>
      <div className="overview-charts">
        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <h2>创作趋势</h2>
              <p>独立构造的趋势样本，与上方当前任务快照分开统计</p>
            </div>
            <label>
              <span className="sr-only">趋势时间范围</span>
              <select
                aria-label="趋势时间范围"
                value={period}
                onChange={(e) => {
                  setPeriod(Number(e.target.value));
                  setActive(null);
                }}
              >
                <option value={7}>近 7 天</option>
                <option value={30}>近 30 天</option>
              </select>
            </label>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-primary" />
              模拟任务量
            </span>
            <span>
              <i className="legend-muted" />
              模拟成本（元）
            </span>
          </div>
          <div className="trend-chart">
            <svg
              viewBox="0 0 720 260"
              role="img"
              aria-label={`近 ${period} 天模拟任务与成本趋势，详细数据可在下方展开查看`}
            >
              <title>演示创作趋势</title>
              {[0, 20, 40, 60].map((v) => (
                <g key={v}>
                  <line
                    x1="48"
                    x2="694"
                    y1={214 - v * 2.7}
                    y2={214 - v * 2.7}
                    className="chart-grid"
                  />
                  <text x="29" y={218 - v * 2.7} textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {trend.map((t, i) => (
                <rect
                  key={i}
                  x={48 + (i * 640) / (period - 1) - (period === 7 ? 12 : 4)}
                  y={214 - t.cost * 2.7}
                  width={period === 7 ? 24 : 8}
                  height={t.cost * 2.7}
                  rx="3"
                  className="chart-bar"
                />
              ))}
              <polyline points={points} fill="none" className="chart-line" />
              {trend.map((t, i) => (
                <g key={i}>
                  <circle
                    cx={48 + (i * 640) / (period - 1)}
                    cy={214 - t.count * 2.7}
                    r={active === i ? 6 : 3.5}
                    className="chart-point"
                    tabIndex={0}
                    role="button"
                    aria-label={`${t.day}：${t.count} 个模拟任务，成本 ${t.cost} 元`}
                    onClick={() => setActive(active === i ? null : i)}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onMouseLeave={() => setActive(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setActive(null);
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActive(active === i ? null : i);
                      }
                    }}
                  >
                    {
                      <title>{`${t.day}：${t.count} 个任务，${t.cost} 元`}</title>
                    }
                  </circle>
                  {(period === 7 || i % 5 === 0 || i === period - 1) && (
                    <text
                      x={48 + (i * 640) / (period - 1)}
                      y="248"
                      textAnchor="middle"
                    >
                      {t.day}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            {active !== null && (
              <div className="chart-tooltip" role="status">
                {trend[active]!.day} · {trend[active]!.count} 个任务 ·{" "}
                {currency(trend[active]!.cost)}
              </div>
            )}
          </div>
          <details className="trend-data">
            <summary>查看趋势数据明细</summary>
            <div className="trend-data-grid">
              {trend.map((t) => (
                <span key={t.day}>
                  {t.day}：{t.count} 个 / {currency(t.cost)}
                </span>
              ))}
            </div>
          </details>
        </section>
        <section className="panel distribution-panel">
          <div className="panel-heading">
            <div>
              <h2>模型使用分布</h2>
              <p>按当前任务样本计数</p>
            </div>
            <BoxesIcon />
          </div>
          {data.models.length ? (
            <div className="distribution-list">
              {data.models.map((m, i) => {
                const count = data.tasks.filter(
                  (t) => t.modelId === m.id,
                ).length;
                const percent = data.tasks.length
                  ? Math.round((count / data.tasks.length) * 100)
                  : 0;
                return (
                  <div key={m.id}>
                    <div className="distribution-label">
                      <span>
                        <i className={`model-dot dot-${i}`} />
                        {m.name}
                      </span>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        className={`bar-fill dot-${i}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <small>{count} 次演示调用</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <StatePanel title="暂无模型样本" />
          )}
          <div className="distribution-note">
            调用量仅由前端样本计算
            <br />
            未向任何 AI Provider 发送请求
          </div>
        </section>
      </div>
      <div className="overview-bottom">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>最近任务</h2>
              <p>最近 5 条演示执行记录</p>
            </div>
            <Link className="text-btn" to="/tasks">
              查看全部
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {data.tasks.length ? (
            <div className="mini-table">
              <div className="mini-row mini-header">
                <span>任务 / 用户</span>
                <span>场景</span>
                <span>状态</span>
                <span>费用估算</span>
              </div>
              {data.tasks.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  to="/tasks"
                  search={{ task: t.id }}
                  className="mini-row"
                >
                  <span>
                    <strong>{t.id}</strong>
                    <small>
                      {t.user} · {time(t.startedAt)}
                    </small>
                  </span>
                  <span>
                    {data.scenes.find((s) => s.id === t.sceneId)?.name ??
                      "不可用"}
                  </span>
                  <span>
                    <Badge value={t.status} />
                  </span>
                  <span className="numeric">{currency(t.estimate)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <StatePanel title="暂无任务样本" />
          )}
        </section>
        <section className="panel anomaly-panel">
          <div className="panel-heading">
            <div>
              <h2>异常摘要</h2>
              <p>方便定位需要关注的演示任务</p>
            </div>
            <AlertCircle size={18} />
          </div>
          <div className="anomaly-summary">
            <strong>{failed.length}</strong>
            <span>
              个模拟异常<small>预设供应商超时</small>
            </span>
          </div>
          {failed.slice(0, 2).map((t) => (
            <Link
              to="/tasks"
              search={{ task: t.id }}
              key={t.id}
              className="anomaly-item"
            >
              <span className="anomaly-dot" />
              <span>
                <strong>{t.id}</strong>
                <small>
                  模拟响应超时 ·{" "}
                  {data.models.find((m) => m.id === t.modelId)?.name}
                </small>
              </span>
              <ArrowUpRight size={15} />
            </Link>
          ))}
          {!failed.length && <p className="muted">当前样本没有异常任务。</p>}
          <p className="anomaly-note">重试只新增演示任务，不执行真实生成。</p>
        </section>
      </div>
    </>
  );
}
function BoxesIcon() {
  return <Activity size={18} className="muted" />;
}
