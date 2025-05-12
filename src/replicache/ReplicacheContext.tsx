import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Replicache } from 'replicache';
import { getReplicacheClient, type AppMutators } from './client';

interface ReplicacheContextType {
    rep: Replicache<AppMutators> | null;
    userId: string | null;
}

const ReplicacheContext = createContext<ReplicacheContextType>({ rep: null, userId: null });

interface ReplicacheProviderProps {
    children: ReactNode;
    userId: string;
}

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
export const useReplicache = (): ReplicacheContextType => {
    const context = useContext(ReplicacheContext);
    if (context === undefined) {
        throw new Error('useReplicache must be used within a ReplicacheProvider');
    }
    return context;
}; 