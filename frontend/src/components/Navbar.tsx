import React from "react";
import { Link } from "react-router-dom"; // Import Link
import ConnectWallet from "./ConnectWallet"; // Import the wagmi-based ConnectWallet

interface NavbarProps {
	theme: "light" | "dark";
	toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
	const buttonStyles: React.CSSProperties = {
		// Theme-specific styles for this button can be added to index.css if needed
		// or kept minimal here if they don't conflict with global theme button styles.
		background: theme === "dark" ? "#555" : "#ccc", // Example: different bg for theme
		color: theme === "dark" ? "white" : "black", // Example: different text for theme
		border: "none",
		padding: "8px 12px",
		borderRadius: "4px",
		cursor: "pointer",
		fontSize: "14px",
		fontWeight: "bold",
		marginLeft: "10px",
	};

	return (
		<nav style={styles.navbarBase}>
			<Link
				to="/"
				style={{
					...styles.brand,
					textDecoration: "none",
					color: "inherit",
					display: "flex",
					alignItems: "center",
				}}
			>
				<img src="/assets/generated-eth-congress-logo.png" alt="Ethereum Congress" style={styles.ethIcon} />
				Ethereum Congress
			</Link>
			<div style={styles.walletAndThemeContainer}>
				<ConnectWallet theme={theme} />
				<button onClick={toggleTheme} style={buttonStyles}>
					{theme === "light" ? "🌙" : "☀️"}
				</button>
			</div>
		</nav>
	);
};

const styles: { [key: string]: React.CSSProperties } = {
	navbarBase: {
		padding: "10px 20px",
		marginBottom: "20px",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	brand: {
		fontWeight: "bold",
		fontSize: "1.2em",
	},
	linksContainer: {
		display: "flex",
	},
	link: {
		textDecoration: "none",
		marginLeft: "15px",
		padding: "5px 10px",
		borderRadius: "4px",
		transition: "background-color 0.2s ease",
	},
	walletAndThemeContainer: {
		display: "flex",
		alignItems: "center",
		marginLeft: "auto",
	},
	ethIcon: {
		width: "32px",
		height: "32px",
		marginRight: "8px",
		borderRadius: "4px",
	},
};

export default Navbar;
