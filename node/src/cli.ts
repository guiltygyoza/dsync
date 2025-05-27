#!/usr/bin/env node

import { Command } from 'commander';
import { createHelia } from 'helia';
import { createOrbitDB, IPFSAccessController } from '@orbitdb/core';
import { createLibp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { autoTLS } from '@ipshipyard/libp2p-auto-tls';
import { autoNAT } from '@libp2p/autonat';
import { bootstrap } from '@libp2p/bootstrap';
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2';
import { dcutr } from '@libp2p/dcutr';
import { identify, identifyPush } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { mdns } from '@libp2p/mdns';
import { ping } from '@libp2p/ping';
import { tcp } from '@libp2p/tcp';
import { tls } from '@libp2p/tls';
import { uPnPNAT } from '@libp2p/upnp-nat';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { ipnsSelector } from 'ipns/selector';
import { ipnsValidator } from 'ipns/validator';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import * as filters from '@libp2p/websockets/filters';
import { keychain } from '@libp2p/keychain';
import { generateKeyPairFromSeed } from '@libp2p/crypto/keys';

interface RunOptions {
    tcpPort?: number;
    wsPort?: number;
    webrtcPort?: number;
    privKeySeed?: string;
}

const bootstrapConfig = {
    list: [
        "/ip4/157.90.152.156/tcp/36843/ws/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
        "/ip4/157.90.152.156/tcp/36437/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
    ],
};

const program = new Command();

program
  .name('orbitdb-cli')
  .description('CLI for interacting with OrbitDB')
  .version('1.0.0');

program
  .command('run')
  .description('Start the node and keep it running')
  .option('-t, --tcp-port <port>', 'TCP port to listen on')
  .option('-w, --ws-port <port>', 'WebSocket port to listen on')
  .option('-r, --webrtc-port <port>', 'WebRTC port to listen on')
  .option('-k, --priv-key-seed <seed>', 'Private key seed')
  .action(async (options: RunOptions) => {
    let privKeyBuffer: Buffer | undefined;
    
    if (options.privKeySeed) {
      privKeyBuffer = Buffer.from(options.privKeySeed, 'utf-8');

      if (privKeyBuffer.length < 32) {
        const padding = Buffer.alloc(32 - privKeyBuffer.length);
        privKeyBuffer = Buffer.concat([privKeyBuffer, padding]);
      } else if (privKeyBuffer.length > 32) {
        privKeyBuffer = privKeyBuffer.subarray(0, 32);
      }
    }

    const seed = new Uint8Array(privKeyBuffer || []);
    console.log('seed', seed.length);

    const privateKey = await generateKeyPairFromSeed("Ed25519", seed);

    const addresses = {
      listen: [
        options.tcpPort ? `/ip4/0.0.0.0/tcp/${options.tcpPort}` : '/ip4/0.0.0.0/tcp/0',
        options.wsPort ? `/ip4/0.0.0.0/tcp/${options.wsPort}/ws` : '/ip4/0.0.0.0/tcp/0/ws',
        options.webrtcPort ? `/ip4/0.0.0.0/udp/${options.webrtcPort}/webrtc-direct` : '/ip4/0.0.0.0/udp/0/webrtc-direct',
        '/ip6/::/tcp/0',
        '/ip6/::/tcp/0/ws',
        '/ip6/::/udp/0/webrtc-direct',
        '/p2p-circuit',
      ],
    };

    const libp2p = await createLibp2p({
      privateKey,
      addresses,
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
      transports: [
        circuitRelayTransport(),
        webRTC(),
        webRTCDirect(),
        webSockets({ filter: filters.all }),
        tcp(),
      ],
       ...(privKeyBuffer && { identity: { privKey: privKeyBuffer } }),
    });

    console.log(libp2p.getMultiaddrs());
    const DBFINDER_NAME = "DBFinder";

    const helia = await createHelia({ libp2p });
    const orbitdb = await createOrbitDB({ ipfs: helia, id: "userA" });
    const DBFinder = await orbitdb.open(DBFINDER_NAME, { type: 'keyvalue', AccessController: IPFSAccessController({write: [orbitdb.identity.id]}) });
    console.log('DBFinder address', DBFinder.address.toString());
    DBFinder.events.on('update', async (entry: any) => {
      console.log('Database update:', entry.payload.value);
    });
    DBFinder.events.on('error', (error: any) => {
      console.error('Database error:', error);
    });

    // await DBFinder.put("eip2", "eip2Addr");
    // const eip1 = await orbitdb.open("eip1", { type: 'documents', AccessController: IPFSAccessController({write: [orbitdb.identity.id]}) });
    // console.log('eip1 address', eip1.address.toString());

    // const eip1second = await orbitdb.open(await DBFinder.get("eip1"));
    // console.log('eip1second address', eip1second.address.toString());
    // const eip1Addr = eip1.address.toString();
    // await DBFinder.put("eip1", eip1Addr);
    // console.log('eip1Addr', eip1Addr);
    // await eip1.put({ _id: "123", name: "hello world title", description: "hello world description" });
    // console.log('eip1Addr', eip1Addr);

    console.log('id', orbitdb.identity.id);
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
    
    // console.log('Database address:', db.address.toString());
    console.log('Node is running. Press Ctrl+C to stop.');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nStopping node...');
      await libp2p.stop();
      process.exit(0);
    });
  });

program.parse(); 
