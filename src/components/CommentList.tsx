import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useReplicache } from "../replicache/ReplicacheContext";
import type { Comment } from "../replicache/types";
import CommentItem from "./CommentItem";
import type { ReadTransaction } from "replicache";
import { useReplicacheSubscribe } from "../hooks/useReplicacheSubscribe";

function CommentList() {
	const { chamberId } = useParams<{ chamberId: string }>();
	const { rep } = useReplicache();

	const commentQuery = useCallback(
		async (tx: ReadTransaction) => {
			if (!chamberId) return [];
			const list = await tx
				.scan<Comment>({ prefix: `comment/${chamberId}/` })
				.values()
				.toArray();
			list.sort((a: Comment, b: Comment) => a.createdAt - b.createdAt);
			return list;
		},
		[chamberId]
	);

	const comments = useReplicacheSubscribe(rep, commentQuery, {
		default: [] as Comment[],
		dependencies: [chamberId],
	});

	if (!rep || !chamberId) {
		return <div>Loading comments...</div>;
	}

	return (
		<ul style={{ listStyle: "none", padding: 0, marginTop: "20px" }}>
			{comments.length === 0 ? (
				<p>No comments yet.</p>
			) : (
				comments.map((comment: Comment) => <CommentItem key={comment.id} comment={comment} />)
			)}
		</ul>
	);
}

export default CommentList;
