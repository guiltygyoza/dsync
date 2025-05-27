import { unixfs, type UnixFS } from "@helia/unixfs";
import type { Libp2p } from "@libp2p/interface";
import { noise } from "@chainsafe/libp2p-noise";
import { tls } from "@libp2p/tls";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { createDelegatedRoutingV1HttpApiClient } from "@helia/delegated-routing-v1-http-api-client";
import { bootstrap } from "@libp2p/bootstrap";
import { delegatedHTTPRoutingDefaults } from "@helia/routers";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import { uPnPNAT } from "@libp2p/upnp-nat";
import { ipnsSelector } from "ipns/selector";
import { ipnsValidator } from "ipns/validator";
import {
  createHelia,
  type DefaultLibp2pServices,
  type HeliaLibp2p,
} from "helia";
import { createLibp2p } from "libp2p";
import { useEffect, useState, useCallback, createContext } from "react";
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
import { devToolsMetrics } from "@libp2p/devtools-metrics";
import { peerIdFromString } from "@libp2p/peer-id";
import { tcp } from "@libp2p/tcp";

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

export const HeliaContext = createContext<{
  helia: HeliaLibp2p<Libp2p<DefaultLibp2pServices>> | null;
  //identities: Identity | null;
  fs: UnixFS | null;
  error: boolean;
  starting: boolean;
}>({
  helia: null,
  fs: null,
  error: false,
  starting: true,
});

export const HeliaProvider = ({ children }: { children: React.ReactNode }) => {
  const [helia, setHelia] = useState<HeliaLibp2p<
    Libp2p<DefaultLibp2pServices>
  > | null>(null);
  const [fs, setFs] = useState<UnixFS | null>(null);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState(false);
  const [te, setTe] = useState(false);

  const startHelia = useCallback(async () => {
    if (helia) {
      console.info("helia already started");
    } else if (window.helia) {
      console.info("found a windowed instance of helia, populating ...");
      setHelia(window.helia);
      setFs(unixfs(window.helia));
      setStarting(false);
    } else {
      try {
        console.info("Starting Helia");
        const libp2p = await createLibp2p({
          addresses: {
            listen: ["/p2p-circuit", "/webrtc", "/webrtc-direct"],
          },
          peerDiscovery: [bootstrap(bootstrapConfig)],
          connectionEncrypters: [noise()],
          connectionGater: {
            denyDialMultiaddr: () => {
              return false;
            },
          },
          metrics: devToolsMetrics(),
          streamMuxers: [yamux()],
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
            }),
            autonat: autoNAT(),
            //delegatedRouting: () =>
            //  createDelegatedRoutingV1HttpApiClient(
            //    "https://delegated-ipfs.dev",
            //    delegatedHTTPRoutingDefaults()
            //  ),
          },
          transports: [
            circuitRelayTransport(),
            webRTC(),
            // tcp(),
            webRTCDirect(),
            webSockets({
              filter: filters.all,
            }),
          ],
        });
        //await libp2p.dial(
        //  peerIdFromString(
        //    "12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc"
        //  )
        //);
        const helia = await createHelia({ libp2p });
        // await libp2p.dial(
        //     multiaddr("/ip4/5.75.178.220/tcp/36437/p2p/12D3KooWBkPEDWKWCdZY28Kyy7TnegeRT61obxwdpFuQ7MfcVdRQ")
        // );
        // @ts-expect-error -- .
        setHelia(helia);
        setFs(unixfs(helia));
        setStarting(false);
      } catch (e) {
        console.error(e);
        setError(true);
      }
    }
  }, []);

  useEffect(() => {
    startHelia();
  }, []);

  const test = useCallback(async () => {
    if (helia && !te) {
      try {
        console.log("helia started ------", helia);
        const orbitdb = await createOrbitDB({
          ipfs: helia,
        });
        console.log("orbitdb", orbitdb);
        const db = await orbitdb.open(
          "/orbitdb/zdpuAvLv3TGJULV3K7YnerQSdjypzQJwfxRJdCc1eVdH6oK6Z"
        );

        console.log("huj")
        console.log("db", db);
        for await (const record of db.iterator()) {
          console.log("huj", record);
        }
        try {
            await db.put({ _id: "125", name: "hello world 1" });
        } catch (e) {
          console.error("error123 ", e);
        }
        try {
            await db.put({ _id: "126", name: "hello world 2" });
        } catch (e) {
          console.error("error123 ", e);
        }
        console.log("huj2")
        console.log(await db.get("125"));
        console.log(await db.get("126"));
        setTe(true);
        //const all = await db.all();
        //console.log("all", all);
      } catch (e) {
        console.error("error123 ", e);
      }
    }
  }, [helia]);

  useEffect(() => {
    test();
  }, [test]);

  return (
    <HeliaContext.Provider
      value={{
        helia,
        fs,
        error,
        starting,
      }}
    >
      {children}
    </HeliaContext.Provider>
  );
};
