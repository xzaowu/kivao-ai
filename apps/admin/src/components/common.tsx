import { type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Inbox,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@kivao/ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAdminData } from "../mock/adapter";
import { statuses, type Snapshot } from "../mock/data";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`badge badge-${value}`}>
      <span aria-hidden="true" className="status-dot" />
      {label ?? statuses[value] ?? value}
    </span>
  );
}
export function StatePanel({
  kind = "empty",
  title,
  children,
  action,
}: {
  kind?: "empty" | "error" | "loading";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const Icon =
    kind === "loading" ? Loader2 : kind === "error" ? AlertCircle : Inbox;
  return (
    <div
      className={`state-panel ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon size={30} className={kind === "loading" ? "spin" : ""} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function DataBoundary({
  children,
}: {
  children: (data: Snapshot) => ReactNode;
}) {
  const query = useAdminData();
  if (query.isPending || query.isFetching)
    return (
      <StatePanel kind="loading" title="正在加载演示数据">
        数据来自 Admin Mock 适配层，请稍候。
      </StatePanel>
    );
  if (query.isError)
    return (
      <StatePanel
        kind="error"
        title="演示数据加载失败"
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            重新加载
          </Button>
        }
      >
        {query.error.message}可在顶部“演示控制”切回正常数据。
      </StatePanel>
    );
  return children(query.data);
}
export function Modal({
  title,
  description = "仅影响本次浏览器会话中的演示数据，不调用后台服务。",
  children,
  onClose,
  drawer = false,
  dirty = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
  dirty?: boolean;
}) {
  const close = () => {
    if (!dirty || window.confirm("存在未保存的修改，确定放弃并关闭？"))
      onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className={drawer ? "admin-drawer" : "admin-dialog"}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <div className="dialog-heading">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Confirm({
  title,
  description,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  busy: boolean;
  error?: string | undefined;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      description={description}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="notice">
        此操作为前端演示，不执行真实任务、不产生扣费。
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <Button variant="outline" disabled={busy} onClick={onClose}>
          返回
        </Button>
        <Button disabled={busy} onClick={onConfirm}>
          {busy ? "正在处理…" : "确认模拟操作"}
        </Button>
      </div>
    </Modal>
  );
}
export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: { label: string; onClick: () => void; destructive?: boolean }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="icon-btn" aria-label={`${label}的操作`}>
          <MoreHorizontal size={19} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((x) => (
          <DropdownMenuItem
            key={x.label}
            variant={x.destructive ? "destructive" : "default"}
            onSelect={x.onClick}
          >
            {x.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function DetailRows({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="detail-rows">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="text-btn" onClick={onClick}>
      <ArrowLeft size={16} />
      返回
    </button>
  );
}
