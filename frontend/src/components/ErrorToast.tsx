import { useEffect, useState } from "react";

interface ErrorToastProps {
	message: string;
	onDismiss: () => void;
}

const ErrorToast = ({ message, onDismiss }: ErrorToastProps) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		setVisible(true);
		const timer = setTimeout(() => {
			setVisible(false);
			// Give time for the fade-out animation before calling onDismiss
			setTimeout(onDismiss, 500);
		}, 5000); // 5 seconds

		return () => {
			clearTimeout(timer);
		};
	}, [onDismiss]);

	return (
		<div
			style={{
				position: "relative",
				top: "20px",
				right: "20px",
				padding: "1rem",
				backgroundColor: "hsl(0 100% 50% / 0.1)",
				border: "1px solid hsl(0 100% 50% / 0.2)",
				color: "hsl(0 100% 50%)",
				borderRadius: "0.5rem",
				zIndex: 9999,
				display: "flex",
				alignItems: "center",
				gap: "1rem",
				marginBottom: "1rem",
				transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
				transform: visible ? "translateY(0)" : "translateY(-100%)",
				opacity: visible ? 1 : 0,
			}}
		>
			<span>{message}</span>
			<button
				onClick={() => {
					setVisible(false);
					setTimeout(onDismiss, 500);
				}}
				style={{
					background: "none",
					border: "none",
					color: "inherit",
					cursor: "pointer",
					fontSize: "1.2rem",
					marginLeft: "auto",
				}}
			>
				&times;
			</button>
		</div>
	);
};

export default ErrorToast;
