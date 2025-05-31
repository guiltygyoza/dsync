import type { IComment } from "../types/comment";

interface CommentItemProps {
	comment: IComment;
}

function CommentItem({ comment }: CommentItemProps) {
	return (
		<li style={{ borderBottom: "1px solid #eee", padding: "10px 0" }}>
			<p style={{ margin: "0 0 5px 0" }}>{comment.text}</p>
			<div style={{ fontSize: "0.8em", color: "#555" }}>
				<span>By: {comment.createdBy}</span>
				<span style={{ marginLeft: "10px" }}>At: {new Date(comment.createdAt).toLocaleString()}</span>
			</div>
		</li>
	);
}

export default CommentItem;
