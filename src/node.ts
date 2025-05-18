import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { createDelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { delegatedHTTPRoutingDefaults } from "@helia/routers";
import { autoTLS } from "@ipshipyard/libp2p-auto-tls";
import { autoNAT } from "@libp2p/autonat";
import { bootstrap } from "@libp2p/bootstrap";
import {
    circuitRelayTransport,
    circuitRelayServer,
} from "@libp2p/circuit-relay-v2";
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
import { userAgent } from "libp2p/user-agent";
import type { AutoTLS } from "@ipshipyard/libp2p-auto-tls";
import type { CircuitRelayService } from "@libp2p/circuit-relay-v2";
import type { Identify } from "@libp2p/identify";
import type { KadDHT } from "@libp2p/kad-dht";
import type { PingService } from "@libp2p/ping";
import type { Libp2pOptions } from "libp2p";
import { createHelia } from "helia";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { createLibp2p } from "libp2p";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import * as filters from "@libp2p/websockets/filters";
import { type Keychain, keychain } from "@libp2p/keychain";

export interface DefaultLibp2pServices extends Record<string, unknown> {
    autoNAT: unknown;
    autoTLS: AutoTLS;
    dcutr: unknown;
    delegatedRouting: unknown;
    dht: KadDHT;
    identify: Identify;
    keychain: Keychain;
    ping: PingService;
    relay: CircuitRelayService;
    upnp: unknown;
}
export const bootstrapConfig = {
    list: [
        "/ip4/ice.sacha42.com/tcp/36843/ws/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
        "/ip4/ice.sacha42.com/tcp/36437/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
    ],
};

const libp2p = await createLibp2p({
    addresses: {
        listen: [
            "/ip4/0.0.0.0/tcp/0",
            "/ip4/0.0.0.0/tcp/0/ws",
            "/ip4/0.0.0.0/udp/0/webrtc-direct",
            "/ip6/::/tcp/0",
            "/ip6/::/tcp/0/ws",
            "/ip6/::/udp/0/webrtc-direct",
            "/p2p-circuit",
        ],
    },
    peerDiscovery: [bootstrap(bootstrapConfig), mdns()],
    connectionEncrypters: [noise(), tls()],
    connectionGater: {
        denyDialMultiaddr: () => {
            return false;
        },
    },
    streamMuxers: [yamux()],
    services: {
        dht: kadDHT({
            clientMode: true,
            validators: {
                ipns: ipnsValidator,
            },
            selectors: {
                ipns: ipnsSelector,
            },
        }),
        ping: ping(),
        dcutr: dcutr(),
        identify: identify(),
        identifyPush: identifyPush(),
        pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
        autonat: autoNAT(),
        delegatedRouting: () =>
            createDelegatedRoutingV1HttpApiClient(
                "https://delegated-ipfs.dev",
                delegatedHTTPRoutingDefaults()
            ),
        autoTLS: autoTLS(),
        upnp: uPnPNAT(),
        relay: circuitRelayServer(),
        keychain: keychain({}),
    },
    transports: [
        circuitRelayTransport(),
        webRTC(),
        webRTCDirect(),
        webSockets({
            filter: filters.all,
        }),
        tcp(),
    ],
});

const helia = await createHelia({ libp2p });

const orbitdb = await createOrbitDB({
    ipfs: helia,
});

console.log("orbitdb", orbitdb);
const db = await orbitdb.open("db-jan-<>-kiwi-1", {
    type: "documents",
});

await db.put({_id: "123", name: "hello world 1"})
await db.put({_id: "124", name: "hello world 2"})

console.log(await db.get("123"))
console.log(await db.get("124"))

//db.events.on("update", async (entry) => {
//    console.log(entry);
//    const all = await db.all();
//    console.log(all);
//});

setTimeout(() => {
    console.log("orbitdb", orbitdb);
}, 10000);
