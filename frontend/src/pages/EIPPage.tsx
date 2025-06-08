import React, { useContext, useState, useEffect, useMemo, useRef, type TextareaHTMLAttributes, type FC } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import { type IEIP, type IComment, EIP_STATUS, SPECIAL_ID_FOR_EIP } from "@dsync/types";
import { DBFINDER_ADDRESS, HeliaContext } from "../provider/HeliaProvider";

// Define AutogrowTextarea component
interface AutogrowTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
	value: string;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const AutogrowTextarea: FC<AutogrowTextareaProps> = ({ value, onChange, style, ...rest }) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const textArea = textareaRef.current;
		if (textArea) {
			textArea.style.overflowY = "hidden"; // Prevent scrollbar during calculation
			textArea.style.height = "auto"; // Reset height to recalculate
			textArea.style.height = `${textArea.scrollHeight}px`; // Set to scroll height
		}
	}, [value]); // Adjust height when value changes

	return (
		<textarea
			ref={textareaRef}
			value={value}
			onChange={onChange}
			style={{ ...style, boxSizing: "border-box", overflowY: "hidden" }} // Ensure border-box and keep overflow hidden
			{...rest}
		/>
	);
};

const isEIPEditable = (status: EIP_STATUS): boolean => {
	return [EIP_STATUS.DRAFT, EIP_STATUS.REVIEW, EIP_STATUS.LAST_CALL, EIP_STATUS.LIVING].includes(status);
};

interface ICommentProps {
	comment: IComment;
	allComments: IComment[];
	onReply: (parentId: string, replyText: string) => void;
	isEditable: boolean;
	currentEIPId: number;
}

interface DocInterface {
	key: string;
	value: IEIP | IComment;
}

// Define interfaces based on usage to replace 'any' types for dbFinder and event entry
interface MinimalDocDatabaseInterface {
	iterator(options?: { amount?: number }): AsyncIterableIterator<DocInterface>;
	events: {
		on(eventName: string, callback: (entry: DocEntryInterface) => void): void;
		off(eventName: string, callback?: (entry: DocEntryInterface) => void): void;
	};
	close(): Promise<void> | void;
	get(key: string): Promise<DocInterface | null>;
}

interface DocEntryInterface {
	payload: {
		key: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any;
	};
}

const CommentItem: React.FC<ICommentProps> = ({ comment, allComments, onReply, isEditable, currentEIPId }) => {
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [replyText, setReplyText] = useState("");

	const handleReplySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (replyText.trim()) {
			onReply(comment._id, replyText);
			setReplyText("");
			setShowReplyForm(false);
		}
	};

	// Find replies for the current comment
	const replies = useMemo(() => {
		return allComments.filter((c) => c.parentId === comment._id && c.eipId === currentEIPId);
	}, [allComments, comment._id, currentEIPId]);

	return (
		<div style={{ border: "1px solid #eee", padding: "10px", marginBottom: "10px" }}>
			<p>
				<strong>{comment.createdBy}</strong> ({new Date(comment.createdAt).toLocaleDateString()}):
			</p>
			<Markdown rehypePlugins={[[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]]}>
				{comment.content}
			</Markdown>
			{isEditable && (
				<button
					onClick={() => {
						setShowReplyForm(!showReplyForm);
					}}
					style={{ fontSize: "0.8em", padding: "2px 5px" }}
				>
					{showReplyForm ? "Cancel" : "Reply"}
				</button>
			)}
			{showReplyForm && isEditable && (
				<form onSubmit={handleReplySubmit} style={{ marginTop: "5px" }}>
					<AutogrowTextarea
						value={replyText}
						onChange={(e) => setReplyText(e.target.value)}
						placeholder="Write a reply (Markdown supported)..."
						rows={3}
						style={{ width: "100%", marginBottom: "5px" }}
						required
					/>
					{replyText.trim() && (
						<div
							style={{
								border: "1px dashed #ddd",
								padding: "5px",
								minHeight: "40px",
								fontSize: "0.9em",
								marginBottom: "10px",
							}}
						>
							<p style={{ fontSize: "0.8em", color: "#555", marginTop: 0, marginBottom: "5px" }}>
								<em>Preview:</em>
							</p>
							<Markdown
								rehypePlugins={[
									[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
								]}
							>
								{replyText}
							</Markdown>
						</div>
					)}
					<button type="submit" style={{ fontSize: "0.9em", padding: "3px 7px", marginTop: "5px" }}>
						Post Reply
					</button>
				</form>
			)}
			{replies.length > 0 && (
				<div style={{ marginLeft: "20px", marginTop: "10px" }}>
					{replies.map((reply) => (
						// For one-level replies, we don't pass onReply to the nested CommentItem
						// and set isEditable to false to prevent further nesting via UI.
						// We also don't pass allComments down again for one-level replies.
						<CommentItem
							key={reply._id}
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
	const [newCommentText, setNewCommentText] = useState<string>(() => {
		const savedComment = localStorage.getItem(`draft-comment-${eipId}`);
		return savedComment || "";
	});
	const [isLoadingEip, setIsLoadingEip] = useState<boolean>(true);
	const [dbError, setDbError] = useState<string | null>(null);

	const { readOrbitDB: readOrbitdb, writeOrbitDB: writeOrbitdb } = useContext(HeliaContext);
	const location = useLocation();
	const navigate = useNavigate();
	const dbAddress = useRef<string | null>(null);
	const commentDBAddress = useRef<string | null>(null);

	const eipDBRef = useRef<MinimalDocDatabaseInterface | null>(null);
	const commentDBRef = useRef<MinimalDocDatabaseInterface | null>(null);

	const updateHandlerForEIPDB = (entry: DocEntryInterface) => {
		console.log("DB update event received:", entry);
		if (entry.payload.key !== "special-id-for-eip") {
			return;
		}
		const newEip = entry.payload.value as IEIP;
		setEip(newEip);
	};

	const updateHandlerForCommentDB = (entry: DocEntryInterface) => {
		console.log("Comment DB update event received:", entry);
		const newComment = JSON.parse(entry.payload.value) as IComment;
		setComments((prevComments) => [...prevComments, newComment]);
	};

	useEffect(() => {
		let isMounted = true;

		const openAndLoadEIPDatabase = async () => {
			if (!readOrbitdb) {
				if (isMounted) setIsLoadingEip(false);
				return;
			}

			if (!eipDBRef.current) {
				try {
					if (isMounted) {
						setIsLoadingEip(true);
						setDbError(null);
					}

					let determinedDbAddress: string | null = null;
					const addressFromState = location.state?.dbAddress as string | undefined;

					if (addressFromState) {
						determinedDbAddress = addressFromState;
						console.log(
							`Using EIP DB address from forwarded state for eipId ${eipId}: ${determinedDbAddress}`
						);
					} else {
						const localStoredAddress = localStorage.getItem(`eip-${eipId}`);
						if (localStoredAddress) {
							determinedDbAddress = localStoredAddress;
							console.log(
								`Using EIP DB address from localStorage for eipId ${eipId}: ${determinedDbAddress}`
							);
						}
					}

					if (!determinedDbAddress) {
						console.log(
							`EIP DB address not in state or localStorage for eipId ${eipId}, attempting to fetch from dbFinder.`
						);
						const dbFinder = await readOrbitdb.open(DBFINDER_ADDRESS);
						try {
							const eipAddressFromFinder = await dbFinder.get(`${eipId}`);
							if (eipAddressFromFinder && typeof eipAddressFromFinder === "string") {
								determinedDbAddress = eipAddressFromFinder;
								console.log(
									`Fetched EIP DB address from dbFinder for eipId ${eipId}: ${determinedDbAddress}`
								);
							} else {
								if (isMounted) {
									setDbError(`EIP address for eipId ${eipId} not found or invalid in dbFinder.`);
									setIsLoadingEip(false);
								}
								await dbFinder.close();
								return;
							}
						} finally {
							await dbFinder.close();
						}
					}

					if (determinedDbAddress) {
						localStorage.setItem(`eip-${eipId}`, determinedDbAddress);
						dbAddress.current = determinedDbAddress;
					} else {
						if (isMounted) {
							setDbError(`Could not determine database address for EIP ${eipId}.`);
							setIsLoadingEip(false);
						}
						return;
					}

					console.log(`Opening the EIP database at: ${dbAddress.current}`);
					const eipDoc = await readOrbitdb.open(dbAddress.current, { type: "documents" });

					if (!isMounted) {
						if (eipDoc) eipDoc.close();
						return;
					}

					eipDBRef.current = eipDoc;

					if (!eipDBRef.current) {
						console.error("Failed to initialize eipDBRef.current after open.");
						if (isMounted) {
							setDbError("Failed to initialize database instance.");
							setIsLoadingEip(false);
						}
						return;
					}

					eipDBRef.current.events.on("update", updateHandlerForEIPDB);

					const fetchedEipData = await eipDBRef.current.get(SPECIAL_ID_FOR_EIP);
					const eipContent = fetchedEipData?.value as IEIP;
					commentDBAddress.current = eipContent.commentDBAddress;

					if (isMounted) {
						console.log("Fetched EIP from DB:", eipContent);
						console.log("eipContent", eipContent);
						setEip(eipContent);
						await openAndLoadCommentDatabase();
					}
				} catch (error) {
					console.error("Error loading EIP from OrbitDB:", error);
					if (isMounted) {
						setDbError(error instanceof Error ? error.message : "Unknown error loading EIP");
					}
				} finally {
					if (isMounted) {
						setIsLoadingEip(false);
					}
				}
			}
		};

		const openAndLoadCommentDatabase = async () => {
			console.log("openAndLoadCommentDatabase", commentDBAddress.current);
			if (!readOrbitdb) {
				if (isMounted) setIsLoadingEip(false);
				return;
			}

			if (!commentDBRef.current) {
				try {
					if (isMounted) {
						setIsLoadingEip(true);
						setDbError(null);
					}
					if (!commentDBAddress.current) {
						console.error("Comment DB address not found");
						return;
					}

					console.log("opening comment db at", commentDBAddress.current);
					const commentDoc = await readOrbitdb.open(commentDBAddress.current);

					if (!isMounted) {
						if (commentDoc) commentDoc.close();
						return;
					}
					commentDBRef.current = commentDoc;

					if (!commentDBRef.current) {
						console.error("Failed to initialize commentDBRef.current after open.");
						if (isMounted) {
							setDbError("Failed to initialize database instance.");
							setIsLoadingEip(false);
						}
						return;
					}

					commentDBRef.current.events.on("update", updateHandlerForCommentDB);

					const loadedComments: IComment[] = [];
					for await (const record of commentDBRef.current.iterator()) {
						const comment = record.value as IComment;
						loadedComments.push(comment);
					}
					if (isMounted) {
						console.log("loadedComments", loadedComments);
						console.log("Loaded comments from DB:", loadedComments.length);
						setComments(loadedComments);
					}
				} catch (error) {
					console.error("Error loading comments from OrbitDB:", error);
					if (isMounted) {
						setDbError(error instanceof Error ? error.message : "Unknown error loading comments");
					}
				} finally {
					if (isMounted) {
						setIsLoadingEip(false);
					}
				}
			}
		};

		openAndLoadEIPDatabase();

		return () => {
			isMounted = false;
			if (eipDBRef.current) {
				console.log("Cleaning up EIP database listener and closing connection for address:", dbAddress.current);
				eipDBRef.current.events.off("update", updateHandlerForEIPDB);
				eipDBRef.current.close();
				eipDBRef.current = null;
			}
			if (commentDBRef.current) {
				console.log(
					"Cleaning up comment database listener and closing connection for address:",
					commentDBAddress.current
				);
				commentDBRef.current.events.off("update", updateHandlerForCommentDB);
				commentDBRef.current.close();
				commentDBRef.current = null;
			}
		};
	}, [readOrbitdb, eipId, location.state?.dbAddress]);

	useEffect(() => {
		if (eipId) {
			localStorage.setItem(`draft-comment-${eipId}`, newCommentText);
		}
	}, [newCommentText, eipId]);

	const handleAddComment = async (e: React.FormEvent) => {
		e.preventDefault();
		await commentDBRef.current?.close();
		const writeOrbitdbInstance = await writeOrbitdb();
		console.log("writeOrbitdbInstance", writeOrbitdbInstance);
		if (!newCommentText.trim() || !eip || !writeOrbitdbInstance) return;

		const commentDoc = await writeOrbitdbInstance.open(eip.commentDBAddress);
		console.log("commentDoc", commentDoc);

		const newComment = {
			_id: `comment-${Date.now()}`,
			eipId: eip._id,
			createdBy: writeOrbitdbInstance.identity.id,
			content: newCommentText,
			createdAt: new Date(),
			parentId: null,
		};

		console.log("newComment", newComment);
		await commentDoc.put(newComment);
		// setComments((prevComments) => [newComment, ...prevComments]);
		setNewCommentText("");
		if (eipId) {
			localStorage.removeItem(`draft-comment-${eipId}`);
		}
	};

	const handleReplyToComment = async (parentId: string, replyText: string) => {
		if (!eip) return;
		const writeOrbitdbInstance = await writeOrbitdb();
		if (!writeOrbitdbInstance) return;
		const commentDoc = await writeOrbitdbInstance.open(eip.commentDBAddress);
		console.log("commentDoc", commentDoc);
		const newReply: IComment = {
			_id: `reply-${parentId}-${Date.now()}`,
			eipId: eip._id,
			createdBy: writeOrbitdbInstance.identity.id,
			content: replyText,
			createdAt: new Date(),
			parentId: parentId,
		};
		await commentDoc.put(newReply._id, newReply);
		setComments((prevComments) => [newReply, ...prevComments]);
	};

	// Moved these hooks before the early return
	const editable = eip ? isEIPEditable(eip.status) : false;
	const topLevelComments = useMemo(() => comments.filter((c) => c.parentId === null), [comments]);

	if (isLoadingEip) {
		return <div>Loading EIP data... (eipId: {eipId})</div>;
	}

	if (dbError) {
		return (
			<div>
				Error loading EIP: {dbError} (eipId: {eipId})
			</div>
		);
	}

	if (!eip) {
		return <div>EIP not found or failed to load. (eipId: {eipId})</div>;
	}

	return (
		<div>
			<button onClick={() => navigate(-1)} style={{ marginBottom: "10px", padding: "5px 10px" }}>
				&larr; Back
			</button>
			<h1>{eip.title}</h1>
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
				<strong>Author(s):</strong> {eip.authors.join(", ")}
			</p>
			<p>
				<strong>Created:</strong> {new Date(eip.createdAt).toLocaleString()}
			</p>
			<p>
				<strong>Last Updated:</strong> {new Date(eip.updatedAt).toLocaleString()}
			</p>
			{eip.requires && eip.requires.length > 0 && (
				<p>
					<strong>Requires:</strong> EIP-{eip.requires.join(", EIP-")}
				</p>
			)}
			<p>
				<strong>Content:</strong>
			</p>
			<Markdown rehypePlugins={[[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }]]}>
				{eip.content.replace(/^---[\s\S]*?---/, "").trim()}
			</Markdown>

			<hr style={{ margin: "20px 0" }} />

			<h2>Comments</h2>
			{editable && (
				<form onSubmit={handleAddComment} style={{ marginBottom: "20px" }}>
					<div style={{ marginBottom: "10px" }}>
						<AutogrowTextarea
							value={newCommentText}
							onChange={(e) => setNewCommentText(e.target.value)}
							placeholder="Write a comment (Markdown supported)..."
							rows={4}
							style={{ width: "100%", marginBottom: "5px" }}
							required
						/>
						{newCommentText.trim() && (
							<div
								style={{
									border: "1px dashed #ddd",
									padding: "10px",
									minHeight: "60px",
									marginBottom: "10px",
								}}
							>
								<p style={{ fontSize: "0.9em", color: "#555", marginTop: 0, marginBottom: "5px" }}>
									<em>Preview:</em>
								</p>
								<Markdown
									rehypePlugins={[
										[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
									]}
								>
									{newCommentText}
								</Markdown>
							</div>
						)}
					</div>
					<button type="submit" style={{ marginTop: "5px" }}>
						Post Comment
					</button>
				</form>
			)}
			{!editable && (
				<p>
					<i>Commenting is disabled for this EIP chamber.</i>
				</p>
			)}

			{topLevelComments.map((comment) => (
				<CommentItem
					key={comment._id}
					comment={comment}
					allComments={comments}
					onReply={handleReplyToComment}
					isEditable={editable}
					currentEIPId={eip._id}
				/>
			))}
		</div>
	);
};

export default EIPPage;
