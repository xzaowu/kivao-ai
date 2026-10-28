import { useState } from "react";
import {
  Clapperboard,
  Image,
  Layers,
  Plus,
  Shirt,
  ShoppingBag,
  Sparkles,
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
  roleLabels,
  roles,
  SceneConfigSchema,
  time,
  type SceneConfig,
  type Snapshot,
} from "../mock/data";
function Cover({
  scene,
  large = false,
}: {
  scene: SceneConfig;
  large?: boolean;
}) {
  const Icon =
    scene.cover === "fashion"
      ? Shirt
      : scene.cover === "video"
        ? Clapperboard
        : scene.cover === "brand"
          ? Sparkles
          : ShoppingBag;
  return (
    <span
      className={`scene-cover cover-${scene.cover} ${large ? "large-cover" : ""}`}
    >
      <Icon size={large ? 64 : 23} aria-hidden="true" />
      {large && <span>{scene.name}</span>}
    </span>
  );
}
export function ScenesPage() {
  return <DataBoundary>{(data) => <Content data={data} />}</DataBoundary>;
}
function Content({ data }: { data: Snapshot }) {
  const [edit, setEdit] = useState<SceneConfig | null>(null);
  const [preview, setPreview] = useState<SceneConfig | null>(null);
  const [toggle, setToggle] = useState<SceneConfig | null>(null);
  const save = useSave();
  const notify = useFeedback();
  const add = () =>
    setEdit({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      category: "电商商品",
      tags: "",
      cover: "product",
      requiredRoles: ["product"],
      outputKind: "image",
      outputCount: 4,
      ratio: "1:1",
      quality: "高清",
      modelId:
        data.models.find(
          (m) => m.enabled && m.capabilities.includes("图片生成"),
        )?.id ??
        data.models[0]?.id ??
        "",
      status: "draft",
      updatedAt: new Date().toISOString(),
      apiSceneId: null,
    });
  return (
    <>
      <PageHeading
        title="场景管理"
        description="管理创作场景的输入规则、输出规格和上架状态。场景是可复用的定义，不是一次任务。"
        action={
          <Button onClick={add}>
            <Plus size={17} />
            添加场景
          </Button>
        }
      />
      <div className="summary-strip">
        <div>
          <span className="summary-icon">
            <Layers size={21} />
          </span>
          <span>
            场景总数
            <strong>
              {data.scenes.length}
              <small>个配置</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <Image size={21} />
          </span>
          <span>
            已上架
            <strong>
              {data.scenes.filter((s) => s.status === "published").length}
              <small>个演示场景</small>
            </strong>
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <Sparkles size={21} />
          </span>
          <span>
            共享 API 场景
            <strong>
              {data.scenes.filter((s) => s.apiSceneId).length}
              <small>个契约映射</small>
            </strong>
          </span>
        </div>
      </div>
      <section className="panel table-panel">
        <DataTable
          data={data.scenes}
          searchLabel="搜索场景名称、标签"
          filters={[
            {
              key: "category",
              label: "分类",
              values: ["电商商品", "时尚服饰", "视频创作", "品牌营销"].map(
                (v) => ({ value: v, label: v }),
              ),
            },
            {
              key: "status",
              label: "状态",
              values: [
                { value: "published", label: "已上架" },
                { value: "draft", label: "草稿" },
                { value: "archived", label: "已下架" },
              ],
            },
            {
              key: "outputKind",
              label: "输出类型",
              values: [
                { value: "image", label: "图片" },
                { value: "video", label: "视频" },
              ],
            },
          ]}
          columns={[
            {
              key: "name",
              label: "场景",
              render: (s) => (
                <button className="identity" onClick={() => setPreview(s)}>
                  <Cover scene={s} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.apiSceneId ? "共享 API 场景映射" : "Admin 预览配置"}
                    </small>
                  </span>
                </button>
              ),
            },
            {
              key: "category",
              label: "分类",
              render: (s) => <span className="chip">{s.category}</span>,
            },
            {
              key: "outputKind",
              label: "输出类型",
              render: (s) =>
                `${s.outputKind === "image" ? "图片" : "视频"} · ${s.outputCount} 个`,
            },
            {
              key: "modelId",
              label: "关联模型",
              render: (s) =>
                data.models.find((m) => m.id === s.modelId)?.name ?? "未配置",
            },
            {
              key: "status",
              label: "状态",
              render: (s) => <Badge value={s.status} />,
            },
            {
              key: "updatedAt",
              label: "更新时间",
              render: (s) => (
                <span className="numeric muted">{time(s.updatedAt)}</span>
              ),
            },
          ]}
          actions={(s) => (
            <RowMenu
              label={s.name}
              items={[
                { label: "预览场景", onClick: () => setPreview(s) },
                { label: "编辑场景", onClick: () => setEdit(s) },
                {
                  label: s.status === "published" ? "模拟下架" : "模拟上架",
                  onClick: () => {
                    save.reset();
                    setToggle({
                      ...s,
                      status:
                        s.status === "published" ? "archived" : "published",
                      updatedAt: new Date().toISOString(),
                    });
                  },
                },
              ]}
            />
          )}
        />
      </section>
      <div className="footnote">
        所有场景改动均为 Admin 演示配置；不会修改 Web 场景库或现有 API 定义。
      </div>
      {edit && (
        <Editor
          title={
            data.scenes.some((s) => s.id === edit.id) ? "编辑场景" : "添加场景"
          }
          initial={edit}
          schema={SceneConfigSchema}
          change={(value) => ({
            kind: "scene",
            value: { ...value, updatedAt: new Date().toISOString() },
          })}
          onClose={() => setEdit(null)}
          warning="此编辑器不调用动态场景 CRUD API。即使配置已上架，也只在 Admin 预览生效。"
        >
          {(v, u) => (
            <>
              <h3>基本信息</h3>
              <Field label="场景名称">
                <input
                  autoFocus
                  required
                  maxLength={60}
                  value={v.name}
                  onChange={(e) => u("name", e.target.value)}
                />
              </Field>
              <Field label="场景描述">
                <textarea
                  required
                  maxLength={400}
                  rows={3}
                  value={v.description}
                  onChange={(e) => u("description", e.target.value)}
                />
              </Field>
              <div className="form-grid">
                <Field label="分类">
                  <select
                    value={v.category}
                    onChange={(e) =>
                      u("category", e.target.value as SceneConfig["category"])
                    }
                  >
                    {["电商商品", "时尚服饰", "视频创作", "品牌营销"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="标签" hint="多个标签以逗号分隔">
                  <input
                    value={v.tags}
                    maxLength={100}
                    onChange={(e) => u("tags", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="封面样式"
                hint="使用内置图标封面，暂不上传远程图片。"
              >
                <select
                  value={v.cover}
                  onChange={(e) =>
                    u("cover", e.target.value as SceneConfig["cover"])
                  }
                >
                  <option value="product">商品 · 蓝</option>
                  <option value="fashion">服饰 · 紫</option>
                  <option value="video">视频 · 青</option>
                  <option value="brand">品牌 · 暖灰</option>
                </select>
              </Field>
              <Cover scene={v} large />
              <h3>素材与参数</h3>
              <CheckGroup
                label="必需输入素材角色"
                options={roles.map((r) => ({
                  value: r,
                  label: roleLabels[r]!,
                }))}
                value={v.requiredRoles}
                onChange={(x) =>
                  u("requiredRoles", x as SceneConfig["requiredRoles"])
                }
              />
              <div className="form-grid">
                <Field label="输出类型">
                  <select
                    value={v.outputKind}
                    onChange={(e) =>
                      u("outputKind", e.target.value as "image" | "video")
                    }
                  >
                    <option value="image">图片</option>
                    <option value="video">视频</option>
                  </select>
                </Field>
                <Field label="输出数量">
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={v.outputCount}
                    onChange={(e) => u("outputCount", e.target.valueAsNumber)}
                  />
                </Field>
                <Field label="画面比例">
                  <select
                    value={v.ratio}
                    onChange={(e) =>
                      u("ratio", e.target.value as SceneConfig["ratio"])
                    }
                  >
                    {["1:1", "3:4", "16:9", "9:16"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="输出质量">
                  <select
                    value={v.quality}
                    onChange={(e) =>
                      u("quality", e.target.value as SceneConfig["quality"])
                    }
                  >
                    <option>标准</option>
                    <option>高清</option>
                  </select>
                </Field>
              </div>
              <h3>执行配置</h3>
              <Field label="关联模型">
                <select
                  required
                  value={v.modelId}
                  onChange={(e) => u("modelId", e.target.value)}
                >
                  <option value="">请选择模型</option>
                  {data.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.capabilities.join("/")}{" "}
                      {m.enabled ? "" : "（停用）"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="上架状态">
                <select
                  value={v.status}
                  onChange={(e) =>
                    u("status", e.target.value as SceneConfig["status"])
                  }
                >
                  <option value="draft">草稿</option>
                  <option value="published">已上架</option>
                  <option value="archived">已下架</option>
                </select>
              </Field>
            </>
          )}
        </Editor>
      )}
      {preview && (
        <Modal drawer title="场景预览" onClose={() => setPreview(null)}>
          <div className="drawer-body">
            <Cover scene={preview} large />
            <div className="detail-title">
              <h2>{preview.name}</h2>
              <Badge value={preview.status} />
            </div>
            <p className="muted">{preview.description}</p>
            <div className="chip-list">
              {preview.tags
                .split(",")
                .filter(Boolean)
                .map((tag, i) => (
                  <span key={i} className="chip">
                    {tag}
                  </span>
                ))}
            </div>
            <DetailRows
              items={[
                ["分类", preview.category],
                [
                  "必需素材角色",
                  preview.requiredRoles.map((r) => roleLabels[r]).join("、"),
                ],
                [
                  "输出规格",
                  `${preview.outputCount} 个${preview.outputKind === "image" ? "图片" : "视频"} · ${preview.ratio} · ${preview.quality}`,
                ],
                [
                  "关联模型",
                  data.models.find((m) => m.id === preview.modelId)?.name ??
                    "未配置",
                ],
                [
                  "API 场景映射",
                  preview.apiSceneId ?? "仅 Admin 预览 · 无后端支持",
                ],
                ["更新时间", time(preview.updatedAt)],
              ]}
            />
            <div className="notice">
              场景定义 ≠ 持续创作 ≠ 执行任务。预览不会创建计划或任务。
            </div>
          </div>
          <div className="dialog-actions">
            <Button
              onClick={() => {
                setEdit(preview);
                setPreview(null);
              }}
            >
              编辑场景
            </Button>
          </div>
        </Modal>
      )}
      {toggle && (
        <Confirm
          title={
            toggle.status === "published" ? "模拟上架场景" : "模拟下架场景"
          }
          description={`即将变更“${toggle.name}”的演示展示状态，不影响前台场景库。`}
          busy={save.isPending}
          error={save.error?.message}
          onClose={() => setToggle(null)}
          onConfirm={() =>
            save.mutate(
              { kind: "scene", value: toggle },
              {
                onSuccess: () => {
                  setToggle(null);
                  notify("场景演示状态已更新");
                },
              },
            )
          }
        />
      )}
    </>
  );
}
