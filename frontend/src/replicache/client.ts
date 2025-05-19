import { Replicache, type WriteTransaction } from "replicache";
import { nanoid } from "nanoid";
import type { Chamber, Comment } from "./types";

export type AppMutators = {
    createChamber: (
        tx: WriteTransaction,
        args: Omit<Chamber, "id" | "createdAt">
    ) => Promise<void>;
    createComment: (
        tx: WriteTransaction,
        args: Omit<Comment, "id" | "createdAt">
    ) => Promise<void>;
    // Other mutators to e.g. update chambers
};

async function createChamber(
    tx: WriteTransaction,
    { title, description, createdBy }: Omit<Chamber, "id" | "createdAt">
): Promise<void> {
    const id = nanoid();
    const createdAt = Date.now();
    const chamber: Chamber = {
        id,
        title,
        description,
        createdBy,
        createdAt,
    };
    await tx.set(`chamber/${id}`, chamber);
}

async function createComment(
    tx: WriteTransaction,
    { chamberId, text, createdBy }: Omit<Comment, "id" | "createdAt">
): Promise<void> {
    const id = nanoid();
    const createdAt = Date.now();
    const comment: Comment = {
        id,
        chamberId,
        text,
        createdBy,
        createdAt,
    };
    await tx.set(`comment/${chamberId}/${id}`, comment);
}

let rep: Replicache<AppMutators> | null = null;

export function getReplicacheClient(userId: string): Replicache<AppMutators> {
    if (!rep) {
        console.log("Initializing Replicache for user:", userId);
        rep = new Replicache<AppMutators>({
            // pushURL: '/api/replicache/push', // Replace with your actual push endpoint
            // pullURL: '/api/replicache/pull', // Replace with your actual pull endpoint
            // pushDelay: 100,
            licenseKey: import.meta.env.VITE_REPLICACHE_LICENSE_KEY ?? "",

            name: `user-${userId}`,

            mutators: {
                createChamber,
                createComment,
            },
            logLevel: "debug",
        });

        rep.onSync = (syncing) => {
            console.log("Replicache sync status:", syncing);
        };
    }
    return rep;
}
