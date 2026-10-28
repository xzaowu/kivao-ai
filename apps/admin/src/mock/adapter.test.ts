import { beforeEach, describe, expect, it } from "vitest";
import {
  applyChange,
  failNextSave,
  readSnapshot,
  resetDemo,
  saveChange,
  setDemoState,
} from "./adapter";
import {
  createFixtures,
  ModelSchema,
  ProviderSchema,
  SceneConfigSchema,
} from "./data";
beforeEach(resetDemo);
describe("Admin Mock data boundaries", () => {
  it("validates every fixture and keeps shared API scene mapping explicit", () => {
    const s = createFixtures();
    s.providers.forEach((p) =>
      expect(ProviderSchema.safeParse(p).success).toBe(true),
    );
    s.models.forEach((m) =>
      expect(ModelSchema.safeParse(m).success).toBe(true),
    );
    s.scenes.forEach((scene) => {
      expect(SceneConfigSchema.safeParse(scene).success).toBe(true);
      expect(() =>
        applyChange(s, { kind: "scene", value: scene }),
      ).not.toThrow();
    });
    expect(
      s.scenes.filter((x) => x.apiSceneId).map((x) => x.apiSceneId),
    ).toEqual(["product-images", "virtual-try-on", "reference-video"]);
  });
  it("rejects URLs with credentials, query strings, non-HTTPS, and malformed values without throwing", () => {
    const p = createFixtures().providers[0]!;
    for (const baseUrl of [
      "garbage",
      "http://example.test",
      "https://user:secret@example.test",
      "https://example.test?token=demo",
      "https://example.test#secret",
    ])
      expect(ProviderSchema.safeParse({ ...p, baseUrl }).success).toBe(false);
    expect(
      ProviderSchema.parse({ ...p, apiKey: "not-stored" }),
    ).not.toHaveProperty("apiKey");
  });
  it("rejects duplicate models and missing or disabled providers", () => {
    const s = createFixtures();
    const m = s.models[0]!;
    expect(() =>
      applyChange(s, { kind: "model", value: { ...m, id: "new" } }),
    ).toThrow("已存在");
    expect(() =>
      applyChange(s, { kind: "model", value: { ...m, providerId: "missing" } }),
    ).toThrow("供应商");
    expect(() =>
      applyChange(s, { kind: "model", value: { ...m, providerId: "p-lab" } }),
    ).toThrow("供应商");
  });
  it("disables linked models and drafts published scenes without mutating the source", () => {
    const s = createFixtures();
    const next = applyChange(s, {
      kind: "provider",
      value: { ...s.providers[0]!, enabled: false },
    });
    expect(
      next.models
        .filter((m) => m.providerId === "p-studio")
        .every((m) => !m.enabled),
    ).toBe(true);
    expect(
      next.scenes
        .filter((x) => ["m-image", "m-tryon"].includes(x.modelId))
        .every((x) => x.status !== "published"),
    ).toBe(true);
    expect(s.providers[0]!.enabled).toBe(true);
    expect(s.scenes[0]!.status).toBe("published");
  });
  it("prevents publishing incompatible or disabled model configs", () => {
    const s = createFixtures();
    const scene = s.scenes[0]!;
    expect(() =>
      applyChange(s, {
        kind: "scene",
        value: { ...scene, modelId: "m-video" },
      }),
    ).toThrow("不兼容");
    expect(() =>
      applyChange(s, { kind: "scene", value: { ...scene, modelId: "m-lab" } }),
    ).toThrow("启用");
    expect(() =>
      applyChange(s, {
        kind: "model",
        value: { ...s.models[0]!, maxOutput: 1 },
      }),
    ).toThrow("不兼容");
  });
  it("preserves the failed task when retrying into a separate queued record", () => {
    const s = createFixtures();
    const t = s.tasks.find((t) => t.status === "failed")!;
    const next = applyChange(s, { kind: "task", id: t.id, action: "retry" });
    expect(next.tasks).toHaveLength(s.tasks.length + 1);
    expect(next.tasks.find((x) => x.id === t.id)).toEqual(t);
    expect(next.tasks[0]).toMatchObject({
      status: "queued",
      retryOf: t.id,
      error: null,
      result: null,
    });
    expect(next.tasks[0]!.id).not.toBe(t.id);
  });
  it("permits cancellation only while queued or running", () => {
    const s = createFixtures();
    const t = s.tasks.find((t) => t.status === "running")!;
    expect(
      applyChange(s, { kind: "task", id: t.id, action: "cancel" }).tasks.find(
        (x) => x.id === t.id,
      )?.status,
    ).toBe("cancelled");
    expect(() =>
      applyChange(s, { kind: "task", id: s.tasks[0]!.id, action: "retry" }),
    ).toThrow("仅可");
    expect(() =>
      applyChange(s, { kind: "task", id: s.tasks[0]!.id, action: "cancel" }),
    ).toThrow("仅可");
  });
  it("simulates errors without losing saved data and returns independent snapshots", async () => {
    const before = await readSnapshot();
    const provider = { ...before.providers[0]!, name: "修改后的演示服务" };
    failNextSave();
    await expect(
      saveChange({ kind: "provider", value: provider }),
    ).rejects.toThrow("尚未保存");
    expect((await readSnapshot()).providers[0]!.name).toBe(
      before.providers[0]!.name,
    );
    await saveChange({ kind: "provider", value: provider });
    expect(
      (await readSnapshot()).providers.some((x) => x.name === provider.name),
    ).toBe(true);
    before.providers[0]!.name = "local mutation";
    expect(
      (await readSnapshot()).providers.some((x) => x.name === "local mutation"),
    ).toBe(false);
  });
  it("exposes recoverable empty/error modes without modifying initial samples", async () => {
    setDemoState("empty");
    expect((await readSnapshot()).tasks).toEqual([]);
    setDemoState("error");
    await expect(readSnapshot()).rejects.toThrow("加载失败");
    setDemoState("normal");
    expect((await readSnapshot()).tasks).toHaveLength(36);
  });
});
