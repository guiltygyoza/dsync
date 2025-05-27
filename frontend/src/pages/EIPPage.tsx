import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { placeholderEIPs, placeholderComments } from "../placeholderData";
import type { IEIP } from "../types/eip";
import type { IComment } from "../types/comment";
import { EIP_STATUS } from "../constants/eip";

const isEIPEditable = (status: EIP_STATUS): boolean => {
	return [EIP_STATUS.DRAFT, EIP_STATUS.REVIEW, EIP_STATUS.LAST_CALL].includes(status);
};

interface ICommentProps {
	comment: IComment;
	allComments: IComment[];
	onReply: (parentId: string, replyText: string) => void;
	isEditable: boolean;
	currentEIPId: number;
}

const CommentItem: React.FC<ICommentProps> = ({ comment, allComments, onReply, isEditable, currentEIPId }) => {
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [replyText, setReplyText] = useState("");

	const handleReplySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (replyText.trim()) {
			onReply(comment.id, replyText);
			setReplyText("");
			setShowReplyForm(false);
		}
	};

	// Find replies for the current comment
	const replies = useMemo(() => {
		return allComments.filter((c) => c.parentId === comment.id && c.eipId === currentEIPId);
	}, [allComments, comment.id, currentEIPId]);

	return (
		<div style={{ border: "1px solid #eee", padding: "10px", marginBottom: "10px" }}>
			<p>
				<strong>{comment.createdBy}</strong> ({new Date(comment.createdAt).toLocaleDateString()}):
			</p>
			<p>{comment.text}</p>
			{isEditable && (
				<button
					onClick={() => setShowReplyForm(!showReplyForm)}
					style={{ fontSize: "0.8em", padding: "2px 5px" }}
				>
					{showReplyForm ? "Cancel" : "Reply"}
				</button>
			)}
			{showReplyForm && isEditable && (
				<form onSubmit={handleReplySubmit} style={{ marginTop: "5px" }}>
					<textarea
						value={replyText}
						onChange={(e) => setReplyText(e.target.value)}
						placeholder="Write a reply..."
						rows={2}
						style={{ width: "100%", marginBottom: "5px" }}
						required
					/>
					<button type="submit">Post Reply</button>
				</form>
			)}
			{replies.length > 0 && (
				<div style={{ marginLeft: "20px", marginTop: "10px" }}>
					{replies.map((reply) => (
						// For one-level replies, we don't pass onReply to the nested CommentItem
						// and set isEditable to false to prevent further nesting via UI.
						// We also don't pass allComments down again for one-level replies.
						<CommentItem
							key={reply.id}
							comment={reply}
							allComments={[]}
							onReply={() => {}}
							isEditable={false}
							currentEIPId={currentEIPId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const EIPPage: React.FC = () => {
	const { eipId } = useParams<{ eipId: string }>();
	const [eip, setEip] = useState<IEIP | null>(null);
	const [comments, setComments] = useState<IComment[]>([]);
	const [newCommentText, setNewCommentText] = useState("");

	useEffect(() => {
		const currentEIPId = parseInt(eipId?.replace("eip-", "") || "0", 10);
		const currentEIP = placeholderEIPs.find((e) => e.id === currentEIPId);

		if (currentEIP) {
			setEip(currentEIP);
			const eipComments = placeholderComments.filter((c) => c.eipId === currentEIP.id);
			setComments(eipComments);
		} else {
			console.warn("[EIPPage] EIP not found for eipId:", eipId);
			setEip(null);
			setComments([]);
		}
	}, [eipId]);

	const handleAddComment = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCommentText.trim() || !eip) return;

		const newComment: IComment = {
			id: `comment-${Date.now()}`,
			eipId: eip.id,
			createdBy: "CurrentUser", // Replace with actual user
			text: newCommentText,
			createdAt: Date.now(),
			parentId: null,
		};
		setComments((prevComments) => [newComment, ...prevComments]);
		setNewCommentText("");
	};

	const handleReplyToComment = (parentId: string, replyText: string) => {
		if (!eip) return;
		const newReply: IComment = {
			id: `reply-${parentId}-${Date.now()}`,
			eipId: eip.id,
			createdBy: "CurrentUser", // Replace with actual user
			text: replyText,
			createdAt: Date.now(),
			parentId: parentId,
		};
		setComments((prevComments) => [...prevComments, newReply]); // Add new reply to the flat list
	};

	// Moved these hooks before the early return
	const editable = eip ? isEIPEditable(eip.status) : false;
	const topLevelComments = useMemo(() => comments.filter((c) => c.parentId === null), [comments]);

	if (!eip) {
		return <div>Loading EIP details or EIP not found... (eipId: {eipId})</div>;
	}

	return (
		<div>
			<h1>{eip.title}</h1>
			<p>
				<i>Associated with: {eip.title}</i>
			</p>
			<p>
				<strong>EIP Status:</strong> {eip.status}
			</p>
			<p>
				<strong>EIP Category:</strong> {eip.category}
			</p>
			<p>
				<strong>EIP Description:</strong> {eip.description}
			</p>
			<p>
				<strong>Chamber Editability:</strong> {editable ? "Editable" : "Read-only"}
			</p>

			<hr style={{ margin: "20px 0" }} />

			<h2>Comments</h2>
			{editable && (
				<form onSubmit={handleAddComment} style={{ marginBottom: "20px" }}>
					<textarea
						value={newCommentText}
						onChange={(e) => setNewCommentText(e.target.value)}
						placeholder="Write a comment..."
						rows={3}
						style={{ width: "100%", marginBottom: "10px" }}
						required
					/>
					<button type="submit">Post Comment</button>
				</form>
			)}
			{!editable && (
				<p>
					<i>Commenting is disabled for this EIP chamber.</i>
				</p>
			)}

			{topLevelComments.map((comment) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					allComments={comments}
					onReply={handleReplyToComment}
					isEditable={editable}
					currentEIPId={eip.id}
				/>
			))}
		</div>
	);
};

export default EIPPage;
