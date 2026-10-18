import { createContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  message?: string;
}

export interface ToastApi {
  showToast: (toast: ToastInput) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
