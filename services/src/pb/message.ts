/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable import/consistent-type-specifier-style */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { decodeMessage, encodeMessage, enumeration, message } from "protons-runtime";
import type { Codec, DecodeOptions } from "protons-runtime";
import type { Uint8ArrayList } from "uint8arraylist";

export interface DBFinderMessage {
	type: DBFinderMessage.MessageType;
	findDbRequest?: FindDBRequest;
	addDbRequest?: AddDBRequest;
}

export namespace DBFinderMessage {
	export enum MessageType {
		FIND_DB = "FIND_DB",
		ADD_DB = "ADD_DB",
	}

	enum __MessageTypeValues {
		FIND_DB = 0,
		ADD_DB = 1,
	}

	export namespace MessageType {
		export const codec = (): Codec<MessageType> => {
			return enumeration<MessageType>(__MessageTypeValues);
		};
	}

	let _codec: Codec<DBFinderMessage>;

	export const codec = (): Codec<DBFinderMessage> => {
		if (_codec == null) {
			_codec = message<DBFinderMessage>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.type != null && __MessageTypeValues[obj.type] !== 0) {
						w.uint32(8);
						DBFinderMessage.MessageType.codec().encode(obj.type, w);
					}

					if (obj.findDbRequest != null) {
						w.uint32(18);
						FindDBRequest.codec().encode(obj.findDbRequest, w);
					}

					if (obj.addDbRequest != null) {
						w.uint32(26);
						AddDBRequest.codec().encode(obj.addDbRequest, w);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						type: MessageType.FIND_DB,
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.type = DBFinderMessage.MessageType.codec().decode(reader);
								break;
							}
							case 2: {
								obj.findDbRequest = FindDBRequest.codec().decode(reader, reader.uint32(), {
									limits: opts.limits?.findDbRequest,
								});
								break;
							}
							case 3: {
								obj.addDbRequest = AddDBRequest.codec().decode(reader, reader.uint32(), {
									limits: opts.limits?.addDbRequest,
								});
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<DBFinderMessage>): Uint8Array => {
		return encodeMessage(obj, DBFinderMessage.codec());
	};

	export const decode = (
		buf: Uint8Array | Uint8ArrayList,
		opts?: DecodeOptions<DBFinderMessage>
	): DBFinderMessage => {
		return decodeMessage(buf, DBFinderMessage.codec(), opts);
	};
}

export interface FindDBRequest {
	dbName: string;
}

export namespace FindDBRequest {
	let _codec: Codec<FindDBRequest>;

	export const codec = (): Codec<FindDBRequest> => {
		if (_codec == null) {
			_codec = message<FindDBRequest>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.dbName != null && obj.dbName !== "") {
						w.uint32(10);
						w.string(obj.dbName);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						dbName: "",
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.dbName = reader.string();
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<FindDBRequest>): Uint8Array => {
		return encodeMessage(obj, FindDBRequest.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<FindDBRequest>): FindDBRequest => {
		return decodeMessage(buf, FindDBRequest.codec(), opts);
	};
}

export interface AddDBRequest {
	dbName: string;
	dbAddress: string;
}

export namespace AddDBRequest {
	let _codec: Codec<AddDBRequest>;

	export const codec = (): Codec<AddDBRequest> => {
		if (_codec == null) {
			_codec = message<AddDBRequest>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.dbName != null && obj.dbName !== "") {
						w.uint32(10);
						w.string(obj.dbName);
					}

					if (obj.dbAddress != null && obj.dbAddress !== "") {
						w.uint32(18);
						w.string(obj.dbAddress);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						dbName: "",
						dbAddress: "",
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.dbName = reader.string();
								break;
							}
							case 2: {
								obj.dbAddress = reader.string();
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<AddDBRequest>): Uint8Array => {
		return encodeMessage(obj, AddDBRequest.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<AddDBRequest>): AddDBRequest => {
		return decodeMessage(buf, AddDBRequest.codec(), opts);
	};
}

export interface FindDBResponse {
	dbAddress: string;
}

export namespace FindDBResponse {
	let _codec: Codec<FindDBResponse>;

	export const codec = (): Codec<FindDBResponse> => {
		if (_codec == null) {
			_codec = message<FindDBResponse>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.dbAddress != null && obj.dbAddress !== "") {
						w.uint32(10);
						w.string(obj.dbAddress);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						dbAddress: "",
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.dbAddress = reader.string();
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<FindDBResponse>): Uint8Array => {
		return encodeMessage(obj, FindDBResponse.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<FindDBResponse>): FindDBResponse => {
		return decodeMessage(buf, FindDBResponse.codec(), opts);
	};
}

export interface AddDBResponse {
	success: boolean;
}

export namespace AddDBResponse {
	let _codec: Codec<AddDBResponse>;

	export const codec = (): Codec<AddDBResponse> => {
		if (_codec == null) {
			_codec = message<AddDBResponse>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.success != null && obj.success !== false) {
						w.uint32(8);
						w.bool(obj.success);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length, opts = {}) => {
					const obj: any = {
						success: false,
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1: {
								obj.success = reader.bool();
								break;
							}
							default: {
								reader.skipType(tag & 7);
								break;
							}
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<AddDBResponse>): Uint8Array => {
		return encodeMessage(obj, AddDBResponse.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<AddDBResponse>): AddDBResponse => {
		return decodeMessage(buf, AddDBResponse.codec(), opts);
	};
}
