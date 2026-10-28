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
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const previous = document.activeElement,
      dialog = ref.current;
    dialog?.showModal();
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
        close();
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
          close();
      }}
    >
      <header className="dialog-header">
        <div>
          <span className="eyebrow">风筝 KIVAO · 流程演示</span>
          <h2 id={titleId}>{title}</h2>
        </div>
        <button className="icon-button" onClick={close} aria-label="关闭弹窗">
          <Icon name="close" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function UiProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{
    title: string;
    body: ReactNode;
    className: string;
  } | null>(null);
  const [toast, setToast] = useState({ text: '', id: 0 });
  const close = useCallback(() => setModal(null), []);
  const open = useCallback(
    (title: string, body: ReactNode, className = '') =>
      setModal({ title, body, className }),
    [],
  );
  const notify = useCallback(
    (text: string) => setToast((previous) => ({ text, id: previous.id + 1 })),
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
    <UiContext.Provider value={{ open, close, notify }}>
      {children}
      {modal && (
        <Dialog
          key={modal.title}
          title={modal.title}
          className={modal.className}
          close={close}
        >
          {modal.body}
        </Dialog>
      )}
      <div
        id="toast"
        role="status"
        aria-live="polite"
        className={toast.text ? 'show' : ''}
      >
        {toast.text}
      </div>
    </UiContext.Provider>
  );
}
