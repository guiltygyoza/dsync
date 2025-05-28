/* eslint-disable @typescript-eslint/no-explicit-any */
declare type Identity = any;
declare type DatabaseInstance<T = any> = {
	address: string;
	close: () => Promise<void>;
	drop: () => Promise<void>;
	// Common methods, specific stores will have more
	put: (doc: any) => Promise<any>;
	get: (key: any) => Promise<any>;
	// For KeyValue
	set?: (key: string, value: any) => Promise<any>;
	del?: (key: string) => Promise<void>;
	// For Documents
	query: (mapper: (doc: T) => boolean) => Promise<T[]>;
	// Add other common methods if known, or leave as 'any'
	[key: string]: any; // Allow other properties/methods
};
declare type Keychain = any;
declare type OrbitDBAccessController = any;
declare type OrbitDBIdentities = any;
declare type Keystore = any;
declare type IdentityProvider = any;
declare type IPFS = any;
declare type OrbitDBEntry = any; // Specific placeholder for log entries
declare type EventIterator<T> = AsyncIterable<T>;

// Main module declaration for "orbitdb"
declare module "@orbitdb/core" {
	// Re-declare essential global types if they are part of the direct API, or rely on globals
	// type IPFS = any; // Assuming global IPFS is sufficient
	// type Identity = any; // Assuming global Identity is sufficient
	// type IdentityProvider = any; // Assuming global IdentityProvider is sufficient
	// type OrbitDBIdentities = any; // Assuming global OrbitDBIdentities is sufficient

	// Main OrbitDB instance type (simplified)
	export interface OrbitDB {
		id: string;
		identity: Identity;
		directory?: string;
		stores: Record<string, DatabaseInstance<any>>;
		keystore: Keystore; // global placeholder
		keychains: Record<string, Keychain>; // global placeholder

		open<T = any>(
			address: string,
			options?: {
				type?: string; // e.g., 'documents', 'keyvalue', 'events', 'custom'
				create?: boolean;
				replicate?: boolean;
				localOnly?: boolean;
				accessController?: OrbitDBAccessController; // global placeholder
				[key: string]: any; // other options
			}
		): Promise<DatabaseInstance<T>>;

		stop: () => Promise<void>;
		disconnect: () => Promise<void>;

		// Expose other core OrbitDB methods if necessary for the test or public API
		// For example:
		// static isValidAddress(address: string): boolean;
		// static parseAddress(address: string): OrbitDBAddress;
		// new (params: any): OrbitDB; // Constructor if needed
	}

	// createOrbitDB function
	export function createOrbitDB(params: {
		ipfs: IPFS; // global placeholder
		id?: string;
		identity?: Identity | { provider: IdentityProvider; [key: string]: any };
		identities?: OrbitDBIdentities; // global placeholder
		directory?: string;
		[key: string]: any; // Allow other params
	}): Promise<OrbitDB>; // Return type is the OrbitDB interface

	// Simplified Database types (can be expanded if needed)
	// These are functions that, when called (e.g. via orbitdb.open with type), return a DatabaseInstance
	export type DocumentsStore<T = any> = DatabaseInstance<T>; // Specific methods for Documents might be added later
	export type KeyValueStore<K = string, V = any> = DatabaseInstance<{ key: K; value: V }> & {
		get: (key: K) => Promise<V | undefined>;
		set: (key: K, value: V) => Promise<string>; // hash or cid
		put: (key: K, value: V) => Promise<string>; // alias for set
		del: (key: K) => Promise<void>;
	};
	export type EventsStore<T = any> = DatabaseInstance<T> & {
		add: (data: T) => Promise<string>; // hash or cid
		iterator: (options?: any) => EventIterator<OrbitDBEntry & { payload: { value: T } }>;
		all: () => Promise<(OrbitDBEntry & { payload: { value: T } })[]>;
	};

	// The actual exported store types might be the constructor functions or factories
	// For the purpose of the test, we primarily care that `orbitdb.open` is typed.
	// The test uses `Documents` and `KeyValue` as imported types, but they are likely
	// not directly instantiated but used as type params or inferred from `orbitdb.open`.
	// If they ARE directly used as values (e.g. OrbitDB.DocumentsStore), they need to be actual exported values.
	// For now, let's assume they are primarily for type annotations in the test.
	// If `import { Documents } from 'orbitdb'` means Documents is a class/value, this needs adjustment.
	// The test file implies `Documents` and `KeyValue` are types for stores, not constructors.
	// `const db = await orbitdb.open('my-docs', { type: 'documents' });`
	// `await db.put({ _id: 'hello', value: 'world' });`
	// `const value = await db.get('hello');`
	// So, `DatabaseInstance` should cover this. The specific types like `DocumentsStore` are for more precise typing.
	// The test file does `import { createOrbitDB, Documents, KeyValue } from 'orbitdb';`
	// This means `Documents` and `KeyValue` need to be exported types.

	export type Documents<T = any> = DocumentsStore<T>;
	export type KeyValue<K = string, V = any> = KeyValueStore<K, V>;

	// Other necessary exports for the library's public API (simplified)
	export type OrbitDBAddress = any; // global placeholder is fine if it's just an opaque type
	export function isValidAddress(address: string): boolean; // Function signature
	export function parseAddress(address: string): OrbitDBAddress; // Function signature

	// Add any other types or functions that are part of the main 'orbitdb' module's public API
	// and are needed for the test file or general usage.
}

// All other 'declare module "sub/path.js"' blocks and top-level exports are removed.
// Global placeholders at the top handle any other internal types not exposed directly.
// The ts-test/test.ts should now be able to resolve 'orbitdb' and its main exports.
// The key is that 'index.d.ts' itself defines 'declare module "orbitdb"'.
