import { createContext, useContext, type ReactNode } from 'react';
export interface UiActions {
  open: (title: string, body: ReactNode, className?: string) => void;
  close: () => void;
  notify: (text: string) => void;
}
export const UiContext = createContext<UiActions | null>(null);
export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error('UiProvider is required');
  return context;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败，请重试。';
}
