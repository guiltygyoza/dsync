import { OrbitDB } from "@orbitdb/core";
import { IncomingStreamData, Logger, serviceCapabilities, Startable } from "@libp2p/interface";
import type { DBFinderComponents, DBFinderInit, DBFinder as DBFinderInterface } from "./index.js";
import { MAX_INBOUND_STREAMS, MAX_OUTBOUND_STREAMS, PROTOCOL_VERSION } from "./constants.js";
import { PROTOCOL_NAME } from "./constants.js";
import { PROTOCOL_PREFIX } from "./constants.js";
import { pbStream } from "it-protobuf-stream";
import { AddDBResponse, DBFinderMessage, FindDBResponse } from "./pb/message.js";

export class DBFinder implements DBFinderInterface, Startable {
	private _db: OrbitDB;
	public readonly protocol: string;
	private readonly components: DBFinderComponents;
	private started: boolean;
	private readonly log: Logger;
	private readonly maxInboundStreams: number;
	private readonly maxOutboundStreams: number;
	private readonly runOnLimitedConnection: boolean;

	constructor(components: DBFinderComponents) {
		this.components = components;
		this.log = components.logger.forComponent("dsync:db-finder");
		this.started = false;
		this.protocol = `/${PROTOCOL_PREFIX}/${PROTOCOL_NAME}/${PROTOCOL_VERSION}`;
		this.maxInboundStreams = MAX_INBOUND_STREAMS;
		this.maxOutboundStreams = MAX_OUTBOUND_STREAMS;
		this.runOnLimitedConnection = true;

		this.handleMessage = this.handleMessage.bind(this);
	}

	readonly [Symbol.toStringTag] = "@dsync/db-finder";

	readonly [serviceCapabilities]: string[] = ["@dsync/db-finder"];

	async start() {
		await this.components.registrar.handle(this.protocol, this.handleMessage, {
			maxInboundStreams: this.maxInboundStreams,
			maxOutboundStreams: this.maxOutboundStreams,
			runOnLimitedConnection: this.runOnLimitedConnection,
		});
		this.started = true;
	}

	public stop() {
		this.started = false;
	}

	async findDB(dbName: string) {
		const db = await this.db.open(dbName);

		return "toto";
	}

	public async addDB(dbName: string) {
		return true;
	}

	public get db() {
		return this._db;
	}

	public set db(db: OrbitDB) {
		this._db = db;
	}

	async handleMessage(data: IncomingStreamData): Promise<void> {
		this.log("incoming message", data.connection.remotePeer);
		const { stream } = data;

		try {
			const pb = pbStream(stream).pb(DBFinderMessage);
			const message = await pb.read();

			switch (message.type) {
				case DBFinderMessage.MessageType.FIND_DB: {
					//this.findDB(message.findDbRequest!.dbName)
					// write the rest
					const respPB = pbStream(stream).pb(FindDBResponse);
					await respPB.write({
						dbAddress: "toto",
					});
					break;
				}
				case DBFinderMessage.MessageType.ADD_DB: {
					//this.addDB(message.addDbRequest!.dbName)
					// write the rest
					const respPB = pbStream(stream).pb(AddDBResponse);
					await respPB.write({
						success: true,
					});
					break;
				}
			}

			await stream.close();
		} catch (error: any) {
			this.log("error", error);
			stream.abort(error);
			return;
		}

		this.log("message handled", data.connection.remotePeer);
	}
}
