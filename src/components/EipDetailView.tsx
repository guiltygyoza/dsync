import React from "react";
import type { IEIP } from "../types/eip";
import type { IComment } from "../types/comment";

interface EipDetailViewProps {
	eip: IEIP;
	comments: IComment[];
	onClose: () => void;
}

const EipDetailView: React.FC<EipDetailViewProps> = ({ eip, comments, onClose }) => {
	// TODO: Replace with actual OrbitDB comment submission logic
	const handleAddComment = (text: string, parentId: string | null = null) => {
		console.log(`Adding comment to EIP ${eip.id}: ${text}, parent: ${parentId}`);
		alert("Comment submission functionality is not yet implemented.");
	};

	return (
		<div style={styles.detailOverlay}>
			<div style={styles.detailContent}>
				<button onClick={onClose} style={styles.closeButton}>
					Close
				</button>
				<h2>
					{eip.title} (EIP-{eip.id})
				</h2>
				<p>
					<strong>Status:</strong> {eip.status}
				</p>
				<p>
					<strong>Category:</strong> {eip.category}
				</p>
				<p>
					<strong>Author(s):</strong> {eip.author}
				</p>
				<p>
					<strong>Created:</strong> {new Date(eip.createdAt).toLocaleDateString()}
				</p>
				<p>
					<strong>Last Updated:</strong> {new Date(eip.updatedAt).toLocaleDateString()}
				</p>
				{eip.requires && eip.requires.length > 0 && (
					<p>
						<strong>Requires:</strong> EIP-{eip.requires.join(", EIP-")}
					</p>
				)}
				<p>
					<strong>Description:</strong>
				</p>
				<pre style={styles.descriptionBox}>{eip.description || "No description available."}</pre>

				<h3>Comments ({comments.length})</h3>
				<div style={styles.commentsSection}>
					{comments.length === 0 ? (
						<p>No comments yet.</p>
					) : (
						comments.map((comment) => (
							<div key={comment.id} style={styles.comment}>
								<p>
									<strong>{comment.createdBy}</strong> ({new Date(comment.createdAt).toLocaleString()}
									):
								</p>
								<p>{comment.text}</p>
								{/* Basic reply functionality placeholder */}
								<button
									onClick={() => handleAddComment("Reply to: " + comment.text, comment.id)}
									style={styles.replyButton}
								>
									Reply
								</button>
							</div>
						))
					)}
				</div>
				{/* Basic comment form placeholder */}
				<div>
					<h4>Add a Comment</h4>
					<textarea
						rows={3}
						placeholder="Type your comment here..."
						style={styles.commentInput}
						id="new-comment-textarea"
					/>
					<button
						onClick={() => {
							const text = (document.getElementById("new-comment-textarea") as HTMLTextAreaElement)
								?.value;
							if (text) handleAddComment(text);
							(document.getElementById("new-comment-textarea") as HTMLTextAreaElement).value = "";
						}}
						style={styles.submitCommentButton}
					>
						Submit Comment
					</button>
				</div>
			</div>
		</div>
	);
};

// Basic styles - consider moving to a CSS file for a real application
const styles: { [key: string]: React.CSSProperties } = {
	detailOverlay: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1000,
		color: "#333", // Dark text for light background of the modal
	},
	detailContent: {
		backgroundColor: "#fff", // Light background for the modal content
		padding: "20px",
		borderRadius: "8px",
		width: "80%",
		maxWidth: "700px",
		maxHeight: "90vh",
		overflowY: "auto",
		position: "relative",
	},
	closeButton: {
		position: "absolute",
		top: "10px",
		right: "10px",
		padding: "8px 12px",
		cursor: "pointer",
		backgroundColor: "#f44336",
		color: "white",
		border: "none",
		borderRadius: "4px",
	},
	descriptionBox: {
		backgroundColor: "#f9f9f9",
		border: "1px solid #eee",
		padding: "10px",
		borderRadius: "4px",
		whiteSpace: "pre-wrap", // Handles line breaks in description
		wordBreak: "break-word",
		maxHeight: "200px",
		overflowY: "auto",
	},
	commentsSection: {
		marginTop: "20px",
		maxHeight: "300px",
		overflowY: "auto",
		borderTop: "1px solid #eee",
		paddingTop: "10px",
	},
	comment: {
		border: "1px solid #ddd",
		padding: "10px",
		borderRadius: "4px",
		marginBottom: "10px",
		backgroundColor: "#f9f9f9",
	},
	commentInput: {
		width: "calc(100% - 22px)", // Account for padding and border
		padding: "10px",
		borderRadius: "4px",
		border: "1px solid #ccc",
		marginBottom: "10px",
		boxSizing: "border-box",
	},
	submitCommentButton: {
		padding: "10px 15px",
		backgroundColor: "#4CAF50",
		color: "white",
		border: "none",
		borderRadius: "4px",
		cursor: "pointer",
	},
	replyButton: {
		padding: "5px 10px",
		fontSize: "0.8em",
		backgroundColor: "#007bff",
		color: "white",
		border: "none",
		borderRadius: "3px",
		cursor: "pointer",
		marginTop: "5px",
	},
};

export default EipDetailView;
