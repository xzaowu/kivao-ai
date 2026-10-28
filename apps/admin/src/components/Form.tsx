import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@kivao/ui";
import { z } from "zod";
import { useFeedback } from "./feedback-context";
import { Modal } from "./common";
import { useSave, type Change } from "../mock/adapter";
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function CheckGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="check-group">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, o.value]
                  : value.filter((v) => v !== o.value),
              )
            }
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
export function Editor<T>({
  title,
  initial,
  schema,
  change,
  children,
  onClose,
  warning,
}: {
  title: string;
  initial: T;
  schema: z.ZodType<T>;
  change: (value: T) => Change;
  children: (
    value: T,
    update: <K extends keyof T>(key: K, value: T[K]) => void,
  ) => ReactNode;
  onClose: () => void;
  warning?: string;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const save = useSave();
  const notify = useFeedback();
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);
  const update = <K extends keyof T>(key: K, v: T[K]) => {
    setValue((x) => ({ ...x, [key]: v }));
    setError("");
  };
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!save.isPending) onClose();
      }}
      dirty={dirty}
    >
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const result = schema.safeParse(value);
          if (!result.success) {
            setError(result.error.issues[0]?.message ?? "请检查表单内容");
            return;
          }
          save.mutate(change(result.data), {
            onSuccess: () => {
              notify("已保存演示配置，仅在当前会话有效");
              onClose();
            },
            onError: (e) => setError(e.message),
          });
        }}
      >
        <div className="form-scroll">
          {children(value, update)}
          {warning && <div className="notice">{warning}</div>}
        </div>
        {error && (
          <p ref={errorRef} tabIndex={-1} className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={() => {
              if (!dirty || window.confirm("放弃未保存的修改？")) onClose();
            }}
          >
            取消
          </Button>
          <Button disabled={save.isPending} type="submit">
            {save.isPending ? "正在保存…" : "保存演示配置"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
