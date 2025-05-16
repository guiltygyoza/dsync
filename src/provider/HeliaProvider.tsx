import { unixfs, type UnixFS } from "@helia/unixfs";
import type { Libp2p } from "@libp2p/interface";
import { createOrbitDB, IPFSAccessController } from "@orbitdb/core";
import {
  createHelia,
  type DefaultLibp2pServices,
  type HeliaLibp2p,
} from "helia";
import { useEffect, useState, useCallback, createContext } from "react";

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
        const helia = await createHelia();
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
      console.log("helia started ------", helia);
      const orbitdb = await createOrbitDB({
        ipfs: helia,
        id: "user-1",
      });
      const db = await orbitdb.open("db-kiwi-jan", {
        type: "documents",
        AccessController: IPFSAccessController({
          write: [orbitdb.identity.id],
        }),
      });
      console.log("putting", db);
      await db.put({ _id: "doc-1", content: "hello" });
      console.log("putted");
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
