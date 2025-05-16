import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

// Wallet interface for abstracting wallet implementations
interface Wallet {
	id: string;
	name: string;
	icon?: string;
	isInstalled: () => boolean;
	connect: () => Promise<{
		address: string;
		ensName?: string | null;
		signer?: JsonRpcSigner | null;
	}>;
	disconnect: () => Promise<void>;
	getAccounts: () => Promise<string[]>;
	isConnected: () => Promise<boolean>;
}

interface EthereumContextType {
	isConnected: boolean;
	address: string | null;
	ensName: string | null;
	connect: () => Promise<void>;
	selectWallet: (walletId: string) => Promise<void>;
	disconnect: () => void;
	signer: JsonRpcSigner | null;
	activeWalletId: string | null;
	availableWallets: Wallet[];
}

const EthereumContext = createContext<EthereumContextType>({
	isConnected: false,
	address: null,
	ensName: null,
	connect: async () => {},
	selectWallet: async () => {},
	disconnect: () => {},
	signer: null,
	activeWalletId: null,
	availableWallets: [],
});

interface EthereumProviderProps {
	children: ReactNode;
}

// Define wallet implementations
const walletImplementations: Wallet[] = [
	// MetaMask implementation
	{
		id: "metamask",
		name: "MetaMask",
		isInstalled: () => {
			if (typeof window === "undefined") return false;
			return window.ethereum !== undefined && window.ethereum.isMetaMask === true;
		},
		connect: async () => {
			if (typeof window === "undefined" || !window.ethereum) {
				throw new Error("MetaMask is not installed");
			}

			const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];

			if (!accounts || accounts.length === 0) {
				throw new Error("No accounts returned after connection request");
			}

			const provider = new BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();
			const address = await signer.getAddress();

			// Try to get ENS name if available
			let ensName = null;
			try {
				ensName = await provider.lookupAddress(address);
			} catch (error) {
				console.log("ENS lookup failed:", error);
			}

			return { address, ensName, signer };
		},
		disconnect: async () => {
			// MetaMask doesn't have a disconnect method
			// The state is handled by the context
			return Promise.resolve();
		},
		getAccounts: async () => {
			if (typeof window === "undefined" || !window.ethereum) return [];
			try {
				return (await window.ethereum.request({ method: "eth_accounts" })) as string[];
			} catch (error) {
				console.error("Failed to get accounts:", error);
				return [];
			}
		},
		isConnected: async () => {
			if (typeof window === "undefined" || !window.ethereum) return false;
			try {
				const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
				return accounts && accounts.length > 0;
			} catch (error) {
				console.error("Failed to check connection:", error);
				return false;
			}
		},
	},
	// Phantom implementation
	{
		id: "phantom",
		name: "Phantom",
		isInstalled: () => {
			if (typeof window === "undefined") return false;
			return window.phantom !== undefined;
		},
		connect: async () => {
			if (typeof window === "undefined" || !window.phantom || !window.phantom.solana) {
				throw new Error("Phantom is not installed");
			}

			const connection = await window.phantom.solana.connect();
			const address = connection.publicKey.toString();

			// Phantom doesn't support ENS
			return { address, ensName: null, signer: null };
		},
		disconnect: async () => {
			if (typeof window === "undefined" || !window.phantom || !window.phantom.solana) {
				return;
			}

			try {
				await window.phantom.solana.disconnect();
			} catch (error) {
				console.error("Error disconnecting from Phantom:", error);
			}
		},
		getAccounts: async () => {
			if (typeof window === "undefined" || !window.phantom || !window.phantom.solana) return [];
			try {
				if (window.phantom.solana.isConnected && window.phantom.solana.publicKey) {
					return [window.phantom.solana.publicKey.toString()];
				}
				return [];
			} catch (error) {
				console.error("Failed to get Phantom accounts:", error);
				return [];
			}
		},
		isConnected: async () => {
			if (typeof window === "undefined" || !window.phantom || !window.phantom.solana) return false;
			try {
				return !!window.phantom.solana.isConnected && !!window.phantom.solana.publicKey;
			} catch (error) {
				console.error("Failed to check Phantom connection:", error);
				return false;
			}
		},
	},
	// Additional wallets can be added here
];

export const EthereumProvider: React.FC<EthereumProviderProps> = ({ children }) => {
	const [isConnected, setIsConnected] = useState(false);
	const [address, setAddress] = useState<string | null>(null);
	const [ensName, setEnsName] = useState<string | null>(null);
	const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
	const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
	const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);

	// Get available wallets
	const getAvailableWallets = () => {
		return walletImplementations.filter((wallet) => wallet.isInstalled());
	};

	// Initialize connection on component mount if previously connected
	useEffect(() => {
		// Check for available wallets
		const wallets = getAvailableWallets();
		setAvailableWallets(wallets);

		const checkConnection = async () => {
			// Try to restore previous connection
			const savedWalletId = localStorage.getItem("activeWalletId");

			if (savedWalletId) {
				const wallet = walletImplementations.find((w) => w.id === savedWalletId);

				if (wallet && wallet.isInstalled()) {
					try {
						// Check if wallet is connected
						const isWalletConnected = await wallet.isConnected();

						if (isWalletConnected) {
							const accounts = await wallet.getAccounts();

							if (accounts.length > 0) {
								// Get connection details without triggering a wallet popup
								// Just use the existing connection

								setIsConnected(true);
								setAddress(accounts[0]);

								// For MetaMask, we can get more details
								if (wallet.id === "metamask" && window.ethereum) {
									try {
										const provider = new BrowserProvider(window.ethereum);
										const signer = await provider.getSigner();
										setSigner(signer);

										// Try to get ENS name if available
										try {
											const ensName = await provider.lookupAddress(accounts[0]);
											setEnsName(ensName);
										} catch (error) {
											console.log("ENS lookup failed:", error);
											setEnsName(null);
										}
									} catch (error) {
										console.error("Error getting signer:", error);
										setSigner(null);
										setEnsName(null);
									}
								} else {
									setSigner(null);
									setEnsName(null);
								}

								setActiveWalletId(wallet.id);
							} else {
								// No accounts available, clear any saved wallet ID
								localStorage.removeItem("activeWalletId");
							}
						} else {
							// Wallet is not connected, clear any saved wallet ID
							localStorage.removeItem("activeWalletId");
						}
					} catch (error) {
						console.error(`Failed to check ${wallet.name} connection:`, error);
						// Clear any saved wallet ID on error
						localStorage.removeItem("activeWalletId");
					}
				} else {
					// Wallet not installed or not found, clear any saved wallet ID
					localStorage.removeItem("activeWalletId");
				}
			}
		};

		checkConnection();

		// Set up event listeners for wallet changes
		// This is a simplified approach - in a real app, you'd want to handle
		// each wallet's specific events
		if (typeof window !== "undefined" && window.ethereum) {
			const handleAccountsChanged = (accounts: string[]) => {
				// Only handle events for MetaMask if it's the active wallet
				if (accounts.length === 0 && activeWalletId === "metamask") {
					// User disconnected
					setIsConnected(false);
					setAddress(null);
					setEnsName(null);
					setSigner(null);
					setActiveWalletId(null);
					localStorage.removeItem("activeWalletId");
				} else if (activeWalletId === "metamask") {
					// Account changed, update state
					checkConnection();
				}
			};

			window.ethereum.on("accountsChanged", handleAccountsChanged);

			return () => {
				// Clean up event listeners
				if (window.ethereum) {
					window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
				}
			};
		}
	}, [activeWalletId]); // Add activeWalletId as a dependency

	// Connect to wallet - shows wallet selection if multiple are available
	const connect = async () => {
		// Always clear any existing wallet selection when connecting
		// This ensures the user is always prompted to choose a wallet when clicking connect
		if (!isConnected) {
			localStorage.removeItem("activeWalletId");
		}

		const wallets = getAvailableWallets();

		if (wallets.length === 0) {
			alert("No supported wallets detected. Please install a compatible wallet to use this feature.");
			return;
		} else if (wallets.length === 1) {
			// If only one wallet is available, use it directly
			await selectWallet(wallets[0].id);
		} else {
			// If multiple wallets are available, show a selection dialog
			const walletOptions = document.createElement("div");
			walletOptions.style.position = "fixed";
			walletOptions.style.top = "0";
			walletOptions.style.left = "0";
			walletOptions.style.width = "100%";
			walletOptions.style.height = "100%";
			walletOptions.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
			walletOptions.style.display = "flex";
			walletOptions.style.justifyContent = "center";
			walletOptions.style.alignItems = "center";
			walletOptions.style.zIndex = "1000";

			const walletSelector = document.createElement("div");
			walletSelector.style.backgroundColor = "white";
			walletSelector.style.padding = "20px";
			walletSelector.style.borderRadius = "10px";
			walletSelector.style.maxWidth = "400px";
			walletSelector.style.width = "90%";

			const title = document.createElement("h3");
			title.textContent = "Select a Wallet";
			title.style.marginBottom = "20px";
			title.style.textAlign = "center";
			walletSelector.appendChild(title);

			wallets.forEach((wallet) => {
				const button = document.createElement("button");
				button.textContent = wallet.name;
				button.style.display = "block";
				button.style.width = "100%";
				button.style.padding = "10px";
				button.style.marginBottom = "10px";
				button.style.backgroundColor = "#f1f1f1";
				button.style.border = "none";
				button.style.borderRadius = "5px";
				button.style.cursor = "pointer";
				button.style.fontSize = "16px";

				button.addEventListener("click", async () => {
					document.body.removeChild(walletOptions);
					await selectWallet(wallet.id);
				});

				walletSelector.appendChild(button);
			});

			const cancelButton = document.createElement("button");
			cancelButton.textContent = "Cancel";
			cancelButton.style.display = "block";
			cancelButton.style.width = "100%";
			cancelButton.style.padding = "10px";
			cancelButton.style.backgroundColor = "#e0e0e0";
			cancelButton.style.border = "none";
			cancelButton.style.borderRadius = "5px";
			cancelButton.style.cursor = "pointer";
			cancelButton.style.fontSize = "16px";

			cancelButton.addEventListener("click", () => {
				document.body.removeChild(walletOptions);
			});

			walletSelector.appendChild(cancelButton);
			walletOptions.appendChild(walletSelector);
			document.body.appendChild(walletOptions);
		}
	};

	// Connect to a specific wallet
	const selectWallet = async (walletId: string) => {
		const wallet = walletImplementations.find((w) => w.id === walletId);

		if (!wallet) {
			console.error(`Wallet with ID ${walletId} not found`);
			return;
		}

		if (!wallet.isInstalled()) {
			alert(`${wallet.name} is not installed. Please install ${wallet.name} to use this feature.`);
			return;
		}

		try {
			// Connect to the wallet
			const connectionDetails = await wallet.connect();

			setIsConnected(true);
			setAddress(connectionDetails.address);
			setEnsName(connectionDetails.ensName || null);
			setSigner(connectionDetails.signer || null);
			setActiveWalletId(wallet.id);
			localStorage.setItem("activeWalletId", wallet.id);
		} catch (error) {
			console.error(`Failed to connect to ${wallet.name}:`, error);
		}
	};

	// Disconnect from wallet
	const disconnect = async () => {
		if (activeWalletId) {
			const wallet = walletImplementations.find((w) => w.id === activeWalletId);

			if (wallet) {
				try {
					await wallet.disconnect();
				} catch (error) {
					console.error(`Error disconnecting from ${wallet.name}:`, error);
				}
			}
		}

		// Clear connection state
		setIsConnected(false);
		setAddress(null);
		setEnsName(null);
		setSigner(null);
		setActiveWalletId(null);

		// Important: Remove the saved wallet ID to ensure the user is prompted to choose a wallet next time
		localStorage.removeItem("activeWalletId");
	};

	return (
		<EthereumContext.Provider
			value={{
				isConnected,
				address,
				ensName,
				connect,
				selectWallet,
				disconnect,
				signer,
				activeWalletId,
				availableWallets,
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

// Add TypeScript interface for window.ethereum and window.phantom
declare global {
	interface Window {
		ethereum?: {
			isMetaMask?: boolean;
			request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
			on<K extends keyof EthereumEventMap>(event: K, callback: (result: EthereumEventMap[K]) => void): void;
			removeListener<K extends keyof EthereumEventMap>(
				event: K,
				callback: (result: EthereumEventMap[K]) => void
			): void;
		};
		phantom?: {
			solana?: {
				isPhantom?: boolean;
				isConnected?: boolean;
				publicKey?: { toString: () => string };
				connect: () => Promise<{ publicKey: { toString: () => string } }>;
				disconnect: () => Promise<void>;
			};
		};
		// Additional wallet providers can be added here
	}
}
