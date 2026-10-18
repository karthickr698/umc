import { useContext } from 'react';
import { ToastContext, type ToastApi } from '@/components/feedback/toast-context';

/** Shows a short-lived message in the top-right corner. */
export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>');
  return toast;
}
