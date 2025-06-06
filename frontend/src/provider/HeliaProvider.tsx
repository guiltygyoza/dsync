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
// import { kadDHT } from "@libp2p/kad-dht";
import { devToolsMetrics } from "@libp2p/devtools-metrics";
// import { peerIdFromString } from "@libp2p/peer-id";
// import { tcp } from "@libp2p/tcp";
import { LevelBlockstore } from "blockstore-level";

import { useAccount, useSignMessage } from "wagmi";
import OrbitDBIdentityProviderEthereum from "../OrbitDBUtils/IdentityProviderEthereum";

export const bootstrapConfig = {
	list: [
		// "/dns4/ice.sacha42.com/tcp/443/wss/p2p/12D3KooW9ytqFZdCap4t331g5a9VtvhMhbYhoE5CFu8zcVc8Adg1",
		// "/ip4/157.90.152.156/tcp/36437/p2p/12D3KooWHYzgG1WpykEc2bqynAzCV5idt1UZmqQhxzuLcK2RvPWU",
		// "/ip4/5.75.178.220/tcp/36437/p2p/12D3KooWBkPEDWKWCdZY28Kyy7TnegeRT61obxwdpFuQ7MfcVdRQ",
		// "/ip4/5.75.178.220/tcp/36843/ws/p2p/12D3KooWBkPEDWKWCdZY28Kyy7TnegeRT61obxwdpFuQ7MfcVdRQ",
		"/ip4/127.0.0.1/tcp/36437/p2p/12D3KooWGnbGVe3J6S4GCvvuxRgSTdsm6aFwvoD27UgP2xNns7rG",
		"/ip4/127.0.0.1/tcp/9999/ws/p2p/12D3KooWGnbGVe3J6S4GCvvuxRgSTdsm6aFwvoD27UgP2xNns7rG",
	],
};

// export const DBFINDER_ADDRESS = "/orbitdb/zdpuAwHvrRnh7PzhE89FUUM2eMrdpwGs8SRPS41JYiSLGoY8u";
export const DBFINDER_ADDRESS = "/orbitdb/zdpuAto2aCYSg9fhVtJJaZZEBx2Xaio6RRfFNj2jNXhmxXaLE";

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
	return await createLibp2p<DefaultLibp2pServices>({
		addresses: { listen: ["/p2p-circuit", "/webrtc", "/webrtc-direct"] },
		peerDiscovery: [bootstrap(bootstrapConfig)],
		connectionEncrypters: [noise()],
		connectionGater: { denyDialMultiaddr: () => false },
		metrics: devToolsMetrics(),
		streamMuxers: [yamux()],
		// @ts-expect-error -- .
		services: {
			//dht: kadDHT({
			//  clientMode: true,
			//  validators: {
			//    ipns: ipnsValidator,
			//  },
			//  selectors: {
			//    ipns: ipnsSelector,
			//  },
			//}),
			ping: ping(),
			dcutr: dcutr(),
			identify: identify(),
			identifyPush: identifyPush(),
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

	const { address, isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const readBlockstore = useMemo(() => new LevelBlockstore("./ipfs-read"), []);
	const writeBlockstore = useMemo(() => new LevelBlockstore("./ipfs-write"), []);
	useIdentityProvider(OrbitDBIdentityProviderEthereum);

	const writeOrbitDBFn = useCallback(async () => {
		if (writeOrbitDB) return writeOrbitDB;
		if (!address) throw new Error("Address is not set");
		if (!signMessageAsync) throw new Error("signMessageAsync is not set");
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
			{children}
		</HeliaContext.Provider>
	);
};
