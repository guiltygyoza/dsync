import { useCallback } from 'react';
import { useReplicache } from '../replicache/ReplicacheContext';
import { useReplicacheSubscribe } from '../hooks/useReplicacheSubscribe';
import type { Chamber } from '../replicache/types';
import { Link } from 'react-router-dom';
import ChamberItem from './ChamberItem';
import type { ReadTransaction } from 'replicache';

function ChamberList() {
    const { rep } = useReplicache();

    const chamberQuery = useCallback(async (tx: ReadTransaction) => {
        const list = await tx.scan<Chamber>({ prefix: 'chamber/' }).values().toArray();
        list.sort((a: Chamber, b: Chamber) => b.createdAt - a.createdAt);
        return list;
    }, []);

    const chambers = useReplicacheSubscribe(
        rep,
        chamberQuery,
        {
            default: [] as Chamber[],
            // dependencies: [], // This was in the original, ensure it's still desired or correct
        }
    );

    if (!rep) {
        return <div>Initializing Replicache...</div>;
    }

    if (chambers.length === 0) {
        return <div>No chambers yet. <Link to="/chamber/new">Create one?</Link></div>;
    }

    return (
        <ul>
            {chambers.map((chamber: Chamber) => (
                <ChamberItem key={chamber.id} chamber={chamber} />
            ))}
        </ul>
    );
}

export default ChamberList; 