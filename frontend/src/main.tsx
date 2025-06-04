import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeliaProvider } from "./provider/HeliaProvider.tsx";

import { WagmiConfig, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

// 2. Create wagmi config
const config = createConfig({
	chains: [mainnet, sepolia],
	connectors: [
		injected(), // For MetaMask and other browser wallets
		// You can add other connectors like WalletConnect here
	],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
	},
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<WagmiConfig config={config}>
			<QueryClientProvider client={queryClient}>
				<HeliaProvider>
					<App />
				</HeliaProvider>
			</QueryClientProvider>
		</WagmiConfig>
	</StrictMode>
);
