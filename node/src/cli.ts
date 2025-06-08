#!/usr/bin/env node
/// <reference types="node" />

import { Command } from "commander";
import { createHelia } from "helia";
// @ts-expect-error -- .
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { LevelBlockstore } from "blockstore-level";
import { autoTLS } from "@ipshipyard/libp2p-auto-tls";
import { autoNAT } from "@libp2p/autonat";
// import { bootstrap } from "@libp2p/bootstrap";
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
import { LevelDatastore } from "datastore-level";
import { libp2pRouting } from "@helia/routers";
import * as dotenv from "dotenv";
import type { EIP_CATEGORY, EIP_STATUS } from "@dsync/types";
import { type IEIP } from "@dsync/types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { addNewEIP } from "./orbitdb.js";

interface RunOptions {
	tcpPort?: number;
	wsPort?: number;
	webrtcPort?: number;
}

const program = new Command();

program.name("dsync-cli").description("CLI for interacting with Dsync").version("1.0.0");

dotenv.config();

const DBFINDER_NAME = "dbfinder";

interface EIPData {
	number: number;
	attributes: {
		eip: string;
		title: string;
		description: string;
		author: string;
		disscusionsTo: string;
		status: string;
		type: string;
		category: string;
		created: string;
		requires: string;
	};
	markdown: string;
}

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
	const blockstore = new LevelBlockstore("./ipfs");

	const libp2p = await createLibp2p({
		datastore: new LevelDatastore("./datastore"),
		privateKey,
		addresses: {
			listen: addresses,
		},
		peerDiscovery: [mdns()],
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
			identify: identify({ maxMessageSize: Infinity }),
			identifyPush: identifyPush({ maxMessageSize: Infinity }),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
				fallbackToFloodsub: true,
				scoreParams: {
					IPColocationFactorWeight: 0,
				},
			}),
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
	const helia = await createHelia({ libp2p, blockstore, routers: [libp2pRouting(libp2p)] });
	await helia.start();
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
	.command("db-init")
	.description(
		"Initialize the database, make sure the eips.json file is in the data folder at the root of the project"
	)
	.action(async () => {
		const codeDir = path.dirname(fileURLToPath(import.meta.url));
		const eipsPath = path.join(codeDir, "..", "..", "data", "eips.json");
		if (!fs.existsSync(eipsPath)) {
			console.error(`eips.json file does not exist in ${eipsPath}`);
			process.exit(1);
		}
		const eipsData = JSON.parse(fs.readFileSync(eipsPath, "utf8")) as EIPData[];
		const eips: IEIP[] = [];
		const ids = new Set<number>();
		for (const data of eipsData) {
			if (ids.has(data.number)) {
				continue;
			}
			ids.add(data.number);
			const eip = {
				_id: data.number,
				title: data.attributes.title || "No title",
				description: data.attributes.description || "No description",
				content: data.markdown,
				status: data.attributes.status as EIP_STATUS,
				category: (data.attributes.category || "Informational") as EIP_CATEGORY,
				authors: data.attributes.author ? data.attributes.author.split(",") : [],
				createdAt: new Date(data.attributes.created || "01-01-2025"),
				updatedAt: new Date(data.attributes.created || "01-01-2025"),
				requires: data.attributes.requires ? data.attributes.requires.split(",").map((id) => parseInt(id)) : [],
				dbAddress: "",
				commentDBAddress: "",
			};
			eips.push(eip);
		}

		console.log(`Loaded ${eips.length} EIPs from ${eipsPath}`);

		console.log("Creating the DBFinder");
		const { orbitdb, libp2p } = await startOrbitDB();
		console.log("Libp2p peerId", libp2p.peerId);
		console.log("OrbitDB identity id", orbitdb.identity.id);
		const DBFinder = await orbitdb.open(DBFINDER_NAME, {
			type: "keyvalue",
			AccessController: IPFSAccessController({
				write: [orbitdb.identity.id],
			}),
		});
		const dbFinderAddress = DBFinder.address.toString();

		for (const eip of eips) {
			await addNewEIP(orbitdb, DBFinder, eip);
			console.log("Inserted data into DBFinder for EIP", eip._id);
		}

		console.log("Completed inserting EIP data");
		console.log("DBFinder created at", dbFinderAddress);

		process.exit(0);
	});

program
	.command("run")
	.description("Start the node and keep it running")
	.option("-t, --tcp-port <port>", "TCP port to listen on")
	.option("-w, --ws-port <port>", "WebSocket port to listen on")
	.option("-r, --webrtc-port <port>", "WebRTC port to listen on")
	.action(async (options: RunOptions) => {
		const addresses = {
			listen: [
				"/ip4/0.0.0.0/tcp/9997",
				options.wsPort ? `/ip4/0.0.0.0/tcp/${options.wsPort}/ws` : "/ip4/0.0.0.0/tcp/0/ws",
				//options.webrtcPort ? `/ip4/0.0.0.0/udp/${options.webrtcPort}/webrtc-direct` : '/ip4/0.0.0.0/udp/0/webrtc-direct',
				//'/ip6/::/tcp/0',
				//'/ip6/::/tcp/0/ws',
				//'/ip6/::/udp/0/webrtc-direct',
				"/p2p-circuit",
				"/webrtc",
				"/webrtc-direct",
			],
		};

		const { orbitdb, libp2p } = await startOrbitDB(addresses.listen);
		console.log(libp2p.getMultiaddrs());
		console.log(libp2p.peerId);
		libp2p.addEventListener("peer:connect", (peerId) => {
			console.log("Libp2p peer:connect", peerId.detail);
		});

		libp2p.addEventListener("transport:listening", () => {
			console.log("Libp2p transport:listening", libp2p.getMultiaddrs());
		});

		libp2p.addEventListener("peer:disconnect", (peerId) => {
			console.log("Libp2p peer:disconnect", peerId.detail);
		});

		// Creating the DBFinder, make sure the bt node's orbitdb id is in the access controller
		const DBFINDER_NAME = "dbfinder";

		const DBFinder = await orbitdb.open(DBFINDER_NAME, {
			type: "keyvalue",
			AccessController: IPFSAccessController({
				// TODO: hardcode the value when deployed
				write: [orbitdb.identity.id],
			}),
		});
		const dbFinderAddress = DBFinder.address.toString();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		DBFinder.events.on("update", async (entry: any) => {
			console.log("DBFinder update:", entry.payload.value);
			// await new Promise((resolve) => setTimeout(resolve, 1000));
			// const coreInfo = JSON.parse(entry.payload.value) as ICoreEIPInfo;
			// console.log("DBFinder update:", coreInfo);
			// const eipDoc = await orbitdb.open(coreInfo.dbAddress, { type: "documents" });
			// const eip = (await eipDoc.get(SPECIAL_ID_FOR_EIP)).value as IEIP;
			// console.log("EIP:", eip);
			// const commentDoc = await orbitdb.open(eip.commentDBAddress, { type: "documents" });
			// const comments = await commentDoc.all();
			// console.log("Comments:", comments);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		DBFinder.events.on("error", (error: any) => {
			console.error("DBFinder error:", error);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		DBFinder.events.on("join", async (peerId: any) => {
			// The peerId of the ipfs1 node.
			console.log("DBFinder join, peerId:", peerId);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		DBFinder.events.on("close", async (peerId: any) => {
			// The peerId of the ipfs1 node.
			console.log("DBFinder close, peerId:", peerId);
		});

		// for (const eip of placeholderEIPs) {
		// 	await addNewEIP(orbitdb, DBFinder, eip);
		// 	console.log("Inserted data into DBFinder", eip.id);
		// }

		// for await (const record of DBFinder.iterator({ limit: -1 })) {
		// 	console.log("Record:", record.value);
		// }

		console.log("DBFinder address: ", dbFinderAddress);
		console.log("Records found in DBFinder: ", (await DBFinder.all()).length);
		// for await (const record of DBFinder.iterator({ limit: -1 })) {
		// 	const coreInfo = JSON.parse(record.value) as ICoreEIPInfo;
		// 	console.log("coreInfo", coreInfo);
		// 	const eipDoc = await orbitdb.open(coreInfo.dbAddress, { type: "documents" });
		// 	console.log("eipDoc.all", await eipDoc.all());
		// 	const eip = await eipDoc.get(SPECIAL_ID_FOR_EIP);
		// 	console.log("Full EIP:", eip);
		// 	const eipvalue = eip.value as IEIP;
		// 	console.log("eipvalue", eipvalue);
		// const commentDoc = await orbitdb.open(eipvalue.commentDBAddress, { type: "documents" });
		// const comments = await commentDoc.all();
		// console.log("Comments:", comments);
		// }

		console.log("OrbitDB identity id", orbitdb.identity.id);
		console.log("Node is running. Press Ctrl+C to stop.");

		// Keep the process running
		process.on("SIGINT", async () => {
			console.log("\nStopping node...");
			await libp2p.stop();
			process.exit(0);
		});
	});

program.parse();
