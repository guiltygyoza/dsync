import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateEIPForm() {
	const navigate = useNavigate();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!title.trim() || !description.trim()) {
			setError("Title and description cannot be empty.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// TODO: add to db
			console.log(`TODO - add to db: { title: ${title}, description: ${description} }`);
			setTitle("");
			setDescription("");
			navigate("/");
		} catch (err) {
			console.error("Failed to create EIP:", err);
			setError("Failed to create EIP. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			{error && <p style={{ color: "red" }}>{error}</p>}
			<div style={{ marginBottom: "10px" }}>
				<label htmlFor="title" style={{ display: "block", marginBottom: "5px" }}>
					Title:
				</label>
				<input
					type="text"
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					style={{ width: "100%", padding: "8px" }}
					disabled={isSubmitting}
				/>
			</div>
			<div style={{ marginBottom: "10px" }}>
				<label htmlFor="description" style={{ display: "block", marginBottom: "5px" }}>
					Description:
				</label>
				<textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					required
					rows={5}
					style={{ width: "100%", padding: "8px" }}
					disabled={isSubmitting}
				/>
			</div>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Creating..." : "Create EIP"}
			</button>
		</form>
	);
}

export default CreateEIPForm;
