declare module '@orbitdb/core' {
    export function createOrbitDB(options: { ipfs: any }): Promise<any>;
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
