import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReplicache } from '../replicache/ReplicacheContext';

function CreateCommentForm() {
    const { chamberId } = useParams<{ chamberId: string }>();
    const { rep, userId } = useReplicache();
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!rep || !userId || !chamberId || isSubmitting || !text.trim()) {
            if (!text.trim()) setError('Comment cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await rep.mutate.createComment({
                chamberId,
                text,
                createdBy: userId,
            });
            setText('');
        } catch (err) {
            console.error('Failed to create comment:', err);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add your comment..."
                rows={3}
                required
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                disabled={!rep || !userId || isSubmitting}
            />
            <button type="submit" disabled={!rep || !userId || isSubmitting || !text.trim()}>
                {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
        </form>
    );
}

export default CreateCommentForm; 