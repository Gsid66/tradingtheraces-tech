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
  
  // ADD THIS DEBUG LOGGING
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 [ScratchingsProvider] Data status:', {
      loading: data.loading,
      error: data.error,
      scratchingsCount: data.scratchings.length,
      sampleScratching: data.scratchings[0] || 'No scratchings available'
    });
  }

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
