import React, { useState } from 'react';
import { useReplicache } from '../replicache/ReplicacheContext';
import { useNavigate } from 'react-router-dom';

function CreateChamberForm() {
    // Get rep and userId from context
    const { rep, userId } = useReplicache();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use userId from context for createdBy
    // const createdBy = 'user1'; // Remove hardcoded ID

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Ensure rep and userId are available
        if (!rep || !userId || isSubmitting) return;
        if (!title.trim() || !description.trim()) {
            setError('Title and description cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await rep.mutate.createChamber({ title, description, createdBy: userId });
            setTitle('');
            setDescription('');
            navigate('/');
        } catch (err) {
            console.error('Failed to create chamber:', err);
            setError('Failed to create chamber. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px' }}
                    disabled={isSubmitting}
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={5}
                    style={{ width: '100%', padding: '8px' }}
                    disabled={isSubmitting}
                />
            </div>
            <button type="submit" disabled={!rep || !userId || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Chamber'}
            </button>
        </form>
    );
}

export default CreateChamberForm; 