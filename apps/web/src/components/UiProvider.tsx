import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';
import { UiContext } from './ui-context';
import { demo } from '../demo/store';

function Dialog({
  title,
  children,
  className,
  close,
}: {
  title: string;
  children: ReactNode;
  className: string;
  close: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const baseline = useRef('');
  function formSnapshot() {
    return JSON.stringify(
      Array.from(
        ref.current?.querySelectorAll<HTMLInputElement>(
          'input:not([type=search]),textarea,select',
        ) || [],
      ).map((el) => [el.type === 'checkbox' ? el.checked : el.value]),
    );
  }
  function requestClose() {
    if (ref.current?.querySelector('.canvas-workspace')) {
      close();
      return;
    }
    if (baseline.current !== formSnapshot()) {
      setLeaving(true);
      return;
    }
    close();
  }
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const previous = document.activeElement,
      dialog = ref.current;
    dialog?.showModal();
    baseline.current = formSnapshot();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          requestClose();
      }}
    >
      <header className="dialog-header">
        <div>
          <span className="eyebrow">风筝 KIVAO · 流程演示</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button
          className="icon-button"
          onClick={requestClose}
          aria-label="关闭弹窗"
        >
          <Icon name="close" />
        </button>
      </header>
      {children}
      {leaving && (
        <section className="ix-leave-confirm" role="alert">
          <p>还有未保存的输入，离开会丢失本次编辑。</p>
          <button className="secondary" onClick={() => setLeaving(false)}>
            继续编辑
          </button>
          <button className="primary" onClick={close}>
            放弃编辑并关闭
          </button>
        </section>
      )}
    </dialog>
  );
}
export function UiProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<
    { id: string; title: string; body: ReactNode; className: string }[]
  >([]);
  const [toast, setToast] = useState<{
    text: string;
    id: number;
    action?: { label: string; run: () => void };
  }>({ text: '', id: 0 });
  const close = useCallback(() => setModals((items) => items.slice(0, -1)), []);
  const dismiss = useCallback(() => setModals([]), []);
  const open = useCallback(
    (title: string, body: ReactNode, className = '') =>
      setModals((items) => [
        ...items.slice(0, -1),
        { id: crypto.randomUUID(), title, body, className },
      ]),
    [],
  );
  const openLayer = useCallback(
    (title: string, body: ReactNode, className = '') =>
      setModals((items) => [
        ...items,
        { id: crypto.randomUUID(), title, body, className },
      ]),
    [],
  );
  const notify = useCallback(
    (text: string, action?: { label: string; run: () => void }) =>
      setToast((previous) => ({
        text,
        id: previous.id + 1,
        ...(action ? { action } : {}),
      })),
    [],
  );
  useEffect(() => {
    if (!toast.text) return;
    const timer = setTimeout(
      () => setToast((value) => ({ ...value, text: '' })),
      3500,
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.text]);
  useEffect(() => {
    const timer = setInterval(() => demo.tick(Date.now()), 180);
    return () => clearInterval(timer);
  }, []);
  return (
    <UiContext.Provider value={{ open, openLayer, dismiss, close, notify }}>
      {children}
      {modals.map((modal) => (
        <Dialog
          key={modal.id}
          title={modal.title}
          className={modal.className}
          close={close}
        >
          {modal.body}
        </Dialog>
      ))}
      <div
        id="toast"
        role="status"
        aria-live="polite"
        className={toast.text ? 'show' : ''}
      >
        <span>{toast.text}</span>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.run();
              setToast((previous) => ({ text: '', id: previous.id + 1 }));
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </UiContext.Provider>
  );
}
