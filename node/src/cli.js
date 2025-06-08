#!/usr/bin/env node
"use strict";
/// <reference types="node" />
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var helia_1 = require("helia");
// @ts-expect-error -- .
var core_1 = require("@orbitdb/core");
var libp2p_1 = require("libp2p");
var libp2p_noise_1 = require("@chainsafe/libp2p-noise");
var libp2p_yamux_1 = require("@chainsafe/libp2p-yamux");
var blockstore_level_1 = require("blockstore-level");
var libp2p_auto_tls_1 = require("@ipshipyard/libp2p-auto-tls");
var autonat_1 = require("@libp2p/autonat");
var bootstrap_1 = require("@libp2p/bootstrap");
var circuit_relay_v2_1 = require("@libp2p/circuit-relay-v2");
var dcutr_1 = require("@libp2p/dcutr");
var identify_1 = require("@libp2p/identify");
var kad_dht_1 = require("@libp2p/kad-dht");
var mdns_1 = require("@libp2p/mdns");
var ping_1 = require("@libp2p/ping");
var tcp_1 = require("@libp2p/tcp");
var tls_1 = require("@libp2p/tls");
var upnp_nat_1 = require("@libp2p/upnp-nat");
var webrtc_1 = require("@libp2p/webrtc");
var websockets_1 = require("@libp2p/websockets");
var selector_1 = require("ipns/selector");
var validator_1 = require("ipns/validator");
var libp2p_gossipsub_1 = require("@chainsafe/libp2p-gossipsub");
var filters = require("@libp2p/websockets/filters");
var keychain_1 = require("@libp2p/keychain");
var keys_1 = require("@libp2p/crypto/keys");
var express_1 = require("express");
// import { Alchemy, Network } from "alchemy-sdk";
// import crypto from "crypto";
var routers_1 = require("@helia/routers");
var dotenv = require("dotenv");
var placeholderData_js_1 = require("./placeholderData.js");
var bootstrapConfig = {
    list: [
        // "/ip4/157.90.152.156/tcp/36843/ws/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
        // "/ip4/157.90.152.156/tcp/36437/p2p/12D3KooWB1J5ksLv96GTyH5Ugp1a8CDpLr5XGXpNHwWorTx95PDc",
        "/ip4/86.252.78.192/tcp/9999/ws/p2p/12D3KooWJ3EqVf1X6QoBkeUSoRZyg8S11g8QVeyE8guVudedNZqv",
        // "/ip4/86.252.78.192/tcp/54395/p2p/12D3KooWJ3EqVf1X6QoBkeUSoRZyg8S11g8QVeyE8guVudedNZqv",
    ],
};
var program = new commander_1.Command();
program.name("dsync-cli").description("CLI for interacting with Dsync").version("1.0.0");
dotenv.config();
function startOrbitDB() {
    return __awaiter(this, arguments, void 0, function (addresses) {
        var privKeyBuffer, padding, seed, privateKey, libp2p, blockstore, helia, orbitdb;
        if (addresses === void 0) { addresses = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.env.PRIVATE_KEY_SEED) {
                        privKeyBuffer = Buffer.from(process.env.PRIVATE_KEY_SEED, "utf-8");
                        if (privKeyBuffer.length < 32) {
                            padding = Buffer.alloc(32 - privKeyBuffer.length);
                            privKeyBuffer = Buffer.concat([privKeyBuffer, padding]);
                        }
                        else if (privKeyBuffer.length > 32) {
                            privKeyBuffer = privKeyBuffer.subarray(0, 32);
                        }
                    }
                    else {
                        console.error("PRIVATE_KEY_SEED is not set");
                        process.exit(1);
                    }
                    seed = new Uint8Array(privKeyBuffer || []);
                    return [4 /*yield*/, (0, keys_1.generateKeyPairFromSeed)("Ed25519", seed)];
                case 1:
                    privateKey = _a.sent();
                    return [4 /*yield*/, (0, libp2p_1.createLibp2p)(__assign({ privateKey: privateKey, addresses: {
                                listen: addresses,
                            }, peerDiscovery: [(0, bootstrap_1.bootstrap)(bootstrapConfig), (0, mdns_1.mdns)()], connectionEncrypters: [(0, libp2p_noise_1.noise)(), (0, tls_1.tls)()], connectionGater: {
                                denyDialMultiaddr: function () { return false; },
                            }, streamMuxers: [(0, libp2p_yamux_1.yamux)()], services: {
                                dht: (0, kad_dht_1.kadDHT)({
                                    validators: { ipns: validator_1.ipnsValidator },
                                    selectors: { ipns: selector_1.ipnsSelector },
                                }),
                                ping: (0, ping_1.ping)(),
                                dcutr: (0, dcutr_1.dcutr)(),
                                identify: (0, identify_1.identify)(),
                                identifyPush: (0, identify_1.identifyPush)(),
                                pubsub: (0, libp2p_gossipsub_1.gossipsub)({
                                    allowPublishToZeroTopicPeers: true,
                                    fallbackToFloodsub: true,
                                    scoreParams: {
                                        IPColocationFactorWeight: 0,
                                    },
                                }),
                                autonat: (0, autonat_1.autoNAT)(),
                                autoTLS: (0, libp2p_auto_tls_1.autoTLS)(),
                                upnp: (0, upnp_nat_1.uPnPNAT)(),
                                relay: (0, circuit_relay_v2_1.circuitRelayServer)(),
                                keychain: (0, keychain_1.keychain)({}),
                            }, transports: [(0, circuit_relay_v2_1.circuitRelayTransport)(), (0, webrtc_1.webRTC)(), (0, webrtc_1.webRTCDirect)(), (0, websockets_1.webSockets)({ filter: filters.all }), (0, tcp_1.tcp)()] }, (privKeyBuffer && { identity: { privKey: privKeyBuffer } })))];
                case 2:
                    libp2p = _a.sent();
                    blockstore = new blockstore_level_1.LevelBlockstore("./ipfs");
                    return [4 /*yield*/, (0, helia_1.createHelia)({ libp2p: libp2p, blockstore: blockstore, routers: [(0, routers_1.libp2pRouting)(libp2p)] })];
                case 3:
                    helia = _a.sent();
                    return [4 /*yield*/, (0, core_1.createOrbitDB)({ ipfs: helia, id: "bootstrap", blockstore: blockstore })];
                case 4:
                    orbitdb = _a.sent();
                    return [2 /*return*/, { orbitdb: orbitdb, libp2p: libp2p }];
            }
        });
    });
}
program
    .command("get-orbitdb-id")
    .description("Get the orbit db id")
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var orbitdb;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, startOrbitDB()];
            case 1:
                orbitdb = (_a.sent()).orbitdb;
                console.log("orbitdb id", orbitdb.identity.id);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
program
    .command("run")
    .description("Start the node and keep it running")
    .option("-t, --tcp-port <port>", "TCP port to listen on")
    .option("-w, --ws-port <port>", "WebSocket port to listen on")
    .option("-r, --webrtc-port <port>", "WebRTC port to listen on")
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var ALCHEMY_API_KEY, ALCHEMY_WEBHOOK_SIGNING_SECRET, EIP_MANAGER_CONTRACT_ADDRESS, WEBHOOK_PORT, addresses, _a, orbitdb, libp2p, testKV, DBFINDER_NAME, DBFinder, _i, placeholderEIPs_1, eip, eipDoc, coreInfo, _b, _c, _d, record, e_1_1, _e, placeholderEIPs_2, eip, eipDoc, _f, placeholderComments_1, comment, app;
    var _g, e_1, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || undefined;
                ALCHEMY_WEBHOOK_SIGNING_SECRET = process.env.ALCHEMY_WEBHOOK_SIGNING_SECRET || undefined;
                EIP_MANAGER_CONTRACT_ADDRESS = process.env.EIP_MANAGER_CONTRACT_ADDRESS || undefined;
                WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3001;
                if (!ALCHEMY_API_KEY || !EIP_MANAGER_CONTRACT_ADDRESS) {
                    console.warn("Please set your ALCHEMY_API_KEY and EIP_MANAGER_CONTRACT_ADDRESS environment variables or update them in cli.ts");
                }
                if (!ALCHEMY_WEBHOOK_SIGNING_SECRET) {
                    console.warn("Remember to set your ALCHEMY_WEBHOOK_SIGNING_SECRET for webhook verification.");
                }
                addresses = {
                    listen: [
                        //options.tcpPort ? `/ip4/0.0.0.0/tcp/${options.tcpPort}` : '/ip4/0.0.0.0/tcp/0',
                        options.wsPort ? "/ip4/0.0.0.0/tcp/".concat(options.wsPort, "/ws") : "/ip4/0.0.0.0/tcp/0/ws",
                        //options.webrtcPort ? `/ip4/0.0.0.0/udp/${options.webrtcPort}/webrtc-direct` : '/ip4/0.0.0.0/udp/0/webrtc-direct',
                        //'/ip6/::/tcp/0',
                        //'/ip6/::/tcp/0/ws',
                        //'/ip6/::/udp/0/webrtc-direct',
                        "/p2p-circuit",
                        "/webrtc",
                        "/webrtc-direct",
                    ],
                };
                return [4 /*yield*/, startOrbitDB(addresses.listen)];
            case 1:
                _a = _k.sent(), orbitdb = _a.orbitdb, libp2p = _a.libp2p;
                console.log(libp2p.getMultiaddrs());
                console.log(libp2p.peerId);
                libp2p.addEventListener("peer:connect", function (peerId) {
                    console.log("peer:connect", peerId.detail);
                });
                libp2p.addEventListener("transport:listening", function () {
                    console.log("transport:listening", libp2p.getMultiaddrs());
                });
                libp2p.addEventListener("peer:disconnect", function (peerId) {
                    console.log("peer:disconnect", peerId.detail);
                });
                return [4 /*yield*/, orbitdb.open("/orbitdb/zdpuB3UdPyM3A4mW7mr54nwTZLyTderAQ37FJ9dNzE6UXUVfY", {
                        type: "keyvalue",
                    })];
            case 2:
                testKV = _k.sent();
                console.log("testKV", testKV.address.toString());
                DBFINDER_NAME = "dbfinder";
                console.log("orbitdb id", orbitdb.identity.id);
                return [4 /*yield*/, orbitdb.open(DBFINDER_NAME, {
                        type: "keyvalue",
                        AccessController: (0, core_1.IPFSAccessController)({
                            write: [orbitdb.identity.id],
                        }),
                    })];
            case 3:
                DBFinder = _k.sent();
                console.log("DBFinder address", DBFinder.address.toString());
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                DBFinder.events.on("update", function (entry) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        console.log("Database update:", entry.payload.value);
                        return [2 /*return*/];
                    });
                }); });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                DBFinder.events.on("error", function (error) {
                    console.error("Database error:", error);
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                DBFinder.events.on("join", function (peerId) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // The peerId of the ipfs1 node.
                        console.log("join", peerId);
                        return [2 /*return*/];
                    });
                }); });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                DBFinder.events.on("close", function (peerId) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // The peerId of the ipfs1 node.
                        console.log("close", peerId);
                        return [2 /*return*/];
                    });
                }); });
                _i = 0, placeholderEIPs_1 = placeholderData_js_1.placeholderEIPs;
                _k.label = 4;
            case 4:
                if (!(_i < placeholderEIPs_1.length)) return [3 /*break*/, 8];
                eip = placeholderEIPs_1[_i];
                return [4 /*yield*/, orbitdb.open(eip.dbAddress, {
                        type: "documents",
                        AccessController: (0, core_1.IPFSAccessController)({ write: [orbitdb.identity.id] }),
                    })];
            case 5:
                eipDoc = _k.sent();
                eip.dbAddress = eipDoc.address.toString();
                coreInfo = {
                    id: eip.id,
                    title: eip.title,
                    status: eip.status,
                    category: eip.category,
                    dbAddress: eip.dbAddress,
                };
                return [4 /*yield*/, DBFinder.put(eip.id.toString(), JSON.stringify(coreInfo))];
            case 6:
                _k.sent();
                _k.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 4];
            case 8:
                console.log("Inserted data into DBFinder");
                _k.label = 9;
            case 9:
                _k.trys.push([9, 14, 15, 20]);
                _b = true, _c = __asyncValues(DBFinder.iterator());
                _k.label = 10;
            case 10: return [4 /*yield*/, _c.next()];
            case 11:
                if (!(_d = _k.sent(), _g = _d.done, !_g)) return [3 /*break*/, 13];
                _j = _d.value;
                _b = false;
                record = _j;
                console.log("record", JSON.parse(record.value));
                _k.label = 12;
            case 12:
                _b = true;
                return [3 /*break*/, 10];
            case 13: return [3 /*break*/, 20];
            case 14:
                e_1_1 = _k.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 20];
            case 15:
                _k.trys.push([15, , 18, 19]);
                if (!(!_b && !_g && (_h = _c.return))) return [3 /*break*/, 17];
                return [4 /*yield*/, _h.call(_c)];
            case 16:
                _k.sent();
                _k.label = 17;
            case 17: return [3 /*break*/, 19];
            case 18:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 19: return [7 /*endfinally*/];
            case 20:
                _e = 0, placeholderEIPs_2 = placeholderData_js_1.placeholderEIPs;
                _k.label = 21;
            case 21:
                if (!(_e < placeholderEIPs_2.length)) return [3 /*break*/, 29];
                eip = placeholderEIPs_2[_e];
                return [4 /*yield*/, orbitdb.open(eip.dbAddress, { type: "documents" })];
            case 22:
                eipDoc = _k.sent();
                return [4 /*yield*/, eipDoc.put({
                        _id: "special-id-for-eip",
                        title: eip.title,
                        description: eip.description,
                        content: eip.content,
                        status: eip.status,
                        category: eip.category,
                        authors: eip.authors,
                        createdAt: eip.createdAt.toISOString(),
                        updatedAt: eip.updatedAt.toISOString(),
                        requires: eip.requires,
                        dbAddress: eip.dbAddress,
                    })];
            case 23:
                _k.sent();
                _f = 0, placeholderComments_1 = placeholderData_js_1.placeholderComments;
                _k.label = 24;
            case 24:
                if (!(_f < placeholderComments_1.length)) return [3 /*break*/, 27];
                comment = placeholderComments_1[_f];
                if (!(comment.eipId === eip.id)) return [3 /*break*/, 26];
                return [4 /*yield*/, eipDoc.put({
                        _id: comment.id,
                        eipId: comment.eipId,
                        content: comment.content,
                        createdBy: comment.createdBy,
                        createdAt: comment.createdAt.toISOString(),
                        parentId: comment.parentId,
                    })];
            case 25:
                _k.sent();
                _k.label = 26;
            case 26:
                _f++;
                return [3 /*break*/, 24];
            case 27:
                console.log("inserted eip data", eip.id);
                _k.label = 28;
            case 28:
                _e++;
                return [3 /*break*/, 21];
            case 29:
                // for await (const record of DBFinder.iterator()) {
                // 	const recordValue = JSON.parse(record.value) as ICoreEIPInfo;
                // 	console.log("record", recordValue);
                // 	const fullEip = await orbitdb.open(recordValue.dbAddress, { type: "documents" });
                // 	console.log("fullEip", fullEip.address.toString());
                // 	for await (const eipRecord of fullEip.iterator()) {
                // 		console.log("eipRecord", eipRecord);
                // 	}
                // }
                console.log("Completed inserting placeholder data");
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
                app = (0, express_1.default)();
                app.use(function (req, res, next) {
                    if (req.originalUrl === "/alchemy-webhook") {
                        var data_1 = "";
                        req.setEncoding("utf8");
                        req.on("data", function (chunk) {
                            data_1 += chunk;
                        });
                        req.on("end", function () {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            req.rawBody = data_1;
                            next();
                        });
                    }
                    else {
                        express_1.default.json()(req, res, next);
                    }
                });
                app.post("/alchemy-webhook", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // TODO
                        res.json(req.body);
                        res.status(200).send("Webhook received");
                        return [2 /*return*/];
                    });
                }); });
                app.listen(WEBHOOK_PORT, function () {
                    console.log("Webhook server listening on port ".concat(WEBHOOK_PORT));
                });
                console.log("Node is running. Press Ctrl+C to stop.");
                // Keep the process running
                process.on("SIGINT", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log("\nStopping node...");
                                return [4 /*yield*/, libp2p.stop()];
                            case 1:
                                _a.sent();
                                process.exit(0);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); });
program.parse();
