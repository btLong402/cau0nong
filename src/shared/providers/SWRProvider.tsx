'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        dedupingInterval: 5000,
        focusThrottleInterval: 10000,
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
          if ((error as { status?: number })?.status === 401) {
            return;
          }

          if (retryCount >= 2) {
            return;
          }

          const timeout = Math.min(1000 * 2 ** retryCount, 5000);
          setTimeout(() => {
            void revalidate({ retryCount });
          }, timeout);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
