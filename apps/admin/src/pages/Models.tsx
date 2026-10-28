import { tabKeyboard } from "../components/tab-keyboard";
import { useState } from "react";
import {
  Box,
  Boxes,
  ChevronRight,
  Plus,
  Server,
  ShieldCheck,
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
import { Editor, Field, CheckGroup } from "../components/Form";
import { useFeedback } from "../components/feedback-context";
import { useSave } from "../mock/adapter";
import {
  capabilities,
  currency,
  ModelSchema,
  ProviderSchema,
  type Provider,
  type Model,
  type Snapshot,
} from "../mock/data";
export function ModelsPage() {
  return <DataBoundary>{(data) => <Content data={data} />}</DataBoundary>;
}
function Content({ data }: { data: Snapshot }) {
  const [tab, setTab] = useState<"models" | "providers">("models");
  const [edit, setEdit] = useState<Model | Provider | null>(null);
  const [detail, setDetail] = useState<{
    kind: "model" | "provider";
    id: string;
  } | null>(null);
  const [toggle, setToggle] = useState<
    | { kind: "model"; value: Model }
    | { kind: "provider"; value: Provider }
    | null
  >(null);
  const save = useSave();
  const notify = useFeedback();
  const providerName = (id: string) =>
    data.providers.find((x) => x.id === id)?.name ?? "供应商不可用";
  const provider =
    detail?.kind === "provider"
      ? data.providers.find((x) => x.id === detail.id)
      : null;
  const model =
    detail?.kind === "model"
      ? data.models.find((x) => x.id === detail.id)
      : null;
  const add = () =>
    setEdit(
      tab === "providers"
        ? {
            id: crypto.randomUUID(),
            name: "",
            type: "OpenAI 兼容",
            baseUrl: "https://new.example.test/v1",
            enabled: false,
            connection: "未连接",
          }
        : {
            id: crypto.randomUUID(),
            name: "",
            modelId: "",
            providerId: data.providers[0]?.id ?? "",
            capabilities: ["图片生成"],
            maxInputs: 4,
            maxOutput: 4,
            maxPrompt: 2000,
            resolution: "1024 × 1024",
            cost: 0,
            credits: 0,
            enabled: false,
          },
    );
  return (
    <>
      <PageHeading
        title="模型与供应商"
        description="分别管理服务连接与模型能力，让每个创作场景找到合适的执行配置。"
        action={
          <Button onClick={add}>
            <Plus size={17} />
            添加{tab === "models" ? "模型" : "供应商"}
          </Button>
        }
      />
      <div className="summary-strip">
        <div>
          <span className="summary-icon">
            <Boxes size={21} />
          </span>
          <span>
            模型配置
            <strong>
              {data.models.length}
              <small>个模型</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <Server size={21} />
          </span>
          <span>
            服务供应商
            <strong>
              {data.providers.length}
              <small>个供应商</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <ShieldCheck size={21} />
          </span>
          <span>
            已启用模型
            <strong>
              {data.models.filter((x) => x.enabled).length}
              <small>个可用配置</small>
            </strong>
          </span>
        </div>
      </div>
      <div
        className="tab-bar"
        role="tablist"
        onKeyDown={tabKeyboard}
        aria-label="模型与供应商"
      >
        {(["models", "providers"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
          >
            {t === "models" ? "模型管理" : "供应商管理"}
            <span>
              {t === "models" ? data.models.length : data.providers.length}
            </span>
          </button>
        ))}
      </div>
      <section
        className="panel table-panel"
        aria-label={tab === "models" ? "模型列表" : "供应商列表"}
      >
        {tab === "models" ? (
          <DataTable
            key="models"
            data={data.models}
            searchLabel="搜索模型名称、模型 ID"
            filters={[
              {
                key: "enabled",
                label: "状态",
                values: [
                  { value: "true", label: "已启用" },
                  { value: "false", label: "已停用" },
                ],
              },
              {
                key: "providerId",
                label: "供应商",
                values: data.providers.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              },
            ]}
            columns={[
              {
                key: "name",
                label: "模型",
                render: (m) => (
                  <button
                    className="identity"
                    onClick={() => setDetail({ kind: "model", id: m.id })}
                  >
                    <span className="entity-icon">
                      <Box size={19} />
                    </span>
                    <span>
                      <strong>{m.name}</strong>
                      <small>{m.modelId}</small>
                    </span>
                  </button>
                ),
              },
              {
                key: "providerId",
                label: "供应商",
                render: (m) => <span>{providerName(m.providerId)}</span>,
              },
              {
                key: "capabilities",
                label: "支持能力",
                sortable: false,
                render: (m) => (
                  <div className="chip-list">
                    {m.capabilities.map((c) => (
                      <span className="chip" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                key: "cost",
                label: "单次成本",
                render: (m) => (
                  <span className="numeric">{currency(m.cost)}</span>
                ),
              },
              {
                key: "credits",
                label: "积分售价",
                render: (m) => (
                  <span className="numeric">{m.credits} 积分</span>
                ),
              },
              {
                key: "enabled",
                label: "状态",
                render: (m) => (
                  <Badge value={m.enabled ? "enabled" : "disabled"} />
                ),
              },
            ]}
            actions={(m) => (
              <RowMenu
                label={m.name}
                items={[
                  {
                    label: "查看详情",
                    onClick: () => setDetail({ kind: "model", id: m.id }),
                  },
                  { label: "编辑模型", onClick: () => setEdit(m) },
                  {
                    label: m.enabled ? "模拟停用" : "模拟启用",
                    onClick: () => {
                      save.reset();
                      setToggle({
                        kind: "model",
                        value: { ...m, enabled: !m.enabled },
                      });
                    },
                  },
                ]}
              />
            )}
          />
        ) : (
          <DataTable
            key="providers"
            data={data.providers}
            searchLabel="搜索供应商名称、接口地址"
            filters={[
              {
                key: "type",
                label: "接口类型",
                values: ["OpenAI 兼容", "自定义 HTTP"].map((x) => ({
                  value: x,
                  label: x,
                })),
              },
              {
                key: "enabled",
                label: "状态",
                values: [
                  { value: "true", label: "已启用" },
                  { value: "false", label: "已停用" },
                ],
              },
            ]}
            columns={[
              {
                key: "name",
                label: "供应商",
                render: (p) => (
                  <button
                    className="identity"
                    onClick={() => setDetail({ kind: "provider", id: p.id })}
                  >
                    <span className="entity-icon">
                      <Server size={19} />
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.type}</small>
                    </span>
                  </button>
                ),
              },
              {
                key: "baseUrl",
                label: "Base URL",
                render: (p) => <code className="url-text">{p.baseUrl}</code>,
              },
              {
                key: "connection",
                label: "连接状态",
                render: (p) => (
                  <span
                    className={`connection ${p.connection === "模拟异常" ? "warning" : ""}`}
                  >
                    {p.connection}
                  </span>
                ),
              },
              {
                key: "id",
                label: "关联模型",
                sortable: false,
                render: (p) =>
                  `${data.models.filter((m) => m.providerId === p.id).length} 个模型`,
              },
              {
                key: "enabled",
                label: "状态",
                render: (p) => (
                  <Badge value={p.enabled ? "enabled" : "disabled"} />
                ),
              },
            ]}
            actions={(p) => (
              <RowMenu
                label={p.name}
                items={[
                  {
                    label: "查看详情",
                    onClick: () => setDetail({ kind: "provider", id: p.id }),
                  },
                  { label: "编辑供应商", onClick: () => setEdit(p) },
                  {
                    label: p.enabled ? "模拟停用" : "模拟启用",
                    onClick: () => {
                      save.reset();
                      setToggle({
                        kind: "provider",
                        value: { ...p, enabled: !p.enabled },
                      });
                    },
                  },
                ]}
              />
            )}
          />
        )}
      </section>
      <div className="footnote">
        <ShieldCheck size={16} />
        成本与积分仅为配置样本；连接状态为预设值，不会发起网络检测或保存真实密钥。
      </div>
      {edit &&
        ("baseUrl" in edit ? (
          <Editor
            title={`${data.providers.some((x) => x.id === edit.id) ? "编辑" : "添加"}供应商`}
            initial={edit}
            schema={ProviderSchema}
            change={(value) => ({ kind: "provider", value })}
            onClose={() => setEdit(null)}
            warning="停用供应商会同时停用关联模型，并将已上架的关联场景转为草稿（仅演示）。"
          >
            {(v, u) => (
              <>
                <h3>连接配置</h3>
                <Field label="供应商名称">
                  <input
                    autoFocus
                    required
                    maxLength={60}
                    value={v.name}
                    onChange={(e) => u("name", e.target.value)}
                  />
                </Field>
                <Field label="接口类型">
                  <select
                    value={v.type}
                    onChange={(e) =>
                      u("type", e.target.value as Provider["type"])
                    }
                  >
                    <option>OpenAI 兼容</option>
                    <option>自定义 HTTP</option>
                  </select>
                </Field>
                <Field
                  label="Base URL"
                  hint="使用 HTTPS 演示地址；不发起连接。不要填写 Token、用户名或密码。"
                >
                  <input
                    type="url"
                    required
                    value={v.baseUrl}
                    onChange={(e) => u("baseUrl", e.target.value)}
                  />
                </Field>
                <div className="key-placeholder">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>API 密钥 · 安全占位</strong>
                    <p>
                      <code>•••• •••• DEMO</code>
                    </p>
                    <small>
                      固定掩码，不对应任何密钥；本轮不提供输入、查看或存储真实凭据。
                    </small>
                  </div>
                </div>
                <Field label="连接状态（模拟）">
                  <select
                    value={v.connection}
                    onChange={(e) =>
                      u("connection", e.target.value as Provider["connection"])
                    }
                  >
                    <option>未连接</option>
                    <option>模拟正常</option>
                    <option>模拟异常</option>
                  </select>
                </Field>
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={v.enabled}
                    onChange={(e) => u("enabled", e.target.checked)}
                  />
                  启用此供应商配置
                </label>
              </>
            )}
          </Editor>
        ) : (
          <Editor
            title={`${data.models.some((x) => x.id === edit.id) ? "编辑" : "添加"}模型`}
            initial={edit}
            schema={ModelSchema}
            change={(value) => ({ kind: "model", value })}
            onClose={() => setEdit(null)}
            warning="单次成本和积分售价均为模拟配置，不会产生结算。停用模型会将关联上架场景转为草稿。"
          >
            {(v, u) => (
              <>
                <h3>基本信息</h3>
                <div className="form-grid">
                  <Field label="模型名称">
                    <input
                      autoFocus
                      required
                      maxLength={60}
                      value={v.name}
                      onChange={(e) => u("name", e.target.value)}
                    />
                  </Field>
                  <Field label="模型 ID">
                    <input
                      required
                      maxLength={100}
                      value={v.modelId}
                      onChange={(e) => u("modelId", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="所属供应商">
                  <select
                    required
                    value={v.providerId}
                    onChange={(e) => u("providerId", e.target.value)}
                  >
                    <option value="">请选择供应商</option>
                    {data.providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.enabled ? "" : "（已停用）"}
                      </option>
                    ))}
                  </select>
                </Field>
                <CheckGroup
                  label="支持能力"
                  options={capabilities.map((x) => ({ value: x, label: x }))}
                  value={v.capabilities}
                  onChange={(x) =>
                    u("capabilities", x as Model["capabilities"])
                  }
                />
                <h3>输入输出限制</h3>
                <div className="form-grid">
                  <Field label="最大输入素材数">
                    <input
                      type="number"
                      required
                      min={1}
                      max={16}
                      value={v.maxInputs}
                      onChange={(e) => u("maxInputs", e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="最大输出数量">
                    <input
                      type="number"
                      required
                      min={1}
                      max={16}
                      value={v.maxOutput}
                      onChange={(e) => u("maxOutput", e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="最大提示词字符数">
                    <input
                      type="number"
                      required
                      min={1}
                      max={32000}
                      value={v.maxPrompt}
                      onChange={(e) => u("maxPrompt", e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="分辨率与时长限制">
                    <input
                      required
                      maxLength={60}
                      value={v.resolution}
                      onChange={(e) => u("resolution", e.target.value)}
                    />
                  </Field>
                </div>
                <h3>演示定价</h3>
                <div className="form-grid">
                  <Field label="单次成本（元）">
                    <input
                      type="number"
                      required
                      min={0}
                      max={10000}
                      step="0.01"
                      value={v.cost}
                      onChange={(e) => u("cost", e.target.valueAsNumber)}
                    />
                  </Field>
                  <Field label="积分售价">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100000}
                      value={v.credits}
                      onChange={(e) => u("credits", e.target.valueAsNumber)}
                    />
                  </Field>
                </div>
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={v.enabled}
                    onChange={(e) => u("enabled", e.target.checked)}
                  />
                  启用此模型配置
                </label>
              </>
            )}
          </Editor>
        ))}
      {(provider || model) && (
        <Modal
          drawer
          title={provider ? "供应商详情" : "模型详情"}
          onClose={() => setDetail(null)}
        >
          <div className="drawer-body">
            <div className="detail-hero">
              <span className="entity-icon large">
                {provider ? <Server /> : <Box />}
              </span>
              <h2>{provider?.name ?? model?.name}</h2>
              <Badge
                value={(provider ?? model)?.enabled ? "enabled" : "disabled"}
              />
            </div>
            {provider ? (
              <>
                <DetailRows
                  items={[
                    ["接口类型", provider.type],
                    ["Base URL", <code>{provider.baseUrl}</code>],
                    ["连接状态", provider.connection],
                    ["密钥状态", "固定安全占位 · 未存储"],
                    [
                      "关联模型",
                      `${data.models.filter((m) => m.providerId === provider.id).length} 个`,
                    ],
                  ]}
                />
                <h3>关联模型</h3>
                <div className="linked-list">
                  {data.models
                    .filter((m) => m.providerId === provider.id)
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setDetail({ kind: "model", id: m.id })}
                      >
                        {m.name}
                        <ChevronRight size={16} />
                      </button>
                    ))}
                </div>
              </>
            ) : (
              model && (
                <DetailRows
                  items={[
                    ["模型 ID", <code>{model.modelId}</code>],
                    ["供应商", providerName(model.providerId)],
                    ["支持能力", model.capabilities.join("、")],
                    [
                      "输入限制",
                      `最多 ${model.maxInputs} 份素材 / ${model.maxPrompt} 字提示词`,
                    ],
                    [
                      "输出限制",
                      `最多 ${model.maxOutput} 个结果 / ${model.resolution}`,
                    ],
                    ["单次成本（模拟）", currency(model.cost)],
                    ["积分售价（模拟）", `${model.credits} 积分`],
                  ]}
                />
              )
            )}
            <div className="notice">仅配置预览，不代表已接通服务。</div>
          </div>
          <div className="dialog-actions">
            <Button
              onClick={() => {
                setEdit((provider ?? model)!);
                setDetail(null);
              }}
            >
              编辑{provider ? "供应商" : "模型"}
            </Button>
          </div>
        </Modal>
      )}
      {toggle && (
        <Confirm
          title={`模拟${toggle.value.enabled ? "启用" : "停用"}${toggle.kind === "provider" ? "供应商" : "模型"}`}
          description={
            toggle.value.enabled
              ? `即将启用 ${toggle.value.name} 的演示配置。`
              : `停用 ${toggle.value.name} 后，关联模型（如有）将停用，关联上架场景将转为草稿。`
          }
          busy={save.isPending}
          error={save.error?.message}
          onClose={() => setToggle(null)}
          onConfirm={() =>
            save.mutate(toggle, {
              onSuccess: () => {
                setToggle(null);
                notify("演示状态已更新");
              },
            })
          }
        />
      )}
    </>
  );
}
