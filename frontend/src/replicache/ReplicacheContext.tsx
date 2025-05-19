import React, { createContext, useContext, useMemo, useEffect, useState, type ReactNode } from 'react';
import { Replicache } from 'replicache';
import { getReplicacheClient, type AppMutators } from './client';
import { useEthereum } from '../ethereum/EthereumContext';

export interface ReplicacheContextType {
    rep: Replicache<AppMutators> | null;
    userId: string | null;
}

export interface ReplicacheProviderProps {
    children: ReactNode;
    userId: string;
}

const ReplicacheContext = createContext<ReplicacheContextType>({ rep: null, userId: null });

export const ReplicacheProvider: React.FC<ReplicacheProviderProps> = ({ children, userId: initialUserId }) => {
    const { isConnected, address } = useEthereum();
    const [effectiveUserId, setEffectiveUserId] = useState<string>(initialUserId);
    
    // Update the effective user ID when Ethereum connection changes
    useEffect(() => {
        if (isConnected && address) {
            // Use Ethereum address as the user ID when connected
            setEffectiveUserId(address);
        } else {
            // Fall back to the initial user ID when not connected
            setEffectiveUserId(initialUserId);
        }
    }, [isConnected, address, initialUserId]);

    const rep = useMemo(() => {
        if (!effectiveUserId) return null;
        if (!import.meta.env.VITE_REPLICACHE_LICENSE_KEY) {
            console.warn(
                'VITE_REPLICACHE_LICENSE_KEY is not set in .env. Replicache will not sync.'
            );
        }

        return getReplicacheClient(effectiveUserId);
    }, [effectiveUserId]);

    return (
        <ReplicacheContext.Provider value={{ rep, userId: effectiveUserId }}>
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