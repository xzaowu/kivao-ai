import { useState } from "react";
import { useSearch } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@kivao/ui";
import {
  DataBoundary,
  Badge,
  PageHeading,
  Modal,
  DetailRows,
  RowMenu,
  Confirm,
} from "../components/common";
import { DataTable } from "../components/DataTable";
import { useFeedback } from "../components/feedback-context";
import { useSave } from "../mock/adapter";
import {
  currency,
  statuses,
  time,
  type AdminTask,
  type Snapshot,
} from "../mock/data";
export function TasksPage() {
  return <DataBoundary>{(data) => <Content data={data} />}</DataBoundary>;
}
function Content({ data }: { data: Snapshot }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [action, setAction] = useState<{
    id: string;
    action: "retry" | "cancel";
  } | null>(null);
  const save = useSave();
  const notify = useFeedback();
  const search = useSearch({ strict: false }) as { task?: string };
  const task = data.tasks.find((t) => t.id === detail);
  const modelName = (id: string) =>
    data.models.find((m) => m.id === id)?.name ?? "模型不可用";
  const sceneName = (id: string) =>
    data.scenes.find((s) => s.id === id)?.name ?? "场景不可用";
  const startAction = (t: AdminTask, type: "retry" | "cancel") => {
    save.reset();
    setAction({ id: t.id, action: type });
  };
  return (
    <>
      <PageHeading
        title="生成任务"
        description="查看每次异步执行的状态、成本估算与异常。重试会保留原任务并创建独立的演示记录。"
      />
      <div className="summary-strip">
        <div>
          <span className="summary-icon">
            <Activity size={21} />
          </span>
          <span>
            任务样本
            <strong>
              {data.tasks.length}
              <small>条记录</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <Clock3 size={21} />
          </span>
          <span>
            处理中
            <strong>
              {
                data.tasks.filter((t) =>
                  ["queued", "running"].includes(t.status),
                ).length
              }
              <small>条演示任务</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon warning-icon">
            <AlertCircle size={21} />
          </span>
          <span>
            异常任务
            <strong>
              {data.tasks.filter((t) => t.status === "failed").length}
              <small>条模拟异常</small>
            </strong>
          </span>
        </div>
      </div>
      <section className="panel table-panel">
        <DataTable
          key={search.task ?? "all"}
          initialSearch={search.task ?? ""}
          data={data.tasks}
          searchLabel="搜索任务 ID、用户、输入摘要"
          filters={[
            {
              key: "status",
              label: "状态",
              values: Object.entries(statuses)
                .filter(([key]) =>
                  [
                    "queued",
                    "running",
                    "succeeded",
                    "failed",
                    "cancelled",
                  ].includes(key),
                )
                .map(([value, label]) => ({ value, label })),
            },
            {
              key: "modelId",
              label: "模型",
              values: data.models.map((m) => ({ value: m.id, label: m.name })),
            },
            {
              key: "sceneId",
              label: "场景",
              values: data.scenes
                .slice(0, 3)
                .map((s) => ({ value: s.id, label: s.name })),
            },
          ]}
          columns={[
            {
              key: "id",
              label: "任务 ID",
              render: (t) => (
                <button className="task-id" onClick={() => setDetail(t.id)}>
                  {t.id}
                  {t.retryOf && <small>重试记录</small>}
                </button>
              ),
            },
            { key: "user", label: "用户" },
            {
              key: "modelId",
              label: "模型 / 场景",
              render: (t) => (
                <span className="stack-text">
                  <strong>{modelName(t.modelId)}</strong>
                  <small>{sceneName(t.sceneId)}</small>
                </span>
              ),
            },
            {
              key: "status",
              label: "状态",
              render: (t) => <Badge value={t.status} />,
            },
            {
              key: "startedAt",
              label: "开始时间",
              render: (t) => (
                <span className="numeric muted">{time(t.startedAt)}</span>
              ),
            },
            {
              key: "duration",
              label: "耗时",
              render: (t) => (
                <span className="numeric">
                  {t.duration ? `${t.duration} 秒` : "—"}
                </span>
              ),
            },
            {
              key: "estimate",
              label: "费用估算",
              render: (t) => (
                <span className="numeric">{currency(t.estimate)}</span>
              ),
            },
          ]}
          actions={(t) => (
            <RowMenu
              label={t.id}
              items={[
                { label: "任务详情", onClick: () => setDetail(t.id) },
                ...(["failed", "cancelled"].includes(t.status)
                  ? [
                      {
                        label: "模拟重试",
                        onClick: () => startAction(t, "retry"),
                      },
                    ]
                  : []),
                ...(["queued", "running"].includes(t.status)
                  ? [
                      {
                        label: "模拟取消",
                        onClick: () => startAction(t, "cancel"),
                        destructive: true,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />
      </section>
      <div className="footnote">
        本页为独立任务样本，未读取 Web
        创作记录；费用为估算，未产生积分或资金流水。
      </div>
      {task && (
        <Modal drawer title="任务详情" onClose={() => setDetail(null)}>
          <div className="drawer-body">
            <div className="detail-title">
              <h2>{task.id}</h2>
              <Badge value={task.status} />
            </div>
            <DetailRows
              items={[
                ["所属创作", <code>{task.creationId}</code>],
                ["用户", task.user],
                ["场景", sceneName(task.sceneId)],
                ["模型", modelName(task.modelId)],
                [
                  "Provider",
                  data.providers.find(
                    (p) =>
                      p.id ===
                      data.models.find((m) => m.id === task.modelId)
                        ?.providerId,
                  )?.name ?? "不可用",
                ],
                ["开始时间", time(task.startedAt)],
                ["耗时", `${task.duration} 秒`],
                ["费用估算（模拟）", currency(task.estimate)],
                ...(task.retryOf
                  ? [["重试来源", task.retryOf] as [string, string]]
                  : []),
              ]}
            />
            <h3>输入摘要</h3>
            <div className="input-summary">{task.input}</div>
            <h3>执行时间线</h3>
            <ol className="timeline">
              <li>
                <CheckCircle2 />
                <div>
                  <strong>已创建演示任务</strong>
                  <small>{time(task.startedAt)}</small>
                </div>
              </li>
              <li>
                <Clock3 />
                <div>
                  <strong>
                    {task.status === "queued"
                      ? "等待演示队列处理"
                      : "已进入模拟执行"}
                  </strong>
                  <small>未调用真实队列或 Provider</small>
                </div>
              </li>
              {task.status !== "queued" && (
                <li
                  className={task.status === "failed" ? "timeline-error" : ""}
                >
                  {task.status === "failed" ? (
                    <AlertCircle />
                  ) : task.status === "cancelled" ? (
                    <XCircle />
                  ) : (
                    <Activity />
                  )}
                  <div>
                    <strong>{statuses[task.status]}</strong>
                    <small>
                      {task.status === "running"
                        ? "状态为固定样本，不自动推进"
                        : `示例耗时 ${task.duration} 秒`}
                    </small>
                  </div>
                </li>
              )}
            </ol>
            {task.error && (
              <div className="error-box" role="note">
                <h3>错误信息</h3>
                <p>{task.error}</p>
              </div>
            )}
            <h3>结果引用</h3>
            <div className="input-summary">
              {task.result ?? "当前无结果版本引用。不会伪造生成文件。"}
            </div>
            <p className="muted small-text">
              结果版本只属于该次执行；重试不会覆盖原任务或旧版本。
            </p>
          </div>
          <div className="dialog-actions">
            {["failed", "cancelled"].includes(task.status) && (
              <Button onClick={() => startAction(task, "retry")}>
                <RefreshCw size={16} />
                模拟重试
              </Button>
            )}
            {["queued", "running"].includes(task.status) && (
              <Button
                variant="outline"
                onClick={() => startAction(task, "cancel")}
              >
                <XCircle size={16} />
                模拟取消
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetail(null)}>
              关闭详情
            </Button>
          </div>
        </Modal>
      )}
      {action && (
        <Confirm
          title={action.action === "retry" ? "模拟重试任务" : "模拟取消任务"}
          description={
            action.action === "retry"
              ? `为 ${action.id} 创建新的排队演示记录。原任务和结果保持不变；新任务不会真实执行或自动推进。`
              : `将 ${action.id} 标记为已取消（前端演示）。不会向任何执行系统发送取消请求。`
          }
          busy={save.isPending}
          error={save.error?.message}
          onClose={() => setAction(null)}
          onConfirm={() =>
            save.mutate(
              { kind: "task", ...action },
              {
                onSuccess: () => {
                  setAction(null);
                  notify(
                    action.action === "retry"
                      ? "已创建新的排队演示任务，原任务已保留"
                      : "演示任务已标记为取消",
                  );
                },
              },
            )
          }
        />
      )}
    </>
  );
}
