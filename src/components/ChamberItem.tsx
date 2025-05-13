import type { Chamber } from '../replicache/types';
import { Link } from 'react-router-dom';

interface ChamberItemProps {
    chamber: Chamber;
}

function ChamberItem({ chamber }: ChamberItemProps) {
    return (
        <li key={chamber.id}>
            <Link to={`/chamber/${chamber.id}`}>{chamber.title}</Link>
            <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#555' }}>
                by {chamber.createdBy} on {new Date(chamber.createdAt).toLocaleDateString()}
            </span>
        </li>
    );
}

export default ChamberItem; 