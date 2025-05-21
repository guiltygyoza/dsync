declare module '@orbitdb/core' {
    export function createOrbitDB({ ipfs, id, identity, identities, directory } = {}): Promise<any>;
    export function Identities({ keystore, path, storage, ipfs } = {}): Promise<any>;
    export function IPFSAccessController({ write, storage } = {}): Promise<({ orbitdb, identities, address })>;
}

declare module 'commander' {
    export class Command {
        name(name: string): this;
        description(description: string): this;
        version(version: string): this;
        command(name: string): this;
        requiredOption(flags: string, description: string): this;
        option(flags: string, description: string): this;
        action(fn: (options: any) => Promise<void>): this;
        parse(): void;
    }
} 
