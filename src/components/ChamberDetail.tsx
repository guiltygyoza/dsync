import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useReplicache } from '../replicache/ReplicacheContext';
import { useSubscribe } from '../hooks/useReplicacheSubscribe';
import type { Chamber } from '../replicache/types';
import type { ReadTransaction } from 'replicache';

function ChamberDetail() {
    const { chamberId } = useParams<{ chamberId: string }>();
    const { rep } = useReplicache();

    const chamberQuery = useCallback(async (tx: ReadTransaction) => {
        if (!chamberId) return null;
        return await tx.get<Chamber>(`chamber/${chamberId}`);
    }, [chamberId]);

    const chamber = useSubscribe(
        rep,
        chamberQuery,
        {
            default: null as Chamber | null,
            dependencies: [chamberId],
        }
    );

    if (!rep) {
        return <div>Initializing Replicache...</div>;
    }

    if (!chamberId) {
        return <div>No chamber ID specified.</div>;
    }

    if (chamber === undefined) {
        return <div>Loading chamber details...</div>;
    }

    if (chamber === null) {
        return <div>Chamber not found.</div>;
    }

    return (
        <div>
            <h1>{chamber.title}</h1>
            <p style={{ whiteSpace: 'pre-wrap' }}>{chamber.description}</p>
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
                <p>Created by: {chamber.createdBy}</p>
                <p>Created at: {new Date(chamber.createdAt).toLocaleString()}</p>
            </div>
        </div>
    );
}

export default ChamberDetail; 