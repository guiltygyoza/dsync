import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface EthereumContextType {
  isConnected: boolean;
  address: string | null;
  ensName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signer: JsonRpcSigner | null;
}

const EthereumContext = createContext<EthereumContextType>({
  isConnected: false,
  address: null,
  ensName: null,
  connect: async () => {},
  disconnect: () => {},
  signer: null,
});

interface EthereumProviderProps {
  children: ReactNode;
}

export const EthereumProvider: React.FC<EthereumProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum !== undefined;
  };

  // Initialize connection on component mount if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;
      
      try {
        // Get accounts
        const accounts = await window.ethereum?.request({ method: 'eth_accounts' }) as string[];
        
        if (accounts && accounts.length > 0) {
          const provider = new BrowserProvider(window.ethereum!);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // Try to get ENS name if available
          let ensName = null;
          try {
            ensName = await provider.lookupAddress(address);
          } catch (error) {
            console.log('ENS lookup failed:', error);
          }
          
          setIsConnected(true);
          setAddress(address);
          setEnsName(ensName);
          setSigner(signer);
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();

    // Listen for account changes
    if (isMetaMaskInstalled()) {
      window.ethereum!.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAddress(null);
          setEnsName(null);
          setSigner(null);
        } else {
          // Account changed, update state
          checkConnection();
        }
      });
    }
  }, []);

  // Connect to MetaMask
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
      return;
    }

    try {
      // Request accounts
      const accounts = await window.ethereum?.request({ method: 'eth_requestAccounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        console.error('No accounts returned after connection request');
        return;
      }
      
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Try to get ENS name if available
      let ensName = null;
      try {
        ensName = await provider.lookupAddress(address);
      } catch (error) {
        console.log('ENS lookup failed:', error);
      }
      
      setIsConnected(true);
      setAddress(address);
      setEnsName(ensName);
      setSigner(signer);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  // Disconnect from MetaMask
  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setEnsName(null);
    setSigner(null);
  };

  return (
    <EthereumContext.Provider
      value={{
        isConnected,
        address,
        ensName,
        connect,
        disconnect,
        signer,
      }}
    >
      {children}
    </EthereumContext.Provider>
  );
};

// Hook to use the Ethereum context
// eslint-disable-next-line react-refresh/only-export-components
export const useEthereum = () => useContext(EthereumContext);

// Define Ethereum provider event types
type EthereumEventMap = {
  accountsChanged: string[];
  chainChanged: string;
  connect: { chainId: string };
  disconnect: { code: number; message: string };
};

// Add TypeScript interface for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on<K extends keyof EthereumEventMap>(
        event: K,
        callback: (result: EthereumEventMap[K]) => void
      ): void;
      removeListener<K extends keyof EthereumEventMap>(
        event: K,
        callback: (result: EthereumEventMap[K]) => void
      ): void;
    };
  }
}
