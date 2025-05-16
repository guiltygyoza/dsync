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

export const bootstrapConfig = {
  list: [
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
    // va1 is not in the TXT records for _dnsaddr.bootstrap.libp2p.io yet
    // so use the host name directly
    "/dnsaddr/va1.bootstrap.libp2p.io/p2p/12D3KooWKnDdG3iXw9eTFijk3EWSunZcFi54Zka4wmtqtt6rPxc8",
    "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
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
            pubsub: gossipsub(),
            autonat: autoNAT(),
            delegatedRouting: () =>
              createDelegatedRoutingV1HttpApiClient(
                "https://delegated-ipfs.dev",
                delegatedHTTPRoutingDefaults()
              ),
          },
          transports: [
            circuitRelayTransport(),
            webRTC(),
            webRTCDirect(),
            webSockets({
              filter: filters.all,
            }),
          ],
        });
        const helia = await createHelia({ libp2p });
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
    if (helia) {
      try {
        console.log("helia started ------", helia);
        const orbitdb = await createOrbitDB({
          ipfs: helia,
          id: "user-1",
        });
        console.log("orbitdb", orbitdb);
        const db = await orbitdb.open("db-kiwi-jan-123132", {
          type: "documents",
          AccessController: IPFSAccessController({
            write: ["*"],
          }),
        });
        console.log("putting", db);
        await db.put({ _id: "doc-1", content: "hello" });
        console.log("putted");

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
