import React from "react";
import { Link } from "react-router-dom"; // Import Link
import { useEthereum } from "../ethereum/EthereumContext";

interface NavbarProps {
	theme: "light" | "dark";
	toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
	const { isConnected, address, ensName, connect, disconnect } = useEthereum();

	const formatAddress = (address: string) => {
		return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
	};

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
				<img src="src/assets/eth-icon.png" alt="Ethereum" style={styles.ethIcon} />
				Ethereum Congress
			</Link>
			<div style={styles.linksContainer}>
				<Link to="/eips/new" style={styles.link}>
					Create an EIP
				</Link>
			</div>
			<div style={styles.walletAndThemeContainer}>
				{isConnected ? (
					<div style={styles.walletInfo}>
						<span style={styles.walletAddress}>{ensName || formatAddress(address || "")}</span>
						<button style={styles.disconnectButton} onClick={disconnect}>
							Disconnect
						</button>
					</div>
				) : (
					<button style={styles.connectButton} onClick={connect}>
						Connect Wallet
					</button>
				)}
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
	connectButton: {
		background: "#4CAF50",
		color: "white",
		border: "none",
		padding: "8px 16px",
		borderRadius: "4px",
		cursor: "pointer",
		fontSize: "14px",
		fontWeight: "bold",
	},
	disconnectButton: {
		background: "#f44336",
		color: "white",
		border: "none",
		padding: "4px 8px",
		borderRadius: "4px",
		cursor: "pointer",
		fontSize: "12px",
		marginLeft: "10px",
	},
	walletInfo: {
		display: "flex",
		alignItems: "center",
	},
	walletAddress: {
		fontSize: "14px",
		fontFamily: "monospace",
		padding: "6px 10px",
		borderRadius: "4px",
	},
	ethIcon: {
		width: "24px",
		height: "24px",
		marginRight: "8px",
	},
};

export default Navbar;
