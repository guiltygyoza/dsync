import { useParams } from "react-router-dom";
import type { IComment } from "../types/comment";
import CommentItem from "./CommentItem";

function CommentList() {
	const { chamberId } = useParams<{ chamberId: string }>();

	// const commentQuery =

	const comments: IComment[] = [];

	if (!chamberId) {
		return <div>Loading comments...</div>;
	}

	return (
		<ul style={{ listStyle: "none", padding: 0, marginTop: "20px" }}>
			{comments.length === 0 ? (
				<p>No comments yet.</p>
			) : (
				comments.map((comment: IComment) => <CommentItem key={comment.id} comment={comment} />)
			)}
		</ul>
	);
}

export default CommentList;
