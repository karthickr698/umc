import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ToastProvider } from '@/components/feedback/toast-provider';
import { SessionProvider } from '@/features/auth';
import { createQueryClient } from '@/lib/query-client';
import { router } from './router';

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
