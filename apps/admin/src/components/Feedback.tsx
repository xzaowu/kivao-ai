import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";
import { FeedbackContext } from "./feedback-context";
export function Feedback({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (message) {
      const id = setTimeout(() => setMessage(""), 6500);
      return () => clearTimeout(id);
    }
  }, [message]);
  return (
    <FeedbackContext value={setMessage}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast">
            <CheckCircle2 size={19} />
            <span>{message}</span>
            <button
              className="icon-btn"
              aria-label="关闭通知"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </FeedbackContext>
  );
}
