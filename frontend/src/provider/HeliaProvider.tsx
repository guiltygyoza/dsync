import { unixfs, type UnixFS } from "@helia/unixfs";
import type { Libp2p } from "@libp2p/interface";
import { noise } from "@chainsafe/libp2p-noise";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { bootstrap } from "@libp2p/bootstrap";
import { libp2pRouting } from "@helia/routers";
// @ts-expect-error -- .
import { createOrbitDB, useIdentityProvider, type OrbitDB } from "@orbitdb/core";
import { createHelia, type DefaultLibp2pServices, type HeliaLibp2p } from "helia";
import { createLibp2p } from "libp2p";
import { useEffect, useState, useCallback, createContext, useMemo, useRef } from "react";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { yamux } from "@chainsafe/libp2p-yamux";
import { dcutr } from "@libp2p/dcutr";
import { ping } from "@libp2p/ping";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import * as filters from "@libp2p/websockets/filters";
import { identify, identifyPush } from "@libp2p/identify";
import { autoNAT } from "@libp2p/autonat";
import { kadDHT } from "@libp2p/kad-dht";
import { LevelBlockstore } from "blockstore-level";

import { useAccount, useSignMessage } from "wagmi";
import OrbitDBIdentityProviderEthereum from "../OrbitDBUtils/IdentityProviderEthereum";
import ErrorToast from "../components/ErrorToast";

export const bootstrapConfig = {
	list: ["/dns4/whydidyoustop.com/tcp/443/wss/p2p/12D3KooWHUzEPAwpxEiAP2yk9SWtCizHouTdfhVAjpMenfiXFppv"],
};

export const DBFINDER_ADDRESS = "/orbitdb/zdpuB2SVwBoVF64u8oYPQs7xgAX7VyAEsmdxotCWKxA3jvJNX";

export const HeliaContext = createContext<{
	helia: HeliaLibp2p<Libp2p<DefaultLibp2pServices>> | null;
	fs: UnixFS | null;
	readOrbitDB: OrbitDB | null; // Add OrbitDB instance to context
	writeOrbitDB: () => Promise<OrbitDB>;
	error: boolean;
	starting: boolean;
}>({
	helia: null,
	fs: null,
	readOrbitDB: null, // Initialize orbitDB as null
	writeOrbitDB: async () => null,
	error: false,
	starting: false,
});

const createWalletFacade = (address: string, signMessageAsync: (args: { message: string }) => Promise<string>) => ({
	getAddress: async () => address,
	signMessage: async (message: string) => await signMessageAsync({ message }),
});

const setupLibp2p = async (): Promise<Libp2p<DefaultLibp2pServices>> => {
	// @ts-expect-error -- .
	return await createLibp2p<DefaultLibp2pServices>({
		addresses: { listen: ["/p2p-circuit", "/webrtc", "/webrtc-direct"] },
		peerDiscovery: [bootstrap(bootstrapConfig)],
		connectionEncrypters: [noise()],
		connectionGater: { denyDialMultiaddr: () => false },
		streamMuxers: [yamux()],
		// @ts-expect-error -- .
		services: {
			dht: kadDHT({
				// clientMode: true,
			}),
			ping: ping(),
			dcutr: dcutr(),
			identify: identify({ maxMessageSize: 2_000_000_000 }),
			identifyPush: identifyPush({ maxMessageSize: 2_000_000_000 }),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
				fallbackToFloodsub: true,
				scoreParams: {
					IPColocationFactorWeight: 0,
				},
			}),
			autonat: autoNAT(),
			//delegatedRouting: () =>
			//  createDelegatedRoutingV1HttpApiClient(
			//    "https://delegated-ipfs.dev",
			//    delegatedHTTPRoutingDefaults()
			//  ),
		},
		transports: [circuitRelayTransport(), webRTC(), webRTCDirect(), webSockets({ filter: filters.all })],
	});
};

export const HeliaProvider = ({ children }: { children: React.ReactNode }) => {
	const [helia, setHelia] = useState<HeliaLibp2p<Libp2p<DefaultLibp2pServices>> | null>(null);
	const [fs, setFs] = useState<UnixFS | null>(null);
	const [readOrbitDB, setReadOrbitDB] = useState<OrbitDB | null>(null);
	const [writeOrbitDB, setWriteOrbitDB] = useState<OrbitDB | null>(null);
	const startingRef = useRef(false);
	const [error, setError] = useState(false);
	const [errors, setErrors] = useState<{ id: number; message: string }[]>([]);

	const { address, isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const readBlockstore = useMemo(() => new LevelBlockstore("./ipfs-read"), []);
	const writeBlockstore = useMemo(() => new LevelBlockstore("./ipfs-write"), []);
	useIdentityProvider(OrbitDBIdentityProviderEthereum);

	const writeOrbitDBFn = useCallback(async () => {
		try {
			if (writeOrbitDB) return writeOrbitDB;
			if (!address) throw new Error("Wallet not connected!");
			if (!signMessageAsync) throw new Error("Wallet not connected!");
			if (!helia) throw new Error("helia is not set");
			if (!writeBlockstore) throw new Error("writeBlockstore is not set");
			if (!isConnected) throw new Error("isConnected is not set");

			const walletFacade = createWalletFacade(address, signMessageAsync);
			// identityProviderInstance -> obj {getId, signIdentity, type}
			const identityProviderInstance = OrbitDBIdentityProviderEthereum({ wallet: walletFacade });
			console.log("identityProviderInstance", identityProviderInstance);
			// Wrap the function in an arrow function to ensure React stores the function itself, not its return value.
			const orbitdb = await createOrbitDB({
				ipfs: helia,
				identity: {
					provider: identityProviderInstance,
				},
				blockstore: writeBlockstore,
			});

			setWriteOrbitDB(orbitdb);
			return orbitdb;
		} catch (e) {
			setError(true);
			const message = e instanceof Error ? e.message : "An unknown error occurred while writing to OrbitDB.";
			setErrors((prev) => [...prev, { id: Date.now(), message }]);
			throw e;
		}
	}, [helia, writeOrbitDB, signMessageAsync, isConnected, address, writeBlockstore, setWriteOrbitDB]);

	const startHelia = useCallback(async () => {
		if (helia || startingRef.current) return;
		startingRef.current = true;
		console.log("Starting Helia");

		try {
			const libp2p = await setupLibp2p();
			const helia = await createHelia({ libp2p, blockstore: readBlockstore, routers: [libp2pRouting(libp2p)] });
			const readOrbitdb = await createOrbitDB({
				ipfs: helia,
				blockstore: readBlockstore,
			});
			setHelia(helia);
			setFs(unixfs(helia));
			setReadOrbitDB(readOrbitdb);
			startingRef.current = false;
			console.log("Helia started");
		} catch (e) {
			console.error(e);
			setError(true);
			const message =
				e instanceof Error
					? `Failed to start Helia: ${e.message}`
					: "An unknown error occurred while starting Helia.";
			setErrors((prev) => [...prev, { id: Date.now(), message }]);
		}
	}, [helia, readBlockstore]);

	useEffect(() => {
		if (!helia && !startingRef.current) {
			startHelia();
		}
	}, [helia, startHelia]);

	return (
		<HeliaContext.Provider
			value={{
				helia,
				fs,
				writeOrbitDB: writeOrbitDBFn,
				readOrbitDB: readOrbitDB,
				error,
				starting: startingRef.current,
			}}
		>
			<div
				style={{
					position: "fixed",
					top: 0,
					right: 0,
					zIndex: 10000,
					width: "300px",
				}}
			>
				{errors.map((error) => (
					<ErrorToast
						key={error.id}
						message={error.message}
						onDismiss={() => setErrors((prev) => prev.filter((e) => e.id !== error.id))}
					/>
				))}
			</div>
			{children}
		</HeliaContext.Provider>
	);
};
