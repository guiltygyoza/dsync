import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Replicache } from 'replicache';
import { getReplicacheClient, type AppMutators } from './client';

export interface ReplicacheContextType {
    rep: Replicache<AppMutators> | null;
    userId: string | null;
}

export interface ReplicacheProviderProps {
    children: ReactNode;
    userId: string;
}

const ReplicacheContext = createContext<ReplicacheContextType>({ rep: null, userId: null });

export const ReplicacheProvider: React.FC<ReplicacheProviderProps> = ({ children, userId }) => {
    const rep = useMemo(() => {
        if (!userId) return null;
        if (!import.meta.env.VITE_REPLICACHE_LICENSE_KEY) {
            console.warn(
                'VITE_REPLICACHE_LICENSE_KEY is not set in .env. Replicache will not sync.'
            );
        }
        return getReplicacheClient(userId);
    }, [userId]);

    return (
        <ReplicacheContext.Provider value={{ rep, userId }}>
            {children}
        </ReplicacheContext.Provider>
    );
};


// Create a hook to use the context, returning the typed value
// eslint-disable-next-line react-refresh/only-export-components
export const useReplicache = (): ReplicacheContextType => {
  const context = useContext(ReplicacheContext);
  if (context === undefined) {
      throw new Error('useReplicache must be used within a ReplicacheProvider');
  }
  return context;
}; 