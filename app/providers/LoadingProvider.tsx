'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Small delay before hiding ensures smooth UX by preventing flash on fast navigations
  const LOADING_DISMISS_DELAY_MS = 300;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DISMISS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
