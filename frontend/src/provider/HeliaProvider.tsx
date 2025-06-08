import { unixfs, type UnixFS } from "@helia/unixfs";
import type { Libp2p } from "@libp2p/interface";
import { noise } from "@chainsafe/libp2p-noise";
// import { tls } from "@libp2p/tls";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
// import { createDelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { bootstrap } from "@libp2p/bootstrap";
import { libp2pRouting } from "@helia/routers";
// @ts-expect-error -- .
import { createOrbitDB, useIdentityProvider, type OrbitDB } from "@orbitdb/core";
// import { uPnPNAT } from "@libp2p/upnp-nat";
// import { ipnsSelector } from "ipns/selector";
// import { ipnsValidator } from "ipns/validator";
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
import { peerIdFromString } from "@libp2p/peer-id";
// import { tcp } from "@libp2p/tcp";
import { LevelBlockstore } from "blockstore-level";

import { useAccount, useSignMessage } from "wagmi";
import OrbitDBIdentityProviderEthereum from "../OrbitDBUtils/IdentityProviderEthereum";
import ErrorToast from "../components/ErrorToast";

export const bootstrapConfig = {
	list: [
		// "/dns4/ice.sacha42.com/tcp/443/wss/p2p/12D3KooW9ytqFZdCap4t331g5a9VtvhMhbYhoE5CFu8zcVc8Adg1",
		// "/ip4/157.90.152.156/tcp/36437/p2p/12D3KooWHYzgG1WpykEc2bqynAzCV5idt1UZmqQhxzuLcK2RvPWU",
		// "/ip4/5.75.178.220/tcp/36437/p2p/12D3KooWBkPEDWKWCdZY28Kyy7TnegeRT61obxwdpFuQ7MfcVdRQ",
		// "/ip4/5.75.178.220/tcp/36843/ws/p2p/12D3KooWBkPEDWKWCdZY28Kyy7TnegeRT61obxwdpFuQ7MfcVdRQ",
		"/ip4/127.0.0.1/tcp/9997/p2p/12D3KooW9ytqFZdCap4t331g5a9VtvhMhbYhoE5CFu8zcVc8Adg1",
		"/ip4/127.0.0.1/tcp/9999/ws/p2p/12D3KooW9ytqFZdCap4t331g5a9VtvhMhbYhoE5CFu8zcVc8Adg1",
	],
};

// export const DBFINDER_ADDRESS = "/orbitdb/zdpuAwHvrRnh7PzhE89FUUM2eMrdpwGs8SRPS41JYiSLGoY8u";
export const DBFINDER_ADDRESS = "/orbitdb/zdpuAzSJGmvgrBdzvNeMPdjfA756R54QgebHMF5o8p6V1ckSk";

//// Based on the structure returned by OrbitDBIdentityProviderEthereum
//type OrbitDBIdentityInstance = () => Promise<{
//	type: string;
//	getId: () => Promise<string>;
//	signIdentity: (data: string) => Promise<string>;
//}>;

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
		// if (window.helia) {
		// 	console.info("found a windowed instance of helia, populating ...");
		// 	setHelia(window.helia);
		// 	setFs(unixfs(window.helia));
		// 	startingRef.current = false;
		// 	return;
		// }

		if (helia || startingRef.current) return;
		startingRef.current = true;
		console.log("Starting Helia");

		try {
			const libp2p = await setupLibp2p();
			const helia = await createHelia({ libp2p, blockstore: readBlockstore, routers: [libp2pRouting(libp2p)] });
			await new Promise((resolve) => setTimeout(resolve, 2000));
			const peerId = peerIdFromString("12D3KooW9ytqFZdCap4t331g5a9VtvhMhbYhoE5CFu8zcVc8Adg1");
			const peer = await libp2p.peerStore.get(peerId);
			console.log("peer", peer);
			console.log("protocols", peer.protocols);
			console.log("tags", peer.tags);
			console.log("protocols", libp2p.getProtocols());
			console.log("multiaddrs", libp2p.getMultiaddrs());
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
