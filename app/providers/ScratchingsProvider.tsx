'use client'

import { createContext, useContext, ReactNode } from 'react';
import { useScratchings, Scratching } from '@/lib/hooks/useScratchings';

interface ScratchingsContextType {
  scratchings: Scratching[];
  loading: boolean;
  error: string | null;
}

const ScratchingsContext = createContext<ScratchingsContextType | undefined>(undefined);

export function ScratchingsProvider({ children }: { children: ReactNode }) {
  const data = useScratchings(0); // Australia only

  return (
    <ScratchingsContext.Provider value={data}>
      {children}
    </ScratchingsContext.Provider>
  );
}

export function useScratchingsContext() {
  const context = useContext(ScratchingsContext);
  if (!context) {
    throw new Error('useScratchingsContext must be used within ScratchingsProvider');
  }
  return context;
}
