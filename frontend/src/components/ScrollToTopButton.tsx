import { useState, useEffect } from "react";

const ScrollToTopButton: React.FC = () => {
	const [isVisible, setIsVisible] = useState(false);

	const toggleVisibility = () => {
		if (window.pageYOffset > 300) {
			setIsVisible(true);
		} else {
			setIsVisible(false);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		window.addEventListener("scroll", toggleVisibility);

		return () => {
			window.removeEventListener("scroll", toggleVisibility);
		};
	}, []);

	return (
		<button
			onClick={scrollToTop}
			style={{
				position: "fixed",
				bottom: "40px",
				right: "40px",
				display: isVisible ? "inline-block" : "none",
				padding: "10px 15px",
				fontSize: "20px",
				lineHeight: "1",
				border: "none",
				backgroundColor: "rgba(0, 123, 255, 0.7)",
				color: "white",
				cursor: "pointer",
				borderRadius: "50%",
				zIndex: 1000,
				boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
				transition: "background-color 0.3s, transform 0.3s",
			}}
			onMouseOver={(e) => {
				e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 1)";
				e.currentTarget.style.transform = "scale(1.1)";
			}}
			onMouseOut={(e) => {
				e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 0.7)";
				e.currentTarget.style.transform = "scale(1)";
			}}
		>
			&uarr;
		</button>
	);
};

export default ScrollToTopButton;
