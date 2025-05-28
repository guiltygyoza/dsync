#!/usr/bin/env node
/// <reference types="node" />

import { Command } from "commander";
import { createHelia } from "helia";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { LevelBlockstore } from "blockstore-level";
import { autoTLS } from "@ipshipyard/libp2p-auto-tls";
import { autoNAT } from "@libp2p/autonat";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport, circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { dcutr } from "@libp2p/dcutr";
import { identify, identifyPush } from "@libp2p/identify";
import { kadDHT } from "@libp2p/kad-dht";
import { mdns } from "@libp2p/mdns";
import { ping } from "@libp2p/ping";
import { tcp } from "@libp2p/tcp";
import { tls } from "@libp2p/tls";
import { uPnPNAT } from "@libp2p/upnp-nat";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { ipnsSelector } from "ipns/selector";
import { ipnsValidator } from "ipns/validator";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import * as filters from "@libp2p/websockets/filters";
import { keychain } from "@libp2p/keychain";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { Alchemy, Network } from "alchemy-sdk";
import crypto from "crypto";
import { libp2pRouting } from "@helia/routers";
import * as dotenv from "dotenv";

// add a cmd to add a orbit db id to the access controller of the given db addr

interface RunOptions {
	tcpPort?: number;
	wsPort?: number;
	webrtcPort?: number;
}

const bootstrapConfig = {
	list: [
		// "/ip4/157.90.152.156/tcp/36843/ws/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
		// "/ip4/157.90.152.156/tcp/36437/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
		"/ip4/86.252.78.192/tcp/9999/ws/p2p/12D3KooWJ3EqVf1X6QoBkeUSoRZyg8S11g8QVeyE8guVudedNZqv",
		// "/ip4/86.252.78.192/tcp/54395/p2p/12D3KooWJ3EqVf1X6QoBkeUSoRZyg8S11g8QVeyE8guVudedNZqv",
	],
};

const program = new Command();

program.name("dsync-cli").description("CLI for interacting with Dsync").version("1.0.0");

dotenv.config();

async function startOrbitDB(addresses: string[] = []) {
	let privKeyBuffer: Buffer | undefined;
	if (process.env.PRIVATE_KEY_SEED) {
		privKeyBuffer = Buffer.from(process.env.PRIVATE_KEY_SEED, "utf-8");

		if (privKeyBuffer.length < 32) {
			const padding = Buffer.alloc(32 - privKeyBuffer.length);
			privKeyBuffer = Buffer.concat([privKeyBuffer, padding]);
		} else if (privKeyBuffer.length > 32) {
			privKeyBuffer = privKeyBuffer.subarray(0, 32);
		}
	} else {
		console.error("PRIVATE_KEY_SEED is not set");
		process.exit(1);
	}

	const seed = new Uint8Array(privKeyBuffer || []);
	const privateKey = await generateKeyPairFromSeed("Ed25519", seed);

	const libp2p = await createLibp2p({
		privateKey,
		addresses: {
			listen: addresses,
		},
		peerDiscovery: [bootstrap(bootstrapConfig), mdns()],
		connectionEncrypters: [noise(), tls()],
		connectionGater: {
			denyDialMultiaddr: () => false,
		},
		streamMuxers: [yamux()],
		services: {
			dht: kadDHT({
				validators: { ipns: ipnsValidator },
				selectors: { ipns: ipnsSelector },
			}),
			ping: ping(),
			dcutr: dcutr(),
			identify: identify(),
			identifyPush: identifyPush(),
			pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
			autonat: autoNAT(),
			autoTLS: autoTLS(),
			upnp: uPnPNAT(),
			relay: circuitRelayServer(),
			keychain: keychain({}),
		},
		transports: [circuitRelayTransport(), webRTC(), webRTCDirect(), webSockets({ filter: filters.all }), tcp()],
		...(privKeyBuffer && { identity: { privKey: privKeyBuffer } }),
	});
	// REALLLY IMPORTANT:
	const blockstore = new LevelBlockstore("./ipfs");
	const helia = await createHelia({ libp2p, blockstore, routers: [libp2pRouting(libp2p)] });
	const orbitdb = await createOrbitDB({ ipfs: helia, id: "bootstrap", blockstore });

	return { orbitdb, libp2p };
}

program
	.command("get-orbitdb-id")
	.description("Get the orbit db id")
	.action(async () => {
		const { orbitdb } = await startOrbitDB();
		console.log("orbitdb id", orbitdb.identity.id);
		process.exit(0);
	});

program
	.command("run")
	.description("Start the node and keep it running")
	.option("-t, --tcp-port <port>", "TCP port to listen on")
	.option("-w, --ws-port <port>", "WebSocket port to listen on")
	.option("-r, --webrtc-port <port>", "WebRTC port to listen on")
	.action(async (options: RunOptions) => {
		const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || undefined;
		const ALCHEMY_WEBHOOK_SIGNING_SECRET = process.env.ALCHEMY_WEBHOOK_SIGNING_SECRET || undefined;
		const EIP_MANAGER_CONTRACT_ADDRESS = process.env.EIP_MANAGER_CONTRACT_ADDRESS || undefined;
		const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3001;

		if (!ALCHEMY_API_KEY || !EIP_MANAGER_CONTRACT_ADDRESS) {
			console.warn(
				"Please set your ALCHEMY_API_KEY and EIP_MANAGER_CONTRACT_ADDRESS environment variables or update them in cli.ts"
			);
		}
		if (!ALCHEMY_WEBHOOK_SIGNING_SECRET) {
			console.warn("Remember to set your ALCHEMY_WEBHOOK_SIGNING_SECRET for webhook verification.");
		}

		const addresses = {
			listen: [
				//options.tcpPort ? `/ip4/0.0.0.0/tcp/${options.tcpPort}` : '/ip4/0.0.0.0/tcp/0',
				//options.wsPort ? `/ip4/0.0.0.0/tcp/${options.wsPort}/ws` : '/ip4/0.0.0.0/tcp/0/ws',
				//options.webrtcPort ? `/ip4/0.0.0.0/udp/${options.webrtcPort}/webrtc-direct` : '/ip4/0.0.0.0/udp/0/webrtc-direct',
				//'/ip6/::/tcp/0',
				//'/ip6/::/tcp/0/ws',
				//'/ip6/::/udp/0/webrtc-direct',
				"/p2p-circuit",
				"/webrtc",
				"/webrtc-direct",
			],
		};

		const alchemy = new Alchemy({
			apiKey: ALCHEMY_API_KEY,
			network: Network.ETH_SEPOLIA,
		});

		const { orbitdb, libp2p } = await startOrbitDB(addresses.listen);
		console.log(libp2p.getMultiaddrs());
		console.log(libp2p.peerId);
		libp2p.addEventListener("peer:connect", (peerId) => {
			console.log("peer:connect", peerId.detail);
		});

		libp2p.addEventListener("transport:listening", (peerId) => {
			console.log("transport:listening", libp2p.getMultiaddrs());
		});

		libp2p.addEventListener("peer:disconnect", (peerId) => {
			console.log("peer:disconnect", peerId.detail);
		});

		const DBFINDER_NAME = "/orbitdb/zdpuAwHvrRnh7PzhE89FUUM2eMrdpwGs8SRPS41JYiSLGoY8u";

		console.log("orbitdb id", orbitdb.identity.id);
		const DBFinder = await orbitdb.open(DBFINDER_NAME, {
			type: "keyvalue",
			AccessController: IPFSAccessController({
				write: [
					"02ac6a344f5cdceb2c4ccb78596ca3891d31861e803e429f624e0f65a402371ab6",
					"02ac6a344f5cdceb2c4ccb78596ca3891d31861e803e429f624e0f65a402371ab6",
				],
			}),
		});
		console.log("DBFinder address", DBFinder.address.toString());
		DBFinder.events.on("update", async (entry: any) => {
			console.log("Database update:", entry.payload.value);
		});
		DBFinder.events.on("error", (error: any) => {
			console.error("Database error:", error);
		});

		DBFinder.events.on("join", async (peerId, heads) => {
			// The peerId of the ipfs1 node.
			console.log("join", peerId);
		});

		DBFinder.events.on("close", async (peerId, heads) => {
			// The peerId of the ipfs1 node.
			console.log("close", peerId);
		});
		for await (const record of DBFinder.iterator()) {
			console.log("record1", record);
		}

		// what is left:
		// - add commenters array to the smart contract, create access controller for that
		// - create alchemy webhook and listen in the node
		// - make the db structure, in node create doc db for new eip
		// - record new users connecting wallets

		// const eip1 = await orbitdb.open("eip1", { type: 'documents', AccessController: IPFSAccessController({write: [orbitdb.identity.id]}) });
		// console.log('eip1 address', eip1.address.toString());

		// const eip1second = await orbitdb.open(await DBFinder.get("eip1"));
		// console.log('eip1second address', eip1second.address.toString());
		// const eip1Addr = eip1.address.toString();
		// await DBFinder.put("eip1", eip1Addr);
		// console.log('eip1Addr', eip1Addr);
		// await eip1.put({ _id: "123", name: "hello world title", description: "hello world description" });
		// console.log('eip1Addr', eip1Addr);

		console.log("id", orbitdb.identity.id);
		// const db = await orbitdb.open('db-jan-kiwi-1', { type: 'documents', AccessController: IPFSAccessController({write: [orbitdb.identity.id]}) });
		// db.events.on('ready', () => {
		//   console.log('Database ready');
		// });

		// db.events.on('error', (error: any) => {
		//   console.error('Database error:', error);
		// });

		// db.events.on('update', async (entry: any) => {
		//   console.log('Database update:', entry.payload.value);
		// });

		// console.log('Database address:', db.address.toString())
		const app = express();

		app.use((req: Request, res: Response, next: NextFunction) => {
			if (req.originalUrl === "/alchemy-webhook") {
				let data = "";
				req.setEncoding("utf8");
				req.on("data", (chunk) => {
					data += chunk;
				});
				req.on("end", () => {
					(req as any).rawBody = data;
					next();
				});
			} else {
				express.json()(req, res, next);
			}
		});

		app.post("/alchemy-webhook", async (req: Request, res: Response) => {
			// TODO
			res.status(200).send("Webhook received");
		});

		app.listen(WEBHOOK_PORT, () => {
			console.log(`Webhook server listening on port ${WEBHOOK_PORT}`);
		});

		console.log("Node is running. Press Ctrl+C to stop.");

		// Keep the process running
		process.on("SIGINT", async () => {
			console.log("\nStopping node...");
			await libp2p.stop();
			process.exit(0);
		});
	});

program.parse();
